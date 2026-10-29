const db = require('../config/database');

/**
 * Danh sách khách hàng kèm thống kê đặt vé và tổng chi tiêu (Mục 22)
 */
async function getCustomers(req, res, next) {
  try {
    const { membership_level, search } = req.query;

    let sql = `
      SELECT c.*, 
             u.username, u.status AS user_status,
             COUNT(DISTINCT b.id) AS total_bookings,
             COUNT(DISTINCT t.id) AS total_tickets,
             COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS total_spent,
             SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS total_cancelled
      FROM customers c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN bookings b ON b.customer_id = c.id
      LEFT JOIN tickets t ON t.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (membership_level && membership_level !== 'all') {
      sql += ` AND c.membership_level = ?`;
      params.push(membership_level);
    }

    if (search) {
      sql += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR u.username LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY c.id ORDER BY total_spent DESC`;

    const customers = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Chi tiết khách hàng và lịch sử đặt vé
 */
async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;

    const customers = await db.query(`SELECT * FROM customers WHERE id = ?`, [id]);
    if (!customers || customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });
    }

    const bookings = await db.query(
      `SELECT b.*, m.name AS movie_name, s.start_time, r.name AS room_name
       FROM bookings b
       JOIN screening_schedules s ON b.screening_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE b.customer_id = ?
       ORDER BY b.booking_time DESC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...customers[0],
        bookings,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
};
