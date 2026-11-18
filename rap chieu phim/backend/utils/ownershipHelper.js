const db = require('../config/database');

/**
 * Xác định chính xác customer_id của người dùng đã xác thực từ JWT (tuyệt đối không tin client body/query
 * và không bao giờ nhầm lẫn users.id với customers.id để chống lỗ hổng IDOR chéo bảng).
 */
async function resolveAuthenticatedCustomerId(user = {}) {
  if (!user) return null;

  // 1. Ưu tiên customerId đã được ký trong JWT khi đăng nhập
  const jwtCustomerId = parseInt(user.customerId, 10);
  if (Number.isInteger(jwtCustomerId) && jwtCustomerId > 0) {
    return jwtCustomerId;
  }

  // 2. Nếu JWT chưa có customerId (ví dụ token cũ), tra cứu trực tiếp trong bảng customers theo user.id
  const userId = parseInt(user.id, 10);
  if (Number.isInteger(userId) && userId > 0) {
    try {
      const rows = await db.query(`SELECT id FROM customers WHERE user_id = ? LIMIT 1`, [userId]);
      if (Array.isArray(rows) && rows.length > 0 && rows[0].id) {
        return Number(rows[0].id);
      }
    } catch {
      // ignore lookup error
    }
  }

  return null;
}

/**
 * Kiểm tra quyền sở hữu chặt chẽ của khách hàng (chỉ so sánh customer_id với resolvedCustomerId, KHÔNG so với users.id)
 */
function isOwnedByCustomer(recordCustomerId, resolvedCustomerId) {
  const recId = parseInt(recordCustomerId, 10);
  const authCustId = parseInt(resolvedCustomerId, 10);
  return Number.isInteger(recId) && recId > 0 && Number.isInteger(authCustId) && authCustId > 0 && recId === authCustId;
}

module.exports = {
  resolveAuthenticatedCustomerId,
  isOwnedByCustomer,
};
