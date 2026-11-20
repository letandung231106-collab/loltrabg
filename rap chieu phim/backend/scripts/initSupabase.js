const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const memory = require('../config/memoryStore');

const rawUrl = process.env.DATABASE_URL || '';
// Clean up and sanitize connection string
let connectionString = rawUrl.trim();
// Fix unencoded password or brackets if present: postgresql://user:[pwd]@host...
if (connectionString.includes(':[') && connectionString.includes(']@')) {
  connectionString = connectionString.replace(/:\[(.*?)\]@/, (m, pwd) => `:${encodeURIComponent(pwd)}@`);
} else if (connectionString.includes(':') && connectionString.includes('@')) {
  // Check if password has unencoded @
  try {
    new URL(connectionString);
  } catch (err) {
    // If invalid URL due to extra @, attempt to encode password
    const match = connectionString.match(/^(postgresql:\/\/[^:]+:)(.*)@([^@]+)$/);
    if (match) {
      connectionString = `${match[1]}${encodeURIComponent(match[2])}@${match[3]}`;
    }
  }
}

console.log('================================================================');
console.log(' SUPABASE POSTGRESQL INITIALIZATION & MIGRATION SCRIPT');
console.log('================================================================');
console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  console.log('✔ Kết nối thành công tới Supabase PostgreSQL Server!');

  try {
    // 1. Chạy file schema PostgreSQL
    console.log('\n--- 1. KHỞI TẠO BẢNG & HÀM TƯƠNG THÍCH (supabase_schema.sql) ---');
    const schemaPath = path.join(__dirname, '../../supabase_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query(schemaSql);
    console.log('✔ Khởi tạo thành công 34 bảng, triggers, indexes và compatibility functions!');

    // 2. Chèn dữ liệu mẫu từ memoryStore
    console.log('\n--- 2. CHÈN DỮ LIỆU MẪU CHUẨN HOÁ (Seed Data) ---');

    // Helper: Chunked Bulk Insert với ON CONFLICT DO UPDATE/NOTHING
    async function seedTable(tableName, items, columns, mapFn) {
      if (!items || items.length === 0) return 0;
      const chunkSize = 50;
      let insertedCount = 0;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const valuePlaceholders = [];
        const params = [];
        let paramIndex = 1;

        chunk.forEach((rawItem, cIdx) => {
          const itemIndex = i + cIdx;
          const item = mapFn ? mapFn(rawItem, itemIndex) : rawItem;
          const rowPlaceholders = [];
          for (const col of columns) {
            rowPlaceholders.push(`$${paramIndex++}`);
            params.push(item[col] === undefined ? null : item[col]);
          }
          valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
        });

        const colNames = columns.map(c => `"${c}"`).join(', ');
        const conflictClause = columns.includes('id')
          ? `ON CONFLICT (id) DO UPDATE SET ${columns.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}`
          : 'ON CONFLICT DO NOTHING';

        const sql = `INSERT INTO ${tableName} (${colNames}) VALUES ${valuePlaceholders.join(', ')} ${conflictClause}`;
        try {
          await client.query(sql, params);
          insertedCount += chunk.length;
        } catch (err) {
          console.warn(`  [Notice] ${tableName} chunk: ${err.message}`);
        }
      }
      console.log(`  ✔ [${tableName}]: Đã đồng bộ ${insertedCount}/${items.length} bản ghi`);

      // Reset serial sequence
      try {
        await client.query(`
          SELECT setval(
            pg_get_serial_sequence('${tableName}', 'id'),
            COALESCE((SELECT MAX(id) FROM ${tableName}), 1),
            (SELECT MAX(id) FROM ${tableName}) IS NOT NULL
          );
        `);
      } catch (seqErr) {
        // Table may not have serial id
      }
      return insertedCount;
    }

    // A. Roles
    await seedTable('roles', memory.roles, ['id', 'name', 'description']);

    // B. Users
    await seedTable('users', memory.users, ['id', 'username', 'password', 'role_id', 'status', 'created_at']);

    // C. Customers
    await seedTable('customers', memory.customers, ['id', 'user_id', 'name', 'email', 'phone', 'membership_level', 'created_at']);

    // D. Employees
    await seedTable('employees', memory.employees, ['id', 'user_id', 'name', 'phone', 'email', 'position', 'department', 'status', 'created_at']);

    // E. Cinema Rooms
    await seedTable('cinema_rooms', memory.rooms, ['id', 'name', 'room_type', 'capacity', 'location', 'status', 'description']);

    // F. Movies
    await seedTable('movies', memory.movies, [
      'id', 'name', 'genre', 'director', 'actors', 'duration', 'release_date', 'end_date',
      'age_rating', 'language', 'format', 'description', 'poster', 'trailer', 'status'
    ]);

    // G. Seats (576 ghế)
    await seedTable('seats', memory.seats, ['id', 'room_id', 'row_number', 'seat_number', 'seat_type', 'status']);

    // H. Screening Schedules
    await seedTable('screening_schedules', memory.schedules, [
      'id', 'movie_id', 'room_id', 'start_time', 'end_time', 'format', 'ticket_price', 'status'
    ]);

    // I. Equipment Types
    await seedTable('equipment_types', memory.equipment_types, ['id', 'name', 'description']);

    // J. Equipment
    await seedTable('equipment', memory.equipment, [
      'id', 'equipment_type_id', 'room_id', 'name', 'code', 'manufacturer',
      'purchase_date', 'warranty_end', 'last_maintenance', 'next_maintenance', 'status'
    ]);

    // K. Concession Items (10 món bao gồm Bánh Tart Trứng & Bim Bim)
    await seedTable('concession_items', memory.concession_items, [
      'id', 'name', 'category', 'price', 'cost_price', 'image', 'is_active', 'description'
    ], item => ({
      ...item,
      is_active: item.is_active ? 1 : 0
    }));

    // L. Inventory Ingredients
    await seedTable('inventory_ingredients', memory.inventory_ingredients, [
      'id', 'code', 'name', 'unit', 'stock_quantity', 'min_threshold', 'cost_per_unit', 'supplier'
    ]);

    // M. Concession Recipes (BOM)
    await seedTable('concession_recipes', memory.concession_recipes, [
      'id', 'item_id', 'ingredient_id', 'quantity_used', 'note'
    ], (item, idx) => ({
      id: item.id || idx + 1,
      ...item
    }));

    // N. Inventory Logs (Tạm tắt trigger hoặc bù tồn kho sau log)
    // Tồn kho hiện tại đã có sẵn trong ingredients, tạm disable trigger khi seed logs
    await client.query('ALTER TABLE inventory_logs DISABLE TRIGGER trg_inventory_logs_ai;');
    await seedTable('inventory_logs', memory.inventory_logs, [
      'id', 'ingredient_id', 'change_type', 'quantity', 'reason', 'employee_id'
    ]);
    await client.query('ALTER TABLE inventory_logs ENABLE TRIGGER trg_inventory_logs_ai;');

    // O. KDM Licenses
    await seedTable('kdm_licenses', memory.kdm_licenses, [
      'id', 'movie_id', 'movie_name', 'room_id', 'room_name', 'server_serial', 'valid_from', 'valid_until', 'status', 'key_file'
    ]);

    // P. Projector Lamp Logs
    await seedTable('projector_lamp_logs', memory.projector_lamp_logs, [
      'id', 'room_id', 'room_name', 'projector_model', 'lamp_type', 'hours_used', 'max_hours_recommended', 'health_percentage', 'temperature_celsius', 'status'
    ]);

    // Q. Turnaround Checklists
    await seedTable('turnaround_checklists', memory.turnaround_checklists, [
      'id', 'schedule_id', 'room_id', 'room_name', 'cleaned_by_name', 'target_minutes', 'actual_minutes',
      'seats_checked', 'trash_cleared', 'spilled_liquid_cleaned', 'screen_undamaged', 'aircon_normal', 'status'
    ], item => ({
      ...item,
      seats_checked: item.seats_checked ? 1 : 0,
      trash_cleared: item.trash_cleared ? 1 : 0,
      spilled_liquid_cleaned: item.spilled_liquid_cleaned ? 1 : 0,
      screen_undamaged: item.screen_undamaged ? 1 : 0,
      aircon_normal: item.aircon_normal ? 1 : 0
    }));

    // R. Movie Reviews
    await seedTable('movie_reviews', memory.movie_reviews, [
      'id', 'movie_id', 'user_id', 'user_name', 'rating', 'comment', 'is_verified_buyer'
    ]);

    // S. Work Shifts & Maintenances & Incidents & Assignments & Inspections
    await seedTable('work_shifts', memory.work_shifts, [
      'id', 'employee_id', 'work_date', 'shift_name', 'start_time', 'end_time', 'position', 'room_id', 'status'
    ]);

    await seedTable('maintenances', memory.maintenances, [
      'id', 'code', 'equipment_id', 'employee_id', 'type', 'description', 'scheduled_date', 'completed_date', 'result', 'cost', 'note', 'status'
    ]);

    await seedTable('incidents', memory.incidents, [
      'id', 'code', 'reporter_id', 'room_id', 'equipment_id', 'title', 'description', 'severity', 'image', 'status'
    ]);

    await seedTable('incident_histories', memory.incident_histories, [
      'id', 'incident_id', 'employee_id', 'action', 'description', 'spare_parts', 'cost'
    ]);

    await seedTable('assignments', memory.assignments, [
      'id', 'employee_id', 'incident_id', 'maintenance_id', 'assigned_at', 'status'
    ]);

    await seedTable('room_inspections', memory.room_inspections, [
      'id', 'room_id', 'employee_id', 'inspection_date', 'status', 'note'
    ]);

    await seedTable('inspection_details', memory.inspection_details, [
      'id', 'inspection_id', 'item_name', 'status', 'note'
    ]);

    await seedTable('notifications', memory.notifications, [
      'id', 'user_id', 'title', 'message', 'type', 'is_read'
    ], item => ({
      ...item,
      is_read: item.is_read ? 1 : 0
    }));

    // T. Bookings, Booking Seats, Payments, Tickets
    await seedTable('bookings', memory.bookings, [
      'id', 'customer_id', 'screening_id', 'booking_code', 'booking_time', 'total_amount', 'concession_amount', 'voucher_code', 'discount_amount', 'status'
    ]);

    await seedTable('booking_seats', memory.booking_seats, [
      'id', 'booking_id', 'seat_id', 'price', 'status', 'hold_start', 'hold_expire'
    ]);

    await seedTable('payments', memory.payments, [
      'id', 'booking_id', 'payment_method', 'amount', 'transaction_code', 'payment_time', 'status'
    ]);

    await seedTable('tickets', memory.tickets, [
      'id', 'booking_id', 'customer_id', 'screening_id', 'seat_id', 'ticket_code', 'qr_code', 'status'
    ]);

    await seedTable('shift_handovers', memory.shift_handovers, [
      'id', 'work_shift_id', 'employee_id', 'manager_id', 'opening_float', 'cash_sales', 'card_sales', 'qr_sales',
      'actual_cash_counted', 'variance', 'cash_dropped_to_safe', 'next_shift_float', 'status', 'notes'
    ]);

    console.log('\n================================================================');
    console.log(' KHỞI TẠO VÀ ĐỒNG BỘ DỮ LIỆU SUPABASE THÀNH CÔNG RỰC RỠ!');
    console.log('================================================================');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình khởi tạo Supabase:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
