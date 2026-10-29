const db = require('../config/database');

/**
 * Lấy danh sách menu bắp nước (F&B Concession)
 */
async function getConcessions(req, res, next) {
  try {
    const { category } = req.query;
    let sql = `SELECT * FROM concession_items`;
    const params = [];

    const items = await db.query(sql, params);
    let filtered = items;
    if (category && category !== 'all') {
      filtered = items.filter((item) => item.category === category);
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm món mới vào menu F&B
 */
async function createConcession(req, res, next) {
  try {
    const { name, category, price, cost_price = 0, image, is_active = true, description = '' } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Tên món và giá bán là bắt buộc.',
      });
    }

    const result = await db.query(
      `INSERT INTO concession_items (name, category, price, cost_price, image, is_active, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, category || 'popcorn', parseFloat(price), parseFloat(cost_price), image || '', is_active, description]
    );

    return res.status(201).json({
      success: true,
      message: 'Thêm món bắp nước thành công!',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật món F&B
 */
async function updateConcession(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category, price, cost_price, image, is_active, description } = req.body;

    await db.query(
      `UPDATE concession_items SET name = ?, category = ?, price = ?, cost_price = ?, image = ?, is_active = ?, description = ? WHERE id = ?`,
      [name, category, price, cost_price, image, is_active, description, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật món F&B thành công!',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa món F&B
 */
async function deleteConcession(req, res, next) {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM concession_items WHERE id = ?`, [id]);
    return res.status(200).json({
      success: true,
      message: 'Đã xóa món khỏi menu.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bán bắp nước tại quầy (Tự động trừ kho theo định lượng BOM)
 */
async function sellConcessionOrder(req, res, next) {
  try {
    const { items, payment_method = 'cash', staff_id = 1, notes = '' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một món bắp nước.',
      });
    }

    // Lấy công thức BOM
    const recipes = await db.query(`SELECT * FROM concession_recipes`, []);
    let totalAmount = 0;

    // Trừ kho nguyên liệu
    for (const orderItem of items) {
      totalAmount += orderItem.price * orderItem.quantity;
      const itemRecipes = recipes.filter((r) => r.item_id === orderItem.id);

      for (const recipe of itemRecipes) {
        const usageQuantity = -(recipe.quantity_used * orderItem.quantity);
        await db.query(
          `INSERT INTO inventory_logs (ingredient_id, change_type, quantity, reason, employee_id)
           VALUES (?, ?, ?, ?, ?)`,
          [recipe.ingredient_id, 'usage', usageQuantity, `Bán ${orderItem.quantity}x ${orderItem.name}`, staff_id]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bán đơn hàng thành công! Đã tự động trừ kho nguyên vật liệu tương ứng.`,
      data: {
        order_id: `ORD-POS-${Date.now() % 100000}`,
        total_amount: totalAmount,
        payment_method,
        item_count: items.length,
        created_at: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getConcessions,
  createConcession,
  updateConcession,
  deleteConcession,
  sellConcessionOrder,
};
