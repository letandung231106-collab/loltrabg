const db = require('../config/database');

/**
 * Lấy danh sách kế hoạch & phiếu bảo trì
 */
async function getMaintenances(req, res, next) {
  try {
    const { type, status, equipment_id, employee_id } = req.query;

    let sql = `
      SELECT m.*, 
             e.name AS equipment_name, e.code AS equipment_code,
             et.name AS type_name,
             r.name AS room_name,
             emp.name AS technician_name
      FROM maintenances m
      JOIN equipment e ON m.equipment_id = e.id
      JOIN equipment_types et ON e.equipment_type_id = et.id
      LEFT JOIN cinema_rooms r ON e.room_id = r.id
      LEFT JOIN employees emp ON m.employee_id = emp.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== 'all') {
      sql += ` AND m.type = ?`;
      params.push(type);
    }

    if (status && status !== 'all') {
      sql += ` AND m.status = ?`;
      params.push(status);
    }

    if (equipment_id) {
      sql += ` AND m.equipment_id = ?`;
      params.push(equipment_id);
    }

    if (employee_id) {
      sql += ` AND m.employee_id = ?`;
      params.push(employee_id);
    }

    sql += ` ORDER BY m.scheduled_date DESC`;

    const maintenances = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      count: maintenances.length,
      data: maintenances,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tạo phiếu bảo trì mới (Manager / Admin)
 */
async function createMaintenance(req, res, next) {
  try {
    const { equipment_id, employee_id, type = 'periodic', description, scheduled_date, note } = req.body;

    if (!equipment_id || !description || !scheduled_date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền thiết bị, mô tả và ngày dự kiến bảo trì.',
      });
    }

    const code = `MAINT-${new Date().toISOString().slice(0, 7).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await db.withTransaction(async (conn) => {
      const [maintRes] = await conn.query(
        `INSERT INTO maintenances (code, equipment_id, employee_id, type, description, scheduled_date, note, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'planned')`,
        [code, equipment_id, employee_id || null, type, description, scheduled_date, note || null]
      );

      const maintenanceId = maintRes.insertId;

      if (employee_id) {
        await conn.query(
          `INSERT INTO assignments (employee_id, maintenance_id, status) VALUES (?, ?, 'assigned')`,
          [employee_id, maintenanceId]
        );
      }

      return { maintenanceId, code };
    });

    return res.status(201).json({
      success: true,
      message: 'Đã lập kế hoạch bảo trì thành công!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật tiến độ / Hoàn tất bảo trì (Technician / Manager)
 */
async function updateMaintenance(req, res, next) {
  try {
    const { id } = req.params;
    const { status, result, cost = 0, note, completed_date, next_maintenance_date } = req.body;

    await db.withTransaction(async (conn) => {
      const [maints] = await conn.query(`SELECT * FROM maintenances WHERE id = ? FOR UPDATE`, [id]);
      if (!maints || maints.length === 0) throw new Error('Không tìm thấy phiếu bảo trì.');

      const maint = maints[0];

      await conn.query(
        `UPDATE maintenances SET
          status = COALESCE(?, status),
          result = COALESCE(?, result),
          cost = COALESCE(?, cost),
          note = COALESCE(?, note),
          completed_date = COALESCE(?, completed_date)
         WHERE id = ?`,
        [status, result, cost, note, completed_date || (status === 'completed' ? new Date() : null), id]
      );

      // Nếu hoàn tất thành công -> Cập nhật thiết bị ngày bảo trì gần nhất và kỳ kế tiếp
      if (status === 'completed') {
        const nextDate = next_maintenance_date || new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
        await conn.query(
          `UPDATE equipment SET last_maintenance = CURDATE(), next_maintenance = ?, status = 'good' WHERE id = ?`,
          [nextDate, maint.equipment_id]
        );
        await conn.query(`UPDATE assignments SET status = 'completed' WHERE maintenance_id = ?`, [id]);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật phiếu bảo trì thành công!',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMaintenances,
  createMaintenance,
  updateMaintenance,
};
