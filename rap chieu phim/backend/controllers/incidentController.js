const db = require('../config/database');

/**
 * Lấy danh sách sự cố
 */
async function getIncidents(req, res, next) {
  try {
    const { status, severity, room_id, technician_id } = req.query;

    let sql = `
      SELECT i.*, 
             r.name AS room_name,
             e.name AS equipment_name,
             rep.name AS reporter_name,
             tech.name AS assigned_technician_name, tech.id AS technician_id,
             a.status AS assignment_status
      FROM incidents i
      LEFT JOIN cinema_rooms r ON i.room_id = r.id
      LEFT JOIN equipment e ON i.equipment_id = e.id
      JOIN employees rep ON i.reporter_id = rep.id
      LEFT JOIN assignments a ON a.incident_id = i.id
      LEFT JOIN employees tech ON a.employee_id = tech.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    if (severity && severity !== 'all') {
      sql += ` AND i.severity = ?`;
      params.push(severity);
    }

    if (room_id) {
      sql += ` AND i.room_id = ?`;
      params.push(room_id);
    }

    if (technician_id) {
      sql += ` AND tech.id = ?`;
      params.push(technician_id);
    }

    sql += ` ORDER BY i.created_at DESC`;

    const incidents = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xem chi tiết sự cố kèm toàn bộ Lịch sử xử lý (BR15)
 */
async function getIncidentById(req, res, next) {
  try {
    const { id } = req.params;

    const incidents = await db.query(
      `SELECT i.*, 
              r.name AS room_name, r.room_type,
              e.name AS equipment_name, e.code AS equipment_code,
              rep.name AS reporter_name, rep.phone AS reporter_phone,
              tech.name AS assigned_technician_name, tech.id AS technician_id, tech.phone AS technician_phone
       FROM incidents i
       LEFT JOIN cinema_rooms r ON i.room_id = r.id
       LEFT JOIN equipment e ON i.equipment_id = e.id
       JOIN employees rep ON i.reporter_id = rep.id
       LEFT JOIN assignments a ON a.incident_id = i.id
       LEFT JOIN employees tech ON a.employee_id = tech.id
       WHERE i.id = ?`,
      [id]
    );

    if (!incidents || incidents.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự cố này.' });
    }

    // Lấy lịch sử xử lý (Incident Histories)
    const histories = await db.query(
      `SELECT h.*, e.name AS employee_name, e.position
       FROM incident_histories h
       JOIN employees e ON h.employee_id = e.id
       WHERE h.incident_id = ?
       ORDER BY h.created_at ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...incidents[0],
        histories,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * BÁO CÁO SỰ CỐ MỚI (Staff / Manager)
 */
async function createIncident(req, res, next) {
  try {
    const { room_id, equipment_id, title, description, severity = 'medium', image } = req.body;
    const reporterId = req.user.employeeId || 1;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tiêu đề và mô tả chi tiết sự cố.',
      });
    }

    const code = `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const result = await db.withTransaction(async (conn) => {
      // 1. Tạo incident
      const [incRes] = await conn.query(
        `INSERT INTO incidents (code, reporter_id, room_id, equipment_id, title, description, severity, image, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
        [code, reporterId, room_id || null, equipment_id || null, title, description, severity, image || null]
      );

      const incidentId = incRes.insertId;

      // 2. Nếu mức độ nghiêm trọng high/critical -> Tạm thời chuyển trạng thái phòng sang 'incident'
      if (room_id && (severity === 'high' || severity === 'critical')) {
        await conn.query(`UPDATE cinema_rooms SET status = 'incident' WHERE id = ?`, [room_id]);
      }

      // 3. Nếu có thiết bị cụ thể -> Đổi trạng thái thiết bị sang 'broken' hoặc 'check_needed'
      if (equipment_id) {
        await conn.query(
          `UPDATE equipment SET status = ? WHERE id = ?`,
          [severity === 'high' || severity === 'critical' ? 'broken' : 'check_needed', equipment_id]
        );
      }

      // 4. Ghi nhận log đầu tiên vào incident_histories (BR15, BR16)
      await conn.query(
        `INSERT INTO incident_histories (incident_id, employee_id, action, description)
         VALUES (?, ?, 'Tạo báo cáo sự cố', ?)`,
        [incidentId, reporterId, `Sự cố mức độ ${severity.toUpperCase()} được khởi tạo: ${title}`]
      );

      // 5. Gửi thông báo đến Manager
      await conn.query(
        `INSERT INTO notifications (user_id, title, message, type)
         SELECT u.id, ?, ?, 'incident'
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE r.name IN ('admin', 'manager')`,
        [
          `Sự cố mới: ${code}`,
          `Nhân viên vừa báo cáo sự cố "${title}" (Mức độ: ${severity}). Vui lòng phân công kỹ thuật viên xử lý.`,
        ]
      );

      return { incidentId, code };
    });

    return res.status(201).json({
      success: true,
      message: 'Đã gửi báo cáo sự cố thành công!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PHÂN CÔNG KỸ THUẬT VIÊN (Manager)
 */
async function assignTechnician(req, res, next) {
  try {
    const { id } = req.params;
    const { technician_id } = req.body;
    const managerId = req.user.employeeId || 2;

    if (!technician_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn kỹ thuật viên để phân công.' });
    }

    await db.withTransaction(async (conn) => {
      // 1. Kiểm tra sự cố
      const [incidents] = await conn.query(`SELECT * FROM incidents WHERE id = ? FOR UPDATE`, [id]);
      if (!incidents || incidents.length === 0) throw new Error('Không tìm thấy sự cố.');

      const inc = incidents[0];
      if (inc.status === 'closed') {
        throw new Error('BR13: Sự cố đã đóng không thể phân công lại.');
      }

      // 2. Tạo hoặc cập nhật assignments
      await conn.query(`DELETE FROM assignments WHERE incident_id = ?`, [id]);
      await conn.query(
        `INSERT INTO assignments (employee_id, incident_id, status) VALUES (?, ?, 'assigned')`,
        [technician_id, id]
      );

      // 3. Cập nhật trạng thái sự cố sang 'accepted' hoặc 'in_progress'
      await conn.query(`UPDATE incidents SET status = 'accepted' WHERE id = ?`, [id]);

      // 4. Lấy tên KTV
      const [techs] = await conn.query(`SELECT name, user_id FROM employees WHERE id = ?`, [technician_id]);
      const techName = techs.length > 0 ? techs[0].name : `KTV #${technician_id}`;

      // 5. Ghi nhận lịch sử (BR15)
      await conn.query(
        `INSERT INTO incident_histories (incident_id, employee_id, action, description)
         VALUES (?, ?, 'Phân công kỹ thuật viên', ?)`,
        [id, managerId, `Quản lý đã phân công cho kỹ thuật viên ${techName} tiếp nhận xử lý.`]
      );

      // 6. Gửi thông báo đến kỹ thuật viên
      if (techs.length > 0) {
        await conn.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'incident')`,
          [
            techs[0].user_id,
            'Phân công nhiệm vụ mới',
            `Bạn vừa được giao xử lý sự cố [${inc.code}] "${inc.title}". Vui lòng kiểm tra và tiếp nhận.`,
          ]
        );
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Đã phân công kỹ thuật viên thành công!',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * KỸ THUẬT VIÊN CẬP NHẬT KẾT QUẢ XỬ LÝ (Technician - MỤC 8, BR12, BR15)
 */
async function resolveIncident(req, res, next) {
  try {
    const { id } = req.params;
    const { action_title, description, spare_parts, cost = 0, is_completed = true } = req.body;
    const technicianId = req.user.employeeId || 6;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mô tả chi tiết phương án và kết quả xử lý.',
      });
    }

    await db.withTransaction(async (conn) => {
      const [incidents] = await conn.query(`SELECT * FROM incidents WHERE id = ? FOR UPDATE`, [id]);
      if (!incidents || incidents.length === 0) throw new Error('Không tìm thấy sự cố.');

      const inc = incidents[0];
      if (inc.status === 'closed') {
        throw new Error('BR13: Sự cố đã đóng không được phép chỉnh sửa.');
      }

      // BR12: Kiểm tra phân quyền kỹ thuật viên (chỉ được sửa nếu được phân công hoặc là Manager/Admin)
      if (req.user.role === 'technician') {
        const [assigns] = await conn.query(
          `SELECT id FROM assignments WHERE incident_id = ? AND employee_id = ?`,
          [id, technicianId]
        );
        if (assigns.length === 0) {
          throw new Error('BR12: Bạn chỉ được xử lý các sự cố được phân công cho mình.');
        }
      }

      const newStatus = is_completed ? 'resolved' : 'in_progress';

      // Cập nhật sự cố
      await conn.query(`UPDATE incidents SET status = ? WHERE id = ?`, [newStatus, id]);

      // Ghi nhận lịch sử xử lý (BR15)
      await conn.query(
        `INSERT INTO incident_histories (incident_id, employee_id, action, description, spare_parts, cost)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          technicianId,
          action_title || (is_completed ? 'Hoàn thành khắc phục sự cố' : 'Đang tiến hành sửa chữa'),
          description,
          spare_parts || null,
          cost,
        ]
      );

      // Nếu đã xử lý xong và có thiết bị -> Đổi trạng thái thiết bị sang 'good'
      if (is_completed && inc.equipment_id) {
        await conn.query(`UPDATE equipment SET status = 'good', last_maintenance = CURDATE() WHERE id = ?`, [
          inc.equipment_id,
        ]);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật tiến trình và kết quả xử lý sự cố thành công!',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * ĐÓNG SỰ CỐ (Chỉ Manager / Admin - BR13, BR14)
 */
async function closeIncident(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const employeeId = req.user.employeeId || 2;

    await db.withTransaction(async (conn) => {
      const [incidents] = await conn.query(`SELECT * FROM incidents WHERE id = ? FOR UPDATE`, [id]);
      if (!incidents || incidents.length === 0) throw new Error('Không tìm thấy sự cố.');

      const inc = incidents[0];

      // Cập nhật sự cố sang 'closed'
      await conn.query(`UPDATE incidents SET status = 'closed' WHERE id = ?`, [id]);

      // Cập nhật assignment sang 'completed'
      await conn.query(`UPDATE assignments SET status = 'completed' WHERE incident_id = ?`, [id]);

      // Ghi nhận lịch sử nghiệm thu
      await conn.query(
        `INSERT INTO incident_histories (incident_id, employee_id, action, description)
         VALUES (?, ?, 'Nghiệm thu và đóng sự cố', ?)`,
        [id, employeeId, note || 'Quản lý đã kiểm tra nghiệm thu đạt tiêu chuẩn và đóng sự cố.']
      );

      // Nếu phòng không còn sự cố nào khác đang mở -> Khôi phục trạng thái phòng về 'active'
      if (inc.room_id) {
        const [remainingIncidents] = await conn.query(
          `SELECT id FROM incidents WHERE room_id = ? AND status NOT IN ('closed', 'resolved') AND id != ?`,
          [inc.room_id, id]
        );
        if (remainingIncidents.length === 0) {
          await conn.query(`UPDATE cinema_rooms SET status = 'active' WHERE id = ?`, [inc.room_id]);
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Đã nghiệm thu và đóng sự cố thành công.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  assignTechnician,
  resolveIncident,
  closeIncident,
};
