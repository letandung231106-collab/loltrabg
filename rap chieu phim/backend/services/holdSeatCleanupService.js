const db = require('../config/database');

/**
 * Service định kỳ quét và giải phóng ghế giữ quá 10 phút chưa thanh toán (BR06, BR07)
 */
function startHoldSeatCleanupService(intervalMs = 15000) {
  console.log(`[HoldSeat Service] Khởi động tiến trình giải phóng ghế hết hạn định kỳ (${intervalMs / 1000}s/lần)...`);

  const cleanup = async () => {
    try {
      if (!db.getIsConnected()) return;

      await db.withTransaction(async (conn) => {
        // 1. Tìm các booking_seats đã hết hạn giữ (hold_expire < NOW() AND status = 'holding')
        const [expiredSeats] = await conn.query(
          `SELECT id, booking_id, seat_id FROM booking_seats 
           WHERE status = 'holding' AND hold_expire < NOW() FOR UPDATE`
        );

        if (expiredSeats.length > 0) {
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
      // Bỏ qua log nếu DB tạm thời chưa kết nối
      if (db.getIsConnected()) {
        console.error('[HoldSeat Service Error]', err.message);
      }
    }
  };

  // Chạy ngay lần đầu
  cleanup();
  return setInterval(cleanup, intervalMs);
}

module.exports = {
  startHoldSeatCleanupService,
};
