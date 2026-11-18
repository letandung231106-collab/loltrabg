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
             COALESCE((SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id), 0) AS total_bookings,
             COALESCE((SELECT COUNT(*) FROM tickets t WHERE t.customer_id = c.id), 0) AS total_tickets,
             COALESCE((SELECT SUM(p.amount) FROM payments p JOIN bookings b2 ON p.booking_id = b2.id WHERE b2.customer_id = c.id AND p.status = 'success'), 0) AS total_spent,
             COALESCE((SELECT COUNT(*) FROM bookings b3 WHERE b3.customer_id = c.id AND b3.status = 'cancelled'), 0) AS total_cancelled
      FROM customers c
      JOIN users u ON c.user_id = u.id
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

    sql += ` ORDER BY total_spent DESC`;

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

/**
 * Cập nhật thông tin khách hàng & Hạng thẻ thành viên
 */
async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, membership_level } = req.body;

    const existing = await db.query(`SELECT * FROM customers WHERE id = ?`, [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });
    }

    await db.query(
      `UPDATE customers
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           membership_level = COALESCE(?, membership_level)
       WHERE id = ?`,
      [name, email, phone, membership_level, id]
    );

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật thông tin khách hàng ${name || existing[0].name} thành công!`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
};
