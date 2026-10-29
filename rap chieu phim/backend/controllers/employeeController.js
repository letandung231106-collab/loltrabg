const db = require('../config/database');

/**
 * Danh sách nhân viên
 */
async function getEmployees(req, res, next) {
  try {
    const { department, position, status, search } = req.query;

    let sql = `
      SELECT e.*, 
             u.username, r.name AS role_name,
             COUNT(DISTINCT a.id) AS active_assignments_count
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN assignments a ON a.employee_id = e.id AND a.status IN ('assigned', 'accepted', 'in_progress')
      WHERE 1=1
    `;
    const params = [];

    if (department && department !== 'all') {
      sql += ` AND e.department = ?`;
      params.push(department);
    }

    if (status && status !== 'all') {
      sql += ` AND e.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (e.name LIKE ? OR e.phone LIKE ? OR e.email LIKE ? OR e.position LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY e.id ORDER BY e.id ASC`;

    const employees = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy danh sách riêng Kỹ thuật viên (Technicians) để phục vụ phân công
 */
async function getTechnicians(req, res, next) {
  try {
    const technicians = await db.query(
      `SELECT e.*, 
              COUNT(DISTINCT a.id) AS pending_tasks
       FROM employees e
       JOIN users u ON e.user_id = u.id
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN assignments a ON a.employee_id = e.id AND a.status IN ('assigned', 'accepted', 'in_progress')
       WHERE r.name IN ('technician', 'manager', 'admin') AND e.status = 'active'
       GROUP BY e.id
       ORDER BY pending_tasks ASC, e.name ASC`
    );

    return res.status(200).json({
      success: true,
      data: technicians,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEmployees,
  getTechnicians,
};
