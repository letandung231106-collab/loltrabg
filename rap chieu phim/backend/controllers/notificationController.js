const db = require('../config/database');

/**
 * Lấy danh sách thông báo của người dùng
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;

    const notifications = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [userId]
    );

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Đánh dấu thông báo đã đọc
 */
async function markNotificationAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (id === 'all') {
      await db.query(`UPDATE notifications SET is_read = TRUE WHERE user_id = ?`, [userId]);
    } else {
      await db.query(`UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`, [id, userId]);
    }

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật trạng thái thông báo.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markNotificationAsRead,
};
