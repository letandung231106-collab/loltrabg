const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sepayController = require('../controllers/sepayController');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (e) {
    // token không hợp lệ hoặc hết hạn, tiếp tục với vai trò khách
  }
  next();
}

// 1. Webhook tiếp nhận biến động số dư từ SePay (Xác thực qua API Key nếu được cấu hình)
router.post('/webhook', sepayController.handleWebhook);

// 2. Kiểm tra trạng thái thanh toán đơn hàng (Frontend Polling theo mã đơn)
router.get('/status/:orderCode', sepayController.checkPaymentStatus);

// 3. Đăng ký phiên thanh toán bắp nước POS
router.post('/register-pos-session', optionalAuth, sepayController.registerPosSession);

// 4. Đăng ký phiên thanh toán đặt vé xem phim
router.post('/register-booking-session', optionalAuth, sepayController.registerBookingSession);

// 5. Lấy thông tin tài khoản ngân hàng thụ hưởng SePay
router.get('/info', sepayController.getSepayInfo);

// 6. Giả lập thanh toán SePay (Dành cho QA / Sandbox / Test tự động không cần chuyển tiền thật)
router.post('/simulate-payment', sepayController.simulatePayment);

module.exports = router;
