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

/**
 * Thêm mới nhân viên và khởi tạo tài khoản đăng nhập
 */
async function createEmployee(req, res, next) {
  try {
    const { username, password = 'password123', name, phone, email, position, department = 'Vận Hành Rạp', role = 'staff' } = req.body;

    if (!username || !name) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp username và họ tên nhân viên.' });
    }

    const existingUser = await db.query(`SELECT id FROM users WHERE username = ?`, [username]);
    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ success: false, message: `Tên đăng nhập "${username}" đã tồn tại trên hệ thống.` });
    }

    const roleMap = { admin: 1, manager: 2, staff: 3, technician: 4 };
    const roleId = roleMap[role] || 3;

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRes = await db.query(
      `INSERT INTO users (username, password, role_id, status) VALUES (?, ?, ?, 'active')`,
      [username, hashedPassword, roleId]
    );
    const userId = userRes?.insertId || userRes?.[0]?.insertId || 10;

    const empRes = await db.query(
      `INSERT INTO employees (user_id, name, phone, email, position, department, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [userId, name, phone || '', email || '', position || 'Nhân viên rạp', department, 'active']
    );
    const createdEmpId = empRes?.insertId || empRes?.[0]?.insertId;

    return res.status(201).json({
      success: true,
      message: `Đã tạo nhân viên ${name} với vai trò ${role.toUpperCase()} thành công!`,
      data: { id: createdEmpId, userId, username, role },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật thông tin nhân sự và quyền hạn
 */
async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, email, position, department, status, role } = req.body;

    const existing = await db.query(`SELECT * FROM employees WHERE id = ?`, [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên.' });
    }
    const emp = existing[0];

    await db.query(
      `UPDATE employees 
       SET name = COALESCE(?, name),
           phone = COALESCE(?, phone),
           email = COALESCE(?, email),
           position = COALESCE(?, position),
           department = COALESCE(?, department),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, phone, email, position, department, status, id]
    );

    if (role && emp.user_id && emp.user_id > 1) {
      const roleMap = { admin: 1, manager: 2, staff: 3, technician: 4, customer: 5 };
      const roleId = roleMap[role];
      if (roleId) {
        await db.query(`UPDATE users SET role_id = ? WHERE id = ?`, [roleId, emp.user_id]);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật thông tin nhân viên ${name || emp.name} thành công!`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEmployees,
  getTechnicians,
  createEmployee,
  updateEmployee,
};
