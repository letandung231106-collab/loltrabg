const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const { verifySupabaseAccessToken } = require('../services/supabaseAuthService');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Xác thực mật khẩu chặt chẽ bằng bcrypt hash lưu trong database.
 * Tuyệt đối không có mật khẩu backdoor hay fallback so sánh plaintext.
 */
async function verifyBcryptPassword(plainPassword, storedHash) {
  if (typeof plainPassword !== 'string' || !plainPassword || typeof storedHash !== 'string') {
    return false;
  }
  if (!storedHash.startsWith('$2a$') && !storedHash.startsWith('$2b$') && !storedHash.startsWith('$2y$')) {
    return false;
  }
  return bcrypt.compare(plainPassword, storedHash);
}

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

    // Xác thực mật khẩu hoàn toàn qua bcrypt hash trong database (không có backdoor hay ngoại lệ)
    const isMatch = await verifyBcryptPassword(password, user.password);

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
    // STT 03: Chặn switch-role trong môi trường production hoặc khi ENABLE_DEMO_TOOLS !== 'true'
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_TOOLS !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Tính năng chuyển đổi vai trò nhanh (switch-role) đã bị vô hiệu hóa vì lý do bảo mật. Chỉ cho phép khi NODE_ENV !== "production" và ENABLE_DEMO_TOOLS=true.',
      });
    }

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

/**
 * Cập nhật thông tin cá nhân (Profile & Đổi mật khẩu)
 */
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    // Chỉ nhận danh sách trường cho phép (whitelist); bỏ qua hoàn toàn role, role_id, userId, customerId, employeeId, membership_level, points
    const { name, email, phone, currentPassword, newPassword } = req.body || {};

    const users = await db.query(`SELECT id, username, password, role_id, status FROM users WHERE id = ?`, [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }
    const user = users[0];

    // Xử lý đổi mật khẩu nếu có (bắt buộc xác minh mật khẩu hiện tại bằng bcrypt, không có backdoor)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại để đổi mật khẩu.' });
      }
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      }

      const isMatch = await verifyBcryptPassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId]);
    }

    const safeName = typeof name === 'string' && name.trim() ? name.trim() : null;
    const safeEmail = typeof email === 'string' && email.trim() ? email.trim() : null;
    const safePhone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

    // Cập nhật CHỈ hồ sơ thực sự thuộc userId đã xác thực (WHERE user_id = ? — tuyệt đối không dùng OR id = ?)
    if (req.user.role === 'customer') {
      if (safeEmail) {
        const dupEmail = await db.query(
          `SELECT id FROM customers WHERE LOWER(email) = LOWER(?) AND user_id != ?`,
          [safeEmail, userId]
        );
        if (Array.isArray(dupEmail) && dupEmail.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Email này đã được sử dụng bởi tài khoản khác.',
          });
        }
      }
      await db.query(
        `UPDATE customers
         SET name = COALESCE(?, name),
             email = COALESCE(?, email),
             phone = COALESCE(?, phone)
         WHERE user_id = ?`,
        [safeName, safeEmail, safePhone, userId]
      );
    } else {
      if (safeEmail) {
        const dupEmail = await db.query(
          `SELECT id FROM employees WHERE LOWER(email) = LOWER(?) AND user_id != ?`,
          [safeEmail, userId]
        );
        if (Array.isArray(dupEmail) && dupEmail.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Email này đã được sử dụng bởi nhân viên khác.',
          });
        }
      }
      await db.query(
        `UPDATE employees
         SET name = COALESCE(?, name),
             email = COALESCE(?, email),
             phone = COALESCE(?, phone)
         WHERE user_id = ?`,
        [safeName, safeEmail, safePhone, userId]
      );
    }

    const updatedUserPayload = {
      id: req.user.id,
      username: req.user.username,
      roleId: req.user.roleId,
      role: req.user.role,
      customerId: req.user.customerId || null,
      employeeId: req.user.employeeId || null,
      name: safeName || req.user.name,
      email: safeEmail || req.user.email,
      phone: safePhone || req.user.phone,
      position: req.user.position,
      department: req.user.department,
    };

    const token = jwt.sign(updatedUserPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      user: updatedUserPayload,
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Quên mật khẩu / Khôi phục mật khẩu (Forgot Password)
 * Đã vô hiệu hóa thao tác đổi mật khẩu trực tiếp không xác minh để chống chiếm tài khoản.
 * Không tiết lộ tài khoản có tồn tại hay không; sẵn sàng tích hợp Supabase Auth Email OTP ở Giai đoạn 4.
 */
async function forgotPassword(req, res) {
  return res.status(501).json({
    success: false,
    code: 'PASSWORD_RESET_REQUIRES_OTP',
    message:
      'Chức năng đặt lại mật khẩu trực tiếp đã tạm ngưng để bảo vệ tài khoản. Vui lòng sử dụng quy trình xác thực Email OTP (sắp kích hoạt qua Supabase Auth) hoặc liên hệ quản trị viên.',
  });
}

/**
 * Helper: Xây dựng payload Backend JWT chuẩn từ bản ghi DB đã xác thực
 */
function buildBackendTokenPayload(userRow, avatarUrl = null) {
  return {
    id: userRow.id,
    username: userRow.username,
    roleId: userRow.role_id,
    role: userRow.role,
    customerId: userRow.customer_id || null,
    employeeId: userRow.employee_id || null,
    name: userRow.employee_name || userRow.customer_name || userRow.username,
    email: userRow.customer_email || userRow.employee_email || null,
    position: userRow.position || null,
    department: userRow.department || null,
    avatarUrl: avatarUrl || null,
  };
}

/**
 * Helper: Tra cứu đầy đủ user theo users.auth_user_id
 */
async function findUserByAuthUserId(authUserId) {
  const rows = await db.query(
    `SELECT u.id, u.username, u.role_id, u.auth_user_id, r.name AS role, u.status,
            c.id AS customer_id, c.name AS customer_name, c.email AS customer_email,
            e.id AS employee_id, e.name AS employee_name, e.email AS employee_email, e.position, e.department
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN customers c ON c.user_id = u.id
     LEFT JOIN employees e ON e.user_id = u.id
     WHERE u.auth_user_id = ?`,
    [authUserId]
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * GIAI ĐOẠN 3: HYBRID TOKEN EXCHANGE (POST /api/auth/supabase-exchange)
 * - Xác minh Supabase access_token trực tiếp qua Supabase Auth getUser()
 * - KHÔNG tin role/customerId/employeeId từ Google metadata hoặc client body
 * - KHÔNG tự động liên kết tài khoản nội bộ (Admin, Manager, Staff, Technician) theo email
 * - KHÔNG ghi đè auth_user_id đã tồn tại; KHÔNG tạo tài khoản trùng email
 */
async function supabaseExchange(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const accessToken = bearerToken || (typeof req.body?.accessToken === 'string' ? req.body.accessToken.trim() : '');

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        code: 'MISSING_SUPABASE_TOKEN',
        message: 'Vui lòng cung cấp Supabase access token hợp lệ.',
      });
    }

    let verified;
    try {
      verified = await verifySupabaseAccessToken(accessToken);
    } catch (verifyErr) {
      return res.status(verifyErr.statusCode || 401).json({
        success: false,
        code: verifyErr.code || 'INVALID_SUPABASE_TOKEN',
        message: verifyErr.message || 'Xác thực Supabase token thất bại.',
      });
    }

    const { authUserId, email, fullName, avatarUrl } = verified;
    const INTERNAL_ROLES = new Set(['admin', 'manager', 'staff', 'technician']);

    // BƯỚC 1: Đối chiếu tài khoản đã liên kết qua users.auth_user_id
    let userRow = await findUserByAuthUserId(authUserId);
    let action = 'existing_linked';

    if (userRow) {
      if (userRow.status !== 'active') {
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_DISABLED',
          message: 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động.',
        });
      }
      if (!userRow.role) {
        return res.status(403).json({
          success: false,
          code: 'INVALID_ROLE',
          message: 'Không xác định được vai trò hợp lệ của tài khoản trong hệ thống.',
        });
      }
      // Không tự tạo hồ sơ nhân viên cho role nội bộ nếu thiếu
      if (INTERNAL_ROLES.has(userRow.role) && !userRow.employee_id) {
        return res.status(403).json({
          success: false,
          code: 'MISSING_EMPLOYEE_PROFILE',
          message: 'Tài khoản nội bộ chưa có hồ sơ nhân sự hợp lệ. Vui lòng liên hệ Quản trị viên.',
        });
      }
      // Nếu là customer nhưng thiếu hồ sơ customers -> tự tạo hồ sơ customer chuẩn (không nâng quyền)
      if (userRow.role === 'customer' && !userRow.customer_id) {
        const custInsert = await db.query(
          `INSERT INTO customers (user_id, name, email, phone, membership_level) VALUES (?, ?, ?, ?, 'standard')`,
          [userRow.id, fullName, email, '']
        );
        userRow.customer_id = custInsert?.insertId || custInsert?.[0]?.insertId || null;
        userRow.customer_name = fullName;
        userRow.customer_email = email;
      }
    } else {
      // BƯỚC 2: Chưa có auth_user_id -> Kiểm tra xem email có thuộc tài khoản NỘI BỘ (employees) không
      const empRows = await db.query(
        `SELECT u.id, u.username, u.role_id, u.auth_user_id, r.name AS role, u.status,
                e.id AS employee_id, e.name AS employee_name, e.email AS employee_email
         FROM employees e
         JOIN users u ON e.user_id = u.id
         JOIN roles r ON u.role_id = r.id
         WHERE LOWER(e.email) = LOWER(?)`,
        [email]
      );

      if (Array.isArray(empRows) && empRows.length > 0) {
        return res.status(403).json({
          success: false,
          code: 'INTERNAL_ACCOUNT_REQUIRES_MANUAL_LINK',
          message:
            'Tài khoản quản trị/nhân viên nội bộ không được tự động liên kết Google theo email. Vui lòng đăng nhập bằng mật khẩu nội bộ trước khi liên kết hoặc liên hệ Admin.',
        });
      }

      // BƯỚC 3: Kiểm tra xem email có thuộc khách hàng (customers) đã tồn tại không
      const custRows = await db.query(
        `SELECT u.id, u.username, u.role_id, u.auth_user_id, r.name AS role, u.status,
                c.id AS customer_id, c.name AS customer_name, c.email AS customer_email
         FROM customers c
         JOIN users u ON c.user_id = u.id
         JOIN roles r ON u.role_id = r.id
         WHERE LOWER(c.email) = LOWER(?)`,
        [email]
      );

      if (Array.isArray(custRows) && custRows.length > 0) {
        const existingCust = custRows[0];

        // Chặn tuyệt đối nếu user có role không phải customer
        if (existingCust.role !== 'customer') {
          return res.status(403).json({
            success: false,
            code: 'INTERNAL_ACCOUNT_REQUIRES_MANUAL_LINK',
            message: 'Tài khoản không thuộc nhóm khách hàng không được tự động liên kết Google.',
          });
        }

        if (existingCust.status !== 'active') {
          return res.status(403).json({
            success: false,
            code: 'ACCOUNT_DISABLED',
            message: 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động.',
          });
        }

        // Chặn ghi đè nếu tài khoản khách hàng này đã gắn với một auth_user_id khác
        if (existingCust.auth_user_id && existingCust.auth_user_id !== authUserId) {
          return res.status(409).json({
            success: false,
            code: 'ACCOUNT_ALREADY_LINKED',
            message: 'Email này đã được liên kết với một tài khoản Google khác. Không được phép ghi đè liên kết.',
          });
        }

        // Liên kết an toàn (chỉ cập nhật khi auth_user_id IS NULL, giữ nguyên mật khẩu và role cũ)
        const linkRes = await db.query(
          `UPDATE users SET auth_user_id = ? WHERE id = ? AND auth_user_id IS NULL`,
          [authUserId, existingCust.id]
        );
        if (!linkRes || Number(linkRes.affectedRows || 0) === 0) {
          return res.status(409).json({
            success: false,
            code: 'LINK_CONFLICT',
            message: 'Không thể liên kết tài khoản do xung đột dữ liệu xác thực.',
          });
        }

        userRow = { ...existingCust, auth_user_id: authUserId };
        action = 'linked_existing_customer';
      } else {
        // BƯỚC 4: Người dùng Google hoàn toàn mới -> Tạo mới với quyền mặc định CUSTOMER (role_id = 5)
        const emailPrefix = email
          .split('@')[0]
          .replace(/[^a-zA-Z0-9_]/g, '')
          .slice(0, 20) || 'user';
        const uniqueSuffix = crypto.randomBytes(3).toString('hex');
        const generatedUsername = `gg_${emailPrefix}_${uniqueSuffix}`;
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const created = await db.withTransaction(async (conn) => {
          const [uRes] = await conn.query(
            `INSERT INTO users (username, password, role_id, auth_user_id, status) VALUES (?, ?, 5, ?, 'active')`,
            [generatedUsername, hashedPassword, authUserId]
          );
          const newUserId = uRes?.insertId || uRes?.[0]?.insertId;

          const [cRes] = await conn.query(
            `INSERT INTO customers (user_id, name, email, phone, membership_level) VALUES (?, ?, ?, ?, 'standard')`,
            [newUserId, fullName, email, '']
          );
          const newCustomerId = cRes?.insertId || cRes?.[0]?.insertId;

          return { newUserId, newCustomerId };
        });

        userRow = {
          id: created.newUserId,
          username: generatedUsername,
          role_id: 5,
          role: 'customer',
          status: 'active',
          auth_user_id: authUserId,
          customer_id: created.newCustomerId,
          customer_name: fullName,
          customer_email: email,
          employee_id: null,
        };
        action = 'created_new_customer';
      }
    }

    const tokenPayload = buildBackendTokenPayload(userRow, avatarUrl);
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      success: true,
      action,
      message: `Đăng nhập Google thành công với vai trò ${String(userRow.role).toUpperCase()}`,
      token,
      user: tokenPayload,
    });
  } catch (error) {
    // Bắt lỗi vi phạm UNIQUE constraint của auth_user_id (1 UUID không thể gắn vào 2 tài khoản)
    if (error && (error.code === '23505' || error.code === 'ER_DUP_ENTRY')) {
      return res.status(409).json({
        success: false,
        code: 'AUTH_UUID_ALREADY_LINKED',
        message: 'Tài khoản Google này đã được liên kết với một tài khoản khác trong hệ thống.',
      });
    }
    next(error);
  }
}

/**
 * LIÊN KẾT THỦ CÔNG TÀI KHOẢN HIỆN CÓ VỚI SUPABASE AUTH (POST /api/auth/link-supabase)
 * Bắt buộc đã đăng nhập bằng Backend JWT (authenticateToken) + xác minh mật khẩu hiện tại bằng bcrypt
 * Dùng cho Admin / Manager / Staff / Technician muốn chủ động liên kết Google an toàn.
 */
async function linkSupabaseAccount(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, accessToken } = req.body || {};

    if (!currentPassword || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu hiện tại và Supabase access token để liên kết tài khoản.',
      });
    }

    const userRows = await db.query(
      `SELECT u.id, u.username, u.password, u.auth_user_id, u.status,
              e.email AS employee_email, c.email AS customer_email
       FROM users u
       LEFT JOIN employees e ON e.user_id = u.id
       LEFT JOIN customers c ON c.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }
    const dbUser = userRows[0];

    if (dbUser.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa.' });
    }
    if (dbUser.auth_user_id) {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_LINKED',
        message: 'Tài khoản này đã được liên kết với Supabase Auth. Không được phép ghi đè.',
      });
    }

    const accountEmail = (dbUser.employee_email || dbUser.customer_email || '').trim().toLowerCase();
    if (!accountEmail) {
      return res.status(400).json({
        success: false,
        code: 'ACCOUNT_EMAIL_MISSING',
        message: 'Tài khoản NIGHT MOVIE hiện tại chưa có địa chỉ email hợp lệ để đối chiếu liên kết Google.',
      });
    }

    const passOk = await verifyBcryptPassword(currentPassword, dbUser.password);
    if (!passOk) {
      return res.status(401).json({ success: false, message: 'Mật khẩu nội bộ hiện tại không chính xác.' });
    }

    let verified;
    try {
      verified = await verifySupabaseAccessToken(accessToken);
    } catch (verifyErr) {
      return res.status(verifyErr.statusCode || 401).json({
        success: false,
        code: verifyErr.code || 'INVALID_SUPABASE_TOKEN',
        message: verifyErr.message,
      });
    }

    // Bắt buộc email Google/Supabase khớp chính xác email tài khoản đang đăng nhập
    if (verified.email.trim().toLowerCase() !== accountEmail) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_MISMATCH',
        message: 'Email tài khoản Google không khớp với email của tài khoản NIGHT MOVIE đang đăng nhập.',
      });
    }

    // Kiểm tra UUID chưa bị gắn cho tài khoản khác
    const uuidOwner = await findUserByAuthUserId(verified.authUserId);
    if (uuidOwner && uuidOwner.id !== userId) {
      return res.status(409).json({
        success: false,
        code: 'AUTH_UUID_ALREADY_LINKED',
        message: 'Tài khoản Google này đã được liên kết với một tài khoản NIGHT MOVIE khác.',
      });
    }

    const linkRes = await db.query(
      `UPDATE users SET auth_user_id = ? WHERE id = ? AND auth_user_id IS NULL`,
      [verified.authUserId, userId]
    );
    if (!linkRes || Number(linkRes.affectedRows || 0) === 0) {
      return res.status(409).json({ success: false, message: 'Không thể liên kết tài khoản.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Liên kết tài khoản Google với tài khoản NIGHT MOVIE thành công!',
      data: { userId, linkedEmail: verified.email },
    });
  } catch (error) {
    if (error && (error.code === '23505' || error.code === 'ER_DUP_ENTRY')) {
      return res.status(409).json({
        success: false,
        code: 'AUTH_UUID_ALREADY_LINKED',
        message: 'Tài khoản Google này đã được liên kết với một tài khoản khác.',
      });
    }
    next(error);
  }
}

module.exports = {
  login,
  register,
  getMe,
  fastSwitchRole,
  updateProfile,
  forgotPassword,
  supabaseExchange,
  linkSupabaseAccount,
};
