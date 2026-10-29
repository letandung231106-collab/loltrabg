/**
 * Middleware phân quyền (Role-Based Access Control)
 * @param  {...string} allowedRoles Các vai trò được phép (ví dụ: 'admin', 'manager', 'staff', 'technician', 'customer')
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực danh tính người dùng.',
      });
    }

    const userRole = req.user.role.toLowerCase();
    const hasPermission = allowedRoles.map((r) => r.toLowerCase()).includes(userRole);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện chức năng này. Quyền yêu cầu: [${allowedRoles.join(', ')}]. Quyền hiện tại: ${userRole}`,
      });
    }

    next();
  };
}

module.exports = {
  authorizeRoles,
};
