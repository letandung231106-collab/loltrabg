const db = require('../config/database');

/**
 * Lấy danh sách lịch chiếu theo Ngày, Phim, Phòng hoặc Trạng thái
 */
async function getSchedules(req, res, next) {
  try {
    const { date, movie_id, room_id, status } = req.query;

    let sql = `
      SELECT s.*, 
             m.name AS movie_name, m.poster AS movie_poster, m.duration, m.age_rating, m.genre,
             r.name AS room_name, r.room_type, r.capacity, r.status AS room_status,
             (SELECT COUNT(*) FROM booking_seats bs 
              JOIN bookings b ON bs.booking_id = b.id 
              WHERE b.screening_id = s.id AND bs.status = 'booked') AS booked_seats_count
      FROM screening_schedules s
      JOIN movies m ON s.movie_id = m.id
      JOIN cinema_rooms r ON s.room_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ` AND DATE(s.start_time) = ?`;
      params.push(date);
    }

    if (movie_id) {
      sql += ` AND s.movie_id = ?`;
      params.push(movie_id);
    }

    if (room_id) {
      sql += ` AND s.room_id = ?`;
      params.push(room_id);
    }

    if (status) {
      sql += ` AND s.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY s.start_time ASC`;

    const schedules = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy chi tiết lịch chiếu và SƠ ĐỒ GHẾ THỜI GIAN THỰC
 * QUY TẮC QUAN TRỌNG (Mục 12 & 32): Trạng thái ghế xác định theo Suất chiếu + Ghế
 */
async function getScheduleSeatMap(req, res, next) {
  try {
    const { id } = req.params;

    // 1. Lấy thông tin lịch chiếu
    const schedules = await db.query(
      `SELECT s.*, 
              m.name AS movie_name, m.poster AS movie_poster, m.duration, m.age_rating, m.genre, m.format AS movie_format,
              r.name AS room_name, r.room_type, r.capacity, r.status AS room_status
       FROM screening_schedules s
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE s.id = ?`,
      [id]
    );

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch chiếu này.',
      });
    }

    const schedule = schedules[0];

    // 2. Lấy toàn bộ danh sách ghế vật lý của phòng
    const physicalSeats = await db.query(
      `SELECT * FROM seats WHERE room_id = ? ORDER BY row_number ASC, seat_number ASC`,
      [schedule.room_id]
    );

    // 3. Lấy các bản ghi ghế đang ĐƯỢC GIỮ hoặc ĐÃ ĐẶT trong suất chiếu này
    // (Lưu ý: Chỉ lấy holding còn hiệu lực: hold_expire > NOW())
    const activeBookingSeats = await db.query(
      `SELECT bs.seat_id, bs.status, bs.hold_start, bs.hold_expire, bs.booking_id, b.customer_id
       FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       WHERE b.screening_id = ?
         AND (
           bs.status = 'booked'
           OR (bs.status = 'holding' AND bs.hold_expire > NOW())
         )`,
      [id]
    );

    const bookingSeatMap = new Map();
    activeBookingSeats.forEach((item) => {
      bookingSeatMap.set(item.seat_id, item);
    });

    // 4. Hợp nhất thành sơ đồ ghế với trạng thái thời gian thực
    const seatLayout = physicalSeats.map((seat) => {
      let state = 'available'; // 🟢 Trống
      let holdInfo = null;

      if (seat.status === 'broken' || seat.status === 'inactive') {
        state = 'unavailable'; // ⚪ Ghế hỏng / Không sử dụng
      } else if (bookingSeatMap.has(seat.id)) {
        const bookedData = bookingSeatMap.get(seat.id);
        if (bookedData.status === 'booked') {
          state = 'booked'; // 🔴 Đã đặt
        } else if (bookedData.status === 'holding') {
          state = 'holding'; // 🔵 Đang được giữ
          holdInfo = {
            hold_expire: bookedData.hold_expire,
            booking_id: bookedData.booking_id,
            is_current_user: req.user ? req.user.customerId === bookedData.customer_id : false,
          };
        }
      }

      // Tính giá vé theo loại ghế
      let price = parseFloat(schedule.ticket_price);
      if (seat.seat_type === 'vip') price += 20000;
      if (seat.seat_type === 'couple') price = price * 2 + 10000;

      return {
        id: seat.id,
        room_id: seat.room_id,
        row_number: seat.row_number,
        seat_number: seat.seat_number,
        seat_type: seat.seat_type,
        price,
        state, // 'available' | 'holding' | 'booked' | 'unavailable'
        holdInfo,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        schedule,
        seats: seatLayout,
        summary: {
          total: seatLayout.length,
          available: seatLayout.filter((s) => s.state === 'available').length,
          holding: seatLayout.filter((s) => s.state === 'holding').length,
          booked: seatLayout.filter((s) => s.state === 'booked').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Tạo mới Lịch chiếu có kiểm tra đầy đủ Business Rules (BR01, BR02, BR03)
 */
async function createSchedule(req, res, next) {
  try {
    const { movie_id, room_id, start_time, ticket_price = 90000, format = '2D Digital' } = req.body;

    if (!movie_id || !room_id || !start_time) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: phim, phòng và thời gian bắt đầu.',
      });
    }

    // 1. Kiểm tra phim & tính giờ kết thúc (duration + 15 phút dọn phòng)
    const movies = await db.query(`SELECT id, duration, name, status FROM movies WHERE id = ?`, [movie_id]);
    if (!movies || movies.length === 0) {
      return res.status(400).json({ success: false, message: 'Phim không tồn tại.' });
    }
    const movie = movies[0];

    const startDateTime = new Date(start_time);
    const endDateTime = new Date(startDateTime.getTime() + (movie.duration + 15) * 60000);
    const endTimeStr = endDateTime.toISOString().slice(0, 19).replace('T', ' ');

    // 2. BR02: Kiểm tra tình trạng phòng (không được là maintenance hoặc incident)
    const rooms = await db.query(`SELECT id, name, status FROM cinema_rooms WHERE id = ?`, [room_id]);
    if (!rooms || rooms.length === 0) {
      return res.status(400).json({ success: false, message: 'Phòng chiếu không tồn tại.' });
    }
    const room = rooms[0];

    if (room.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: `BR02: Không thể lập lịch chiếu cho ${room.name} vì phòng đang trong trạng thái BẢO TRÌ.`,
      });
    }

    if (room.status === 'incident') {
      return res.status(400).json({
        success: false,
        message: `BR02: Không thể lập lịch chiếu cho ${room.name} vì phòng đang CÓ SỰ CỐ chưa xử lý.`,
      });
    }

    // 3. BR03: Kiểm tra thiết bị trọng yếu của phòng (Máy chiếu / Âm thanh)
    const faultyEquipment = await db.query(
      `SELECT e.name, et.name AS type_name, e.status
       FROM equipment e
       JOIN equipment_types et ON e.equipment_type_id = et.id
       WHERE e.room_id = ? AND e.status IN ('broken', 'repairing') AND et.id IN (1, 2)`,
      [room_id]
    );

    if (faultyEquipment.length > 0) {
      return res.status(400).json({
        success: false,
        message: `BR03: Phòng ${room.name} đang có thiết bị trọng yếu bị hỏng (${faultyEquipment.map((f) => f.name).join(', ')}). Không thể mở lịch chiếu.`,
      });
    }

    // 4. BR01: Kiểm tra xung đột lịch chiếu cùng phòng
    const conflicts = await db.query(
      `SELECT s.id, s.start_time, s.end_time, m.name AS movie_name
       FROM screening_schedules s
       JOIN movies m ON s.movie_id = m.id
       WHERE s.room_id = ? 
         AND s.status IN ('scheduled', 'screening')
         AND (
           (? >= s.start_time AND ? < s.end_time)
           OR (? > s.start_time AND ? <= s.end_time)
           OR (? <= s.start_time AND ? >= s.end_time)
         )`,
      [room_id, start_time, start_time, endTimeStr, endTimeStr, start_time, endTimeStr]
    );

    if (conflicts.length > 0) {
      const c = conflicts[0];
      return res.status(409).json({
        success: false,
        message: `BR01: Xung đột lịch chiếu! Phòng ${room.name} đã có suất chiếu phim "${c.movie_name}" từ ${c.start_time} đến ${c.end_time}.`,
      });
    }

    // 5. Thêm lịch chiếu mới
    const result = await db.query(
      `INSERT INTO screening_schedules (movie_id, room_id, start_time, end_time, format, ticket_price, status)
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
      [movie_id, room_id, start_time, endTimeStr, format, ticket_price]
    );

    return res.status(201).json({
      success: true,
      message: `Đã lập lịch chiếu thành công cho phim "${movie.name}" tại ${room.name}!`,
      data: {
        id: result.insertId,
        movie_id,
        room_id,
        start_time,
        end_time: endTimeStr,
        ticket_price,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Hủy lịch chiếu
 */
async function cancelSchedule(req, res, next) {
  try {
    const { id } = req.params;

    // Kiểm tra vé đã bán chưa
    const bookedSeats = await db.query(
      `SELECT COUNT(*) AS count FROM booking_seats bs
       JOIN bookings b ON bs.booking_id = b.id
       WHERE b.screening_id = ? AND bs.status = 'booked'`,
      [id]
    );

    if (bookedSeats[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Lịch chiếu này đã bán được ${bookedSeats[0].count} vé. Cần hoàn tiền cho khách trước khi hủy.`,
      });
    }

    await db.query(`UPDATE screening_schedules SET status = 'cancelled' WHERE id = ?`, [id]);

    return res.status(200).json({
      success: true,
      message: 'Đã hủy lịch chiếu thành công.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSchedules,
  getScheduleSeatMap,
  createSchedule,
  cancelSchedule,
};
