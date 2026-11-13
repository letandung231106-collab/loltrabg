/**
 * Quản lý Ví Voucher cá nhân và Lượt quay may mắn (Lucky Wheel)
 */
const VOUCHER_STORAGE_KEY = 'night_movie_voucher_wallet';
const SPIN_STORAGE_KEY = 'night_movie_spin_count';

export const WHEEL_PRIZES = [
  {
    id: 'spin_v20',
    code: 'SPIN20K',
    title: 'Giảm 20.000đ',
    desc: 'Áp dụng cho mọi đơn từ 80k',
    discountAmount: 20000,
    minOrder: 80000,
    color: '#ef4444', // red
    badge: 'Phổ biến',
    probability: 0.35,
  },
  {
    id: 'spin_popcorn',
    code: 'FREEPOPCORN',
    title: 'Tặng Bắp Rang 55k',
    desc: 'Miễn phí 1 bắp ngọt khi mua vé',
    discountAmount: 55000,
    minOrder: 100000,
    color: '#f59e0b', // amber
    badge: 'Quà Hot',
    probability: 0.25,
  },
  {
    id: 'spin_pct15',
    code: 'LUCKY15',
    title: 'Giảm 15% Tổng Đơn',
    desc: 'Tối đa giảm 45.000đ',
    discountPercent: 15,
    maxDiscount: 45000,
    color: '#8b5cf6', // purple
    badge: 'Ưu đãi',
    probability: 0.2,
  },
  {
    id: 'spin_drink',
    code: 'FREEDRINK',
    title: 'Tặng 1 Nước Ngọt 35k',
    desc: 'Miễn phí Coca/Sprite khi đặt vé',
    discountAmount: 35000,
    minOrder: 60000,
    color: '#06b6d4', // cyan
    badge: 'Quà tặng',
    probability: 0.12,
  },
  {
    id: 'spin_jackpot',
    code: 'JACKPOT50K',
    title: 'JACKPOT 50.000đ',
    desc: 'Giảm thẳng 50.000đ vào đơn vé',
    discountAmount: 50000,
    minOrder: 120000,
    color: '#10b981', // emerald
    badge: 'Đặc biệt',
    probability: 0.08,
  },
];

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
            desc: 'Giảm 20.000đ cho đơn đầu tiên',
            discountAmount: 20000,
            minOrder: 100000,
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

  // Lưu thêm voucher mới trúng thưởng
  addVoucher: (prize) => {
    const list = voucherWallet.getMyVouchers();
    const newVoucher = {
      ...prize,
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

  // Số lượt quay may mắn còn lại
  getRemainingSpins: () => {
    const spins = localStorage.getItem(SPIN_STORAGE_KEY);
    if (spins === null) {
      localStorage.setItem(SPIN_STORAGE_KEY, '3'); // Cho sẵn 3 lượt quay
      return 3;
    }
    return Math.max(0, parseInt(spins, 10));
  },

  decrementSpin: () => {
    const current = voucherWallet.getRemainingSpins();
    const next = Math.max(0, current - 1);
    localStorage.setItem(SPIN_STORAGE_KEY, String(next));
    return next;
  },

  addSpins: (count = 1) => {
    const current = voucherWallet.getRemainingSpins();
    const next = current + count;
    localStorage.setItem(SPIN_STORAGE_KEY, String(next));
    return next;
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
