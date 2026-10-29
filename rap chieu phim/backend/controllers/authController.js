const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Đăng nhập hệ thống (Hỗ trợ cả 5 Actors)
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.',
      });
    }

    const users = await db.query(
      `SELECT u.id, u.username, u.password, u.role_id, r.name AS role, u.status,
              c.id AS customer_id, c.name AS customer_name, c.email AS customer_email,
              e.id AS employee_id, e.name AS employee_name, e.position, e.department
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN customers c ON c.user_id = u.id
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.username = ?`,
      [username]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác.',
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động.',
      });
    }

    // Kiểm tra mật khẩu (hỗ trợ cả mật khẩu băm bcrypt và password mẫu password123 / admin123)
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (password === user.password);
    }

    // Cho phép tiện ích demo: nếu password là 'password123' hoặc 'admin123'
    if (!isMatch && (password === 'password123' || password === 'admin123')) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác.',
      });
    }

    const tokenPayload = {
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

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      success: true,
      message: `Đăng nhập thành công với vai trò ${user.role.toUpperCase()}`,
      token,
      user: tokenPayload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Đăng ký tài khoản Khách hàng mới
 */
async function register(req, res, next) {
  try {
    const { username, password, name, email, phone } = req.body;

    if (!username || !password || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.',
      });
    }

    // Kiểm tra trùng username hoặc email
    const existingUsers = await db.query(
      `SELECT id FROM users WHERE username = ?`,
      [username]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.',
      });
    }

    const existingEmails = await db.query(
      `SELECT id FROM customers WHERE email = ?`,
      [email]
    );
    if (existingEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.withTransaction(async (conn) => {
      // Role ID 5 = customer
      const [userResult] = await conn.query(
        `INSERT INTO users (username, password, role_id, status) VALUES (?, ?, 5, 'active')`,
        [username, hashedPassword]
      );
      const userId = userResult.insertId;

      const [customerResult] = await conn.query(
        `INSERT INTO customers (user_id, name, email, phone, membership_level) VALUES (?, ?, ?, ?, 'standard')`,
        [userId, name, email, phone]
      );
      const customerId = customerResult.insertId;

      return { userId, customerId };
    });

    const tokenPayload = {
      id: result.userId,
      username,
      roleId: 5,
      role: 'customer',
      customerId: result.customerId,
      name,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản khách hàng thành công!',
      token,
      user: tokenPayload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy thông tin user hiện tại
 */
async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Switch Role nhanh phục vụ Demo / Chấm điểm Đồ án (1-Click Switch Role)
 */
async function fastSwitchRole(req, res, next) {
  try {
    const { targetRole } = req.body; // 'admin', 'manager', 'staff', 'technician', 'customer'
    
    let defaultUsername = 'admin';
    if (targetRole === 'manager') defaultUsername = 'manager1';
    else if (targetRole === 'staff') defaultUsername = 'staff1';
    else if (targetRole === 'technician') defaultUsername = 'tech1';
    else if (targetRole === 'customer') defaultUsername = 'customer1';

    const users = await db.query(
      `SELECT u.id, u.username, u.role_id, r.name AS role, u.status,
              c.id AS customer_id, c.name AS customer_name,
              e.id AS employee_id, e.name AS employee_name, e.position, e.department
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN customers c ON c.user_id = u.id
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE u.username = ? OR r.name = ?
       LIMIT 1`,
      [defaultUsername, targetRole]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy tài khoản mẫu cho role: ${targetRole}`,
      });
    }

    const user = users[0];
    const tokenPayload = {
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

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      success: true,
      message: `Đã chuyển đổi sang vai trò: ${user.role.toUpperCase()}`,
      token,
      user: tokenPayload,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register,
  getMe,
  fastSwitchRole,
};
