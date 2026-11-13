const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Xử lý thanh toán trực tiếp / mô phỏng
router.post('/process', authenticateToken, paymentController.processPayment);

// MoMo Payment Gateway v2 Sandbox Endpoints
router.post('/momo/create', authenticateToken, paymentController.createMomoPayment);
router.get('/momo/sandbox-checkout', paymentController.renderMomoSandboxGateway);
router.post('/momo/ipn', paymentController.handleMomoIpn);
router.post('/momo/momo-return', authenticateToken, paymentController.verifyMomoReturn);

module.exports = router;
