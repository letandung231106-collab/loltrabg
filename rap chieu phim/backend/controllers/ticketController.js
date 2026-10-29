const db = require('../config/database');

/**
 * Lấy danh sách tất cả vé (Admin / Manager)
 */
async function getAllTickets(req, res, next) {
  try {
    const { movie_id, date, status, search, limit = 50 } = req.query;

    let sql = `
      SELECT t.*, 
             m.name AS movie_name, m.poster AS movie_poster,
             s.start_time, s.end_time,
             r.name AS room_name,
             st.row_number, st.seat_number, st.seat_type,
             c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
             b.booking_code
      FROM tickets t
      JOIN screening_schedules s ON t.screening_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN cinema_rooms r ON s.room_id = r.id
      JOIN seats st ON t.seat_id = st.id
      JOIN customers c ON t.customer_id = c.id
      JOIN bookings b ON t.booking_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (movie_id) {
      sql += ` AND s.movie_id = ?`;
      params.push(movie_id);
    }

    if (date) {
      sql += ` AND DATE(s.start_time) = ?`;
      params.push(date);
    }

    if (status && status !== 'all') {
      sql += ` AND t.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (t.ticket_code LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR b.booking_code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const tickets = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Vé của tôi (Khách hàng)
 */
async function getMyTickets(req, res, next) {
  try {
    const customerId = req.user.customerId || req.user.id;

    const tickets = await db.query(
      `SELECT t.*, 
              m.name AS movie_name, m.poster AS movie_poster, m.duration, m.age_rating,
              s.start_time, s.end_time, s.format AS screening_format,
              r.name AS room_name, r.room_type,
              st.row_number, st.seat_number, st.seat_type,
              b.booking_code, b.total_amount
       FROM tickets t
       JOIN screening_schedules s ON t.screening_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       JOIN seats st ON t.seat_id = st.id
       JOIN bookings b ON t.booking_id = b.id
       WHERE t.customer_id = ?
       ORDER BY s.start_time DESC`,
      [customerId]
    );

    return res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Quét / Xác thực vé xem phim tại cửa soát vé (Staff)
 */
async function verifyTicket(req, res, next) {
  try {
    const { ticket_code } = req.body;

    if (!ticket_code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã vé hoặc quét mã QR.',
      });
    }

    const tickets = await db.query(
      `SELECT t.*, 
              m.name AS movie_name,
              s.start_time, s.end_time,
              r.name AS room_name,
              st.row_number, st.seat_number,
              c.name AS customer_name
       FROM tickets t
       JOIN screening_schedules s ON t.screening_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       JOIN seats st ON t.seat_id = st.id
       JOIN customers c ON t.customer_id = c.id
       WHERE t.ticket_code = ?`,
      [ticket_code]
    );

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vé không tồn tại hoặc mã vé không hợp lệ.',
      });
    }

    const ticket = tickets[0];

    if (ticket.status === 'used') {
      return res.status(400).json({
        success: false,
        message: `Vé này đã được sử dụng trước đó. Vui lòng kiểm tra lại!`,
        data: ticket,
      });
    }

    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Vé này đã bị hủy.',
        data: ticket,
      });
    }

    // Đánh dấu vé đã sử dụng (Check-in)
    await db.query(`UPDATE tickets SET status = 'used' WHERE id = ?`, [ticket.id]);

    return res.status(200).json({
      success: true,
      message: `Soát vé THÀNH CÔNG! Chào mừng ${ticket.customer_name} vào xem phim ${ticket.movie_name} (Ghế ${ticket.row_number}${ticket.seat_number} - ${ticket.room_name}).`,
      data: { ...ticket, status: 'used' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Hủy vé nếu đủ điều kiện (trước giờ chiếu tối thiểu 2 tiếng)
 */
async function cancelTicket(req, res, next) {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const customerId = req.user.customerId;

    const tickets = await db.query(
      `SELECT t.*, s.start_time, b.id AS booking_id
       FROM tickets t
       JOIN screening_schedules s ON t.screening_id = s.id
       JOIN bookings b ON t.booking_id = b.id
       WHERE t.id = ?`,
      [id]
    );

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vé xem phim.' });
    }

    const ticket = tickets[0];

    // Nếu là customer, kiểm tra quyền sở hữu và thời gian hủy
    if (userRole === 'customer') {
      if (ticket.customer_id !== customerId) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy vé này.' });
      }

      const showTime = new Date(ticket.start_time).getTime();
      const now = Date.now();
      const diffHours = (showTime - now) / (1000 * 60 * 60);

      if (diffHours < 2) {
        return res.status(400).json({
          success: false,
          message: 'Theo quy định rạp, vé chỉ được hủy trước giờ chiếu tối thiểu 2 tiếng.',
        });
      }
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy vé đang ở trạng thái: ${ticket.status}.`,
      });
    }

    await db.withTransaction(async (conn) => {
      // Cập nhật ticket -> cancelled
      await conn.query(`UPDATE tickets SET status = 'cancelled' WHERE id = ?`, [id]);

      // Chuyển booking_seat -> released để ghế trống lại
      await conn.query(
        `UPDATE booking_seats SET status = 'released' WHERE booking_id = ? AND seat_id = ?`,
        [ticket.booking_id, ticket.seat_id]
      );
    });

    return res.status(200).json({
      success: true,
      message: 'Hủy vé thành công! Ghế đã được hoàn trả về hệ thống.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTickets,
  getMyTickets,
  verifyTicket,
  cancelTicket,
};
