const express = require('express');
const router = express.Router();
const { VALID_VOUCHERS, validateAndCalculateVoucher } = require('../config/vouchers');

/**
 * Lấy danh sách các mã khuyến mãi / voucher hiện có
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: Object.values(VALID_VOUCHERS),
  });
});

/**
 * Kiểm tra mã voucher và tính toán số tiền giảm thực tế từ server
 */
router.post('/validate', (req, res) => {
  const { code, total_amount } = req.body;
  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp mã voucher để kiểm tra.',
    });
  }

  const result = validateAndCalculateVoucher(code, total_amount);
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const subtotal = Math.round(Number(total_amount) || 0);
  const payableAmount = Math.max(0, subtotal - result.discountAmount);

  res.status(200).json({
    success: true,
    data: {
      voucherCode: result.voucherCode,
      discountAmount: result.discountAmount,
      payableAmount,
      desc: result.desc,
    },
  });
});

module.exports = router;
