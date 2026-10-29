const db = require('../config/database');

/**
 * Lấy danh sách ca làm việc theo ngày / nhân viên
 */
async function getShifts(req, res, next) {
  try {
    const { date, employee_id, room_id, shift_name } = req.query;

    let sql = `
      SELECT ws.*, 
             e.name AS employee_name, e.position AS employee_position, e.department,
             r.name AS room_name
      FROM work_shifts ws
      JOIN employees e ON ws.employee_id = e.id
      LEFT JOIN cinema_rooms r ON ws.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ` AND ws.work_date = ?`;
      params.push(date);
    }

    if (employee_id) {
      sql += ` AND ws.employee_id = ?`;
      params.push(employee_id);
    }

    if (room_id) {
      sql += ` AND ws.room_id = ?`;
      params.push(room_id);
    }

    if (shift_name) {
      sql += ` AND ws.shift_name = ?`;
      params.push(shift_name);
    }

    sql += ` ORDER BY ws.work_date DESC, ws.start_time ASC`;

    const shifts = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Phân ca làm việc mới
 */
async function createShift(req, res, next) {
  try {
    const { employee_id, work_date, shift_name = 'morning', start_time, end_time, position, room_id } = req.body;

    if (!employee_id || !work_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin phân ca làm việc.',
      });
    }

    const result = await db.query(
      `INSERT INTO work_shifts (employee_id, work_date, shift_name, start_time, end_time, position, room_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [employee_id, work_date, shift_name, start_time, end_time, position || 'Nhân viên trực', room_id || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Đã phân ca làm việc thành công!',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Điểm danh / Check-in ca làm việc (Staff / Technician)
 */
async function checkInShift(req, res, next) {
  try {
    const { id } = req.params;
    const { status = 'checked_in' } = req.body;

    await db.query(`UPDATE work_shifts SET status = ? WHERE id = ?`, [status, id]);

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái ca làm việc: ${status}`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getShifts,
  createShift,
  checkInShift,
};
