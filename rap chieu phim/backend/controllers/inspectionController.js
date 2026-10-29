const db = require('../config/database');

/**
 * Lấy danh sách phiếu kiểm tra phòng
 */
async function getInspections(req, res, next) {
  try {
    const { room_id, status } = req.query;

    let sql = `
      SELECT i.*, 
             r.name AS room_name, r.room_type,
             e.name AS employee_name
      FROM room_inspections i
      JOIN cinema_rooms r ON i.room_id = r.id
      JOIN employees e ON i.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (room_id) {
      sql += ` AND i.room_id = ?`;
      params.push(room_id);
    }

    if (status && status !== 'all') {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY i.inspection_date DESC`;

    const inspections = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      data: inspections,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy chi tiết 9 hạng mục của một phiếu kiểm tra
 */
async function getInspectionById(req, res, next) {
  try {
    const { id } = req.params;

    const inspections = await db.query(
      `SELECT i.*, r.name AS room_name, e.name AS employee_name
       FROM room_inspections i
       JOIN cinema_rooms r ON i.room_id = r.id
       JOIN employees e ON i.employee_id = e.id
       WHERE i.id = ?`,
      [id]
    );

    if (!inspections || inspections.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu kiểm tra phòng.' });
    }

    const details = await db.query(
      `SELECT * FROM inspection_details WHERE inspection_id = ? ORDER BY id ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...inspections[0],
        details,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GỬI CHECKLIST KIỂM TRA PHÒNG 9 TIÊU CHÍ (MỤC 26, BR16)
 * Nếu có hạng mục không đạt -> Tự động sinh sự cố (Incident)
 */
async function submitInspection(req, res, next) {
  try {
    const { room_id, note, checklist, auto_create_incident = true } = req.body;
    const employeeId = req.user.employeeId || 4;

    if (!room_id || !Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp phòng chiếu và đầy đủ danh sách 9 hạng mục kiểm tra.',
      });
    }

    // Đánh giá tổng thể: pass nếu tất cả pass, fail nếu có bất kỳ mục fail nào
    const hasFail = checklist.some((item) => item.status === 'fail');
    const hasActionReq = checklist.some((item) => item.status === 'action_required');
    let overallStatus = 'pass';
    if (hasFail) overallStatus = 'fail';
    else if (hasActionReq) overallStatus = 'action_required';

    const result = await db.withTransaction(async (conn) => {
      // 1. Tạo phiếu kiểm tra phòng
      const [inspRes] = await conn.query(
        `INSERT INTO room_inspections (room_id, employee_id, status, note)
         VALUES (?, ?, ?, ?)`,
        [room_id, employeeId, overallStatus, note || null]
      );

      const inspectionId = inspRes.insertId;

      // 2. Lưu chi tiết từng hạng mục
      const detailRows = checklist.map((item) => [
        inspectionId,
        item.item_name,
        item.status || 'pass',
        item.note || null,
      ]);

      await conn.query(
        `INSERT INTO inspection_details (inspection_id, item_name, status, note) VALUES ?`,
        [detailRows]
      );

      // 3. BR16: Nếu có hạng mục Fail và bật auto_create_incident -> Tạo Incident tự động
      const createdIncidents = [];
      if (hasFail && auto_create_incident) {
        const failedItems = checklist.filter((i) => i.status === 'fail');

        for (const failedItem of failedItems) {
          const incCode = `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
          const incTitle = `Sự cố phát hiện qua kiểm tra phòng: ${failedItem.item_name}`;
          const incDesc = `Hạng mục "${failedItem.item_name}" không đạt tiêu chuẩn trong phiếu kiểm tra #${inspectionId}. Ghi chú: ${failedItem.note || 'Cần kiểm tra khắc phục gấp'}`;

          const [incRes] = await conn.query(
            `INSERT INTO incidents (code, reporter_id, room_id, title, description, severity, status)
             VALUES (?, ?, ?, ?, ?, 'high', 'new')`,
            [incCode, employeeId, room_id, incTitle, incDesc]
          );

          createdIncidents.push({ id: incRes.insertId, code: incCode, item: failedItem.item_name });
        }

        // Đổi trạng thái phòng sang 'incident'
        await conn.query(`UPDATE cinema_rooms SET status = 'incident' WHERE id = ?`, [room_id]);
      }

      return {
        inspectionId,
        overallStatus,
        createdIncidents,
      };
    });

    return res.status(201).json({
      success: true,
      message: `Đã lưu phiếu kiểm tra phòng (Kết quả: ${overallStatus.toUpperCase()})! ${
        result.createdIncidents.length > 0 ? `Đã tự động khởi tạo ${result.createdIncidents.length} sự cố.` : ''
      }`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInspections,
  getInspectionById,
  submitInspection,
};
