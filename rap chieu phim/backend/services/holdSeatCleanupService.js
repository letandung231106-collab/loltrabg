const db = require('../config/database');

let lastCleanupAt = 0;
let activeCleanupPromise = null;

/**
 * Quét và giải phóng ghế giữ quá 10 phút chưa thanh toán (BR06, BR07)
 * Hỗ trợ chạy cả trong tiến trình nền standalone và gọi lười (throttled) trên Vercel Serverless.
 */
async function cleanupExpiredSeats(minIntervalMs = 0) {
  const now = Date.now();
  if (minIntervalMs > 0 && now - lastCleanupAt < minIntervalMs) {
    return;
  }
  if (activeCleanupPromise) {
    return activeCleanupPromise;
  }

  lastCleanupAt = now;
  activeCleanupPromise = (async () => {
    try {
      await db.withTransaction(async (conn) => {
        // 1. Tìm các booking_seats đã hết hạn giữ (hold_expire < NOW() AND status = 'holding')
        const [expiredSeats] = await conn.query(
          `SELECT id, booking_id, seat_id FROM booking_seats 
           WHERE status = 'holding' AND hold_expire < NOW() FOR UPDATE`
        );

        if (expiredSeats && expiredSeats.length > 0) {
          const bookingIds = [...new Set(expiredSeats.map((s) => s.booking_id))];
          const seatIds = expiredSeats.map((s) => s.id);

          // 2. Chuyển trạng thái booking_seats thành 'released'
          await conn.query(
            `UPDATE booking_seats SET status = 'released' WHERE id IN (?)`,
            [seatIds]
          );

          // 3. Chuyển trạng thái bookings còn pending thành 'expired'
          await conn.query(
            `UPDATE bookings SET status = 'expired' WHERE id IN (?) AND status = 'pending'`,
            [bookingIds]
          );

          console.log(`[HoldSeat Service] Đã tự động giải phóng ${expiredSeats.length} ghế hết hạn của ${bookingIds.length} đơn đặt.`);
        }
      });
    } catch (err) {
      if (db.getIsConnected()) {
        console.error('[HoldSeat Service Error]', err.message);
      }
    } finally {
      activeCleanupPromise = null;
    }
  })();

  return activeCleanupPromise;
}

/**
 * Service định kỳ quét và giải phóng ghế giữ quá 10 phút chưa thanh toán (BR06, BR07)
 */
function startHoldSeatCleanupService(intervalMs = 15000) {
  console.log(`[HoldSeat Service] Khởi động tiến trình giải phóng ghế hết hạn định kỳ (${intervalMs / 1000}s/lần)...`);

  // Chạy ngay lần đầu
  cleanupExpiredSeats(0);
  return setInterval(() => cleanupExpiredSeats(0), intervalMs);
}

module.exports = {
  startHoldSeatCleanupService,
  cleanupExpiredSeats,
};
