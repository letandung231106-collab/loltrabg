const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { startHoldSeatCleanupService } = require('./services/holdSeatCleanupService');

// Tải biến môi trường
dotenv.config();

// Tự động nạp giá trị dev sandbox mặc định nếu môi trường dev chưa tạo file .env
if (process.env.NODE_ENV !== 'production') {
  process.env.PORT = process.env.PORT || '5050';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'cinema_secret_key_demo_2026_super_secure_dev_token';
  process.env.MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
  process.env.MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
  process.env.MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  process.env.ENABLE_DEMO_TOOLS = process.env.ENABLE_DEMO_TOOLS || 'true';
  process.env.ENABLE_MOCK_PAYMENT = process.env.ENABLE_MOCK_PAYMENT || 'true';
}

// STT 09: Kiểm tra các biến môi trường thiết yếu khi khởi động, không dùng fallback bí mật viết cứng
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'MOMO_PARTNER_CODE', 'MOMO_ACCESS_KEY', 'MOMO_SECRET_KEY'];
const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`[CRITICAL CONFIG ERROR] Thiếu các biến môi trường bắt buộc: ${missingVars.join(', ')}`);
  console.error('Hệ thống từ chối khởi động với secret mặc định. Vui lòng cấu hình file .env.');
  process.exit(1);
}

// BẢO VỆ PRODUCTION: Chặn JWT_SECRET mặc định yếu trong production
if (process.env.NODE_ENV === 'production') {
  if (process.env.JWT_SECRET === 'cinema_secret_key_demo_2026_super_secure' || process.env.JWT_SECRET.length < 32) {
    console.error('[CRITICAL SECURITY ERROR] JWT_SECRET trong Production không được sử dụng khóa demo mặc định và phải dài tối thiểu 32 ký tự.');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
// STT 25: Giới hạn CORS theo origin frontend và domain deploy
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://night-movie-ok-b1a7.vercel.app',
  process.env.FRONTEND_URL,
  process.env.DEPLOY_DOMAIN,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile apps, server-to-server, curl, tests)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: Nguồn truy cập ${origin} không được phép.`));
    },
    credentials: true,
  })
);

// STT 25: Hỗ trợ cả Standalone và Vercel Serverless (tránh treo stream khi Vercel đã pre-parse body)
app.use((req, res, next) => {
  if (req.body !== undefined && typeof req.body === 'object') {
    return next();
  }
  express.json({ limit: '5mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.body !== undefined && typeof req.body === 'object') {
    return next();
  }
  express.urlencoded({ extended: true, limit: '5mb' })(req, res, next);
});

// Request Logger (Development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Cinema Management Backend REST API is running!',
    database: db.getIsConnected() ? 'connected' : 'disconnected (Check MySQL server)',
    timestamp: new Date(),
  });
});

// Đăng ký các Route REST API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/schedules', require('./routes/scheduleRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/maintenances', require('./routes/maintenanceRoutes'));
app.use('/api/inspections', require('./routes/inspectionRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/concessions', require('./routes/concessionRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/handovers', require('./routes/cashHandoverRoutes'));
app.use('/api/kdm', require('./routes/kdmRoutes'));
app.use('/api/turnaround', require('./routes/turnaroundRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/vouchers', require('./routes/voucherRoutes'));
app.use('/api/sepay', require('./routes/sepayRoutes'));
app.use('/api/payments/sepay', require('./routes/sepayRoutes'));

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Khởi động server standalone (nếu không phải môi trường serverless Vercel)
async function startServer() {
  try {
    // Kiểm tra kết nối MySQL (bắt buộc kết nối thật khi NODE_ENV=production)
    await db.testConnection();
  } catch (err) {
    console.error(`[FATAL STARTUP ERROR] ${err.message}`);
    process.exit(1);
  }

  // Khởi chạy worker dọn dẹp ghế giữ quá 10 phút
  startHoldSeatCleanupService(15000);

  app.listen(PORT, () => {
    console.log('================================================================');
    console.log(` CINEMA MANAGEMENT & BOOKING REST API SERVER (OOAD PROJECT)`);
    console.log(` Server đang chạy tại: http://localhost:${PORT}`);
    console.log(` Health Check API:     http://localhost:${PORT}/api/health`);
    console.log('================================================================');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;

