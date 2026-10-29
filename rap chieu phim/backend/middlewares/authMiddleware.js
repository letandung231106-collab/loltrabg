const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'cinema_ooad_secret_jwt_key_2026_super_secure';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để thực hiện thao tác này.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Lấy thông tin chi tiết người dùng
    if (db.getIsConnected()) {
      const users = await db.query(
        `SELECT u.id, u.username, u.role_id, r.name AS role, u.status,
                c.id AS customer_id, c.name AS customer_name,
                e.id AS employee_id, e.name AS employee_name, e.position, e.department
         FROM users u
         JOIN roles r ON u.role_id = r.id
         LEFT JOIN customers c ON c.user_id = u.id
         LEFT JOIN employees e ON e.user_id = u.id
         WHERE u.id = ?`,
        [decoded.id]
      );

      if (!users || users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản không tồn tại hoặc đã bị xóa.',
        });
      }

      const user = users[0];
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động.',
        });
      }

      req.user = {
        id: user.id,
        username: user.username,
        roleId: user.role_id,
        role: user.role,
        customerId: user.customer_id,
        employeeId: user.employee_id,
        name: user.employee_name || user.customer_name || user.username,
        position: user.position,
        department: user.department,
      };
    } else {
      // Mock / Decoded payload fallback if DB is in transition
      req.user = decoded;
    }

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc token không hợp lệ.',
      error: err.message,
    });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET,
};
