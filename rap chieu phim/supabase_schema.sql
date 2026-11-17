-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR NIGHT MOVIE CINEMA MANAGEMENT SYSTEM
-- Fully converted from MySQL cinema_management.sql to PostgreSQL 15/17
-- ====================================================================

-- --------------------------------------------------------------------
-- 0. COMPATIBILITY EXTENSIONS & HELPER FUNCTIONS
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MySQL curdate() compatibility
CREATE OR REPLACE FUNCTION curdate() RETURNS date AS $$
  SELECT CURRENT_DATE;
$$ LANGUAGE sql IMMUTABLE;

-- MySQL ifnull() compatibility
CREATE OR REPLACE FUNCTION ifnull(anyelement, anyelement) RETURNS anyelement AS $$
  SELECT COALESCE($1, $2);
$$ LANGUAGE sql IMMUTABLE;

-- MySQL datediff() compatibility
CREATE OR REPLACE FUNCTION datediff(d1 timestamp, d2 timestamp) RETURNS integer AS $$
  SELECT (d1::date - d2::date)::integer;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION datediff(d1 date, d2 date) RETURNS integer AS $$
  SELECT (d1 - d2)::integer;
$$ LANGUAGE sql IMMUTABLE;

-- MySQL date_add() compatibility
CREATE OR REPLACE FUNCTION date_add(d date, i interval) RETURNS timestamp AS $$
  SELECT (d + i)::timestamp;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION date_add(d timestamp, i interval) RETURNS timestamp AS $$
  SELECT (d + i)::timestamp;
$$ LANGUAGE sql IMMUTABLE;

-- MySQL date_sub() compatibility
CREATE OR REPLACE FUNCTION date_sub(d date, i interval) RETURNS timestamp AS $$
  SELECT (d - i)::timestamp;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION date_sub(d timestamp, i interval) RETURNS timestamp AS $$
  SELECT (d - i)::timestamp;
$$ LANGUAGE sql IMMUTABLE;

-- --------------------------------------------------------------------
-- 1. ROLES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
);

-- --------------------------------------------------------------------
-- 2. USERS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_roles FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 3. CUSTOMERS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  membership_level VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_customers_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 4. EMPLOYEES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL,
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_employees_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 5. MOVIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  director VARCHAR(150) NOT NULL,
  actors TEXT NOT NULL,
  duration INT NOT NULL,
  release_date DATE NOT NULL,
  end_date DATE NOT NULL,
  age_rating VARCHAR(10) NOT NULL DEFAULT 'P',
  language VARCHAR(100) NOT NULL DEFAULT 'Tiếng Việt - Phụ đề',
  format VARCHAR(50) NOT NULL DEFAULT '2D Digital',
  description TEXT NOT NULL,
  poster TEXT NOT NULL,
  trailer TEXT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'now_showing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 6. CINEMA ROOMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cinema_rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  room_type VARCHAR(50) NOT NULL DEFAULT 'standard',
  capacity INT NOT NULL DEFAULT 80,
  location VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  description TEXT NULL
);

-- --------------------------------------------------------------------
-- 7. SEATS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL,
  row_number VARCHAR(5) NOT NULL,
  seat_number INT NOT NULL,
  seat_type VARCHAR(50) NOT NULL DEFAULT 'standard',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  CONSTRAINT uq_room_seat UNIQUE (room_id, row_number, seat_number),
  CONSTRAINT fk_seats_rooms FOREIGN KEY (room_id) REFERENCES cinema_rooms (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 8. SCREENING SCHEDULES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screening_schedules (
  id SERIAL PRIMARY KEY,
  movie_id INT NOT NULL,
  room_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  format VARCHAR(50) NOT NULL DEFAULT '2D Phụ đề',
  ticket_price DECIMAL(12, 2) NOT NULL DEFAULT 90000.00,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_schedules_movies FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_schedules_rooms FOREIGN KEY (room_id) REFERENCES cinema_rooms (id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_schedule_time ON screening_schedules (start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_schedule_room_time ON screening_schedules (room_id, start_time, end_time);

-- --------------------------------------------------------------------
-- 9. BOOKINGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL,
  screening_id INT NOT NULL,
  booking_code VARCHAR(50) NOT NULL UNIQUE,
  booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  concession_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  voucher_code VARCHAR(50) NULL,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  CONSTRAINT fk_bookings_customers FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_schedules FOREIGN KEY (screening_id) REFERENCES screening_schedules (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 10. BOOKING SEATS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_seats (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL,
  seat_id INT NOT NULL,
  price DECIMAL(12, 2) NOT NULL DEFAULT 90000.00,
  status VARCHAR(50) NOT NULL DEFAULT 'holding',
  hold_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hold_expire TIMESTAMP NOT NULL,
  CONSTRAINT fk_booking_seats_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_booking_seats_seat FOREIGN KEY (seat_id) REFERENCES seats (id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_booking_seat_status ON booking_seats (booking_id, seat_id, status);
CREATE INDEX IF NOT EXISTS idx_hold_expire ON booking_seats (hold_expire);

-- --------------------------------------------------------------------
-- 11. CONCESSION ITEMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concession_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'popcorn',
  price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) DEFAULT 0,
  image TEXT NULL,
  is_active SMALLINT DEFAULT 1,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 12. BOOKING CONCESSIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_concessions (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL,
  concession_item_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_concessions_booking FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_booking_concessions_item FOREIGN KEY (concession_item_id) REFERENCES concession_items (id) ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_booking_concessions_booking ON booking_concessions (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_concessions_item ON booking_concessions (concession_item_id);

-- --------------------------------------------------------------------
-- 13. PAYMENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'banking',
  amount DECIMAL(12, 2) NOT NULL,
  transaction_code VARCHAR(100) NOT NULL UNIQUE,
  payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  CONSTRAINT fk_payments_bookings FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 14. TICKETS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL,
  customer_id INT NOT NULL,
  screening_id INT NOT NULL,
  seat_id INT NOT NULL,
  ticket_code VARCHAR(50) NOT NULL UNIQUE,
  qr_code TEXT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_bookings FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_customers FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_schedules FOREIGN KEY (screening_id) REFERENCES screening_schedules (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_seats FOREIGN KEY (seat_id) REFERENCES seats (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 15. EQUIPMENT TYPES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
);

-- --------------------------------------------------------------------
-- 16. EQUIPMENT
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  equipment_type_id INT NOT NULL,
  room_id INT NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  manufacturer VARCHAR(150) NOT NULL,
  purchase_date DATE NOT NULL,
  warranty_end DATE NOT NULL,
  last_maintenance DATE NULL,
  next_maintenance DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'good',
  CONSTRAINT fk_equipment_types FOREIGN KEY (equipment_type_id) REFERENCES equipment_types (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_equipment_rooms FOREIGN KEY (room_id) REFERENCES cinema_rooms (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 17. INCIDENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  reporter_id INT NOT NULL,
  room_id INT NULL,
  equipment_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL DEFAULT 'medium',
  image VARCHAR(500) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_incidents_reporter FOREIGN KEY (reporter_id) REFERENCES employees (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_incidents_rooms FOREIGN KEY (room_id) REFERENCES cinema_rooms (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_incidents_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 18. INCIDENT HISTORIES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incident_histories (
  id SERIAL PRIMARY KEY,
  incident_id INT NOT NULL,
  employee_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  spare_parts VARCHAR(255) NULL,
  cost DECIMAL(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_histories_incidents FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_histories_employees FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 19. MAINTENANCES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenances (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  equipment_id INT NOT NULL,
  employee_id INT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'periodic',
  description TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE NULL,
  result VARCHAR(50) NOT NULL DEFAULT 'pending',
  cost DECIMAL(12, 2) DEFAULT 0.00,
  note TEXT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  CONSTRAINT fk_maintenances_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_maintenances_employees FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 20. WORK SHIFTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_shifts (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL,
  work_date DATE NOT NULL,
  shift_name VARCHAR(50) NOT NULL DEFAULT 'morning',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  position VARCHAR(100) NOT NULL,
  room_id INT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  CONSTRAINT fk_shifts_employees FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_shifts_rooms FOREIGN KEY (room_id) REFERENCES cinema_rooms (id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 21. ASSIGNMENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  employee_id INT NOT NULL,
  incident_id INT NULL,
  maintenance_id INT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'assigned',
  CONSTRAINT fk_assignments_employees FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_incidents FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_assignments_maintenances FOREIGN KEY (maintenance_id) REFERENCES maintenances (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 22. ROOM INSPECTIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_inspections (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL,
  employee_id INT NOT NULL,
  inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'pass',
  note TEXT NULL,
  CONSTRAINT fk_inspections_rooms FOREIGN KEY (room_id) REFERENCES cinema_rooms (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inspections_employees FOREIGN KEY (employee_id) REFERENCES employees (id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 23. INSPECTION DETAILS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_details (
  id SERIAL PRIMARY KEY,
  inspection_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pass',
  note VARCHAR(255) NULL,
  CONSTRAINT fk_details_inspections FOREIGN KEY (inspection_id) REFERENCES room_inspections (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 24. NOTIFICATIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'system',
  is_read SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- --------------------------------------------------------------------
-- 25. INVENTORY INGREDIENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_ingredients (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_threshold DECIMAL(10,2) NOT NULL DEFAULT 10,
  cost_per_unit DECIMAL(12,2) DEFAULT 0,
  supplier VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 26. CONCESSION RECIPES (BOM)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concession_recipes (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  quantity_used DECIMAL(10,3) NOT NULL,
  note VARCHAR(100) NULL,
  CONSTRAINT fk_recipe_item FOREIGN KEY (item_id) REFERENCES concession_items (id) ON DELETE CASCADE,
  CONSTRAINT fk_recipe_ing FOREIGN KEY (ingredient_id) REFERENCES inventory_ingredients (id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 27. INVENTORY LOGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_logs (
  id SERIAL PRIMARY KEY,
  ingredient_id INT NOT NULL,
  change_type VARCHAR(50) NOT NULL DEFAULT 'import',
  quantity DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NULL,
  employee_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger tự động đồng bộ tồn kho nguyên vật liệu khi có nhật ký nhập/xuất kho
CREATE OR REPLACE FUNCTION trg_inventory_logs_ai()
RETURNS TRIGGER AS $$
DECLARE
  current_stock DECIMAL(10,2);
BEGIN
  SELECT stock_quantity INTO current_stock
  FROM inventory_ingredients
  WHERE id = NEW.ingredient_id;

  IF NEW.quantity < 0 AND (current_stock + NEW.quantity) < 0 THEN
    RAISE EXCEPTION 'Lỗi nghiệp vụ kho: Số lượng xuất/hao hụt vượt quá tồn kho hiện có.';
  END IF;

  UPDATE inventory_ingredients
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.ingredient_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_logs_ai ON inventory_logs;
CREATE TRIGGER trg_inventory_logs_ai
BEFORE INSERT ON inventory_logs
FOR EACH ROW
EXECUTE FUNCTION trg_inventory_logs_ai();

-- --------------------------------------------------------------------
-- 28. CONCESSION ORDERS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concession_orders (
  id SERIAL PRIMARY KEY,
  order_code VARCHAR(100) NOT NULL UNIQUE,
  employee_id INT NULL,
  customer_id INT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'cash',
  notes TEXT NULL,
  idempotency_key VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 29. CONCESSION ORDER ITEMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concession_order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  item_id INT NOT NULL,
  item_name VARCHAR(255) NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 30. SHIFT HANDOVERS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shift_handovers (
  id SERIAL PRIMARY KEY,
  work_shift_id INT NOT NULL,
  employee_id INT NOT NULL,
  manager_id INT NOT NULL,
  opening_float DECIMAL(12,2) NOT NULL,
  cash_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  card_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  qr_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
  actual_cash_counted DECIMAL(12,2) NOT NULL DEFAULT 0,
  variance DECIMAL(12,2) NOT NULL DEFAULT 0,
  cash_dropped_to_safe DECIMAL(12,2) NOT NULL DEFAULT 0,
  next_shift_float DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 31. KDM LICENSES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kdm_licenses (
  id SERIAL PRIMARY KEY,
  movie_id INT NOT NULL,
  movie_name VARCHAR(255) NOT NULL,
  room_id INT NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  server_serial VARCHAR(100) NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  key_file VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 32. PROJECTOR LAMP LOGS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projector_lamp_logs (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  projector_model VARCHAR(100) NOT NULL,
  lamp_type VARCHAR(100) NOT NULL,
  hours_used INT NOT NULL DEFAULT 0,
  max_hours_recommended INT NOT NULL DEFAULT 2000,
  health_percentage DECIMAL(5,2) DEFAULT 100.0,
  temperature_celsius DECIMAL(5,2) DEFAULT 22.0,
  status VARCHAR(50) DEFAULT 'good',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 33. TURNAROUND CHECKLISTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turnaround_checklists (
  id SERIAL PRIMARY KEY,
  schedule_id INT NOT NULL,
  room_id INT NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  cleaned_by_name VARCHAR(150) NOT NULL,
  target_minutes INT NOT NULL DEFAULT 15,
  actual_minutes INT NOT NULL DEFAULT 10,
  seats_checked SMALLINT DEFAULT 1,
  trash_cleared SMALLINT DEFAULT 1,
  spilled_liquid_cleaned SMALLINT DEFAULT 1,
  screen_undamaged SMALLINT DEFAULT 1,
  aircon_normal SMALLINT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'ready',
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 34. MOVIE REVIEWS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movie_reviews (
  id SERIAL PRIMARY KEY,
  movie_id INT NOT NULL,
  user_id INT NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NULL,
  is_verified_buyer BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_movies FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reviews_movie ON movie_reviews (movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON movie_reviews (user_id);
