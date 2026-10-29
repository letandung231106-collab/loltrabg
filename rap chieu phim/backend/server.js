const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middlewares/errorMiddleware');
const { startHoldSeatCleanupService } = require('./services/holdSeatCleanupService');

// Tải biến môi trường
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Khởi động server standalone (nếu không phải môi trường serverless Vercel)
async function startServer() {
  // Kiểm tra kết nối MySQL
  await db.testConnection();

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

