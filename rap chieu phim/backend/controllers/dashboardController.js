const db = require('../config/database');

/**
 * DASHBOARD TỔNG QUAN (MỤC 9: ADMIN / MANAGER KPI & STATS)
 */
async function getDashboardSummary(req, res, next) {
  try {
    // 1. Thống kê Phim
    const movieStats = await db.query(
      `SELECT 
        COUNT(*) AS total_movies,
        SUM(CASE WHEN status = 'now_showing' THEN 1 ELSE 0 END) AS now_showing_movies,
        SUM(CASE WHEN status = 'coming_soon' THEN 1 ELSE 0 END) AS coming_soon_movies
       FROM movies`
    );

    // 2. Thống kê Phòng chiếu
    const roomStats = await db.query(
      `SELECT 
        COUNT(*) AS total_rooms,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_rooms,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance_rooms,
        SUM(CASE WHEN status = 'incident' THEN 1 ELSE 0 END) AS incident_rooms
       FROM cinema_rooms`
    );

    // 3. Thống kê Thiết bị & Sự cố
    const equipmentStats = await db.query(
      `SELECT 
        COUNT(*) AS total_equipment,
        SUM(CASE WHEN status IN ('broken', 'repairing') THEN 1 ELSE 0 END) AS faulty_equipment,
        SUM(CASE WHEN status = 'check_needed' THEN 1 ELSE 0 END) AS check_needed_equipment,
        SUM(CASE WHEN next_maintenance <= DATE_ADD(CURDATE(), INTERVAL 14 DAY) THEN 1 ELSE 0 END) AS upcoming_maintenance
       FROM equipment`
    );

    const incidentStats = await db.query(
      `SELECT 
        COUNT(*) AS total_incidents,
        SUM(CASE WHEN status IN ('new', 'accepted', 'in_progress') THEN 1 ELSE 0 END) AS unresolved_incidents,
        SUM(CASE WHEN severity = 'critical' AND status != 'closed' THEN 1 ELSE 0 END) AS critical_incidents
       FROM incidents`
    );

    // 4. Thống kê Suất chiếu & Vé & Doanh thu Hôm Nay (So với tổng)
    const todaySales = await db.query(
      `SELECT 
        COUNT(DISTINCT s.id) AS screenings_today,
        COUNT(DISTINCT CASE WHEN b.status = 'paid' AND DATE(b.booking_time) = CURDATE() THEN t.id END) AS tickets_sold_today,
        COALESCE(SUM(CASE WHEN b.status = 'paid' AND DATE(b.booking_time) = CURDATE() THEN b.total_amount END), 0) AS revenue_today,
        COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.total_amount END), 0) AS total_revenue_all_time,
        COUNT(DISTINCT CASE WHEN b.status = 'paid' THEN t.id END) AS total_tickets_all_time
       FROM screening_schedules s
       LEFT JOIN bookings b ON b.screening_id = s.id
       LEFT JOIN tickets t ON t.booking_id = b.id
       WHERE DATE(s.start_time) = CURDATE() OR 1=1`
    );

    // 5. Thống kê Bảo trì & Chi phí
    const maintenanceStats = await db.query(
      `SELECT 
        COUNT(*) AS total_maintenances,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_maintenances,
        COALESCE(SUM(cost), 0) AS total_maintenance_cost
       FROM maintenances`
    );

    return res.status(200).json({
      success: true,
      data: {
        movies: movieStats[0],
        rooms: roomStats[0],
        equipment: equipmentStats[0],
        incidents: incidentStats[0],
        sales: todaySales[0],
        maintenance: maintenanceStats[0],
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * BIỂU ĐỒ DOANH THU & VÉ (Theo ngày / tháng / phim)
 */
async function getRevenueAnalytics(req, res, next) {
  try {
    // Doanh thu theo 7 ngày gần nhất
    const dailyRevenue = await db.query(
      `SELECT 
        DATE(p.payment_time) AS date,
        COUNT(DISTINCT p.id) AS transaction_count,
        COUNT(DISTINCT t.id) AS tickets_count,
        COALESCE(SUM(p.amount), 0) AS total_revenue
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       LEFT JOIN tickets t ON t.booking_id = b.id
       WHERE p.status = 'success' AND p.payment_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(p.payment_time)
       ORDER BY DATE(p.payment_time) ASC`
    );

    // Top phim có doanh thu cao nhất
    const topMovies = await db.query(
      `SELECT 
        m.id, m.name, m.poster,
        COUNT(DISTINCT t.id) AS total_tickets,
        COALESCE(SUM(b.total_amount), 0) AS total_revenue
       FROM movies m
       JOIN screening_schedules s ON s.movie_id = m.id
       JOIN bookings b ON b.screening_id = s.id AND b.status = 'paid'
       LEFT JOIN tickets t ON t.booking_id = b.id
       GROUP BY m.id
       ORDER BY total_revenue DESC
       LIMIT 6`
    );

    // Sự cố theo tháng
    const incidentMonthly = await db.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS total_incidents,
        SUM(CASE WHEN severity IN ('high', 'critical') THEN 1 ELSE 0 END) AS high_severity_count
       FROM incidents
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC LIMIT 6`
    );

    // Chi phí bảo trì theo loại thiết bị
    const maintenanceCostByType = await db.query(
      `SELECT 
        et.name AS type_name,
        COUNT(m.id) AS maintenance_count,
        COALESCE(SUM(m.cost), 0) AS total_cost
       FROM maintenances m
       JOIN equipment e ON m.equipment_id = e.id
       JOIN equipment_types et ON e.equipment_type_id = et.id
       GROUP BY et.id
       ORDER BY total_cost DESC`
    );

    return res.status(200).json({
      success: true,
      data: {
        dailyRevenue,
        topMovies,
        incidentMonthly,
        maintenanceCostByType,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardSummary,
  getRevenueAnalytics,
};
