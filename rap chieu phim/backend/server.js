const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { startHoldSeatCleanupService, cleanupExpiredSeats } = require('./services/holdSeatCleanupService');

// Tải biến môi trường (ưu tiên .env trong thư mục backend khi chạy qua api/index.js)
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });
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

// STT 09: Kiểm tra JWT_SECRET thiết yếu khi khởi động, không dùng fallback bí mật viết cứng
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!process.env.JWT_SECRET) {
  console.error('[CRITICAL CONFIG ERROR] Thiếu biến môi trường bắt buộc: JWT_SECRET');
  console.error('Hệ thống từ chối khởi động với secret mặc định. Vui lòng cấu hình biến môi trường.');
  if (!isServerless) {
    process.exit(1);
  }
}

// Cảnh báo nếu thiếu khóa cổng MoMo (không làm sập toàn bộ API nếu chưa kích hoạt MoMo)
const OPTIONAL_MOMO_VARS = ['MOMO_PARTNER_CODE', 'MOMO_ACCESS_KEY', 'MOMO_SECRET_KEY'];
const missingMomoVars = OPTIONAL_MOMO_VARS.filter((v) => !process.env[v]);
if (missingMomoVars.length > 0) {
  console.warn(`[Config Notice] Chưa cấu hình đầy đủ MoMo (${missingMomoVars.join(', ')}). Cổng thanh toán MoMo sẽ từ chối cho tới khi bổ sung biến môi trường.`);
}

// BẢO VỆ PRODUCTION: Chặn JWT_SECRET mặc định yếu trong production
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET === 'cinema_secret_key_demo_2026_super_secure' || process.env.JWT_SECRET.length < 32) {
    console.error('[CRITICAL SECURITY ERROR] JWT_SECRET trong Production không được sử dụng khóa demo mặc định và phải dài tối thiểu 32 ký tự.');
    if (!isServerless) {
      process.exit(1);
    }
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
// STT 25: Giới hạn CORS theo origin frontend và domain deploy
const extraCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
  process.env.DEPLOY_DOMAIN,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
  ...extraCorsOrigins,
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

// Đảm bảo kết nối DB trong môi trường Serverless (Vercel cold start không chạy startServer())
let dbInitPromise = null;
let dbInitCompleted = false;

async function ensureDatabaseReady(req, res, next) {
  if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    return res.status(503).json({
      success: false,
      message: 'Máy chủ chưa được cấu hình JWT_SECRET hợp lệ cho môi trường Production.',
    });
  }

  if (!db.getIsConnected() && !dbInitCompleted) {
    if (!dbInitPromise) {
      dbInitPromise = db
        .testConnection()
        .then(() => {
          dbInitCompleted = true;
        })
        .catch((err) => {
          dbInitPromise = null;
          throw err;
        });
    }
    try {
      await dbInitPromise;
    } catch (err) {
      console.error('[Serverless DB Init Error]', err.message);
      return res.status(503).json({
        success: false,
        message: 'Không thể kết nối cơ sở dữ liệu máy chủ. Vui lòng kiểm tra cấu hình DATABASE_URL.',
      });
    }
  }

  // Trên môi trường Serverless không có setInterval nền -> dọn ghế giữ quá hạn lười (tối đa 30s/lần)
  if (
    isServerless &&
    db.getIsConnected() &&
    (req.path.startsWith('/api/schedules') || req.path.startsWith('/api/bookings') || req.path.startsWith('/api/payments'))
  ) {
    cleanupExpiredSeats(30000).catch(() => {});
  }

  return next();
}

app.use('/api', ensureDatabaseReady);

// Health Check API
app.get('/api/health', (req, res) => {
  const connected = db.getIsConnected();
  const isSupabase = typeof db.getIsSupabase === 'function' && db.getIsSupabase();
  res.status(200).json({
    status: 'online',
    message: 'Cinema Management Backend REST API is running!',
    environment: process.env.NODE_ENV || 'development',
    runtime: isServerless ? 'vercel-serverless' : 'standalone-node',
    database: connected
      ? isSupabase
        ? 'connected (Supabase PostgreSQL)'
        : 'connected (MySQL)'
      : 'in-memory-fallback',
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

