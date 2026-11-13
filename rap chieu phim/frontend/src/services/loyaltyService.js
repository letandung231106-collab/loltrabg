/**
 * Hệ thống Điểm thưởng Khách hàng Thân Thiết (Night Movie Loyalty & Rewards)
 * - Tích lũy 5% giá trị mỗi đơn vé / bắp nước thành điểm thưởng (1 điểm = 1 VNĐ).
 * - Sử dụng điểm thưởng trừ trực tiếp vào đơn hàng hoặc đổi lấy lượt quay Lucky Wheel.
 * - Thăng hạng thành viên: Đồng (0) -> Bạc (50,000 pts) -> Vàng (150,000 pts) -> Kim Cương (300,000 pts).
 */

const LOYALTY_STORAGE_KEY = 'night_movie_loyalty_points';
const LOYALTY_HISTORY_KEY = 'night_movie_loyalty_history';

export const TIERS = {
  BRONZE: { name: 'Đồng (Member)', minPoints: 0, color: '#cd7f32', discountExtra: 0 },
  SILVER: { name: 'Bạc (Silver VIP)', minPoints: 50000, color: '#94a3b8', discountExtra: 5 },
  GOLD: { name: 'Vàng (Gold VIP)', minPoints: 150000, color: '#f59e0b', discountExtra: 10 },
  DIAMOND: { name: 'Kim Cương (Diamond)', minPoints: 300000, color: '#06b6d4', discountExtra: 15 },
};

export const loyaltyService = {
  getPoints: () => {
    try {
      const pts = localStorage.getItem(LOYALTY_STORAGE_KEY);
      if (pts === null) {
        localStorage.setItem(LOYALTY_STORAGE_KEY, '25000'); // Tặng sẵn 25.000 điểm tân thủ
        return 25000;
      }
      return parseInt(pts, 10) || 0;
    } catch {
      return 25000;
    }
  },

  addPoints: (amount, reason = 'Tích điểm đơn hàng') => {
    const current = loyaltyService.getPoints();
    const earned = Math.round(amount * 0.05); // 5% giá trị đơn
    const next = current + earned;
    localStorage.setItem(LOYALTY_STORAGE_KEY, String(next));

    loyaltyService.logHistory({
      type: 'earn',
      points: earned,
      reason,
      createdAt: new Date().toISOString(),
    });

    return { earned, total: next };
  },

  redeemPoints: (pointsToUse, reason = 'Trừ điểm thanh toán vé') => {
    const current = loyaltyService.getPoints();
    if (pointsToUse > current) return false;

    const next = current - pointsToUse;
    localStorage.setItem(LOYALTY_STORAGE_KEY, String(next));

    loyaltyService.logHistory({
      type: 'spend',
      points: pointsToUse,
      reason,
      createdAt: new Date().toISOString(),
    });

    return next;
  },

  getTier: (points = loyaltyService.getPoints()) => {
    if (points >= TIERS.DIAMOND.minPoints) return TIERS.DIAMOND;
    if (points >= TIERS.GOLD.minPoints) return TIERS.GOLD;
    if (points >= TIERS.SILVER.minPoints) return TIERS.SILVER;
    return TIERS.BRONZE;
  },

  getHistory: () => {
    try {
      const data = localStorage.getItem(LOYALTY_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  logHistory: (entry) => {
    try {
      const history = loyaltyService.getHistory();
      history.unshift({ id: Date.now(), ...entry });
      localStorage.setItem(LOYALTY_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      console.warn('Lỗi ghi lịch sử điểm:', e);
    }
  },
};
