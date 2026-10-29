const db = require('../config/database');

/**
 * Lấy danh sách thiết bị có bộ lọc (Phòng, Loại, Tình trạng)
 */
async function getEquipment(req, res, next) {
  try {
    const { room_id, type_id, status, search } = req.query;

    let sql = `
      SELECT e.*, 
             et.name AS type_name,
             r.name AS room_name, r.room_type
      FROM equipment e
      JOIN equipment_types et ON e.equipment_type_id = et.id
      LEFT JOIN cinema_rooms r ON e.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (room_id) {
      sql += ` AND e.room_id = ?`;
      params.push(room_id);
    }

    if (type_id) {
      sql += ` AND e.equipment_type_id = ?`;
      params.push(type_id);
    }

    if (status && status !== 'all') {
      sql += ` AND e.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (e.name LIKE ? OR e.code LIKE ? OR e.manufacturer LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY e.room_id ASC, e.equipment_type_id ASC`;

    const equipment = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      count: equipment.length,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy danh sách các loại thiết bị
 */
async function getEquipmentTypes(req, res, next) {
  try {
    const types = await db.query(`SELECT * FROM equipment_types ORDER BY id ASC`);
    return res.status(200).json({ success: true, data: types });
  } catch (error) {
    next(error);
  }
}

/**
 * Cảnh báo thiết bị sắp đến hạn bảo trì hoặc bảo hành
 */
async function getMaintenanceAlerts(req, res, next) {
  try {
    const alerts = await db.query(
      `SELECT e.*, et.name AS type_name, r.name AS room_name,
              DATEDIFF(e.next_maintenance, CURDATE()) AS days_until_maintenance
       FROM equipment e
       JOIN equipment_types et ON e.equipment_type_id = et.id
       LEFT JOIN cinema_rooms r ON e.room_id = r.id
       WHERE e.next_maintenance <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
          OR e.status IN ('check_needed', 'broken', 'repairing')
       ORDER BY e.next_maintenance ASC`
    );

    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm thiết bị mới
 */
async function createEquipment(req, res, next) {
  try {
    const {
      equipment_type_id,
      room_id,
      name,
      manufacturer,
      purchase_date,
      warranty_end,
      next_maintenance,
      status = 'good',
    } = req.body;

    if (!equipment_type_id || !name || !purchase_date || !next_maintenance) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các thông tin thiết bị bắt buộc.',
      });
    }

    const code = `EQ-${room_id ? 'P' + room_id : 'GEN'}-${Date.now().toString().slice(-6)}`;

    const result = await db.query(
      `INSERT INTO equipment (equipment_type_id, room_id, name, code, manufacturer, purchase_date, warranty_end, next_maintenance, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        equipment_type_id,
        room_id || null,
        name,
        code,
        manufacturer || 'Đang cập nhật',
        purchase_date,
        warranty_end || purchase_date,
        next_maintenance,
        status,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Thêm thiết bị mới thành công!',
      data: { id: result.insertId, code, ...req.body },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật tình trạng thiết bị
 */
async function updateEquipment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, room_id, status, last_maintenance, next_maintenance, manufacturer } = req.body;

    await db.query(
      `UPDATE equipment SET
        name = COALESCE(?, name),
        room_id = COALESCE(?, room_id),
        status = COALESCE(?, status),
        last_maintenance = COALESCE(?, last_maintenance),
        next_maintenance = COALESCE(?, next_maintenance),
        manufacturer = COALESCE(?, manufacturer)
       WHERE id = ?`,
      [name, room_id, status, last_maintenance, next_maintenance, manufacturer, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thiết bị thành công!',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEquipment,
  getEquipmentTypes,
  getMaintenanceAlerts,
  createEquipment,
  updateEquipment,
};
