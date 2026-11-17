const db = require('../config/database');

/**
 * Lấy danh sách phòng chiếu kèm tình trạng thiết bị
 */
async function getRooms(req, res, next) {
  try {
    const rooms = await db.query(
      `SELECT r.*,
              COUNT(DISTINCT s.id) AS total_seats,
              COUNT(DISTINCT e.id) AS total_equipment,
              SUM(CASE WHEN e.status IN ('broken', 'repairing') THEN 1 ELSE 0 END) AS faulty_equipment_count
       FROM cinema_rooms r
       LEFT JOIN seats s ON s.room_id = r.id
       LEFT JOIN equipment e ON e.room_id = r.id
       GROUP BY r.id
       ORDER BY r.id ASC`
    );

    return res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Chi tiết phòng chiếu: thông tin, danh sách ghế, thiết bị và lịch chiếu
 */
async function getRoomById(req, res, next) {
  try {
    const { id } = req.params;

    const rooms = await db.query(`SELECT * FROM cinema_rooms WHERE id = ?`, [id]);
    if (!rooms || rooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chiếu.',
      });
    }

    const room = rooms[0];

    // Lấy danh sách ghế
    const seats = await db.query(
      `SELECT * FROM seats WHERE room_id = ? ORDER BY \`row_number\` ASC, seat_number ASC`,
      [id]
    );

    // Lấy danh sách thiết bị
    const equipment = await db.query(
      `SELECT e.*, et.name AS type_name
       FROM equipment e
       JOIN equipment_types et ON e.equipment_type_id = et.id
       WHERE e.room_id = ?`,
      [id]
    );

    // Lấy lịch sử kiểm tra phòng gần nhất
    const inspections = await db.query(
      `SELECT i.*, e.name AS employee_name
       FROM room_inspections i
       JOIN employees e ON i.employee_id = e.id
       WHERE i.room_id = ?
       ORDER BY i.inspection_date DESC LIMIT 5`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...room,
        seats,
        equipment,
        inspections,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật trạng thái phòng (active, maintenance, paused, incident)
 */
async function updateRoomStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, description } = req.body;

    if (!['active', 'maintenance', 'paused', 'incident'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái phòng không hợp lệ (chọn: active, maintenance, paused, incident).',
      });
    }

    await db.query(
      `UPDATE cinema_rooms SET status = ?, description = COALESCE(?, description) WHERE id = ?`,
      [status, description, id]
    );

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái phòng thành công: ${status}`,
    });
  } catch (error) {
    next(error);
  }
}

const DEFAULT_EQUIPMENT_TEMPLATES = {
  projector: {
    equipment_type_id: 1,
    name: 'Máy chiếu Laser 4K Christie RGB',
    manufacturer: 'Christie Digital (Mỹ)',
    codePrefix: 'PRJ',
  },
  sound: {
    equipment_type_id: 2,
    name: 'Hệ thống âm thanh vòm Dolby Atmos CP950',
    manufacturer: 'Dolby Laboratories',
    codePrefix: 'SND',
  },
  hvac: {
    equipment_type_id: 3,
    name: 'Điều hòa trung tâm Daikin VRV X 18HP',
    manufacturer: 'Daikin (Nhật Bản)',
    codePrefix: 'AC',
  },
  lighting: {
    equipment_type_id: 4,
    name: 'Hệ thống đèn LED dẫn đường & chiếu sáng rạp',
    manufacturer: 'Philips Lighting',
    codePrefix: 'LGT',
  },
  screen: {
    equipment_type_id: 5,
    name: 'Màn chiếu tráng bạc Harkness Clarus XC',
    manufacturer: 'Harkness Screens',
    codePrefix: 'SCR',
  },
  motion_4dx: {
    equipment_type_id: 6,
    name: 'Hệ thống ghế chuyển động & hiệu ứng 4DX',
    manufacturer: 'CJ 4DPLEX',
    codePrefix: '4DX',
  },
  camera: {
    equipment_type_id: 7,
    name: 'Camera hồng ngoại giám sát khán phòng',
    manufacturer: 'Hikvision Pro',
    codePrefix: 'CAM',
  },
  server: {
    equipment_type_id: 8,
    name: 'Máy chủ giải mã phim DCI & KDM Dolby IMS3000',
    manufacturer: 'Dolby Cinema',
    codePrefix: 'SRV',
  },
};

/**
 * Tạo phòng chiếu mới, tự động sinh sơ đồ ghế & tự động thêm trang thiết bị được chọn
 */
async function createRoom(req, res, next) {
  try {
    const {
      name,
      room_type = 'standard',
      location,
      description,
      rows = 6,
      seatsPerRow = 12,
      selected_equipment,
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên phòng và vị trí.',
      });
    }

    const totalCapacity = rows * seatsPerRow;

    const result = await db.withTransaction(async (conn) => {
      const [roomRes] = await conn.query(
        `INSERT INTO cinema_rooms (name, room_type, capacity, location, status, description)
         VALUES (?, ?, ?, ?, 'active', ?)`,
        [name, room_type, totalCapacity, location, description || '']
      );

      const roomId = roomRes.insertId;

      // Sinh danh sách ghế tự động: A -> H
      const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const seatValues = [];

      for (let r = 0; r < Math.min(rows, rowLetters.length); r++) {
        const rowChar = rowLetters[r];
        let seatType = 'standard';
        if (r >= 3 && r <= 4) seatType = 'vip';
        if (r === rows - 1) seatType = 'couple';

        for (let s = 1; s <= seatsPerRow; s++) {
          seatValues.push([roomId, rowChar, s, seatType, 'active']);
        }
      }

      if (seatValues.length > 0) {
        await conn.query(
          `INSERT INTO seats (room_id, \`row_number\`, seat_number, seat_type, status) VALUES ?`,
          [seatValues]
        );
      }

      // Tự động khởi tạo trang thiết bị đi kèm cho phòng chiếu mới
      const defaultKeys =
        room_type === '4dx'
          ? ['projector', 'sound', 'hvac', 'lighting', 'screen', 'motion_4dx', 'server']
          : room_type === 'imax'
          ? ['projector', 'sound', 'hvac', 'lighting', 'screen', 'camera', 'server']
          : ['projector', 'sound', 'hvac', 'lighting', 'screen', 'server'];

      const equipmentList = Array.isArray(selected_equipment)
        ? selected_equipment
        : defaultKeys;

      const todayStr = new Date().toISOString().slice(0, 10);
      const nextMaintStr = new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
      const warrantyStr = new Date(Date.now() + 3 * 365 * 86400000).toISOString().slice(0, 10);

      let equipmentCount = 0;
      for (let idx = 0; idx < equipmentList.length; idx++) {
        const item = equipmentList[idx];
        const tpl =
          typeof item === 'string'
            ? DEFAULT_EQUIPMENT_TEMPLATES[item]
            : item && typeof item === 'object'
            ? item
            : null;
        if (!tpl) continue;

        const eqTypeId = tpl.equipment_type_id || 1;
        const eqName = tpl.name || `Thiết bị phòng ${name}`;
        const eqManufacturer = tpl.manufacturer || 'Cinema Pro';
        const prefix = tpl.codePrefix || 'EQ';
        const eqCode = `EQ-P${roomId}-${prefix}0${idx + 1}`;

        await conn.query(
          `INSERT INTO equipment (equipment_type_id, room_id, name, code, manufacturer, purchase_date, warranty_end, next_maintenance, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [eqTypeId, roomId, eqName, eqCode, eqManufacturer, todayStr, warrantyStr, nextMaintStr, 'good']
        );
        equipmentCount++;
      }

      return { roomId, totalCapacity, equipmentCount };
    });

    return res.status(201).json({
      success: true,
      message: `Đã khởi tạo phòng chiếu ${name} cùng ${result.totalCapacity} ghế và tự động lắp đặt ${result.equipmentCount} trang thiết bị!`,
      data: {
        id: result.roomId,
        capacity: result.totalCapacity,
        equipment_created: result.equipmentCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật thông tin phòng chiếu (name, room_type, location, description)
 */
async function updateRoom(req, res, next) {
  try {
    const { id } = req.params;
    const { name, room_type, location, description, capacity } = req.body;

    const existing = await db.query(`SELECT * FROM cinema_rooms WHERE id = ?`, [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng chiếu.' });
    }

    await db.query(
      `UPDATE cinema_rooms 
       SET name = COALESCE(?, name),
           room_type = COALESCE(?, room_type),
           capacity = COALESCE(?, capacity),
           location = COALESCE(?, location),
           status = COALESCE(?, status),
           description = COALESCE(?, description)
       WHERE id = ?`,
      [name, room_type, capacity, location, req.body.status, description, id]
    );

    return res.status(200).json({
      success: true,
      message: `Cập nhật thông tin phòng chiếu ${name || existing[0].name} thành công!`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa phòng chiếu (chặn xóa nếu đang có lịch chiếu đã lên lịch)
 */
async function deleteRoom(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await db.query(`SELECT * FROM cinema_rooms WHERE id = ?`, [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng chiếu.' });
    }

    // Kiểm tra lịch chiếu gắn với phòng
    const activeSchedules = await db.query(
      `SELECT * FROM screening_schedules WHERE room_id = ? AND status = 'scheduled'`,
      [id]
    );

    if (activeSchedules && activeSchedules.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa phòng chiếu "${existing[0].name}" vì đang có ${activeSchedules.length} suất chiếu đã được lên lịch. Vui lòng hủy lịch chiếu trước!`,
      });
    }

    await db.query(`DELETE FROM cinema_rooms WHERE id = ?`, [id]);

    return res.status(200).json({
      success: true,
      message: `Đã xóa phòng chiếu "${existing[0].name}" thành công!`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRooms,
  getRoomById,
  updateRoomStatus,
  createRoom,
  updateRoom,
  deleteRoom,
};
