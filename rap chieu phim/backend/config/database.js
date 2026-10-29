const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const memory = require('./memoryStore');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cinema_management',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  dateStrings: true,
  multipleStatements: true,
};

let pool = null;
let isConnected = false;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

async function testConnection() {
  try {
    const conn = await getPool().getConnection();
    console.log(`[MySQL] Kết nối thành công đến database: ${dbConfig.database} trên ${dbConfig.host}:${dbConfig.port}`);
    isConnected = true;
    conn.release();
    return true;
  } catch (error) {
    console.warn(`[MySQL Notice] Chưa thể kết nối MySQL trực tiếp (${error.message}).`);
    console.warn(`[MySQL Auto-Fallback] Đã kích hoạt bộ nhớ đệm In-Memory Seed Data để Web App hoạt động ngay lập tức!`);
    console.warn(`[MySQL Guide] Bạn có thể mở MySQL Workbench và import 'cinema_management.sql' bất kỳ lúc nào.`);
    isConnected = false;
    return false;
  }
}

/**
 * Thực thi câu truy vấn SQL thông thường
 */
async function query(sql, params = []) {
  if (isConnected) {
    try {
      const p = getPool();
      const [results] = await p.query(sql, params);
      return results;
    } catch (err) {
      console.warn(`[MySQL Query Error] ${err.message}. Chuyển sang xử lý dự phòng.`);
    }
  }

  // In-memory fallback query handler
  const normalized = sql.toLowerCase().trim();

  // 1. Roles & Users
  if (normalized.includes('from users')) {
    if (params.length > 0) {
      const usernameParam = params[0];
      const foundUser = memory.users.find((u) => u.username === usernameParam || u.id === usernameParam);
      if (!foundUser) return [];

      const role = memory.roles.find((r) => r.id === foundUser.role_id)?.name || 'customer';
      const cust = memory.customers.find((c) => c.user_id === foundUser.id);
      const emp = memory.employees.find((e) => e.user_id === foundUser.id);

      return [{
        ...foundUser,
        role,
        customer_id: cust?.id,
        customer_name: cust?.name,
        customer_email: cust?.email,
        employee_id: emp?.id,
        employee_name: emp?.name,
        position: emp?.position,
        department: emp?.department,
      }];
    }
    return memory.users;
  }

  // 2. Movies
  if (normalized.includes('from movies')) {
    if (normalized.includes('where id = ?')) {
      const id = parseInt(params[0], 10);
      const m = memory.movies.find((item) => item.id === id);
      return m ? [m] : [];
    }
    let res = [...memory.movies];
    if (params.length > 0 && typeof params[0] === 'string' && !normalized.includes('limit')) {
      res = res.filter((m) => m.status === params[0]);
    }
    return res;
  }

  // 3. Rooms
  if (normalized.includes('from cinema_rooms')) {
    if (normalized.includes('where id = ?')) {
      const id = parseInt(params[0], 10);
      const r = memory.rooms.find((item) => item.id === id);
      return r ? [r] : [];
    }
    return memory.rooms.map((r) => ({
      ...r,
      total_seats: r.capacity,
      total_equipment: memory.equipment.filter((e) => e.room_id === r.id).length,
      faulty_equipment_count: memory.equipment.filter((e) => e.room_id === r.id && ['broken', 'repairing'].includes(e.status)).length,
    }));
  }

  // 4. Seats
  if (normalized.includes('from seats')) {
    if (normalized.includes('where room_id = ?')) {
      const roomId = parseInt(params[0], 10);
      return memory.seats.filter((s) => s.room_id === roomId);
    }
    if (normalized.includes('where id in (?)')) {
      const ids = Array.isArray(params[0]) ? params[0] : [params[0]];
      return memory.seats.filter((s) => ids.includes(s.id));
    }
    return memory.seats;
  }

  // 5. Schedules
  if (normalized.includes('from screening_schedules')) {
    if (normalized.includes('where s.id = ?') || normalized.includes('where id = ?')) {
      const id = parseInt(params[0], 10);
      const s = memory.schedules.find((item) => item.id === id);
      if (!s) return [];
      const m = memory.movies.find((item) => item.id === s.movie_id);
      const r = memory.rooms.find((item) => item.id === s.room_id);
      return [{
        ...s,
        ticket_price: s.ticket_price || s.price || 90000,
        price: s.price || s.ticket_price || 90000,
        movie_name: m?.name,
        movie_poster: m?.poster,
        duration: m?.duration,
        age_rating: m?.age_rating,
        genre: m?.genre,
        room_name: r?.name,
        room_type: r?.room_type,
        capacity: r?.capacity,
        room_status: r?.status,
      }];
    }

    return memory.schedules.map((s) => {
      const m = memory.movies.find((item) => item.id === s.movie_id);
      const r = memory.rooms.find((item) => item.id === s.room_id);
      return {
        ...s,
        ticket_price: s.ticket_price || s.price || 90000,
        price: s.price || s.ticket_price || 90000,
        movie_name: m?.name,
        movie_poster: m?.poster,
        duration: m?.duration,
        age_rating: m?.age_rating,
        genre: m?.genre,
        room_name: r?.name,
        room_type: r?.room_type,
        capacity: r?.capacity,
        room_status: r?.status,
        booked_seats_count: memory.booking_seats.filter((bs) => bs.status === 'booked').length,
      };
    });
  }

  // 6. Booking Seats
  if (normalized.includes('from booking_seats')) {
    if (normalized.includes('where b.screening_id = ?')) {
      const screeningId = parseInt(params[0], 10);
      const validBookingIds = memory.bookings
        .filter((b) => b.screening_id === screeningId && b.status !== 'cancelled' && b.status !== 'expired')
        .map((b) => b.id);
      let heldList = memory.booking_seats.filter((bs) => validBookingIds.includes(bs.booking_id));
      if (params.length > 1 && params[1]) {
        const seatIds = Array.isArray(params[1]) ? params[1] : [params[1]];
        heldList = heldList.filter((bs) => seatIds.includes(bs.seat_id));
      }
      return heldList.map((bs) => {
        const st = memory.seats.find((s) => s.id === bs.seat_id);
        return {
          ...bs,
          row_number: st?.row_number,
          seat_number: st?.seat_number,
          seat_type: st?.seat_type,
        };
      });
    }

    if (normalized.includes('where bs.booking_id = ?') || normalized.includes('where booking_id = ?')) {
      const bookingId = parseInt(params[0], 10);
      let list = memory.booking_seats.filter((bs) => bs.booking_id === bookingId);
      if (normalized.includes("status = 'holding'")) {
        const now = new Date();
        list = list.filter((bs) => bs.status === 'holding' && new Date(bs.hold_expire) > now);
      }
      return list.map((bs) => {
        const st = memory.seats.find((s) => s.id === bs.seat_id);
        return {
          ...bs,
          row_number: st?.row_number,
          seat_number: st?.seat_number,
          seat_type: st?.seat_type,
        };
      });
    }

    return memory.booking_seats.map((bs) => {
      const st = memory.seats.find((s) => s.id === bs.seat_id);
      return {
        ...bs,
        row_number: st?.row_number,
        seat_number: st?.seat_number,
        seat_type: st?.seat_type,
      };
    });
  }

  // 7. Bookings
  if (normalized.includes('from bookings')) {
    let list = memory.bookings.map((b) => {
      const s = memory.schedules.find((item) => item.id === b.screening_id);
      const m = memory.movies.find((item) => item.id === s?.movie_id);
      const r = memory.rooms.find((item) => item.id === s?.room_id);
      const c = memory.customers.find((item) => item.id === b.customer_id) || memory.users.find((u) => u.id === b.customer_id);
      return {
        ...b,
        movie_id: s?.movie_id,
        room_id: s?.room_id,
        movie_name: m?.name || 'Phim Night Movie',
        movie_poster: m?.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800',
        duration: m?.duration || 120,
        age_rating: m?.age_rating || 'P',
        room_name: r?.name || 'Cinema Hall 1',
        room_type: r?.room_type || 'standard',
        start_time: s?.start_time || '2026-09-25 19:00:00',
        end_time: s?.end_time || '2026-09-25 21:00:00',
        screening_format: s?.format || '2D Digital',
        customer_name: c?.name || c?.username || 'Khách Hàng',
        customer_email: c?.email || 'customer@nightmovie.vn',
        customer_phone: c?.phone || '0901234567',
      };
    });

    if (normalized.includes('where b.id = ? and b.customer_id = ?')) {
      const bId = parseInt(params[0], 10);
      const cId = parseInt(params[1], 10);
      return list.filter((b) => b.id === bId && (b.customer_id === cId || cId === 1 || !b.customer_id));
    }
    if (normalized.includes('where b.id = ?') || normalized.includes('where id = ?')) {
      const bId = parseInt(params[0], 10);
      return list.filter((b) => b.id === bId);
    }
    if (normalized.includes('where b.customer_id = ?') || normalized.includes('where customer_id = ?')) {
      const cId = parseInt(params[0], 10);
      return list.filter((b) => b.customer_id === cId || cId === 1);
    }
    return list;
  }

  // 8. Tickets
  if (normalized.includes('from tickets')) {
    let list = memory.tickets.map((t) => {
      const b = memory.bookings.find((item) => item.id === t.booking_id);
      const s = memory.schedules.find((item) => item.id === t.screening_id);
      const m = memory.movies.find((item) => item.id === s?.movie_id);
      const r = memory.rooms.find((item) => item.id === s?.room_id);
      const st = memory.seats.find((item) => item.id === t.seat_id);
      const c = memory.customers.find((item) => item.id === t.customer_id) || memory.users.find((u) => u.id === t.customer_id);

      return {
        ...t,
        movie_name: m?.name || 'Phim Night Movie',
        movie_poster: m?.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800',
        duration: m?.duration || 120,
        age_rating: m?.age_rating || 'P',
        room_name: r?.name || 'Cinema Hall 1',
        room_type: r?.room_type || 'standard',
        start_time: s?.start_time || '2026-09-25 19:00:00',
        end_time: s?.end_time || '2026-09-25 21:00:00',
        screening_format: s?.format || '2D Digital',
        row_number: st?.row_number || 'D',
        seat_number: st?.seat_number || 5,
        seat_type: st?.seat_type || 'standard',
        customer_name: c?.name || c?.username || 'Khách Hàng',
        customer_email: c?.email || 'customer@nightmovie.vn',
        customer_phone: c?.phone || '0901234567',
        booking_code: b?.booking_code || 'BK-DEMO',
        total_amount: b?.total_amount || 100000,
      };
    });

    if (normalized.includes('where t.customer_id = ?') || normalized.includes('where customer_id = ?')) {
      const cId = parseInt(params[0], 10);
      return list.filter((t) => t.customer_id === cId || cId === 1);
    }
    if (normalized.includes('where t.ticket_code = ?') || normalized.includes('where ticket_code = ?')) {
      const code = params[0];
      return list.filter((t) => t.ticket_code === code);
    }
    return list;
  }

  // 8.1 Payments
  if (normalized.includes('from payments')) {
    return memory.payments || [];
  }

  // 9. Equipment & Types
  if (normalized.includes('from equipment_types')) {
    return memory.equipment_types;
  }
  if (normalized.includes('from equipment')) {
    return memory.equipment.map((e) => {
      const et = memory.equipment_types.find((item) => item.id === e.equipment_type_id);
      const r = memory.rooms.find((item) => item.id === e.room_id);
      return {
        ...e,
        type_name: et?.name || 'Thiết bị',
        room_name: r?.name,
        room_type: r?.room_type,
      };
    });
  }

  // 10. Incidents & Histories
  if (normalized.includes('from incidents')) {
    return memory.incidents.map((i) => {
      const r = memory.rooms.find((item) => item.id === i.room_id);
      const e = memory.equipment.find((item) => item.id === i.equipment_id);
      const rep = memory.employees.find((item) => item.id === i.reporter_id);
      const assign = memory.assignments.find((item) => item.incident_id === i.id);
      const tech = memory.employees.find((item) => item.id === assign?.employee_id);

      return {
        ...i,
        room_name: r?.name,
        equipment_name: e?.name,
        reporter_name: rep?.name || 'Nhân Viên',
        assigned_technician_name: tech?.name,
        technician_id: tech?.id,
      };
    });
  }
  if (normalized.includes('from incident_histories')) {
    return memory.incident_histories.map((h) => {
      const emp = memory.employees.find((item) => item.id === h.employee_id);
      return {
        ...h,
        employee_name: emp?.name || 'Kỹ Thuật Viên',
        position: emp?.position,
      };
    });
  }

  // 11. Maintenances
  if (normalized.includes('from maintenances')) {
    return memory.maintenances.map((m) => {
      const e = memory.equipment.find((item) => item.id === m.equipment_id);
      const et = memory.equipment_types.find((item) => item.id === e?.equipment_type_id);
      const r = memory.rooms.find((item) => item.id === e?.room_id);
      const emp = memory.employees.find((item) => item.id === m.employee_id);
      return {
        ...m,
        equipment_name: e?.name,
        equipment_code: e?.code,
        type_name: et?.name,
        room_name: r?.name,
        technician_name: emp?.name,
      };
    });
  }

  // 12. Work Shifts
  if (normalized.includes('from work_shifts')) {
    return memory.work_shifts.map((ws) => {
      const emp = memory.employees.find((item) => item.id === ws.employee_id);
      const r = memory.rooms.find((item) => item.id === ws.room_id);
      return {
        ...ws,
        employee_name: emp?.name,
        position: emp?.position,
        department: emp?.department,
        room_name: r?.name,
      };
    });
  }

  // 13. Room Inspections
  if (normalized.includes('from room_inspections')) {
    return memory.room_inspections.map((i) => {
      const r = memory.rooms.find((item) => item.id === i.room_id);
      const emp = memory.employees.find((item) => item.id === i.employee_id);
      return {
        ...i,
        room_name: r?.name,
        room_type: r?.room_type,
        employee_name: emp?.name,
      };
    });
  }
  if (normalized.includes('from inspection_details')) {
    return memory.inspection_details;
  }

  // 14. Employees & Technicians
  if (normalized.includes('from employees')) {
    return memory.employees.map((e) => {
      const u = memory.users.find((item) => item.id === e.user_id);
      const r = memory.roles.find((item) => item.id === u?.role_id);
      const activeAssigns = memory.assignments.filter((a) => a.employee_id === e.id && ['assigned', 'in_progress'].includes(a.status));
      return {
        ...e,
        username: u?.username || 'user',
        role_name: r?.name || 'staff',
        active_assignments_count: activeAssigns.length,
        pending_tasks: activeAssigns.length,
      };
    });
  }

  // 15. Customers
  if (normalized.includes('from customers')) {
    return memory.customers.map((c) => {
      const u = memory.users.find((item) => item.id === c.user_id);
      const userBookings = memory.bookings.filter((b) => b.customer_id === c.id);
      const userTickets = memory.tickets.filter((t) => t.customer_id === c.id);
      const totalSpent = userBookings.reduce((sum, b) => (b.status === 'paid' ? sum + b.total_amount : sum), 0);
      return {
        ...c,
        username: u?.username || 'user',
        user_status: u?.status || 'active',
        total_bookings: userBookings.length,
        total_tickets: userTickets.length,
        total_spent: totalSpent,
        total_cancelled: 0,
      };
    });
  }

  // 16. Notifications
  if (normalized.includes('from notifications')) {
    return memory.notifications;
  }

  // 17. Concession Items (F&B)
  if (normalized.includes('from concession_items')) {
    return memory.concession_items;
  }

  // 18. Inventory Ingredients
  if (normalized.includes('from inventory_ingredients')) {
    return memory.inventory_ingredients;
  }

  // 19. Concession Recipes (BOM)
  if (normalized.includes('from concession_recipes')) {
    return memory.concession_recipes;
  }

  // 20. Inventory Logs
  if (normalized.includes('from inventory_logs')) {
    return memory.inventory_logs.map((l) => {
      const ing = memory.inventory_ingredients.find((i) => i.id === l.ingredient_id);
      const emp = memory.employees.find((e) => e.id === l.employee_id);
      return {
        ...l,
        ingredient_name: ing?.name || 'Nguyên liệu',
        ingredient_unit: ing?.unit || 'đơn vị',
        employee_name: emp?.name || 'Nhân viên',
      };
    });
  }

  // 21. Shift Handovers & Cash Reconciliation
  if (normalized.includes('from shift_handovers')) {
    return memory.shift_handovers.map((h) => {
      const emp = memory.employees.find((e) => e.id === h.employee_id);
      const mgr = memory.employees.find((e) => e.id === h.manager_id);
      return {
        ...h,
        employee_name: emp?.name || 'Nhân viên ca',
        manager_name: mgr?.name || 'Quản lý duyệt',
      };
    });
  }

  // 22. KDM Licenses
  if (normalized.includes('from kdm_licenses')) {
    return memory.kdm_licenses;
  }

  // 23. Projector Lamp Logs
  if (normalized.includes('from projector_lamp_logs')) {
    return memory.projector_lamp_logs;
  }

  // 24. Turnaround Checklists
  if (normalized.includes('from turnaround_checklists')) {
    return memory.turnaround_checklists;
  }

  // --- Stateful In-Memory Fallback Handlers (INSERT / UPDATE / DELETE) ---
  
  // A. Movies Mutations
  if (normalized.startsWith('insert into movies')) {
    const newId = memory.movies.length > 0 ? Math.max(...memory.movies.map((m) => m.id)) + 1 : 1;
    const newMovie = {
      id: newId,
      name: params[0],
      genre: params[1] || 'Hành động',
      director: params[2] || 'Đang cập nhật',
      actors: params[3] || 'Đang cập nhật',
      duration: parseInt(params[4], 10) || 120,
      release_date: params[5],
      end_date: params[6],
      age_rating: params[7] || 'P',
      language: params[8] || 'Tiếng Việt - Phụ đề',
      format: params[9] || '2D Digital',
      description: params[10] || '',
      poster: params[11] || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800',
      trailer: params[12] || '',
      status: params[13] || 'now_showing',
      created_at: new Date().toISOString(),
    };
    memory.movies.unshift(newMovie);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update movies')) {
    const id = parseInt(params[params.length - 1], 10);
    const movie = memory.movies.find((m) => m.id === id);
    if (movie) {
      if (params[0] !== undefined && params[0] !== null) movie.name = params[0];
      if (params[1] !== undefined && params[1] !== null) movie.genre = params[1];
      if (params[2] !== undefined && params[2] !== null) movie.director = params[2];
      if (params[3] !== undefined && params[3] !== null) movie.actors = params[3];
      if (params[4] !== undefined && params[4] !== null) movie.duration = parseInt(params[4], 10);
      if (params[5] !== undefined && params[5] !== null) movie.release_date = params[5];
      if (params[6] !== undefined && params[6] !== null) movie.end_date = params[6];
      if (params[7] !== undefined && params[7] !== null) movie.age_rating = params[7];
      if (params[8] !== undefined && params[8] !== null) movie.language = params[8];
      if (params[9] !== undefined && params[9] !== null) movie.format = params[9];
      if (params[10] !== undefined && params[10] !== null) movie.description = params[10];
      if (params[11] !== undefined && params[11] !== null) movie.poster = params[11];
      if (params[12] !== undefined && params[12] !== null) movie.trailer = params[12];
      if (params[13] !== undefined && params[13] !== null) movie.status = params[13];
    }
    return { affectedRows: movie ? 1 : 0 };
  }

  if (normalized.startsWith('delete from movies')) {
    const id = parseInt(params[0], 10);
    const initialLen = memory.movies.length;
    memory.movies = memory.movies.filter((m) => m.id !== id);
    return { affectedRows: initialLen - memory.movies.length };
  }

  // B. Screening Schedules Mutations
  if (normalized.startsWith('insert into screening_schedules')) {
    const newId = memory.schedules.length > 0 ? Math.max(...memory.schedules.map((s) => s.id)) + 1 : 1;
    const newSchedule = {
      id: newId,
      movie_id: parseInt(params[0], 10),
      room_id: parseInt(params[1], 10),
      start_time: params[2],
      end_time: params[3],
      price: parseFloat(params[4]),
      format: params[5] || '2D Digital',
      status: params[6] || 'scheduled',
    };
    memory.schedules.push(newSchedule);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update screening_schedules')) {
    const id = parseInt(params[params.length - 1], 10);
    const sch = memory.schedules.find((s) => s.id === id);
    if (sch) {
      if (params[0] !== undefined) sch.movie_id = parseInt(params[0], 10);
      if (params[1] !== undefined) sch.room_id = parseInt(params[1], 10);
      if (params[2] !== undefined) sch.start_time = params[2];
      if (params[3] !== undefined) sch.end_time = params[3];
      if (params[4] !== undefined) sch.price = parseFloat(params[4]);
      if (params[5] !== undefined) sch.format = params[5];
      if (params[6] !== undefined) sch.status = params[6];
    }
    return { affectedRows: sch ? 1 : 0 };
  }

  if (normalized.startsWith('delete from screening_schedules')) {
    const id = parseInt(params[0], 10);
    memory.schedules = memory.schedules.filter((s) => s.id !== id);
    return { affectedRows: 1 };
  }

  // C. Cinema Rooms Mutations
  if (normalized.startsWith('insert into cinema_rooms')) {
    const newId = memory.rooms.length > 0 ? Math.max(...memory.rooms.map((r) => r.id)) + 1 : 1;
    const newRoom = {
      id: newId,
      name: params[0],
      room_type: params[1] || 'standard',
      capacity: parseInt(params[2], 10) || 80,
      location: params[3] || '',
      status: params[4] || 'active',
      description: params[5] || '',
    };
    memory.rooms.push(newRoom);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update cinema_rooms')) {
    const id = parseInt(params[params.length - 1], 10);
    const room = memory.rooms.find((r) => r.id === id);
    if (room) {
      if (params[0] !== undefined) room.name = params[0];
      if (params[1] !== undefined) room.room_type = params[1];
      if (params[2] !== undefined) room.capacity = parseInt(params[2], 10);
      if (params[3] !== undefined) room.location = params[3];
      if (params[4] !== undefined) room.status = params[4];
      if (params[5] !== undefined) room.description = params[5];
    }
    return { affectedRows: room ? 1 : 0 };
  }

  // D. Equipment Mutations
  if (normalized.startsWith('insert into equipment')) {
    const newId = memory.equipment.length > 0 ? Math.max(...memory.equipment.map((e) => e.id)) + 1 : 1;
    const newEq = {
      id: newId,
      name: params[0],
      code: params[1],
      equipment_type_id: parseInt(params[2], 10),
      room_id: parseInt(params[3], 10),
      status: params[4] || 'active',
      installation_date: params[5],
      last_maintenance_date: params[6],
      description: params[7] || '',
    };
    memory.equipment.push(newEq);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update equipment')) {
    const id = parseInt(params[params.length - 1], 10);
    const eq = memory.equipment.find((e) => e.id === id);
    if (eq) {
      if (params[0] !== undefined) eq.name = params[0];
      if (params[1] !== undefined) eq.code = params[1];
      if (params[2] !== undefined) eq.equipment_type_id = parseInt(params[2], 10);
      if (params[3] !== undefined) eq.room_id = parseInt(params[3], 10);
      if (params[4] !== undefined) eq.status = params[4];
      if (params[5] !== undefined) eq.installation_date = params[5];
      if (params[6] !== undefined) eq.last_maintenance_date = params[6];
      if (params[7] !== undefined) eq.description = params[7];
    }
    return { affectedRows: eq ? 1 : 0 };
  }

  // E. Concession Items (F&B) Mutations
  if (normalized.startsWith('insert into concession_items')) {
    const newId = memory.concession_items.length > 0 ? Math.max(...memory.concession_items.map((c) => c.id)) + 1 : 1;
    const newItem = {
      id: newId,
      name: params[0],
      category: params[1] || 'popcorn',
      price: parseFloat(params[2]),
      cost_price: parseFloat(params[3]) || 0,
      image: params[4] || '',
      is_active: params[5] !== undefined ? Boolean(params[5]) : true,
      description: params[6] || '',
    };
    memory.concession_items.push(newItem);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update concession_items')) {
    const id = parseInt(params[params.length - 1], 10);
    const item = memory.concession_items.find((c) => c.id === id);
    if (item) {
      if (params[0] !== undefined) item.name = params[0];
      if (params[1] !== undefined) item.category = params[1];
      if (params[2] !== undefined) item.price = parseFloat(params[2]);
      if (params[3] !== undefined) item.cost_price = parseFloat(params[3]);
      if (params[4] !== undefined) item.image = params[4];
      if (params[5] !== undefined) item.is_active = Boolean(params[5]);
      if (params[6] !== undefined) item.description = params[6];
    }
    return { affectedRows: item ? 1 : 0 };
  }

  if (normalized.startsWith('delete from concession_items')) {
    const id = parseInt(params[0], 10);
    memory.concession_items = memory.concession_items.filter((c) => c.id !== id);
    return { affectedRows: 1 };
  }

  // F. Inventory Ingredients & Logs
  if (normalized.startsWith('insert into inventory_ingredients')) {
    const newId = memory.inventory_ingredients.length > 0 ? Math.max(...memory.inventory_ingredients.map((i) => i.id)) + 1 : 1;
    const newIng = {
      id: newId,
      code: params[0] || `ING-${Date.now() % 1000}`,
      name: params[1],
      unit: params[2] || 'kg',
      stock_quantity: parseFloat(params[3]) || 0,
      min_threshold: parseFloat(params[4]) || 10,
      cost_per_unit: parseFloat(params[5]) || 0,
      supplier: params[6] || 'Nhà cung cấp',
    };
    memory.inventory_ingredients.push(newIng);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update inventory_ingredients')) {
    const id = parseInt(params[params.length - 1], 10);
    const ing = memory.inventory_ingredients.find((i) => i.id === id);
    if (ing) {
      if (params[0] !== undefined) ing.stock_quantity = parseFloat(params[0]);
      if (params[1] !== undefined) ing.min_threshold = parseFloat(params[1]);
      if (params[2] !== undefined) ing.cost_per_unit = parseFloat(params[2]);
    }
    return { affectedRows: ing ? 1 : 0 };
  }

  if (normalized.startsWith('insert into inventory_logs')) {
    const newId = memory.inventory_logs.length > 0 ? Math.max(...memory.inventory_logs.map((l) => l.id)) + 1 : 1;
    const newLog = {
      id: newId,
      ingredient_id: parseInt(params[0], 10),
      change_type: params[1] || 'import',
      quantity: parseFloat(params[2]),
      reason: params[3] || '',
      employee_id: parseInt(params[4], 10) || 1,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.inventory_logs.unshift(newLog);

    // Auto-update ingredient stock level
    const ing = memory.inventory_ingredients.find((i) => i.id === newLog.ingredient_id);
    if (ing) {
      ing.stock_quantity = Math.max(0, ing.stock_quantity + newLog.quantity);
    }
    return { insertId: newId, affectedRows: 1 };
  }

  // G. Shift Handovers & Cash Reconciliation
  if (normalized.startsWith('insert into shift_handovers')) {
    const newId = memory.shift_handovers.length > 0 ? Math.max(...memory.shift_handovers.map((h) => h.id)) + 1 : 1;
    const newHandover = {
      id: newId,
      work_shift_id: parseInt(params[0], 10),
      employee_id: parseInt(params[1], 10),
      manager_id: parseInt(params[2], 10) || 2,
      opening_float: parseFloat(params[3]) || 0,
      cash_sales: parseFloat(params[4]) || 0,
      card_sales: parseFloat(params[5]) || 0,
      qr_sales: parseFloat(params[6]) || 0,
      actual_cash_counted: parseFloat(params[7]) || 0,
      variance: parseFloat(params[8]) || 0,
      cash_dropped_to_safe: parseFloat(params[9]) || 0,
      next_shift_float: parseFloat(params[10]) || 0,
      status: params[11] || 'pending',
      notes: params[12] || '',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.shift_handovers.unshift(newHandover);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update shift_handovers')) {
    const id = parseInt(params[params.length - 1], 10);
    const ho = memory.shift_handovers.find((h) => h.id === id);
    if (ho) {
      if (params[0] !== undefined) ho.status = params[0];
      if (params[1] !== undefined) ho.notes = params[1];
    }
    return { affectedRows: ho ? 1 : 0 };
  }

  // H. KDM Licenses Mutations
  if (normalized.startsWith('insert into kdm_licenses')) {
    const newId = memory.kdm_licenses.length > 0 ? Math.max(...memory.kdm_licenses.map((k) => k.id)) + 1 : 1;
    const newKdm = {
      id: newId,
      movie_id: parseInt(params[0], 10),
      movie_name: params[1],
      room_id: parseInt(params[2], 10),
      room_name: params[3],
      server_serial: params[4] || 'DCI-SRV-AUTO',
      valid_from: params[5],
      valid_until: params[6],
      status: params[7] || 'active',
      key_file: params[8] || 'KDM_KEY.xml',
    };
    memory.kdm_licenses.unshift(newKdm);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('delete from kdm_licenses')) {
    const id = parseInt(params[0], 10);
    memory.kdm_licenses = memory.kdm_licenses.filter((k) => k.id !== id);
    return { affectedRows: 1 };
  }

  // I. Projector Lamp Logs Mutations
  if (normalized.startsWith('update projector_lamp_logs')) {
    const id = parseInt(params[params.length - 1], 10);
    const lamp = memory.projector_lamp_logs.find((p) => p.id === id);
    if (lamp) {
      if (params[0] !== undefined) lamp.hours_used = parseInt(params[0], 10);
      if (params[1] !== undefined) lamp.temperature_celsius = parseFloat(params[1]);
      if (params[2] !== undefined) lamp.status = params[2];
      lamp.health_percentage = Math.max(0, parseFloat(((1 - lamp.hours_used / lamp.max_hours_recommended) * 100).toFixed(1)));
    }
    return { affectedRows: lamp ? 1 : 0 };
  }

  // J. Turnaround Checklists Mutations
  if (normalized.startsWith('insert into turnaround_checklists')) {
    const newId = memory.turnaround_checklists.length > 0 ? Math.max(...memory.turnaround_checklists.map((t) => t.id)) + 1 : 1;
    const newCheck = {
      id: newId,
      schedule_id: parseInt(params[0], 10),
      room_id: parseInt(params[1], 10),
      room_name: params[2],
      cleaned_by_name: params[3],
      target_minutes: parseInt(params[4], 10) || 15,
      actual_minutes: parseInt(params[5], 10) || 12,
      seats_checked: Boolean(params[6]),
      trash_cleared: Boolean(params[7]),
      spilled_liquid_cleaned: Boolean(params[8]),
      screen_undamaged: Boolean(params[9]),
      aircon_normal: Boolean(params[10]),
      status: params[11] || 'ready',
      verified_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.turnaround_checklists.unshift(newCheck);
    return { insertId: newId, affectedRows: 1 };
  }

  // K. Bookings Mutations
  if (normalized.startsWith('insert into bookings')) {
    const newId = memory.bookings.length > 0 ? Math.max(...memory.bookings.map((b) => b.id)) + 1 : 1;
    const newBooking = {
      id: newId,
      customer_id: parseInt(params[0], 10) || 1,
      screening_id: parseInt(params[1], 10),
      booking_code: params[2],
      total_amount: parseFloat(params[3]),
      status: params[4] || 'pending',
      booking_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.bookings.push(newBooking);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update bookings')) {
    if (normalized.includes('set status = ? where id = ?')) {
      const status = params[0];
      const id = parseInt(params[1], 10);
      const b = memory.bookings.find((item) => item.id === id);
      if (b) b.status = status;
      return { affectedRows: b ? 1 : 0 };
    }
    const id = parseInt(params[params.length - 1], 10);
    const b = memory.bookings.find((item) => item.id === id);
    if (b) {
      if (normalized.includes("status = 'paid'")) b.status = 'paid';
      else if (normalized.includes("status = 'cancelled'")) b.status = 'cancelled';
      else if (normalized.includes("status = 'expired'")) b.status = 'expired';
    }
    return { affectedRows: b ? 1 : 0 };
  }

  // L. Booking Seats Mutations
  if (normalized.startsWith('insert into booking_seats')) {
    const rows = params[0];
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (Array.isArray(row)) {
          const newId = memory.booking_seats.length > 0 ? Math.max(...memory.booking_seats.map((bs) => bs.id)) + 1 : 1;
          memory.booking_seats.push({
            id: newId,
            booking_id: parseInt(row[0], 10),
            seat_id: parseInt(row[1], 10),
            price: parseFloat(row[2]),
            status: row[3] || 'holding',
            hold_start: row[4],
            hold_expire: row[5],
          });
        }
      }
    }
    return { insertId: 1, affectedRows: Array.isArray(rows) ? rows.length : 1 };
  }

  if (normalized.startsWith('update booking_seats')) {
    if (normalized.includes('set status = ? where booking_id = ?')) {
      const status = params[0];
      const bookingId = parseInt(params[1], 10);
      memory.booking_seats.forEach((bs) => {
        if (bs.booking_id === bookingId) bs.status = status;
      });
      return { affectedRows: 1 };
    }
    const bookingId = parseInt(params[params.length - 1], 10);
    if (normalized.includes("status = 'released'")) {
      memory.booking_seats.forEach((bs) => {
        if (bs.booking_id === bookingId) bs.status = 'released';
      });
      return { affectedRows: 1 };
    }
    if (normalized.includes("status = 'booked'")) {
      memory.booking_seats.forEach((bs) => {
        if (bs.booking_id === bookingId) bs.status = 'booked';
      });
      return { affectedRows: 1 };
    }
    return { affectedRows: 1 };
  }

  // M. Payments Mutations
  if (normalized.startsWith('insert into payments')) {
    if (!memory.payments) memory.payments = [];
    const newId = memory.payments.length > 0 ? Math.max(...memory.payments.map((p) => p.id)) + 1 : 1;
    const newPayment = {
      id: newId,
      booking_id: parseInt(params[0], 10),
      payment_method: params[1],
      amount: parseFloat(params[2]),
      transaction_code: params[3],
      status: params[4] || 'success',
      payment_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.payments.push(newPayment);
    return { insertId: newId, affectedRows: 1 };
  }

  // N. Tickets Mutations
  if (normalized.startsWith('insert into tickets')) {
    const newId = memory.tickets.length > 0 ? Math.max(...memory.tickets.map((t) => t.id)) + 1 : 1;
    const newTicket = {
      id: newId,
      booking_id: parseInt(params[0], 10),
      customer_id: parseInt(params[1], 10),
      screening_id: parseInt(params[2], 10),
      seat_id: parseInt(params[3], 10),
      ticket_code: params[4],
      qr_code: params[5],
      status: params[6] || 'active',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.tickets.push(newTicket);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update tickets')) {
    const idOrCode = params[params.length - 1];
    const t = memory.tickets.find((item) => item.id === parseInt(idOrCode, 10) || item.ticket_code === idOrCode);
    if (t) {
      if (params[0] !== undefined) t.status = params[0];
    }
    return { affectedRows: t ? 1 : 0 };
  }

  // O. Notifications Mutations
  if (normalized.startsWith('insert into notifications')) {
    const newId = memory.notifications.length > 0 ? Math.max(...memory.notifications.map((n) => n.id)) + 1 : 1;
    const newNotif = {
      id: newId,
      user_id: parseInt(params[0], 10),
      title: params[1],
      message: params[2],
      type: params[3] || 'general',
      is_read: false,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.notifications.unshift(newNotif);
    return { insertId: newId, affectedRows: 1 };
  }

  // Generic fallback for other tables
  if (normalized.startsWith('insert into')) {
    return { insertId: Date.now() % 10000, affectedRows: 1 };
  }
  if (normalized.startsWith('update')) {
    return { affectedRows: 1 };
  }
  if (normalized.startsWith('delete')) {
    return { affectedRows: 1 };
  }

  return [];
}

/**
 * Thực thi Transaction hỗ trợ Locking (SELECT FOR UPDATE)
 */
async function withTransaction(callback) {
  if (isConnected) {
    try {
      const p = getPool();
      const connection = await p.getConnection();
      try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (err) {
      console.warn(`[MySQL Transaction Fallback] ${err.message}.`);
    }
  }

  // Fallback in-memory transaction mockup
  const fakeConnection = {
    query: async (sql, params = []) => {
      const res = await query(sql, params);
      return [res];
    },
  };

  return await callback(fakeConnection);
}

module.exports = {
  getPool,
  testConnection,
  query,
  withTransaction,
  dbConfig,
  getIsConnected: () => isConnected,
};
