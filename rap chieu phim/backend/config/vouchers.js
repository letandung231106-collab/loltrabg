/**
 * CẤU HÌNH VÀ BỘ QUY TẮC MÃ GIẢM GIÁ (VOUCHER ENGINE)
 * Toàn bộ logic tính tiền và xác thực mã nằm tập trung tại Backend (STT 22)
 * KHÔNG tin số tiền giảm do client tự gửi lên.
 */

const VALID_VOUCHERS = {
  NIGHTMOVIE20: {
    code: 'NIGHTMOVIE20',
    discountPercent: 20,
    maxDiscount: 50000,
    minTotalAmount: 0,
    desc: 'Giảm 20% tối đa 50k',
  },
  FREESNACK: {
    code: 'FREESNACK',
    discountAmount: 39000,
    minTotalAmount: 39000,
    desc: 'Tặng nước ngọt 39k',
  },
  STUDENT30: {
    code: 'STUDENT30',
    discountAmount: 30000,
    minTotalAmount: 60000,
    desc: 'Giảm 30k học sinh - sinh viên',
  },
  VIP10: {
    code: 'VIP10',
    discountPercent: 10,
    maxDiscount: 40000,
    minTotalAmount: 0,
    desc: 'Thành viên VIP giảm 10%',
  },
};

/**
 * Xác thực mã giảm giá và tính toán số tiền chiết khấu thực tế
 * @param {string} voucherCode - Mã voucher
 * @param {number} totalAmount - Tổng tiền gốc của đơn đặt vé
 * @returns {{ valid: boolean, voucherCode: string|null, discountAmount: number, desc?: string, error?: string }}
 */
function validateAndCalculateVoucher(voucherCode, totalAmount) {
  if (!voucherCode) {
    return { valid: true, voucherCode: null, discountAmount: 0 };
  }

  const code = String(voucherCode).trim().toUpperCase();
  const voucher = VALID_VOUCHERS[code];
  if (!voucher) {
    return {
      valid: false,
      voucherCode: code,
      discountAmount: 0,
      error: `Mã giảm giá "${code}" không tồn tại hoặc đã hết hạn.`,
    };
  }

  const subtotal = Math.round(Number(totalAmount) || 0);
  if (voucher.minTotalAmount && subtotal < voucher.minTotalAmount) {
    return {
      valid: false,
      voucherCode: code,
      discountAmount: 0,
      error: `Mã giảm giá "${code}" yêu cầu đơn hàng tối thiểu ${voucher.minTotalAmount.toLocaleString('vi-VN')} đ.`,
    };
  }

  let discount = 0;
  if (voucher.discountAmount) {
    discount = voucher.discountAmount;
  } else if (voucher.discountPercent) {
    discount = Math.round((subtotal * voucher.discountPercent) / 100);
    if (voucher.maxDiscount && discount > voucher.maxDiscount) {
      discount = voucher.maxDiscount;
    }
  }

  // Tiền giảm tối đa không vượt quá tổng tiền đơn hàng
  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    voucherCode: code,
    discountAmount: discount,
    desc: voucher.desc,
  };
}

module.exports = {
  VALID_VOUCHERS,
  validateAndCalculateVoucher,
};
