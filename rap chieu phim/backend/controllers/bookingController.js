const db = require('../config/database');

const SEAT_HOLD_MINUTES = parseInt(process.env.SEAT_HOLD_MINUTES || '10', 10);

/**
 * GIỮ GHẾ TẠM THỜI (MỤC 15, 16, 19, 32 - BR04, BR05, BR06, BR10)
 * Chống đặt trùng ghế tuyệt đối bằng MySQL Transaction & Row-Level Locking
 */
async function holdSeats(req, res, next) {
  try {
    const { screening_id, seat_ids } = req.body;
    const customerId = req.user.customerId || req.user.id;

    if (!screening_id || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một ghế để giữ.',
      });
    }

    // 1. Kiểm tra suất chiếu có hợp lệ không (chưa kết thúc - BR11)
    const schedules = await db.query(
      `SELECT s.*, m.name AS movie_name, r.name AS room_name 
       FROM screening_schedules s
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE s.id = ?`,
      [screening_id]
    );

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({ success: false, message: 'Lịch chiếu không tồn tại.' });
    }

    const schedule = schedules[0];
    if (new Date(schedule.start_time) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'BR11: Không thể đặt vé cho suất chiếu đã bắt đầu hoặc đã kết thúc.',
      });
    }

    // 2. Thực thi Transaction với Locking để kiểm tra và giữ ghế
    const bookingResult = await db.withTransaction(async (conn) => {
      // Khóa và kiểm tra trạng thái của các ghế được chọn trong suất chiếu này
      const [conflicts] = await conn.query(
        `SELECT bs.seat_id, bs.status, s.row_number, s.seat_number, bs.hold_expire
         FROM booking_seats bs
         JOIN bookings b ON bs.booking_id = b.id
         JOIN seats s ON bs.seat_id = s.id
         WHERE b.screening_id = ?
           AND bs.seat_id IN (?)
           AND (
             bs.status = 'booked'
             OR (bs.status = 'holding' AND bs.hold_expire > NOW())
           )
         FOR UPDATE`,
        [screening_id, seat_ids]
      );

      if (conflicts.length > 0) {
        const conflictSeats = conflicts.map((c) => `${c.row_number}${c.seat_number}`).join(', ');
        throw new Error(`Ghế ${conflictSeats} vừa được người khác giữ hoặc đã bán. Vui lòng chọn ghế khác!`);
      }

      // Lấy thông tin giá từng loại ghế
      const [seatsInfo] = await conn.query(
        `SELECT id, row_number, seat_number, seat_type FROM seats WHERE id IN (?)`,
        [seat_ids]
      );

      let totalAmount = 0;
      const basePrice = parseFloat(schedule.ticket_price);
      const calculatedSeats = seatsInfo.map((seat) => {
        let price = basePrice;
        if (seat.seat_type === 'vip') price += 20000;
        if (seat.seat_type === 'couple') price = price * 2 + 10000;
        totalAmount += price;
        return {
          seat_id: seat.id,
          price,
        };
      });

      // Tạo mã đơn đặt
      const bookingCode = `BK-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;

      // Tạo bản ghi booking (status: pending)
      const [bookRes] = await conn.query(
        `INSERT INTO bookings (customer_id, screening_id, booking_code, total_amount, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [customerId, screening_id, bookingCode, totalAmount]
      );

      const bookingId = bookRes.insertId;

      // Tính thời gian hết hạn giữ ghế: NOW() + SEAT_HOLD_MINUTES phút (10 phút)
      const holdExpireDate = new Date(Date.now() + SEAT_HOLD_MINUTES * 60 * 1000);
      const holdExpireStr = holdExpireDate.toISOString().slice(0, 19).replace('T', ' ');

      // Lưu chi tiết từng ghế vào booking_seats (status: holding)
      const bookingSeatRows = calculatedSeats.map((s) => [
        bookingId,
        s.seat_id,
        s.price,
        'holding',
        new Date().toISOString().slice(0, 19).replace('T', ' '),
        holdExpireStr,
      ]);

      await conn.query(
        `INSERT INTO booking_seats (booking_id, seat_id, price, status, hold_start, hold_expire) VALUES ?`,
        [bookingSeatRows]
      );

      return {
        bookingId,
        bookingCode,
        totalAmount,
        holdExpire: holdExpireDate,
        holdMinutes: SEAT_HOLD_MINUTES,
        seats: seatsInfo,
      };
    });

    return res.status(200).json({
      success: true,
      message: `Đã giữ tạm thời ${seat_ids.length} ghế trong ${SEAT_HOLD_MINUTES} phút. Vui lòng thanh toán trước khi hết hạn!`,
      data: bookingResult,
    });
  } catch (error) {
    if (error.message.includes('vừa được người khác giữ')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * GIẢI PHÓNG GHẾ GIỮ (Hủy giữ ghế chủ động - MỤC 18)
 */
async function releaseSeatHold(req, res, next) {
  try {
    const { booking_id } = req.body;
    const customerId = req.user.customerId || req.user.id;

    await db.withTransaction(async (conn) => {
      const [bookings] = await conn.query(
        `SELECT id, status FROM bookings WHERE id = ? AND customer_id = ? FOR UPDATE`,
        [booking_id, customerId]
      );

      if (!bookings || bookings.length === 0) {
        throw new Error('Không tìm thấy đơn đặt hoặc bạn không có quyền hủy đơn này.');
      }

      const booking = bookings[0];
      if (booking.status === 'pending') {
        await conn.query(`UPDATE booking_seats SET status = 'released' WHERE booking_id = ?`, [booking_id]);
        await conn.query(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [booking_id]);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Đã giải phóng ghế giữ thành công.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xem chi tiết Đơn đặt vé
 */
async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;

    const bookings = await db.query(
      `SELECT b.*, 
              m.name AS movie_name, m.poster AS movie_poster, m.duration, m.age_rating,
              s.start_time, s.end_time, s.format AS screening_format,
              r.name AS room_name, r.room_type,
              c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone
       FROM bookings b
       JOIN screening_schedules s ON b.screening_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       JOIN customers c ON b.customer_id = c.id
       WHERE b.id = ?`,
      [id]
    );

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt vé.' });
    }

    const booking = bookings[0];

    // Lấy danh sách ghế
    const seats = await db.query(
      `SELECT bs.*, s.row_number, s.seat_number, s.seat_type
       FROM booking_seats bs
       JOIN seats s ON bs.seat_id = s.id
       WHERE bs.booking_id = ?`,
      [id]
    );

    // Lấy thông tin thanh toán nếu có
    const payments = await db.query(`SELECT * FROM payments WHERE booking_id = ?`, [id]);

    // Lấy vé điện tử nếu đã phát hành
    const tickets = await db.query(
      `SELECT t.*, s.row_number, s.seat_number 
       FROM tickets t
       JOIN seats s ON t.seat_id = s.id
       WHERE t.booking_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...booking,
        seats,
        payment: payments.length > 0 ? payments[0] : null,
        tickets,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Danh sách đơn đặt vé của Khách hàng hiện tại
 */
async function getMyBookings(req, res, next) {
  try {
    const customerId = req.user.customerId || req.user.id;

    const bookings = await db.query(
      `SELECT b.*, 
              m.name AS movie_name, m.poster AS movie_poster,
              s.start_time, s.end_time,
              r.name AS room_name,
              COUNT(bs.id) AS seat_count,
              GROUP_CONCAT(CONCAT(st.row_number, st.seat_number) SEPARATOR ', ') AS seat_labels
       FROM bookings b
       JOIN screening_schedules s ON b.screening_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       LEFT JOIN booking_seats bs ON bs.booking_id = b.id
       LEFT JOIN seats st ON bs.seat_id = st.id
       WHERE b.customer_id = ?
       GROUP BY b.id
       ORDER BY b.booking_time DESC`,
      [customerId]
    );

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  holdSeats,
  releaseSeatHold,
  getBookingById,
  getMyBookings,
};
