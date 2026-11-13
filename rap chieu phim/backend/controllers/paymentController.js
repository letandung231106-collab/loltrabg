const db = require('../config/database');

/**
 * XỬ LÝ THANH TOÁN MÔ PHỎNG & XUẤT VÉ ĐIỆN TỬ (MỤC 17, 18, 21 - BR08, BR09)
 */
async function processPayment(req, res, next) {
  try {
    const { booking_id, payment_method = 'banking', simulate_failure = false } = req.body;
    const customerId = req.user.customerId || req.user.id;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã đơn đặt vé (booking_id).',
      });
    }

    const transactionCode = `TXN-${payment_method.toUpperCase()}-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await db.withTransaction(async (conn) => {
      // 1. Kiểm tra đơn đặt vé còn pending và chưa hết hạn giữ ghế
      const [bookings] = await conn.query(
        `SELECT b.*, s.movie_id, s.room_id, s.start_time, m.name AS movie_name, r.name AS room_name
         FROM bookings b
         JOIN screening_schedules s ON b.screening_id = s.id
         JOIN movies m ON s.movie_id = m.id
         JOIN cinema_rooms r ON s.room_id = r.id
         WHERE b.id = ?
         FOR UPDATE`,
        [booking_id]
      );

      if (!bookings || bookings.length === 0) {
        throw new Error('Đơn đặt vé không tồn tại hoặc đã hết hạn.');
      }

      const booking = bookings[0];

      // Kiểm tra quyền sở hữu đơn đặt vé (cho phép admin/staff hoặc đúng khách hàng)
      if (
        req.user.role === 'customer' &&
        booking.customer_id &&
        booking.customer_id !== customerId &&
        booking.customer_id !== req.user.id
      ) {
        throw new Error('Bạn không có quyền thanh toán đơn đặt vé này.');
      }

      if (booking.status === 'paid') {
        throw new Error('Đơn đặt vé này đã được thanh toán thành công trước đó.');
      }

      if (booking.status === 'cancelled' || booking.status === 'expired') {
        throw new Error('Đơn đặt vé này đã bị hủy hoặc hết hạn thời gian giữ 10 phút. Vui lòng chọn ghế lại.');
      }

      // 2. Kiểm tra các ghế giữ của đơn đặt này
      const [heldSeats] = await conn.query(
        `SELECT bs.*, s.row_number, s.seat_number 
         FROM booking_seats bs
         JOIN seats s ON bs.seat_id = s.id
         WHERE bs.booking_id = ? AND bs.status = 'holding'
         FOR UPDATE`,
        [booking_id]
      );

      if (!heldSeats || heldSeats.length === 0) {
        // Đã hết hạn giữ ghế -> Giải phóng ghế và hủy đơn
        await conn.query(`UPDATE booking_seats SET status = 'released' WHERE booking_id = ?`, [booking_id]);
        await conn.query(`UPDATE bookings SET status = 'expired' WHERE id = ?`, [booking_id]);
        throw new Error('Thời gian giữ ghế 10 phút đã hết hạn hoặc không tìm thấy ghế. Ghế đã được tự động giải phóng.');
      }

      // 3. Nếu người dùng chọn mô phỏng thanh toán thất bại
      if (simulate_failure) {
        await conn.query(
          `INSERT INTO payments (booking_id, payment_method, amount, transaction_code, status)
           VALUES (?, ?, ?, ?, 'failed')`,
          [booking_id, payment_method, booking.total_amount, transactionCode]
        );
        await conn.query(`UPDATE booking_seats SET status = 'released' WHERE booking_id = ?`, [booking_id]);
        await conn.query(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [booking_id]);

        return {
          paymentStatus: 'failed',
          message: 'Thanh toán thất bại theo yêu cầu mô phỏng. Ghế đã được hoàn trả.',
        };
      }

      // 4. Thanh toán THÀNH CÔNG:
      // - Ghi nhận thanh toán thành công
      await conn.query(
        `INSERT INTO payments (booking_id, payment_method, amount, transaction_code, status)
         VALUES (?, ?, ?, ?, 'success')`,
        [booking_id, payment_method, booking.total_amount, transactionCode]
      );

      // - Chuyển booking thành 'paid'
      await conn.query(`UPDATE bookings SET status = 'paid' WHERE id = ?`, [booking_id]);

      // - Chuyển booking_seats thành 'booked' (🔴 ĐÃ ĐẶT - BR08)
      await conn.query(`UPDATE booking_seats SET status = 'booked' WHERE booking_id = ?`, [booking_id]);

      // - Sinh Vé Điện Tử (tickets) cho từng ghế
      const generatedTickets = [];
      for (const seat of heldSeats) {
        const ticketCode = `TCK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${booking.screening_id}-${seat.row_number}${seat.seat_number}`;
        const qrCodePayload = JSON.stringify({
          ticketCode,
          movie: booking.movie_name,
          room: booking.room_name,
          seat: `${seat.row_number}${seat.seat_number}`,
          time: booking.start_time,
          customer: req.user.name,
        });

        const [tckRes] = await conn.query(
          `INSERT INTO tickets (booking_id, customer_id, screening_id, seat_id, ticket_code, qr_code, status)
           VALUES (?, ?, ?, ?, ?, ?, 'active')`,
          [booking_id, customerId, booking.screening_id, seat.seat_id, ticketCode, qrCodePayload]
        );

        generatedTickets.push({
          id: tckRes.insertId,
          ticketCode,
          seat: `${seat.row_number}${seat.seat_number}`,
          row_number: seat.row_number,
          seat_number: seat.seat_number,
          price: seat.price,
        });
      }

      // - Tạo thông báo cho khách hàng
      await conn.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, ?, ?, 'booking')`,
        [
          req.user.id,
          'Đặt vé thành công!',
          `Bạn đã thanh toán thành công ${booking.total_amount.toLocaleString('vi-VN')} VNĐ cho ${generatedTickets.length} vé xem phim "${booking.movie_name}" lúc ${booking.start_time}.`,
        ]
      );

      return {
        paymentStatus: 'success',
        bookingId: booking_id,
        bookingCode: booking.booking_code,
        transactionCode,
        totalAmount: booking.total_amount,
        movieName: booking.movie_name,
        roomName: booking.room_name,
        screeningTime: booking.start_time,
        tickets: generatedTickets,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Thanh toán thành công! Vé điện tử đã được phát hành.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  processPayment,
};
