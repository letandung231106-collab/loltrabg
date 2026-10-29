const db = require('../config/database');

/**
 * Lấy danh sách phiếu bàn giao ca & đối soát két tiền
 */
async function getHandovers(req, res, next) {
  try {
    const handovers = await db.query(`SELECT * FROM shift_handovers ORDER BY created_at DESC`, []);
    return res.status(200).json({
      success: true,
      count: handovers.length,
      data: handovers,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tạo biên bản bàn giao ca trực & chốt két tiền mặt
 */
async function createHandover(req, res, next) {
  try {
    const {
      work_shift_id = 1,
      employee_id = 4,
      manager_id = 2,
      opening_float = 2000000,
      cash_sales = 0,
      card_sales = 0,
      qr_sales = 0,
      actual_cash_counted = 0,
      cash_dropped_to_safe = 0,
      next_shift_float = 0,
      notes = '',
    } = req.body;

    const expectedCash = parseFloat(opening_float) + parseFloat(cash_sales);
    const variance = parseFloat(actual_cash_counted) - expectedCash; // Chênh lệch (thừa/thiếu tiền)

    const result = await db.query(
      `INSERT INTO shift_handovers (work_shift_id, employee_id, manager_id, opening_float, cash_sales, card_sales, qr_sales, actual_cash_counted, variance, cash_dropped_to_safe, next_shift_float, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(work_shift_id, 10),
        parseInt(employee_id, 10),
        parseInt(manager_id, 10),
        parseFloat(opening_float),
        parseFloat(cash_sales),
        parseFloat(card_sales),
        parseFloat(qr_sales),
        parseFloat(actual_cash_counted),
        variance,
        parseFloat(cash_dropped_to_safe),
        parseFloat(next_shift_float),
        Math.abs(variance) === 0 ? 'approved' : 'pending_review',
        notes,
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Tạo biên bản bàn giao ca thành công! ${variance !== 0 ? `Lưu ý chênh lệch két: ${variance.toLocaleString('vi-VN')} đ` : 'Két tiền khớp 100%'}.`,
      data: { id: result.insertId, variance, ...req.body },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Quản lý duyệt / phê duyệt biên bản bàn giao ca
 */
async function approveHandover(req, res, next) {
  try {
    const { id } = req.params;
    const { status = 'approved', notes = '' } = req.body;

    await db.query(`UPDATE shift_handovers SET status = ?, notes = ? WHERE id = ?`, [status, notes, id]);
    return res.status(200).json({
      success: true,
      message: 'Đã phê duyệt biên bản bàn giao két tiền ca trực.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHandovers,
  createHandover,
  approveHandover,
};
