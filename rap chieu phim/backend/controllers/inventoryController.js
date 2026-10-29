const db = require('../config/database');

/**
 * Lấy danh sách nguyên vật liệu trong kho
 */
async function getIngredients(req, res, next) {
  try {
    const ingredients = await db.query(`SELECT * FROM inventory_ingredients`, []);
    return res.status(200).json({
      success: true,
      count: ingredients.length,
      data: ingredients,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy lịch sử biến động nhập/xuất/hao hụt kho
 */
async function getInventoryLogs(req, res, next) {
  try {
    const logs = await db.query(`SELECT * FROM inventory_logs ORDER BY created_at DESC`, []);
    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tạo phiếu nhập / xuất / báo cáo hao hụt kho
 */
async function createInventoryLog(req, res, next) {
  try {
    const { ingredient_id, change_type = 'import', quantity, reason = '', employee_id = 1 } = req.body;

    if (!ingredient_id || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Mã nguyên liệu và số lượng là bắt buộc.',
      });
    }

    const qty = change_type === 'import' ? Math.abs(parseFloat(quantity)) : -Math.abs(parseFloat(quantity));

    const result = await db.query(
      `INSERT INTO inventory_logs (ingredient_id, change_type, quantity, reason, employee_id)
       VALUES (?, ?, ?, ?, ?)`,
      [parseInt(ingredient_id, 10), change_type, qty, reason, parseInt(employee_id, 10)]
    );

    return res.status(201).json({
      success: true,
      message: `Đã cập nhật kho thành công (${change_type === 'import' ? 'Nhập' : change_type === 'waste' ? 'Hao hụt' : 'Xuất'} ${Math.abs(qty)})!`,
      data: { id: result.insertId, ...req.body },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm nguyên vật liệu mới vào danh mục kho
 */
async function createIngredient(req, res, next) {
  try {
    const { code, name, unit, stock_quantity = 0, min_threshold = 10, cost_per_unit = 0, supplier = '' } = req.body;

    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Tên nguyên liệu và đơn vị tính là bắt buộc.',
      });
    }

    const result = await db.query(
      `INSERT INTO inventory_ingredients (code, name, unit, stock_quantity, min_threshold, cost_per_unit, supplier)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code || `ING-${Date.now() % 1000}`, name, unit, parseFloat(stock_quantity), parseFloat(min_threshold), parseFloat(cost_per_unit), supplier]
    );

    return res.status(201).json({
      success: true,
      message: 'Thêm nguyên vật liệu vào kho thành công!',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getIngredients,
  getInventoryLogs,
  createInventoryLog,
  createIngredient,
};
