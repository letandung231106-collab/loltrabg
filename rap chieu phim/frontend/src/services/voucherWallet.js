/**
 * Quản lý Ví Voucher cá nhân và mã ưu đãi (Discount Vouchers)
 */
const VOUCHER_STORAGE_KEY = 'night_movie_voucher_wallet';

export const voucherWallet = {
  // Lấy danh sách voucher trong ví của khách
  getMyVouchers: () => {
    try {
      const data = localStorage.getItem(VOUCHER_STORAGE_KEY);
      if (!data) {
        // Tặng sẵn 1 voucher chào mừng mặc định
        const defaultVouchers = [
          {
            id: 'welcome_20k',
            code: 'NIGHTMOVIE20',
            title: 'Mã chào mừng tân thủ 20k',
            desc: 'Giảm 20.000đ cho đơn từ 80k',
            discountAmount: 20000,
            minOrder: 80000,
            claimedAt: new Date().toISOString(),
            isUsed: false,
          },
        ];
        localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(defaultVouchers));
        return defaultVouchers;
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  // Lưu thêm voucher mới
  addVoucher: (voucher) => {
    const list = voucherWallet.getMyVouchers();
    const newVoucher = {
      ...voucher,
      claimedAt: new Date().toISOString(),
      isUsed: false,
    };
    list.unshift(newVoucher);
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(list));
    return newVoucher;
  },

  // Đánh dấu voucher đã sử dụng
  markAsUsed: (code) => {
    const list = voucherWallet.getMyVouchers();
    const updated = list.map((v) => (v.code === code ? { ...v, isUsed: true, usedAt: new Date().toISOString() } : v));
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(updated));
  },

  // Tìm voucher tốt nhất có thể áp dụng cho giỏ hàng
  findBestVoucher: (subtotalAmount = 0) => {
    const vouchers = voucherWallet.getMyVouchers().filter((v) => !v.isUsed);
    let best = null;
    let maxSaving = 0;

    for (const v of vouchers) {
      if (v.minOrder && subtotalAmount < v.minOrder) continue;

      let saving = 0;
      if (v.discountAmount) {
        saving = v.discountAmount;
      } else if (v.discountPercent) {
        saving = Math.min((subtotalAmount * v.discountPercent) / 100, v.maxDiscount || Infinity);
      }

      if (saving > maxSaving) {
        maxSaving = saving;
        best = v;
      }
    }

    return best;
  },
};
