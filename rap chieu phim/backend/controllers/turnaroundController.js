const db = require('../config/database');

/**
 * Lấy danh sách phiếu dọn rạp giữa 2 suất chiếu
 */
async function getTurnaroundChecklists(req, res, next) {
  try {
    const checklists = await db.query(`SELECT * FROM turnaround_checklists ORDER BY verified_at DESC`, []);
    return res.status(200).json({
      success: true,
      count: checklists.length,
      data: checklists,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Ghi nhận hoàn thành dọn rạp cấp tốc
 */
async function submitTurnaround(req, res, next) {
  try {
    const {
      schedule_id = 1,
      room_id = 1,
      room_name = 'Phòng 1',
      cleaned_by_name = 'Nhân viên',
      target_minutes = 15,
      actual_minutes = 10,
      seats_checked = true,
      trash_cleared = true,
      spilled_liquid_cleaned = true,
      screen_undamaged = true,
      aircon_normal = true,
    } = req.body;

    const allPassed = seats_checked && trash_cleared && spilled_liquid_cleaned && screen_undamaged && aircon_normal;

    const result = await db.query(
      `INSERT INTO turnaround_checklists (schedule_id, room_id, room_name, cleaned_by_name, target_minutes, actual_minutes, seats_checked, trash_cleared, spilled_liquid_cleaned, screen_undamaged, aircon_normal, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(schedule_id, 10),
        parseInt(room_id, 10),
        room_name,
        cleaned_by_name,
        parseInt(target_minutes, 10),
        parseInt(actual_minutes, 10),
        seats_checked,
        trash_cleared,
        spilled_liquid_cleaned,
        screen_undamaged,
        aircon_normal,
        allPassed ? 'ready' : 'needs_attention',
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Khán phòng ${room_name} đã dọn dẹp xong trong ${actual_minutes} phút! Sẵn sàng đón khách.`,
      data: { id: result.insertId, ...req.body },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTurnaroundChecklists,
  submitTurnaround,
};
