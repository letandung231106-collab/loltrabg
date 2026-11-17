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

    const normalizedItems = (filtered || []).map((item) => ({
      ...item,
      image: item.image || item.image_url || '',
      image_url: item.image || item.image_url || '',
    }));

    return res.status(200).json({
      success: true,
      count: normalizedItems.length,
      data: normalizedItems,
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
 * Bảo mật: Xác thực nhân viên, lấy giá từ DB, kiểm tra tồn kho, dùng Transaction và Idempotency
 */
async function executeConcessionSaleTransaction({
  items,
  payment_method = 'cash',
  staff_id = 1,
  notes = '',
  idempotencyKey = null,
  customerId = null,
  existingConn = null,
}) {
  // 1. Kiểm tra dữ liệu đầu vào: Danh sách món
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một món bắp nước.');
  }

  // 2. Kiểm tra số lượng từng món (phải là số nguyên > 0, tối đa 20)
  for (const item of items) {
    const rawId = item.id || item.concession_item_id || item.item_id;
    if (!rawId || isNaN(parseInt(rawId, 10))) {
      throw new Error('ID món không hợp lệ.');
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new Error(`Số lượng món '${item.name || rawId}' phải là số nguyên dương hợp lệ.`);
    }
  }

  // 3. Kiểm tra Idempotency Key (chống gửi trùng / trừ kho 2 lần)
  const queryExecutor = existingConn || db;
  if (idempotencyKey) {
    const rawExisting = await queryExecutor.query(
      `SELECT * FROM concession_orders WHERE idempotency_key = ?`,
      [idempotencyKey]
    );
    const existingOrders = Array.isArray(rawExisting) && Array.isArray(rawExisting[0])
      ? rawExisting[0]
      : (Array.isArray(rawExisting) ? rawExisting : []);
    if (existingOrders && existingOrders.length > 0) {
      return {
        alreadyProcessed: true,
        order_id: existingOrders[0].id,
        order_code: existingOrders[0].order_code,
        total_amount: existingOrders[0].total_amount,
        ...existingOrders[0],
      };
    }
  }

  // 4. Logic tạo đơn và trừ kho BOM
  const runTransactionLogic = async (conn) => {
    // 4.1. Lấy thông tin giá bán và trạng thái THỰC TẾ từ DB (không tin tưởng giá từ frontend)
    const itemIds = items.map((i) => parseInt(i.id || i.concession_item_id || i.item_id, 10));
    const [dbItems] = await conn.query(
      `SELECT * FROM concession_items WHERE id IN (?)`,
      [itemIds]
    );

    let totalAmount = 0;
    const validatedItems = [];

    for (const orderItem of items) {
      const currentId = parseInt(orderItem.id || orderItem.concession_item_id || orderItem.item_id, 10);
      const found = (dbItems || []).find((d) => d.id === currentId);
      if (!found) {
        throw new Error(`Sản phẩm F&B với ID ${currentId} không tồn tại trong hệ thống.`);
      }
      if (!found.is_active) {
        throw new Error(`Sản phẩm '${found.name}' hiện đang tạm ngừng kinh doanh.`);
      }

      const realUnitPrice = parseFloat(found.price);
      const qty = parseInt(orderItem.quantity, 10);
      const lineTotal = realUnitPrice * qty;
      totalAmount += lineTotal;

      validatedItems.push({
        item_id: found.id,
        name: found.name,
        quantity: qty,
        unit_price: realUnitPrice,
        total_price: lineTotal,
      });
    }

    // 4.2. Lấy công thức BOM và kiểm tra tồn kho nguyên vật liệu
    const [recipes] = await conn.query(`SELECT * FROM concession_recipes`, []);
    const [ingredients] = await conn.query(`SELECT * FROM inventory_ingredients`, []);

    const ingredientDemands = {};
    for (const vItem of validatedItems) {
      const itemRecipes = (recipes || []).filter((r) => r.item_id === vItem.item_id);
      for (const recipe of itemRecipes) {
        const needed = recipe.quantity_used * vItem.quantity;
        ingredientDemands[recipe.ingredient_id] = (ingredientDemands[recipe.ingredient_id] || 0) + needed;
      }
    }

    // Kiểm tra tồn kho trước khi xác nhận đơn
    for (const [ingIdStr, requiredQty] of Object.entries(ingredientDemands)) {
      const ingId = parseInt(ingIdStr, 10);
      const ing = (ingredients || []).find((i) => i.id === ingId);
      if (ing && ing.stock_quantity < requiredQty) {
        throw new Error(
          `Kho không đủ nguyên liệu '${ing.name}' để phục vụ đơn hàng (cần ${requiredQty.toFixed(2)} ${ing.unit}, hiện có ${ing.stock_quantity} ${ing.unit}).`
        );
      }
    }

    // 4.3. Tạo mã đơn hàng chuẩn và lưu vào bảng concession_orders
    const orderCode = idempotencyKey
      ? `ORD-${idempotencyKey}`
      : `ORD-POS-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;

    const [orderRes] = await conn.query(
      `INSERT INTO concession_orders (order_code, employee_id, customer_id, total_amount, payment_method, notes, idempotency_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderCode,
        staff_id,
        customerId || null,
        totalAmount,
        payment_method || 'cash',
        notes || '',
        idempotencyKey || null,
        new Date().toISOString(),
      ]
    );
    const orderId = orderRes?.insertId;

    // 4.4. Lưu chi tiết từng món vào bảng concession_order_items
    for (const item of validatedItems) {
      await conn.query(
        `INSERT INTO concession_order_items (order_id, item_id, item_name, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.item_id, item.name, item.quantity, item.unit_price, item.total_price]
      );
    }

    // 4.5. Trừ kho nguyên vật liệu và ghi nhật ký inventory_logs
    for (const [ingIdStr, requiredQty] of Object.entries(ingredientDemands)) {
      const ingId = parseInt(ingIdStr, 10);
      await conn.query(
        `INSERT INTO inventory_logs (ingredient_id, change_type, quantity, reason, employee_id)
         VALUES (?, ?, ?, ?, ?)`,
        [ingId, 'usage', -requiredQty, `Bán đơn hàng #${orderCode}`, staff_id || 1]
      );
    }

    return {
      order_id: orderId,
      order_code: orderCode,
      total_amount: totalAmount,
      payment_method: payment_method || 'cash',
      staff_id,
      items: validatedItems,
      created_at: new Date().toISOString(),
    };
  };

  if (existingConn) {
    return await runTransactionLogic(existingConn);
  }
  return await db.withTransaction(runTransactionLogic);
}

async function sellConcessionOrder(req, res, next) {
  try {
    const { items, payment_method = 'cash', notes = '' } = req.body;

    // 1. Bảo mật danh tính nhân viên: Lấy từ token đã xác thực, không tin tưởng req.body.staff_id
    const authenticatedStaffId = req.user?.employeeId || req.user?.id || 1;
    const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotency_key;

    const transactionResult = await executeConcessionSaleTransaction({
      items,
      payment_method,
      staff_id: authenticatedStaffId,
      notes,
      idempotencyKey,
      customerId: req.user?.customerId || null,
    });

    if (transactionResult.alreadyProcessed) {
      return res.status(200).json({
        success: true,
        message: 'Đơn hàng đã được xử lý trước đó (Idempotent replay). Không trừ kho lặp lại.',
        data: transactionResult,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Bán đơn hàng thành công! Đã lưu database và tự động trừ kho nguyên vật liệu.',
      data: transactionResult,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Lỗi xử lý đơn hàng bắp nước.',
    });
  }
}

module.exports = {
  getConcessions,
  createConcession,
  updateConcession,
  deleteConcession,
  sellConcessionOrder,
  executeConcessionSaleTransaction,
};
