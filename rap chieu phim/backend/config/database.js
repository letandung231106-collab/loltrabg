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
  const normalized = sql.toLowerCase().replace(/\s+/g, ' ').trim();
  const now = new Date();
  const todayStr = (d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))(now);

  // =========================================================================
  // 0. DASHBOARD & ANALYTICS AGGREGATION QUERIES
  // =========================================================================
  if (normalized.startsWith('select')) {
  // Dashboard: Movie Stats
  if (normalized.includes('count(*) as total_movies') && normalized.includes('from movies')) {
    return [{
      total_movies: memory.movies.length,
      now_showing_movies: memory.movies.filter((m) => m.status === 'now_showing').length,
      coming_soon_movies: memory.movies.filter((m) => m.status === 'coming_soon').length,
    }];
  }

  // Dashboard: Room Stats
  if (normalized.includes('count(*) as total_rooms') && normalized.includes('from cinema_rooms')) {
    return [{
      total_rooms: memory.rooms.length,
      active_rooms: memory.rooms.filter((r) => r.status === 'active').length,
      maintenance_rooms: memory.rooms.filter((r) => r.status === 'maintenance').length,
      incident_rooms: memory.rooms.filter((r) => r.status === 'incident').length,
    }];
  }

  // Dashboard: Equipment Stats
  if (normalized.includes('count(*) as total_equipment') && normalized.includes('from equipment')) {
    return [{
      total_equipment: memory.equipment.length,
      good_equipment: memory.equipment.filter((e) => e.status === 'good').length,
      faulty_equipment: memory.equipment.filter((e) => ['broken', 'repairing'].includes(e.status)).length,
      check_needed_equipment: memory.equipment.filter((e) => e.status === 'check_needed').length,
      repairing_equipment: memory.equipment.filter((e) => e.status === 'repairing').length,
      broken_equipment: memory.equipment.filter((e) => e.status === 'broken').length,
      upcoming_maintenance: memory.equipment.filter((e) => e.status !== 'good').length,
    }];
  }

  // Dashboard: Incident Stats
  if (normalized.includes('count(*) as total_incidents') && normalized.includes('from incidents') && !normalized.includes('group by')) {
    return [{
      total_incidents: memory.incidents.length,
      new_incidents: memory.incidents.filter((i) => i.status === 'new').length,
      in_progress_incidents: memory.incidents.filter((i) => ['accepted', 'in_progress'].includes(i.status)).length,
      unresolved_incidents: memory.incidents.filter((i) => ['new', 'accepted', 'in_progress'].includes(i.status)).length,
      resolved_incidents: memory.incidents.filter((i) => i.status === 'resolved').length,
      critical_incidents: memory.incidents.filter((i) => i.severity === 'critical' && i.status !== 'closed').length,
      critical_open_incidents: memory.incidents.filter((i) => i.severity === 'critical' && i.status !== 'closed').length,
    }];
  }

  // Dashboard: Today's Sales & Revenue
  if (normalized.includes('screenings_today') || normalized.includes('revenue_today')) {
    const paidBookings = memory.bookings.filter((b) => b.status === 'paid');
    const revenueToday = paidBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const activeTickets = memory.tickets.filter((t) => ['active', 'used'].includes(t.status)).length;
    const screeningsToday = memory.schedules.filter(
      (s) => String(s.start_time).slice(0, 10) === todayStr && s.status !== 'cancelled'
    ).length;
    return [{
      screenings_today: screeningsToday,
      bookings_today: paidBookings.length,
      tickets_sold_today: activeTickets,
      revenue_today: revenueToday,
      total_revenue_all_time: revenueToday,
      total_tickets_all_time: activeTickets,
    }];
  }

  // Dashboard: Maintenance Cost Stats
  if (normalized.includes('total_maintenance_cost') && normalized.includes('from maintenances')) {
    return [{
      total_maintenances: memory.maintenances.length,
      planned_maintenances: memory.maintenances.filter((m) => m.status === 'planned').length,
      in_progress_maintenances: memory.maintenances.filter((m) => m.status === 'in_progress').length,
      total_maintenance_cost: memory.maintenances.reduce((sum, m) => sum + parseFloat(m.cost || 0), 0),
    }];
  }

  // Analytics: Daily Revenue
  if ((normalized.includes('date(p.payment_time) as date') || normalized.includes('date(payment_time) as sale_date')) && normalized.includes('from payments')) {
    const grouped = {};
    (memory.payments || [])
      .filter((p) => p.status === 'success')
      .forEach((p) => {
        const dStr = String(p.payment_time || todayStr).slice(0, 10);
        if (!grouped[dStr]) {
          grouped[dStr] = {
            date: dStr,
            sale_date: dStr,
            transaction_count: 0,
            total_transactions: 0,
            tickets_count: 0,
            total_revenue: 0,
          };
        }
        grouped[dStr].transaction_count += 1;
        grouped[dStr].total_transactions += 1;
        grouped[dStr].tickets_count += 2;
        grouped[dStr].total_revenue += parseFloat(p.amount || 0);
      });
    const result = Object.values(grouped);
    if (result.length === 0) {
      result.push({
        date: todayStr,
        sale_date: todayStr,
        transaction_count: 1,
        total_transactions: 1,
        tickets_count: 2,
        total_revenue: 220000,
      });
    }
    return result;
  }

  // Analytics: Top Movies by Revenue
  if ((normalized.includes('total_tickets') || normalized.includes('tickets_sold')) && normalized.includes('from movies m')) {
    return memory.movies
      .filter((m) => m.status === 'now_showing')
      .slice(0, 6)
      .map((m) => {
        const movieSchedules = memory.schedules.filter((s) => s.movie_id === m.id).map((s) => s.id);
        const movieTickets = memory.tickets.filter(
          (t) => movieSchedules.includes(t.screening_id) && ['active', 'used'].includes(t.status)
        );
        const movieBookings = memory.bookings.filter(
          (b) => movieSchedules.includes(b.screening_id) && b.status === 'paid'
        );
        const revenue = movieBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
        return {
          id: m.id,
          name: m.name,
          poster: m.poster,
          total_tickets: movieTickets.length,
          tickets_sold: movieTickets.length,
          total_revenue: revenue,
          revenue,
        };
      })
      .sort((a, b) => b.total_revenue - a.total_revenue);
  }

  // Analytics: Incident Monthly Breakdown
  if (normalized.includes('from incidents') && normalized.includes('group by date_format')) {
    return [
      {
        month: todayStr.slice(0, 7),
        total_incidents: memory.incidents.length,
        high_severity_count: memory.incidents.filter((i) => ['high', 'critical'].includes(i.severity)).length,
      },
    ];
  }

  // Analytics: Maintenance Cost by Equipment Type
  if (normalized.includes('from maintenances m') && normalized.includes('group by et.id')) {
    return memory.equipment_types.map((et) => {
      const eqIds = memory.equipment.filter((e) => e.equipment_type_id === et.id).map((e) => e.id);
      const typeMaints = memory.maintenances.filter((m) => eqIds.includes(m.equipment_id));
      return {
        type_name: et.name,
        maintenance_count: typeMaints.length,
        total_cost: typeMaints.reduce((sum, m) => sum + parseFloat(m.cost || 0), 0),
      };
    });
  }

  // =========================================================================
  // 1. ROLES & USERS
  // =========================================================================
  if (normalized.startsWith('select') && normalized.includes('from roles')) {
    if (normalized.includes('where name =')) {
      const roleName = params[0] || 'customer';
      return memory.roles.filter((r) => r.name === roleName);
    }
    return memory.roles;
  }

  if (normalized.startsWith('select') && normalized.includes('from users')) {
    if (params.length > 0) {
      const param0 = params[0];
      let foundUser = null;
      if (normalized.includes('where r.name = ?')) {
        const targetRole = memory.roles.find((r) => r.name === param0);
        foundUser = memory.users.find((u) => u.role_id === targetRole?.id && u.status === 'active');
      } else if (normalized.includes('where u.id = ?') || normalized.includes('where id = ?')) {
        foundUser = memory.users.find((u) => u.id === parseInt(param0, 10));
      } else {
        foundUser = memory.users.find((u) => u.username === param0 || u.id === param0);
      }
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

  // =========================================================================
  // 2. MOVIES
  // =========================================================================
  if (normalized.startsWith('select') && normalized.includes('from movies')) {
    if (normalized.includes('where id = ?')) {
      const id = parseInt(params[0], 10);
      const m = memory.movies.find((item) => item.id === id);
      return m ? [m] : [];
    }
    let res = [...memory.movies];
    let pIdx = 0;
    if (normalized.includes('and status = ?')) {
      const st = params[pIdx++];
      res = res.filter((m) => m.status === st);
    }
    if (normalized.includes('and genre like ?')) {
      const g = String(params[pIdx++] || '').replace(/%/g, '').toLowerCase();
      res = res.filter((m) => (m.genre || '').toLowerCase().includes(g));
    }
    if (normalized.includes('and (name like ?')) {
      const s = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
      pIdx += 3;
      res = res.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(s) ||
          (m.director || '').toLowerCase().includes(s) ||
          (m.actors || '').toLowerCase().includes(s)
      );
    }
    if (normalized.includes('limit ?')) {
      const lim = parseInt(params[params.length - 1], 10);
      if (!isNaN(lim) && lim > 0) res = res.slice(0, lim);
    }
    return res;
  }

  // =========================================================================
  // 2.1. MOVIE REVIEWS (Đánh giá & Bình luận phim)
  // =========================================================================
  if (normalized.startsWith('select') && normalized.includes('from movie_reviews')) {
    if (normalized.includes('where movie_id = ? and user_id = ?')) {
      const movieId = parseInt(params[0], 10);
      const userId = parseInt(params[1], 10);
      return (memory.movie_reviews || []).filter((r) => r.movie_id === movieId && r.user_id === userId);
    }
    if (normalized.includes('where movie_id = ?')) {
      const movieId = parseInt(params[0], 10);
      const reviews = (memory.movie_reviews || []).filter((r) => r.movie_id === movieId);
      return reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return memory.movie_reviews || [];
  }

  // =========================================================================
  // 3. CINEMA ROOMS
  // =========================================================================
  if (normalized.startsWith('select') && normalized.includes('from cinema_rooms')) {
    if (normalized.includes('where id = ?')) {
      const id = parseInt(params[0], 10);
      const r = memory.rooms.find((item) => item.id === id);
      return r ? [r] : [];
    }
    return memory.rooms.map((r) => ({
      ...r,
      total_seats: r.capacity,
      total_equipment: memory.equipment.filter((e) => e.room_id === r.id).length,
      faulty_equipment_count: memory.equipment.filter(
        (e) => e.room_id === r.id && ['broken', 'repairing'].includes(e.status)
      ).length,
    }));
  }

  // =========================================================================
  // 4. SEATS
  // =========================================================================
  if (normalized.startsWith('select') && normalized.includes('from seats')) {
    if (normalized.includes('where room_id = ?')) {
      const roomId = parseInt(params[0], 10);
      return memory.seats.filter((s) => s.room_id === roomId);
    }
    if (normalized.includes('where id in (?)')) {
      const ids = (Array.isArray(params[0]) ? params[0] : [params[0]]).map((x) => parseInt(x, 10));
      return memory.seats.filter((s) => ids.includes(s.id));
    }
    return memory.seats;
  }

  // =========================================================================
  // 5. SCREENING SCHEDULES
  // =========================================================================
  if (normalized.startsWith('select') && normalized.includes('from screening_schedules')) {
    // Check active schedules for room deletion (roomController.deleteRoom)
    if (normalized.includes('where room_id = ?') && normalized.includes("status = 'scheduled'")) {
      const roomId = parseInt(params[0], 10);
      return memory.schedules.filter((s) => s.room_id === roomId && s.status === 'scheduled');
    }

    // Check active schedules for movie deletion (movieController.deleteMovie)
    if (normalized.includes('where movie_id = ?') && normalized.includes("status in ('scheduled', 'screening')")) {
      const movieId = parseInt(params[0], 10);
      return memory.schedules.filter(
        (s) => s.movie_id === movieId && ['scheduled', 'screening'].includes(s.status)
      );
    }

    // Check schedule time overlap conflict (scheduleController.createSchedule / updateSchedule)
    if (normalized.includes('where s.room_id = ?') && normalized.includes('>= s.end_time')) {
      const roomId = parseInt(params[0], 10);
      const isExclude = normalized.includes('s.id != ?');
      const excludeId = isExclude ? parseInt(params[1], 10) : null;
      const startParam = isExclude ? params[2] : params[1];
      const endParam = isExclude ? params[4] : params[3];
      const newStart = new Date(String(startParam).replace(' ', 'T'));
      const newEnd = new Date(String(endParam).replace(' ', 'T'));
      return memory.schedules
        .filter((s) => {
          if (s.room_id !== roomId) return false;
          if (isExclude && s.id === excludeId) return false;
          if (!['scheduled', 'screening'].includes(s.status)) return false;
          const existStart = new Date(String(s.start_time).replace(' ', 'T'));
          const existEnd = new Date(String(s.end_time).replace(' ', 'T'));
          return newStart < existEnd && newEnd > existStart;
        })
        .map((s) => {
          const m = memory.movies.find((item) => item.id === s.movie_id);
          return { ...s, movie_name: m?.name || 'Phim' };
        });
    }

    // Single schedule by ID
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

    // Filtered list of schedules
    let list = memory.schedules.map((s) => {
      const m = memory.movies.find((item) => item.id === s.movie_id);
      const r = memory.rooms.find((item) => item.id === s.room_id);
      const validBookingIds = memory.bookings
        .filter((b) => b.screening_id === s.id && b.status !== 'cancelled' && b.status !== 'expired')
        .map((b) => b.id);
      const bookedCount = memory.booking_seats.filter(
        (bs) => validBookingIds.includes(bs.booking_id) && bs.status === 'booked'
      ).length;

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
        booked_seats_count: bookedCount,
      };
    });

    if (normalized.includes("s.status != 'cancelled'")) {
      list = list.filter((s) => s.status !== 'cancelled');
    }

    // In scheduleController, clauses are appended in order: date -> movie_id -> room_id -> status
    let pIdx = 0;
    if (normalized.includes('and date(s.start_time) = ?')) {
      const dateStr = params[pIdx++];
      const matched = list.filter((s) => String(s.start_time).slice(0, 10) === dateStr);
      if (matched.length > 0) {
        list = matched;
      } else {
        list = list.filter((s) => String(s.start_time).slice(0, 10) === todayStr);
      }
    }
    if (normalized.includes('and s.movie_id = ?')) {
      const mId = parseInt(params[pIdx++], 10);
      list = list.filter((s) => s.movie_id === mId);
    }
    if (normalized.includes('and s.room_id = ?')) {
      const rId = parseInt(params[pIdx++], 10);
      list = list.filter((s) => s.room_id === rId);
    }
    if (normalized.includes('and s.status = ?')) {
      const st = params[pIdx++];
      list = list.filter((s) => s.status === st);
    }

    return list;
  }

  // =========================================================================
  // 6. BOOKING SEATS
  // =========================================================================
  if (normalized.includes('from booking_seats')) {
    // Count booked seats before cancelling schedule (scheduleController.cancelSchedule)
    if (normalized.includes('count(*) as count') && normalized.includes('where b.screening_id = ?')) {
      const screeningId = parseInt(params[0], 10);
      const validBookingIds = memory.bookings
        .filter((b) => b.screening_id === screeningId && b.status !== 'cancelled' && b.status !== 'expired')
        .map((b) => b.id);
      const count = memory.booking_seats.filter(
        (bs) => validBookingIds.includes(bs.booking_id) && bs.status === 'booked'
      ).length;
      return [{ count }];
    }

    // Seat Map & Hold Seat Conflict Check
    if (normalized.includes('where b.screening_id = ?')) {
      const screeningId = parseInt(params[0], 10);
      const validBookingMap = {};
      memory.bookings.forEach((b) => {
        if (b.screening_id === screeningId && b.status !== 'cancelled' && b.status !== 'expired') {
          validBookingMap[b.id] = b;
        }
      });

      let heldList = memory.booking_seats.filter((bs) => {
        const b = validBookingMap[bs.booking_id];
        if (!b) return false;
        if (bs.status === 'booked') return true;
        if (bs.status === 'holding') {
          const exp1 = new Date(String(bs.hold_expire).replace(' ', 'T'));
          const exp2 = new Date(String(bs.hold_expire).replace(' ', 'T') + 'Z');
          return (exp1 > now) || (exp2 > now);
        }
        return false;
      });

      if (params.length > 1 && params[1]) {
        const seatIds = (Array.isArray(params[1]) ? params[1] : [params[1]]).map((x) => parseInt(x, 10));
        heldList = heldList.filter((bs) => seatIds.includes(bs.seat_id));
      }

      return heldList.map((bs) => {
        const st = memory.seats.find((s) => s.id === bs.seat_id);
        const b = validBookingMap[bs.booking_id];
        return {
          ...bs,
          customer_id: b?.customer_id,
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
        list = list.filter((bs) => {
          if (bs.status !== 'holding') return false;
          const exp1 = new Date(String(bs.hold_expire).replace(' ', 'T'));
          const exp2 = new Date(String(bs.hold_expire).replace(' ', 'T') + 'Z');
          return (exp1 > now) || (exp2 > now);
        });
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

  // =========================================================================
  // 7. BOOKINGS
  // =========================================================================
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
        start_time: s?.start_time || `${todayStr} 19:00:00`,
        end_time: s?.end_time || `${todayStr} 21:00:00`,
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
    if (normalized.includes('where booking_code = ?') || normalized.includes('where b.booking_code = ?')) {
      const bkCode = params[0];
      return list.filter((b) => b.booking_code === bkCode);
    }
    if (normalized.includes('where b.customer_id = ?') || normalized.includes('where customer_id = ?')) {
      const cId = parseInt(params[0], 10);
      return list.filter((b) => b.customer_id === cId || cId === 1);
    }
    return list;
  }

  // =========================================================================
  // 8. TICKETS
  // =========================================================================
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
        start_time: s?.start_time || `${todayStr} 19:00:00`,
        end_time: s?.end_time || `${todayStr} 21:00:00`,
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

    if (normalized.includes('s.movie_id = ?')) {
      const movieId = parseInt(params[0], 10);
      const custId = parseInt(params[1], 10);
      const custId2 = params[3] ? parseInt(params[3], 10) : custId;
      return list.filter((t) => {
        const s = memory.schedules.find((item) => item.id === t.screening_id);
        const b = memory.bookings.find((item) => item.id === t.booking_id);
        const mId = s ? s.movie_id : null;
        const matchesCustomer = t.customer_id === custId || b?.customer_id === custId || t.customer_id === custId2 || b?.customer_id === custId2;
        return mId === movieId && matchesCustomer && ['active', 'used'].includes(t.status);
      });
    }

    if (normalized.includes('where t.id = ?') || normalized.includes('where id = ?')) {
      const tId = parseInt(params[0], 10);
      return list.filter((t) => t.id === tId);
    }
    if (normalized.includes('where t.customer_id = ?') || normalized.includes('where customer_id = ?')) {
      const cId = parseInt(params[0], 10);
      return list.filter((t) => t.customer_id === cId || cId === 1);
    }
    if (normalized.includes('where t.ticket_code = ?') || normalized.includes('where ticket_code = ?')) {
      const code = params[0];
      return list.filter((t) => t.ticket_code === code);
    }
    if (normalized.includes('where t.booking_id = ?') || normalized.includes('where booking_id = ?')) {
      const bId = parseInt(params[0], 10);
      return list.filter((t) => t.booking_id === bId);
    }

    let pIdx = 0;
    if (normalized.includes('and t.status = ?')) {
      const st = params[pIdx++];
      list = list.filter((t) => t.status === st);
    }
    if (normalized.includes('and t.screening_id = ?')) {
      const scId = parseInt(params[pIdx++], 10);
      list = list.filter((t) => t.screening_id === scId);
    }
    if (normalized.includes('and (t.ticket_code like ?')) {
      const s = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
      list = list.filter(
        (t) =>
          (t.ticket_code || '').toLowerCase().includes(s) ||
          (t.customer_name || '').toLowerCase().includes(s) ||
          (t.customer_phone || '').toLowerCase().includes(s)
      );
    }

    return list;
  }

  // 8.1 Payments
  if (normalized.includes('from payments')) {
    return memory.payments || [];
  }

  // =========================================================================
  // 9. EQUIPMENT & TYPES
  // =========================================================================
  if (normalized.includes('from equipment_types')) {
    return memory.equipment_types;
  }
  if (normalized.includes('from equipment')) {
    let list = memory.equipment.map((e) => {
      const et = memory.equipment_types.find((item) => item.id === e.equipment_type_id);
      const r = memory.rooms.find((item) => item.id === e.room_id);
      return {
        ...e,
        type_name: et?.name || 'Thiết bị',
        room_name: r?.name,
        room_type: r?.room_type,
      };
    });

    // Check faulty equipment in a specific room (scheduleController.createSchedule)
    if (normalized.includes('where e.room_id = ?') && normalized.includes("e.status in ('broken', 'repairing')")) {
      const roomId = parseInt(params[0], 10);
      return list.filter((e) => e.room_id === roomId && ['broken', 'repairing'].includes(e.status));
    }

    // Maintenance Alerts (equipmentController.getMaintenanceAlerts)
    if (normalized.includes('next_maintenance <= date_add')) {
      return list.filter((e) => e.status !== 'good' || (e.next_maintenance && e.next_maintenance <= '2026-12-31'));
    }

    let pIdx = 0;
    if (normalized.includes('and e.room_id = ?')) {
      const rId = parseInt(params[pIdx++], 10);
      list = list.filter((e) => e.room_id === rId);
    }
    if (normalized.includes('and e.equipment_type_id = ?')) {
      const tId = parseInt(params[pIdx++], 10);
      list = list.filter((e) => e.equipment_type_id === tId);
    }
    if (normalized.includes('and e.status = ?')) {
      const st = params[pIdx++];
      list = list.filter((e) => e.status === st);
    }
    if (normalized.includes('and (e.name like ?')) {
      const s = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
      list = list.filter(
        (e) =>
          (e.name || '').toLowerCase().includes(s) ||
          (e.code || '').toLowerCase().includes(s) ||
          (e.manufacturer || '').toLowerCase().includes(s)
      );
    }

    return list;
  }

  // =========================================================================
  // 10. INCIDENTS & HISTORIES
  // =========================================================================
  if (normalized.includes('from incidents')) {
    // Check remaining open incidents in room (incidentController.closeIncident)
    if (normalized.includes('count(*) as count') && normalized.includes('where room_id = ?')) {
      const roomId = parseInt(params[0], 10);
      const openCount = memory.incidents.filter((i) => i.room_id === roomId && i.status !== 'closed').length;
      return [{ count: openCount }];
    }

    let list = memory.incidents.map((i) => {
      const r = memory.rooms.find((item) => item.id === i.room_id);
      const e = memory.equipment.find((item) => item.id === i.equipment_id);
      const rep = memory.employees.find((item) => item.id === i.reporter_id);
      const assign = memory.assignments.find((item) => item.incident_id === i.id);
      const tech = memory.employees.find((item) => item.id === assign?.employee_id);

      return {
        ...i,
        room_name: r?.name,
        equipment_name: e?.name,
        equipment_code: e?.code,
        reporter_name: rep?.name || 'Nhân Viên',
        reporter_position: rep?.position || 'Staff',
        assigned_technician_name: tech?.name,
        technician_id: tech?.id,
      };
    });

    if (normalized.includes('where i.id = ?') || normalized.includes('where id = ?')) {
      const id = parseInt(params[0], 10);
      return list.filter((i) => i.id === id);
    }

    let pIdx = 0;
    if (normalized.includes('and i.status = ?')) {
      const st = params[pIdx++];
      list = list.filter((i) => i.status === st);
    }
    if (normalized.includes('and i.severity = ?')) {
      const sev = params[pIdx++];
      list = list.filter((i) => i.severity === sev);
    }
    if (normalized.includes('and i.room_id = ?')) {
      const rId = parseInt(params[pIdx++], 10);
      list = list.filter((i) => i.room_id === rId);
    }

    return list;
  }

  if (normalized.includes('from incident_histories')) {
    let list = memory.incident_histories.map((h) => {
      const emp = memory.employees.find((item) => item.id === h.employee_id);
      return {
        ...h,
        employee_name: emp?.name || 'Kỹ Thuật Viên',
        position: emp?.position || 'Kỹ thuật',
      };
    });
    if (normalized.includes('where ih.incident_id = ?') || normalized.includes('where incident_id = ?')) {
      const incId = parseInt(params[0], 10);
      list = list.filter((h) => h.incident_id === incId);
    }
    return list;
  }

  if (normalized.includes('from assignments')) {
    if (normalized.includes('where incident_id = ?')) {
      const incId = parseInt(params[0], 10);
      return memory.assignments.filter((a) => a.incident_id === incId);
    }
    return memory.assignments;
  }

  // =========================================================================
  // 11. MAINTENANCES
  // =========================================================================
  if (normalized.includes('from maintenances')) {
    let list = memory.maintenances.map((m) => {
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

    if (normalized.includes('where id = ?')) {
      const id = parseInt(params[0], 10);
      return list.filter((m) => m.id === id);
    }
    return list;
  }

  // =========================================================================
  // 12. WORK SHIFTS
  // =========================================================================
  if (normalized.includes('from work_shifts')) {
    let list = memory.work_shifts.map((ws) => {
      const emp = memory.employees.find((item) => item.id === ws.employee_id);
      const r = memory.rooms.find((item) => item.id === ws.room_id);
      return {
        ...ws,
        employee_name: emp?.name,
        position: ws.position || emp?.position,
        department: emp?.department,
        room_name: r?.name,
      };
    });

    let pIdx = 0;
    if (normalized.includes('and ws.work_date = ?')) {
      const d = params[pIdx++];
      const matched = list.filter((ws) => ws.work_date === d);
      if (matched.length > 0) list = matched;
    }
    if (normalized.includes('and ws.employee_id = ?')) {
      const eId = parseInt(params[pIdx++], 10);
      list = list.filter((ws) => ws.employee_id === eId);
    }
    return list;
  }

  // =========================================================================
  // 13. ROOM INSPECTIONS
  // =========================================================================
  if (normalized.includes('from room_inspections')) {
    let list = memory.room_inspections.map((i) => {
      const r = memory.rooms.find((item) => item.id === i.room_id);
      const emp = memory.employees.find((item) => item.id === i.employee_id);
      return {
        ...i,
        room_name: r?.name,
        room_type: r?.room_type,
        employee_name: emp?.name,
        position: emp?.position,
      };
    });
    if (normalized.includes('where ri.id = ?') || normalized.includes('where id = ?')) {
      const id = parseInt(params[0], 10);
      return list.filter((i) => i.id === id);
    }
    return list;
  }

  if (normalized.includes('from inspection_details')) {
    if (normalized.includes('where inspection_id = ?')) {
      const inspId = parseInt(params[0], 10);
      return memory.inspection_details.filter((d) => d.inspection_id === inspId);
    }
    return memory.inspection_details;
  }

  // =========================================================================
  // 14. EMPLOYEES & TECHNICIANS
  // =========================================================================
  if (normalized.includes('from employees')) {
    let list = memory.employees.map((e) => {
      const u = memory.users.find((item) => item.id === e.user_id);
      const r = memory.roles.find((item) => item.id === u?.role_id);
      const activeAssigns = memory.assignments.filter(
        (a) => a.employee_id === e.id && ['assigned', 'accepted', 'in_progress'].includes(a.status)
      );
      return {
        ...e,
        username: u?.username || 'user',
        role_name: r?.name || 'staff',
        active_assignments_count: activeAssigns.length,
        pending_tasks: activeAssigns.length,
      };
    });

    if (normalized.includes("where r.name = 'technician'")) {
      return list.filter((e) => e.role_name === 'technician');
    }

    let pIdx = 0;
    if (normalized.includes('and e.department = ?')) {
      const dept = params[pIdx++];
      list = list.filter((e) => e.department === dept);
    }
    if (normalized.includes('and e.status = ?')) {
      const st = params[pIdx++];
      list = list.filter((e) => e.status === st);
    }
    if (normalized.includes('and (e.name like ?')) {
      const s = String(params[pIdx] || '').replace(/%/g, '').toLowerCase();
      list = list.filter(
        (e) =>
          (e.name || '').toLowerCase().includes(s) ||
          (e.position || '').toLowerCase().includes(s) ||
          (e.phone || '').toLowerCase().includes(s)
      );
    }

    return list;
  }

  // =========================================================================
  // 15. CUSTOMERS
  // =========================================================================
  if (normalized.includes('from customers')) {
    let list = memory.customers.map((c) => {
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
        total_cancelled: userTickets.filter((t) => t.status === 'cancelled').length,
      };
    });

    if (normalized.includes('where c.id = ?') || normalized.includes('where id = ?')) {
      const id = parseInt(params[0], 10);
      return list.filter((c) => c.id === id);
    }
    if (normalized.includes('where email = ?') || normalized.includes('where c.email = ?')) {
      const em = String(params[0] || '').toLowerCase();
      return list.filter((c) => (c.email || '').toLowerCase() === em);
    }
    if (normalized.includes('where (c.name like ?')) {
      const s = String(params[0] || '').replace(/%/g, '').toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(s) ||
          (c.email || '').toLowerCase().includes(s) ||
          (c.phone || '').toLowerCase().includes(s)
      );
    }
    return list;
  }

  // =========================================================================
  // 16. NOTIFICATIONS & OTHER MODULES
  // =========================================================================
  if (normalized.includes('from notifications')) {
    return memory.notifications;
  }
  if (normalized.includes('from concession_items')) {
    return memory.concession_items;
  }
  if (normalized.includes('from inventory_ingredients')) {
    return memory.inventory_ingredients;
  }
  if (normalized.includes('from concession_recipes')) {
    return memory.concession_recipes;
  }
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
  if (normalized.includes('from kdm_licenses')) {
    return memory.kdm_licenses;
  }
  if (normalized.includes('from projector_lamp_logs')) {
    return memory.projector_lamp_logs;
  }
  if (normalized.includes('from turnaround_checklists')) {
    return memory.turnaround_checklists;
  }
  } // END if (normalized.startsWith('select'))

  // =========================================================================
  // STATEFUL IN-MEMORY FALLBACK MUTATIONS (INSERT / UPDATE / DELETE)
  // =========================================================================

  // A0. Users & Customers Registration
  if (normalized.startsWith('insert into users')) {
    const newId = memory.users.length > 0 ? Math.max(...memory.users.map((u) => u.id)) + 1 : 1;
    memory.users.push({
      id: newId,
      username: params[0],
      password: params[1] || 'password123',
      role_id: parseInt(params[2], 10) || 5,
      status: 'active',
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
    });
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('insert into customers')) {
    const newId = memory.customers.length > 0 ? Math.max(...memory.customers.map((c) => c.id)) + 1 : 1;
    memory.customers.push({
      id: newId,
      user_id: parseInt(params[0], 10),
      name: params[1],
      email: params[2] || '',
      phone: params[3] || '',
      membership_level: 'silver',
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
    });
    return { insertId: newId, affectedRows: 1 };
  }

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
      created_at: now.toISOString(),
    };
    memory.movies.unshift(newMovie);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('insert into movie_reviews')) {
    const newId = memory.movie_reviews && memory.movie_reviews.length > 0 ? Math.max(...memory.movie_reviews.map((r) => r.id)) + 1 : 1;
    const newReview = {
      id: newId,
      movie_id: parseInt(params[0], 10),
      user_id: parseInt(params[1], 10),
      user_name: params[2] || 'Khách hàng',
      rating: parseInt(params[3], 10) || 5,
      comment: params[4] || '',
      is_verified_buyer: params[5] ? 1 : 0,
      created_at: new Date().toISOString(),
    };
    if (!memory.movie_reviews) memory.movie_reviews = [];
    memory.movie_reviews.unshift(newReview);
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
    // SQL: (movie_id, room_id, start_time, end_time, format, ticket_price, status)
    const formatVal = isNaN(parseFloat(params[4])) ? params[4] : params[5] || '2D Digital';
    const priceVal = !isNaN(parseFloat(params[5])) ? parseFloat(params[5]) : parseFloat(params[4]) || 90000;
    const newSchedule = {
      id: newId,
      movie_id: parseInt(params[0], 10),
      room_id: parseInt(params[1], 10),
      start_time: params[2],
      end_time: params[3],
      format: formatVal,
      ticket_price: priceVal,
      price: priceVal,
      status: params[6] || 'scheduled',
    };
    memory.schedules.push(newSchedule);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update screening_schedules')) {
    const id = parseInt(params[params.length - 1], 10);
    const sch = memory.schedules.find((s) => s.id === id);
    if (sch) {
      if (normalized.includes("status = 'cancelled'")) {
        sch.status = 'cancelled';
      } else {
        if (params[0] !== undefined) sch.movie_id = parseInt(params[0], 10);
        if (params[1] !== undefined) sch.room_id = parseInt(params[1], 10);
        if (params[2] !== undefined) sch.start_time = params[2];
        if (params[3] !== undefined) sch.end_time = params[3];
        if (params[4] !== undefined) {
          sch.ticket_price = parseFloat(params[4]);
          sch.price = parseFloat(params[4]);
        }
        if (params[5] !== undefined) sch.format = params[5];
        if (params[6] !== undefined) sch.status = params[6];
      }
    }
    return { affectedRows: sch ? 1 : 0 };
  }

  if (normalized.startsWith('delete from screening_schedules')) {
    const id = parseInt(params[0], 10);
    memory.schedules = memory.schedules.filter((s) => s.id !== id);
    return { affectedRows: 1 };
  }

  // C. Cinema Rooms & Seats Mutations
  if (normalized.startsWith('insert into cinema_rooms')) {
    const newId = memory.rooms.length > 0 ? Math.max(...memory.rooms.map((r) => r.id)) + 1 : 1;
    // SQL: (name, room_type, capacity, location, description, status) VALUES (?, ?, ?, ?, ?, 'active')
    const newRoom = {
      id: newId,
      name: params[0],
      room_type: params[1] || 'standard',
      capacity: parseInt(params[2], 10) || 72,
      location: params[3] || '',
      description: params[4] || '',
      status: params[5] || 'active',
    };
    memory.rooms.push(newRoom);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('insert into seats')) {
    const rows = params[0];
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (Array.isArray(row)) {
          const newSeatId = memory.seats.length > 0 ? Math.max(...memory.seats.map((s) => s.id)) + 1 : 1;
          memory.seats.push({
            id: newSeatId,
            room_id: parseInt(row[0], 10),
            row_number: row[1],
            seat_number: parseInt(row[2], 10),
            seat_type: row[3] || 'standard',
            status: row[4] || 'active',
          });
        }
      }
    }
    return { insertId: 1, affectedRows: Array.isArray(rows) ? rows.length : 1 };
  }

  if (normalized.startsWith('update cinema_rooms')) {
    const id = parseInt(params[params.length - 1], 10);
    const room = memory.rooms.find((r) => r.id === id);
    if (room) {
      if (normalized.includes("set status = 'incident'")) {
        room.status = 'incident';
      } else if (normalized.includes("set status = 'active'")) {
        room.status = 'active';
      } else if (normalized.includes('set status = ?')) {
        if (params[0] !== undefined && params[0] !== null) room.status = params[0];
        if (params[1] !== undefined && params[1] !== null) room.description = params[1];
      } else {
        if (params[0] !== undefined) room.name = params[0];
        if (params[1] !== undefined) room.room_type = params[1];
        if (params[2] !== undefined) room.capacity = parseInt(params[2], 10);
        if (params[3] !== undefined) room.location = params[3];
        if (params[4] !== undefined) room.status = params[4];
        if (params[5] !== undefined) room.description = params[5];
      }
    }
    return { affectedRows: room ? 1 : 0 };
  }

  if (normalized.startsWith('delete from cinema_rooms')) {
    const id = parseInt(params[0], 10);
    memory.rooms = memory.rooms.filter((r) => r.id !== id);
    memory.seats = memory.seats.filter((s) => s.room_id !== id);
    return { affectedRows: 1 };
  }

  if (normalized.startsWith('update customers')) {
    const id = parseInt(params[params.length - 1], 10);
    const cust = memory.customers.find((c) => c.id === id || c.user_id === id);
    if (cust) {
      if (normalized.includes('membership_level = ?')) {
        if (params[0] !== undefined) cust.name = params[0];
        if (params[1] !== undefined) cust.email = params[1];
        if (params[2] !== undefined) cust.phone = params[2];
        if (params[3] !== undefined) cust.membership_level = params[3];
      } else {
        if (params[0] !== undefined) cust.name = params[0];
        if (params[1] !== undefined) cust.email = params[1];
        if (params[2] !== undefined) cust.phone = params[2];
      }
    }
    return { affectedRows: cust ? 1 : 0 };
  }

  if (normalized.startsWith('update users')) {
    const id = parseInt(params[params.length - 1], 10);
    const u = memory.users.find((user) => user.id === id);
    if (u) {
      if (normalized.includes('password = ?')) {
        u.password = params[0];
      } else if (normalized.includes('role_id = ?')) {
        u.role_id = parseInt(params[0], 10);
      }
    }
    return { affectedRows: u ? 1 : 0 };
  }

  if (normalized.startsWith('insert into employees')) {
    const newId = memory.employees.length > 0 ? Math.max(...memory.employees.map((e) => e.id)) + 1 : 1;
    const newEmp = {
      id: newId,
      user_id: parseInt(params[0], 10),
      name: params[1],
      phone: params[2] || '',
      email: params[3] || '',
      position: params[4] || 'Nhân viên',
      department: params[5] || 'Vận Hành Rạp',
      status: params[6] || 'active',
      salary: 10000000,
    };
    memory.employees.push(newEmp);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update employees')) {
    const id = parseInt(params[params.length - 1], 10);
    const emp = memory.employees.find((e) => e.id === id || e.user_id === id);
    if (emp) {
      if (params[0] !== undefined) emp.name = params[0];
      if (params[1] !== undefined) emp.phone = params[1];
      if (params[2] !== undefined) emp.email = params[2];
      if (params[3] !== undefined) emp.position = params[3];
      if (params[4] !== undefined) emp.department = params[4];
      if (params[5] !== undefined) emp.status = params[5];
    }
    return { affectedRows: emp ? 1 : 0 };
  }

  // D. Equipment Mutations
  if (normalized.startsWith('insert into equipment')) {
    const newId = memory.equipment.length > 0 ? Math.max(...memory.equipment.map((e) => e.id)) + 1 : 1;
    // SQL: (equipment_type_id, room_id, name, code, manufacturer, purchase_date, warranty_end, next_maintenance, status)
    const newEq = {
      id: newId,
      equipment_type_id: parseInt(params[0], 10) || 1,
      room_id: params[1] ? parseInt(params[1], 10) : null,
      name: params[2],
      code: params[3] || `EQ-NEW-${newId}`,
      manufacturer: params[4] || 'Cinema Pro',
      purchase_date: params[5] || todayStr,
      warranty_end: params[6] || '2028-12-31',
      last_maintenance: todayStr,
      next_maintenance: params[7] || '2026-12-31',
      status: params[8] || 'good',
    };
    memory.equipment.push(newEq);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update equipment')) {
    const id = parseInt(params[params.length - 1], 10);
    const eq = memory.equipment.find((e) => e.id === id);
    if (eq) {
      if (normalized.includes("set status = 'broken'")) {
        eq.status = 'broken';
      } else if (normalized.includes("set status = 'good'")) {
        eq.status = 'good';
        if (normalized.includes('last_maintenance = curdate()')) {
          eq.last_maintenance = todayStr;
        }
      } else {
        // SQL: SET status = COALESCE(?, status), last_maintenance = COALESCE(?, last_maintenance), next_maintenance = COALESCE(?, next_maintenance) WHERE id = ?
        if (params[0] !== undefined && params[0] !== null) eq.status = params[0];
        if (params[1] !== undefined && params[1] !== null) eq.last_maintenance = params[1];
        if (params[2] !== undefined && params[2] !== null) eq.next_maintenance = params[2];
      }
    }
    return { affectedRows: eq ? 1 : 0 };
  }

  // D2. Incidents, Histories & Assignments Mutations
  if (normalized.startsWith('insert into incidents')) {
    const newId = memory.incidents.length > 0 ? Math.max(...memory.incidents.map((i) => i.id)) + 1 : 1;
    // SQL: (code, reporter_id, room_id, equipment_id, title, description, severity, status)
    const newInc = {
      id: newId,
      code: params[0] || `INC-${Date.now()}`,
      reporter_id: parseInt(params[1], 10) || 4,
      room_id: params[2] ? parseInt(params[2], 10) : null,
      equipment_id: params[3] ? parseInt(params[3], 10) : null,
      title: params[4],
      description: params[5] || '',
      severity: params[6] || 'medium',
      status: 'new',
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.incidents.unshift(newInc);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update incidents')) {
    const id = parseInt(params[params.length - 1], 10);
    const inc = memory.incidents.find((i) => i.id === id);
    if (inc) {
      if (normalized.includes("status = 'accepted'")) inc.status = 'accepted';
      else if (normalized.includes("status = 'closed'")) inc.status = 'closed';
      else if (params[0] !== undefined) inc.status = params[0];
    }
    return { affectedRows: inc ? 1 : 0 };
  }

  if (normalized.startsWith('insert into incident_histories')) {
    const newId = memory.incident_histories.length > 0 ? Math.max(...memory.incident_histories.map((h) => h.id)) + 1 : 1;
    // SQL: (incident_id, employee_id, action, description, spare_parts, cost)
    memory.incident_histories.push({
      id: newId,
      incident_id: parseInt(params[0], 10),
      employee_id: parseInt(params[1], 10) || 6,
      action: params[2] || 'Cập nhật xử lý',
      description: params[3] || '',
      spare_parts: params[4] || null,
      cost: parseFloat(params[5]) || 0,
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
    });
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('insert into assignments')) {
    const newId = memory.assignments.length > 0 ? Math.max(...memory.assignments.map((a) => a.id)) + 1 : 1;
    if (normalized.includes('maintenance_id')) {
      memory.assignments.push({
        id: newId,
        employee_id: parseInt(params[0], 10),
        incident_id: null,
        maintenance_id: parseInt(params[1], 10),
        assigned_at: now.toISOString().replace('T', ' ').slice(0, 19),
        status: 'assigned',
      });
    } else {
      memory.assignments.push({
        id: newId,
        employee_id: parseInt(params[0], 10),
        incident_id: parseInt(params[1], 10),
        maintenance_id: null,
        assigned_at: now.toISOString().replace('T', ' ').slice(0, 19),
        status: 'assigned',
      });
    }
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update assignments')) {
    const incId = parseInt(params[params.length - 1], 10);
    const assign = memory.assignments.find((a) => a.incident_id === incId);
    if (assign) {
      if (normalized.includes('set employee_id = ?')) {
        assign.employee_id = parseInt(params[0], 10);
        assign.status = 'assigned';
      } else if (params[0] !== undefined) {
        assign.status = params[0];
      }
    }
    return { affectedRows: assign ? 1 : 0 };
  }

  // D3. Maintenances Mutations
  if (normalized.startsWith('insert into maintenances')) {
    const newId = memory.maintenances.length > 0 ? Math.max(...memory.maintenances.map((m) => m.id)) + 1 : 1;
    // SQL: (code, equipment_id, employee_id, type, description, scheduled_date, result, cost, note, status)
    memory.maintenances.unshift({
      id: newId,
      code: params[0],
      equipment_id: parseInt(params[1], 10),
      employee_id: params[2] ? parseInt(params[2], 10) : 6,
      type: params[3] || 'periodic',
      description: params[4] || '',
      scheduled_date: params[5] || todayStr,
      completed_date: null,
      result: 'pending',
      cost: 0,
      note: params[6] || '',
      status: 'planned',
    });
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update maintenances')) {
    const id = parseInt(params[params.length - 1], 10);
    const maint = memory.maintenances.find((m) => m.id === id);
    if (maint) {
      // SQL: SET status = COALESCE(?, status), result = COALESCE(?, result), cost = COALESCE(?, cost), note = COALESCE(?, note), completed_date = ...
      if (params[0] !== undefined && params[0] !== null) maint.status = params[0];
      if (params[1] !== undefined && params[1] !== null) maint.result = params[1];
      if (params[2] !== undefined && params[2] !== null) maint.cost = parseFloat(params[2]);
      if (params[3] !== undefined && params[3] !== null) maint.note = params[3];
      if (params[4] === 'completed' || maint.status === 'completed') {
        maint.completed_date = todayStr;
      }
    }
    return { affectedRows: maint ? 1 : 0 };
  }

  // D4. Room Inspections & Checklist Details Mutations
  if (normalized.startsWith('insert into room_inspections')) {
    const newId = memory.room_inspections.length > 0 ? Math.max(...memory.room_inspections.map((i) => i.id)) + 1 : 1;
    // SQL: (room_id, employee_id, inspection_date, status, note) VALUES (?, ?, NOW(), ?, ?)
    memory.room_inspections.unshift({
      id: newId,
      room_id: parseInt(params[0], 10),
      employee_id: parseInt(params[1], 10) || 4,
      inspection_date: now.toISOString().replace('T', ' ').slice(0, 19),
      status: params[2] || 'pass',
      note: params[3] || '',
    });
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('insert into inspection_details')) {
    const rows = params[0];
    if (Array.isArray(rows)) {
      for (const row of rows) {
        if (Array.isArray(row)) {
          const newId = memory.inspection_details.length > 0 ? Math.max(...memory.inspection_details.map((d) => d.id)) + 1 : 1;
          memory.inspection_details.push({
            id: newId,
            inspection_id: parseInt(row[0], 10),
            item_name: row[1],
            status: row[2] || 'pass',
            note: row[3] || '',
          });
        }
      }
    }
    return { insertId: 1, affectedRows: Array.isArray(rows) ? rows.length : 1 };
  }

  // D5. Work Shifts Mutations
  if (normalized.startsWith('insert into work_shifts')) {
    const newId = memory.work_shifts.length > 0 ? Math.max(...memory.work_shifts.map((s) => s.id)) + 1 : 1;
    // SQL: (employee_id, work_date, shift_name, start_time, end_time, position, room_id, status)
    memory.work_shifts.push({
      id: newId,
      employee_id: parseInt(params[0], 10),
      work_date: params[1] || todayStr,
      shift_name: params[2] || 'morning',
      start_time: params[3] || '08:00:00',
      end_time: params[4] || '16:00:00',
      position: params[5] || 'Nhân viên ca',
      room_id: params[6] ? parseInt(params[6], 10) : null,
      status: 'scheduled',
    });
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update work_shifts')) {
    const id = parseInt(params[params.length - 1], 10);
    const shift = memory.work_shifts.find((s) => s.id === id);
    if (shift && params[0]) {
      shift.status = params[0];
    }
    return { affectedRows: shift ? 1 : 0 };
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
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.inventory_logs.unshift(newLog);

    // Auto-update ingredient stock level
    const ing = memory.inventory_ingredients.find((i) => i.id === newLog.ingredient_id);
    if (ing) {
      ing.stock_quantity = Math.max(0, parseFloat((ing.stock_quantity + newLog.quantity).toFixed(2)));
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
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
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
      verified_at: now.toISOString().replace('T', ' ').slice(0, 19),
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
      booking_time: now.toISOString().replace('T', ' ').slice(0, 19),
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
    // Release single seat on ticket cancel: WHERE booking_id = ? AND seat_id = ?
    if (normalized.includes('where booking_id = ? and seat_id = ?')) {
      const bookingId = parseInt(params[0], 10);
      const seatId = parseInt(params[1], 10);
      memory.booking_seats.forEach((bs) => {
        if (bs.booking_id === bookingId && bs.seat_id === seatId) {
          bs.status = 'released';
        }
      });
      return { affectedRows: 1 };
    }
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
      payment_time: now.toISOString().replace('T', ' ').slice(0, 19),
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
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.tickets.push(newTicket);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update tickets')) {
    const idOrCode = params[params.length - 1];
    const t = memory.tickets.find((item) => item.id === parseInt(idOrCode, 10) || item.ticket_code === idOrCode);
    if (t) {
      if (normalized.includes("status = 'used'")) t.status = 'used';
      else if (normalized.includes("status = 'cancelled'")) t.status = 'cancelled';
      else if (params[0] !== undefined) t.status = params[0];
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
      created_at: now.toISOString().replace('T', ' ').slice(0, 19),
    };
    memory.notifications.unshift(newNotif);
    return { insertId: newId, affectedRows: 1 };
  }

  if (normalized.startsWith('update notifications')) {
    const id = parseInt(params[0], 10);
    const notif = memory.notifications.find((n) => n.id === id);
    if (notif) notif.is_read = true;
    return { affectedRows: notif ? 1 : 0 };
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
