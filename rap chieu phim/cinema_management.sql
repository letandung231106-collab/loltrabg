-- ====================================================================
-- HỆ THỐNG QUẢN LÝ VẬN HÀNH VÀ ĐẶT VÉ RẠP PHIM (CINEMA MANAGEMENT SYSTEM)
-- Môn học: Phân tích và Thiết kế Hướng Đối Tượng (OOAD)
-- Database Engine: MySQL 8.0 (InnoDB)
-- Tương thích hoàn toàn: MySQL Workbench, Navicat, phpMyAdmin, CLI
-- ====================================================================

DROP DATABASE IF EXISTS `cinema_management`;
CREATE DATABASE `cinema_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cinema_management`;

-- Tắt kiểm tra khóa ngoại khi khởi tạo bảng
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- 1. BẢNG roles (Vai trò trong hệ thống)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. BẢNG users (Tài khoản đăng nhập)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `status` ENUM('active', 'locked', 'inactive') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. BẢNG customers (Thông tin khách hàng)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL,
  `membership_level` ENUM('standard', 'silver', 'gold', 'platinum') DEFAULT 'standard',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_customers_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. BẢNG employees (Thông tin nhân viên)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `status` ENUM('active', 'on_leave', 'resigned') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_employees_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. BẢNG movies (Phim)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `movies`;
CREATE TABLE `movies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `genre` VARCHAR(100) NOT NULL,
  `director` VARCHAR(150) NOT NULL,
  `actors` TEXT NOT NULL,
  `duration` INT NOT NULL COMMENT 'Thời lượng tính bằng phút',
  `release_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `age_rating` VARCHAR(10) NOT NULL DEFAULT 'P' COMMENT 'P, K, T13, T16, T18, C',
  `language` VARCHAR(100) NOT NULL DEFAULT 'Tiếng Việt - Phụ đề',
  `format` VARCHAR(50) NOT NULL DEFAULT '2D Digital' COMMENT '2D, 3D, IMAX 2D, 4DX',
  `description` TEXT NOT NULL,
  `poster` LONGTEXT NOT NULL,
  `trailer` LONGTEXT NULL,
  `status` ENUM('coming_soon', 'now_showing', 'ended', 'archived') NOT NULL DEFAULT 'now_showing',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. BẢNG cinema_rooms (Phòng chiếu phim)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `cinema_rooms`;
CREATE TABLE `cinema_rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `room_type` ENUM('standard', 'vip', 'imax', '4dx') NOT NULL DEFAULT 'standard',
  `capacity` INT NOT NULL DEFAULT 80,
  `location` VARCHAR(100) NOT NULL COMMENT 'Ví dụ: Tầng 3 - Khu A',
  `status` ENUM('active', 'maintenance', 'paused', 'incident') NOT NULL DEFAULT 'active',
  `description` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. BẢNG seats (Ghế trong phòng - Vị trí vật lý)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `seats`;
CREATE TABLE `seats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL,
  `row_number` VARCHAR(5) NOT NULL COMMENT 'Hàng ghế: A, B, C, D, E, F, G, H',
  `seat_number` INT NOT NULL COMMENT 'Số thứ tự trong hàng: 1, 2, 3...',
  `seat_type` ENUM('standard', 'vip', 'couple') NOT NULL DEFAULT 'standard',
  `status` ENUM('active', 'broken', 'inactive') NOT NULL DEFAULT 'active',
  UNIQUE KEY `uq_room_seat` (`room_id`, `row_number`, `seat_number`),
  CONSTRAINT `fk_seats_rooms` FOREIGN KEY (`room_id`) REFERENCES `cinema_rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 8. BẢNG screening_schedules (Lịch chiếu phim)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `screening_schedules`;
CREATE TABLE `screening_schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `movie_id` INT NOT NULL,
  `room_id` INT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `format` VARCHAR(50) NOT NULL DEFAULT '2D Phụ đề',
  `ticket_price` DECIMAL(12, 2) NOT NULL DEFAULT 90000.00,
  `status` ENUM('scheduled', 'screening', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_schedules_movies` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_schedules_rooms` FOREIGN KEY (`room_id`) REFERENCES `cinema_rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_schedule_time` (`start_time`, `end_time`),
  INDEX `idx_schedule_room_time` (`room_id`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 9. BẢNG bookings (Đơn đặt vé)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `screening_id` INT NOT NULL,
  `booking_code` VARCHAR(50) NOT NULL UNIQUE,
  `booking_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'paid', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
  CONSTRAINT `fk_bookings_customers` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_schedules` FOREIGN KEY (`screening_id`) REFERENCES `screening_schedules` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 10. BẢNG booking_seats (Ghế gắn với Đơn đặt & Cơ chế Giữ ghế)
-- Trạng thái ghế thay đổi theo Suất chiếu + Ghế
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `booking_seats`;
CREATE TABLE `booking_seats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `seat_id` INT NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 90000.00,
  `status` ENUM('holding', 'booked', 'released') NOT NULL DEFAULT 'holding',
  `hold_start` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `hold_expire` DATETIME NOT NULL COMMENT 'hold_start + 10 phút',
  INDEX `idx_booking_seat_status` (`booking_id`, `seat_id`, `status`),
  INDEX `idx_hold_expire` (`hold_expire`),
  CONSTRAINT `fk_booking_seats_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_seats_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 11. BẢNG payments (Giao dịch thanh toán)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL UNIQUE,
  `payment_method` ENUM('vnpay', 'momo', 'banking', 'credit_card', 'cash') NOT NULL DEFAULT 'banking',
  `amount` DECIMAL(12, 2) NOT NULL,
  `transaction_code` VARCHAR(100) NOT NULL UNIQUE,
  `payment_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('pending', 'success', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  CONSTRAINT `fk_payments_bookings` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 12. BẢNG tickets (Vé xem phim điện tử)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `tickets`;
CREATE TABLE `tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `customer_id` INT NOT NULL,
  `screening_id` INT NOT NULL,
  `seat_id` INT NOT NULL,
  `ticket_code` VARCHAR(50) NOT NULL UNIQUE,
  `qr_code` VARCHAR(255) NULL,
  `status` ENUM('active', 'used', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tickets_bookings` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_customers` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_schedules` FOREIGN KEY (`screening_id`) REFERENCES `screening_schedules` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_tickets_seats` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 13. BẢNG equipment_types (Loại thiết bị rạp phim)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `equipment_types`;
CREATE TABLE `equipment_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 14. BẢNG equipment (Thiết bị rạp phim chi tiết)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `equipment`;
CREATE TABLE `equipment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `equipment_type_id` INT NOT NULL,
  `room_id` INT NULL COMMENT 'Gắn với phòng chiếu hoặc khu vực chung',
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `manufacturer` VARCHAR(150) NOT NULL,
  `purchase_date` DATE NOT NULL,
  `warranty_end` DATE NOT NULL,
  `last_maintenance` DATE NULL,
  `next_maintenance` DATE NOT NULL,
  `status` ENUM('good', 'check_needed', 'repairing', 'broken', 'inactive') NOT NULL DEFAULT 'good',
  CONSTRAINT `fk_equipment_types` FOREIGN KEY (`equipment_type_id`) REFERENCES `equipment_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_equipment_rooms` FOREIGN KEY (`room_id`) REFERENCES `cinema_rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 15. BẢNG incidents (Báo cáo sự cố)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `incidents`;
CREATE TABLE `incidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `reporter_id` INT NOT NULL,
  `room_id` INT NULL,
  `equipment_id` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `image` VARCHAR(500) NULL,
  `status` ENUM('new', 'accepted', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'new',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_incidents_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_incidents_rooms` FOREIGN KEY (`room_id`) REFERENCES `cinema_rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_incidents_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 16. BẢNG incident_histories (Lịch sử xử lý sự cố)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `incident_histories`;
CREATE TABLE `incident_histories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `incident_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `spare_parts` VARCHAR(255) NULL,
  `cost` DECIMAL(12, 2) DEFAULT 0.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_histories_incidents` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_histories_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 17. BẢNG maintenances (Kế hoạch & Nhật ký bảo trì)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `maintenances`;
CREATE TABLE `maintenances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `equipment_id` INT NOT NULL,
  `employee_id` INT NULL,
  `type` ENUM('periodic', 'emergency', 'repair') NOT NULL DEFAULT 'periodic',
  `description` TEXT NOT NULL,
  `scheduled_date` DATE NOT NULL,
  `completed_date` DATE NULL,
  `result` ENUM('success', 'partially_fixed', 'failed', 'pending') NOT NULL DEFAULT 'pending',
  `cost` DECIMAL(12, 2) DEFAULT 0.00,
  `note` TEXT NULL,
  `status` ENUM('planned', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'planned',
  CONSTRAINT `fk_maintenances_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_maintenances_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 18. BẢNG work_shifts (Ca làm việc của nhân viên)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `work_shifts`;
CREATE TABLE `work_shifts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `work_date` DATE NOT NULL,
  `shift_name` ENUM('morning', 'afternoon', 'evening') NOT NULL DEFAULT 'morning',
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `room_id` INT NULL,
  `status` ENUM('scheduled', 'checked_in', 'completed', 'absent') NOT NULL DEFAULT 'scheduled',
  CONSTRAINT `fk_shifts_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_shifts_rooms` FOREIGN KEY (`room_id`) REFERENCES `cinema_rooms` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 19. BẢNG assignments (Phân công nhiệm vụ cho Kỹ thuật/Nhân viên)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `assignments`;
CREATE TABLE `assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `incident_id` INT NULL,
  `maintenance_id` INT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('assigned', 'accepted', 'in_progress', 'completed', 'rejected') NOT NULL DEFAULT 'assigned',
  CONSTRAINT `fk_assignments_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_incidents` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_maintenances` FOREIGN KEY (`maintenance_id`) REFERENCES `maintenances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 20. BẢNG room_inspections (Phiếu kiểm tra phòng chiếu / Checklist)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `room_inspections`;
CREATE TABLE `room_inspections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `inspection_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('pass', 'fail', 'action_required') NOT NULL DEFAULT 'pass',
  `note` TEXT NULL,
  CONSTRAINT `fk_inspections_rooms` FOREIGN KEY (`room_id`) REFERENCES `cinema_rooms` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_inspections_employees` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 21. BẢNG inspection_details (Chi tiết từng hạng mục kiểm tra)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `inspection_details`;
CREATE TABLE `inspection_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `inspection_id` INT NOT NULL,
  `item_name` VARCHAR(100) NOT NULL COMMENT 'Máy chiếu, Âm thanh, Điều hòa, Đèn, Ghế, Màn hình, Cửa thoát hiểm, Vệ sinh, PCCC',
  `status` ENUM('pass', 'fail', 'action_required') NOT NULL DEFAULT 'pass',
  `note` VARCHAR(255) NULL,
  CONSTRAINT `fk_details_inspections` FOREIGN KEY (`inspection_id`) REFERENCES `room_inspections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 22. BẢNG notifications (Thông báo hệ thống)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('incident', 'maintenance', 'shift', 'schedule', 'system', 'booking') NOT NULL DEFAULT 'system',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notifications_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- DỮ LIỆU MẪU (SEED DATA ĐẦY ĐỦ VÀ CHUẨN XÁC)
-- ====================================================================

-- 1. Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Quản trị viên toàn quyền hệ thống'),
(2, 'manager', 'Quản lý vận hành rạp chiếu phim'),
(3, 'staff', 'Nhân viên vận hành phòng chiếu & rạp'),
(4, 'technician', 'Kỹ thuật viên sửa chữa & bảo trì thiết bị'),
(5, 'customer', 'Khách hàng đặt vé xem phim');

-- 2. Users (Mật khẩu băm chuẩn bcrypt của chuỗi 'password123')
-- $2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t
-- $2a$10$x7qD2oWc01V4uQoHk5n4.eQo6.y8n0A1e2k3L4m5N6p7Q8r9S0t1u
INSERT INTO `users` (`id`, `username`, `password`, `role_id`, `status`) VALUES
(1, 'admin', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 1, 'active'),
(2, 'manager1', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 2, 'active'),
(3, 'staff1', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 3, 'active'),
(4, 'staff2', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 3, 'active'),
(5, 'tech1', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 4, 'active'),
(6, 'tech2', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 4, 'active'),
(7, 'customer1', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 5, 'active'),
(8, 'customer2', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 5, 'active'),
(9, 'customer3', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 5, 'active'),
(10, 'manager2', '$2a$10$wNqBqHj1.7GfCq3X0.q3v.YVlQh4d7aF9Hj8K1l2M3n4P5q6R7s8t', 2, 'active');

-- 3. Customers
INSERT INTO `customers` (`id`, `user_id`, `name`, `email`, `phone`, `membership_level`) VALUES
(1, 7, 'Nguyễn Văn An', 'nguyenvanan@gmail.com', '0901234567', 'gold'),
(2, 8, 'Trần Thị Mai', 'tranthimai@gmail.com', '0912345678', 'platinum'),
(3, 9, 'Lê Hoàng Long', 'lehoanglong@gmail.com', '0987654321', 'silver');

-- 4. Employees
INSERT INTO `employees` (`id`, `user_id`, `name`, `phone`, `email`, `position`, `department`, `status`) VALUES
(1, 1, 'Hồ Quốc Bảo (Admin)', '0909000001', 'admin@cinema.vn', 'Giám Đốc Hệ Thống', 'Ban Giám Đốc', 'active'),
(2, 2, 'Phạm Minh Đức', '0909000002', 'duc.pm@cinema.vn', 'Trưởng Quản Lý Rạp', 'Vận Hành Rạp', 'active'),
(3, 10, 'Hoàng Thùy Linh', '0909000010', 'linh.ht@cinema.vn', 'Phó Quản Lý Rạp', 'Vận Hành Rạp', 'active'),
(4, 3, 'Nguyễn Thu Trang', '0909000003', 'trang.nt@cinema.vn', 'Nhân Viên Soát Vé & Vận Hành', 'Vận Hành Rạp', 'active'),
(5, 4, 'Đỗ Tuấn Kiệt', '0909000004', 'kiet.dt@cinema.vn', 'Nhân Viên Kiểm Tra Phòng', 'Vận Hành Rạp', 'active'),
(6, 5, 'Võ Minh Quân', '0909000005', 'quan.vm@cinema.vn', 'Kỹ Thuật Viên Trưởng', 'Kỹ Thuật & Bảo Trì', 'active'),
(7, 6, 'Lý Quốc Hùng', '0909000006', 'hung.lq@cinema.vn', 'Kỹ Thuật Viên Máy Chiếu', 'Kỹ Thuật & Bảo Trì', 'active');

-- 5. Cinema Rooms (8 phòng tiêu chuẩn và cao cấp)
INSERT INTO `cinema_rooms` (`id`, `name`, `room_type`, `capacity`, `location`, `status`, `description`) VALUES
(1, 'Cinema Hall 1 (Standard Dolby)', 'standard', 72, 'Tầng 3 - Cánh Trái', 'active', 'Phòng chiếu tiêu chuẩn âm thanh vòm Dolby Atmos 7.1'),
(2, 'Cinema Hall 2 (Standard Dolby)', 'standard', 72, 'Tầng 3 - Cánh Trái', 'active', 'Phòng chiếu kỹ thuật số Laser 4K sắc nét'),
(3, 'Cinema Hall 3 (VIP Prime Lounge)', 'vip', 48, 'Tầng 3 - Khu Trung Tâm', 'active', 'Phòng chiếu ghế bọc da cao cấp điều chỉnh điện kèm phục vụ đồ uống'),
(4, 'Cinema Hall 4 (IMAX Laser Theater)', 'imax', 96, 'Tầng 4 - Đại Sảnh IMAX', 'active', 'Màn hình khổng lồ 22m x 16m chuẩn IMAX Laser thế hệ mới'),
(5, 'Cinema Hall 5 (4DX Motion World)', '4dx', 60, 'Tầng 4 - Cánh Phải', 'active', 'Hiệu ứng ghế rung lắc, gió, mưa, sương mù, mùi hương chân thực'),
(6, 'Cinema Hall 6 (Gold Class Luxury)', 'vip', 36, 'Tầng 4 - Cánh Phải', 'maintenance', 'Phòng hạng sang phục vụ tiệc nhẹ - Đang nâng cấp hệ thống âm thanh'),
(7, 'Cinema Hall 7 (Standard Dolby)', 'standard', 72, 'Tầng 5 - Cánh Trái', 'active', 'Phòng chiếu phim gia đình và hoạt hình trẻ em'),
(8, 'Cinema Hall 8 (Studio Premiere)', 'standard', 72, 'Tầng 5 - Cánh Phải', 'incident', 'Đang xử lý sự cố máy điều hòa trung tâm');

-- 6. Movies (16 Phim đa dạng thể loại)
INSERT INTO `movies` (`id`, `name`, `genre`, `director`, `actors`, `duration`, `release_date`, `end_date`, `age_rating`, `language`, `format`, `description`, `poster`, `trailer`, `status`) VALUES
(1, 'Dune: Hành Tinh Cát - Phần 2', 'Khoa học viễn tưởng, Hành động', 'Denis Villeneuve', 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem', 166, '2026-03-01', '2026-05-30', 'T16', 'Tiếng Anh - Phụ đề Tiếng Việt', 'IMAX 2D, 2D Digital', 'Hành trình huyền thoại của Paul Atreides khi anh hợp nhất với Chani và người Fremen trên con đường trả thù những kẻ đã hủy diệt gia tộc mình.', 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 'https://www.youtube.com/watch?v=Way9Dexny3w', 'now_showing'),
(2, 'Oppenheimer', 'Tiểu sử, Lịch sử, Kịch tính', 'Christopher Nolan', 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.', 180, '2026-02-15', '2026-05-15', 'T18', 'Tiếng Anh - Phụ đề Tiếng Việt', 'IMAX 2D, 2D Digital', 'Câu chuyện về nhà vật lý lý thuyết J. Robert Oppenheimer, người lãnh đạo Dự án Manhattan phát triển vũ khí hạt nhân đầu tiên của nhân loại.', 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 'https://www.youtube.com/watch?v=uYPbbksJxIg', 'now_showing'),
(3, 'Mai', 'Tâm lý, Tình cảm', 'Trấn Thành', 'Phương Anh Đào, Tuấn Trần, Trấn Thành, Hồng Đào', 131, '2026-02-10', '2026-04-30', 'T18', 'Tiếng Việt', '2D Digital', 'Mai là một người phụ nữ làm nghề massage đối mặt với những định kiến xã hội và tìm kiếm hạnh phúc đích thực bên chàng nhạc công trẻ Dương.', 'https://image.tmdb.org/t/p/w780/uFsn8qBEzbeJCqH0LsViwPom5ww.jpg', 'https://www.youtube.com/watch?v=0h6Qz0k0Q_0', 'now_showing'),
(4, 'Lật Mặt 7: Một Điều Ước', 'Gia đình, Tâm lý, Hài', 'Lý Hải', 'Thanh Hiền, Trương Minh Cường, Đinh Y Nhung, Quách Ngọc Tuyên', 138, '2026-04-26', '2026-06-30', 'K', 'Tiếng Việt', '2D Digital', 'Câu chuyện đầy xúc động về tình mẫu tử của bà Hai 73 tuổi cùng 5 người con đã trưởng thành tỏa đi khắp mọi miền đất nước.', 'https://image.tmdb.org/t/p/w780/1K7pHhCZprfDXB7LkCquIK62yCb.jpg', 'https://www.youtube.com/watch?v=r0X6qZ1_yT0', 'now_showing'),
(5, 'Deadpool & Wolverine', 'Hành động, Hài hước, Siêu anh hùng', 'Shawn Levy', 'Ryan Reynolds, Hugh Jackman, Emma Corrin, Matthew Macfadyen', 127, '2026-07-26', '2026-09-30', 'T18', 'Tiếng Anh - Phụ đề Tiếng Việt', '3D, 4DX, 2D Digital', 'Cặp đôi lầy lội Deadpool và Wolverine cùng hợp sức trong chuyến phiêu lưu đa vũ trụ đầy bùng nổ và hài hước không giới hạn.', 'https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg', 'https://www.youtube.com/watch?v=73_1biulkYk', 'now_showing'),
(6, 'Godzilla x Kong: Đế Chế Mới', 'Hành động, Khoa học viễn tưởng', 'Adam Wingard', 'Rebecca Hall, Brian Tyree Henry, Dan Stevens, Kaylee Hottle', 115, '2026-03-29', '2026-05-20', 'T13', 'Tiếng Anh - Phụ đề Tiếng Việt', '3D, 4DX, IMAX 2D', 'Hai quái thú khổng lồ Godzilla và Kong phải gạt bỏ hiềm khích để cùng chống lại một mối đe dọa tiềm ẩn tại Trái Đất Rỗng.', 'https://image.tmdb.org/t/p/w780/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg', 'https://www.youtube.com/watch?v=lV1OOlGwExM', 'now_showing'),
(7, 'Inside Out 2: Những Mảnh Ghép Cảm Xúc 2', 'Hoạt hình, Gia đình, Hài hước', 'Kelsey Mann', 'Amy Poehler, Maya Hawke, Phyllis Smith, Lewis Black', 96, '2026-06-14', '2026-08-30', 'P', 'Lồng tiếng & Phụ đề Tiếng Việt', '2D Digital, 3D', 'Riley bước vào tuổi dậy thì và trung tâm chỉ huy cảm xúc đón nhận những thành viên mới đầy rắc rối: Lo Âu, Ghen Tị, Xấu Hổ và Chán Nản.', 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg', 'https://www.youtube.com/watch?v=LEjhY15eCx0', 'now_showing'),
(8, 'Kung Fu Panda 4', 'Hoạt hình, Võ thuật, Hài hước', 'Mike Mitchell', 'Jack Black, Awkwafina, Viola Davis, Dustin Hoffman', 94, '2026-03-08', '2026-05-15', 'P', 'Lồng tiếng Tiếng Việt', '2D Digital, 3D', 'Po chuẩn bị trở thành Thủ lĩnh Tinh thần của Thung lũng Bình Yên và phải tìm kiếm một Thần Long Đại Hiệp kế cận trước kẻ thù Tắc Kè Bông.', 'https://image.tmdb.org/t/p/w780/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg', 'https://www.youtube.com/watch?v=_inKs4eeHiI', 'now_showing'),
(9, 'Quật Mộ Trùng Ma (Exhuma)', 'Kinh dị, Bí ẩn, Giật gân', 'Jang Jae-hyun', 'Choi Min-sik, Kim Go-eun, Yoo Hae-jin, Lee Do-hyun', 134, '2026-03-15', '2026-05-10', 'T18', 'Tiếng Hàn - Phụ đề Tiếng Việt', '2D Digital', 'Hai pháp sư, một chuyên gia phong thủy và một nhân viên tang lễ khai quật một ngôi mộ bí ẩn để rồi giải phóng một thực thể tà ác khủng khiếp.', 'https://image.tmdb.org/t/p/w780/tw0i3kkmOTjDjGFZTLHKhoeXVvA.jpg', 'https://www.youtube.com/watch?v=q6D9YVw6x4M', 'now_showing'),
(10, 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô', 'Hoạt hình, Trinh thám, Hành động', 'Chika Nagaoka', 'Minami Takayama, Wakana Yamazaki, Rikiya Koyama, Kappei Yamaguchi', 110, '2026-08-02', '2026-10-15', 'K', 'Lồng tiếng & Phụ đề Tiếng Việt', '2D Digital, IMAX 2D', 'Siêu đạo chích Kid nhắm vào một thanh kiếm Nhật cổ tại Hakodate, dẫn đến cuộc đối đầu nghẹt thở giữa Conan, Heiji và Kid.', 'https://image.tmdb.org/t/p/w780/4TMkOnI6rCYxqD059aeeQSBv5mc.jpg', 'https://www.youtube.com/watch?v=n7z5z_9yq4k', 'now_showing'),
(11, 'Spider-Man: Beyond the Spider-Verse', 'Hoạt hình, Hành động, Đa vũ trụ', 'Joaquim Dos Santos', 'Shameik Moore, Hailee Steinfeld, Oscar Isaac', 140, '2026-11-20', '2027-01-30', 'T13', 'Tiếng Anh - Phụ đề Tiếng Việt', 'IMAX 2D, 3D, 4DX', 'Hồi kết hoành tráng trong hành trình cứu lấy đa vũ trụ và số phận những người thân yêu của người nhện Miles Morales.', 'https://image.tmdb.org/t/p/w780/5cAuJOfd5tuuFBz2yQmBCtVBaj0.jpg', 'https://www.youtube.com/watch?v=shW9i6k8cB0', 'coming_soon'),
(12, 'Avatar: Fire and Ash (Phần 3)', 'Khoa học viễn tưởng, Hành động', 'James Cameron', 'Sam Worthington, Zoe Saldana, Sigourney Weaver', 190, '2026-12-19', '2027-03-31', 'T13', 'Tiếng Anh - Phụ đề Tiếng Việt', 'IMAX 3D, 4DX 3D', 'Cuộc chạm trán giữa gia đình Jake Sully và Bộ tộc Tro Tàn - những người Na vi hung hãn đại diện cho yếu tố lửa trên hành tinh Pandora.', 'https://image.tmdb.org/t/p/w780/cf7hE1ifY4UNbS25tGnaTyyDrI2.jpg', 'https://www.youtube.com/watch?v=d9MyW72ELq0', 'coming_soon'),
(13, 'Furiosa: Câu Chuyện Từ Max Điên', 'Hành động, Hậu tận thế', 'George Miller', 'Anya Taylor-Joy, Chris Hemsworth, Tom Burke', 148, '2026-05-24', '2026-07-30', 'T18', 'Tiếng Anh - Phụ đề Tiếng Việt', 'IMAX 2D, 4DX', 'Hành trình thời trẻ của nữ chiến binh Furiosa khi bị bắt cóc khỏi Vùng Xanh và tìm đường trở về nhà qua Vùng Đất Chết tàn khốc.', 'https://image.tmdb.org/t/p/w780/iADOJ8Zymht2JPMoy3R7xceZprc.jpg', 'https://www.youtube.com/watch?v=XJMuhwVlca4', 'coming_soon'),
(14, 'Kẻ Trộm Mặt Trăng 4 (Despicable Me 4)', 'Hoạt hình, Hài hước', 'Chris Renaud', 'Steve Carell, Kristen Wiig, Will Ferrell, Sofia Vergara', 95, '2026-07-05', '2026-09-10', 'P', 'Lồng tiếng Tiếng Việt', '2D Digital, 3D', 'Gia đình Gru chào đón thành viên mới Gru Jr. và đối đầu với kẻ thù Maxime Le Mal vừa trốn thoát khỏi nhà tù siêu cấp.', 'https://image.tmdb.org/t/p/w780/lWVwWRLqpS1OaNg7KT0ZecSW0PK.jpg', 'https://www.youtube.com/watch?v=qQlr9-rF32A', 'now_showing'),
(15, 'Interstellar (Tái Chiếu Kỷ Niệm 10 Năm)', 'Khoa học viễn tưởng, Kịch tính', 'Christopher Nolan', 'Matthew McConaughey, Anne Hathaway, Jessica Chastain', 169, '2026-09-27', '2026-10-30', 'T13', 'Tiếng Anh - Phụ đề Tiếng Việt', 'IMAX 2D 70mm', 'Một nhóm các nhà thám hiểm du hành qua hố sâu không gian để tìm kiếm hành tinh mới có thể duy trì sự sống cho nhân loại.', 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 'https://www.youtube.com/watch?v=zSWdZVtXT7E', 'now_showing'),
(16, 'Transformers One', 'Hoạt hình, Hành động, Viễn tưởng', 'Josh Cooley', 'Chris Hemsworth, Brian Tyree Henry, Scarlett Johansson', 104, '2026-09-20', '2026-11-15', 'K', 'Lồng tiếng & Phụ đề Tiếng Việt', '2D Digital, 3D', 'Câu chuyện chưa kể về nguồn gốc mối quan hệ từ bạn chí cốt thành kẻ thù truyền kiếp giữa Orion Pax (Optimus Prime) và D-16 (Megatron).', 'https://image.tmdb.org/t/p/w780/qbkAqmmEIZfrCO8ZQAuIuVMlWoV.jpg', 'https://www.youtube.com/watch?v=u2NuURum_bE', 'coming_soon');

-- 7. Ghế trong 8 Phòng Chiếu (Tạo mẫu chuẩn cho Phòng 1, 2, 3, 4, 5)
-- Ghế phòng 1 (Standard 6 hàng x 12 ghế = 72 ghế: A-B-C: standard, D-E: vip, F: couple)
INSERT INTO `seats` (`room_id`, `row_number`, `seat_number`, `seat_type`, `status`) VALUES
-- Hàng A
(1, 'A', 1, 'standard', 'active'), (1, 'A', 2, 'standard', 'active'), (1, 'A', 3, 'standard', 'active'), (1, 'A', 4, 'standard', 'active'),
(1, 'A', 5, 'standard', 'active'), (1, 'A', 6, 'standard', 'active'), (1, 'A', 7, 'standard', 'active'), (1, 'A', 8, 'standard', 'active'),
(1, 'A', 9, 'standard', 'active'), (1, 'A', 10, 'standard', 'active'), (1, 'A', 11, 'standard', 'active'), (1, 'A', 12, 'standard', 'active'),
-- Hàng B
(1, 'B', 1, 'standard', 'active'), (1, 'B', 2, 'standard', 'active'), (1, 'B', 3, 'standard', 'active'), (1, 'B', 4, 'standard', 'active'),
(1, 'B', 5, 'standard', 'active'), (1, 'B', 6, 'standard', 'active'), (1, 'B', 7, 'standard', 'active'), (1, 'B', 8, 'standard', 'active'),
(1, 'B', 9, 'standard', 'active'), (1, 'B', 10, 'standard', 'active'), (1, 'B', 11, 'standard', 'active'), (1, 'B', 12, 'standard', 'active'),
-- Hàng C
(1, 'C', 1, 'standard', 'active'), (1, 'C', 2, 'standard', 'active'), (1, 'C', 3, 'standard', 'active'), (1, 'C', 4, 'standard', 'active'),
(1, 'C', 5, 'standard', 'active'), (1, 'C', 6, 'standard', 'active'), (1, 'C', 7, 'standard', 'active'), (1, 'C', 8, 'standard', 'active'),
(1, 'C', 9, 'standard', 'active'), (1, 'C', 10, 'standard', 'active'), (1, 'C', 11, 'standard', 'active'), (1, 'C', 12, 'standard', 'active'),
-- Hàng D (VIP)
(1, 'D', 1, 'vip', 'active'), (1, 'D', 2, 'vip', 'active'), (1, 'D', 3, 'vip', 'active'), (1, 'D', 4, 'vip', 'active'),
(1, 'D', 5, 'vip', 'active'), (1, 'D', 6, 'vip', 'active'), (1, 'D', 7, 'vip', 'active'), (1, 'D', 8, 'vip', 'active'),
(1, 'D', 9, 'vip', 'active'), (1, 'D', 10, 'vip', 'active'), (1, 'D', 11, 'vip', 'active'), (1, 'D', 12, 'vip', 'active'),
-- Hàng E (VIP)
(1, 'E', 1, 'vip', 'active'), (1, 'E', 2, 'vip', 'active'), (1, 'E', 3, 'vip', 'active'), (1, 'E', 4, 'vip', 'active'),
(1, 'E', 5, 'vip', 'active'), (1, 'E', 6, 'vip', 'active'), (1, 'E', 7, 'vip', 'active'), (1, 'E', 8, 'vip', 'active'),
(1, 'E', 9, 'vip', 'active'), (1, 'E', 10, 'vip', 'active'), (1, 'E', 11, 'vip', 'active'), (1, 'E', 12, 'vip', 'active'),
-- Hàng F (Couple đôi)
(1, 'F', 1, 'couple', 'active'), (1, 'F', 2, 'couple', 'active'), (1, 'F', 3, 'couple', 'active'), (1, 'F', 4, 'couple', 'active'),
(1, 'F', 5, 'couple', 'active'), (1, 'F', 6, 'couple', 'active');

-- Ghế phòng 4 (IMAX 8 hàng x 12 ghế = 96 ghế)
INSERT INTO `seats` (`room_id`, `row_number`, `seat_number`, `seat_type`, `status`) VALUES
(4, 'A', 1, 'standard', 'active'), (4, 'A', 2, 'standard', 'active'), (4, 'A', 3, 'standard', 'active'), (4, 'A', 4, 'standard', 'active'),
(4, 'A', 5, 'standard', 'active'), (4, 'A', 6, 'standard', 'active'), (4, 'A', 7, 'standard', 'active'), (4, 'A', 8, 'standard', 'active'),
(4, 'B', 1, 'standard', 'active'), (4, 'B', 2, 'standard', 'active'), (4, 'B', 3, 'standard', 'active'), (4, 'B', 4, 'standard', 'active'),
(4, 'B', 5, 'standard', 'active'), (4, 'B', 6, 'standard', 'active'), (4, 'B', 7, 'standard', 'active'), (4, 'B', 8, 'standard', 'active'),
(4, 'C', 1, 'vip', 'active'), (4, 'C', 2, 'vip', 'active'), (4, 'C', 3, 'vip', 'active'), (4, 'C', 4, 'vip', 'active'),
(4, 'C', 5, 'vip', 'active'), (4, 'C', 6, 'vip', 'active'), (4, 'C', 7, 'vip', 'active'), (4, 'C', 8, 'vip', 'active'),
(4, 'D', 1, 'vip', 'active'), (4, 'D', 2, 'vip', 'active'), (4, 'D', 3, 'vip', 'active'), (4, 'D', 4, 'vip', 'active'),
(4, 'D', 5, 'vip', 'active'), (4, 'D', 6, 'vip', 'active'), (4, 'D', 7, 'vip', 'active'), (4, 'D', 8, 'vip', 'active'),
(4, 'E', 1, 'couple', 'active'), (4, 'E', 2, 'couple', 'active'), (4, 'E', 3, 'couple', 'active'), (4, 'E', 4, 'couple', 'active');

-- 8. Equipment Types (8 loại trang thiết bị rạp phim)
INSERT INTO `equipment_types` (`id`, `name`, `description`) VALUES
(1, 'Máy chiếu (Projector)', 'Máy chiếu kỹ thuật số Laser 4K, IMAX Laser, Barco, Christie'),
(2, 'Hệ thống âm thanh (Sound System)', 'Loa surround, loa subwoofer, bộ giải mã Dolby Atmos, DTS:X, QSC amplifier'),
(3, 'Hệ thống điều hòa (HVAC & AC)', 'Điều hòa trung tâm Chiller, điều hòa biến tần Daikin/Trane làm mát phòng chiếu'),
(4, 'Hệ thống chiếu sáng (Lighting)', 'Đèn dẫn đường bậc thang LED, đèn dimming chiếu sáng khán phòng, đèn exit khẩn cấp'),
(5, 'Màn hình chiếu (Cinema Screen)', 'Màn chiếu bạc Harkness Hall, màn cong IMAX Screen, màn tiêu chuẩn 2D/3D'),
(6, 'Thiết bị hiệu ứng 4DX (4DX Dynamic)', 'Mô-tơ ghế chuyển động đa chiều, quạt gió bão, máy tạo sương khói, vòi phun nước'),
(7, 'Camera an ninh (CCTV Camera)', 'Camera hồng ngoại giám sát an ninh phòng chiếu và hành lang rạp'),
(8, 'Thiết bị mạng & Máy chủ (Server & Network)', 'Máy chủ phát phim DCP Server Dolby ShowVault, Switch mạng quang Cisco');

-- 9. Equipment (52 Thiết bị chi tiết trong rạp)
INSERT INTO `equipment` (`id`, `equipment_type_id`, `room_id`, `name`, `code`, `manufacturer`, `purchase_date`, `warranty_end`, `last_maintenance`, `next_maintenance`, `status`) VALUES
-- Phòng 1
(1, 1, 1, 'Máy chiếu Laser Christie CP4420-RGB 4K', 'EQ-P1-PRJ01', 'Christie Digital (Mỹ)', '2023-01-15', '2028-01-15', '2026-01-10', '2026-07-10', 'good'),
(2, 2, 1, 'Bộ giải mã âm thanh Dolby Atmos CP950', 'EQ-P1-SND01', 'Dolby Laboratories', '2023-01-15', '2028-01-15', '2026-02-12', '2026-08-12', 'good'),
(3, 2, 1, 'Dàn loa Surround JBL 9300 Cinema (x16)', 'EQ-P1-SND02', 'JBL Professional', '2023-01-15', '2027-01-15', '2026-02-12', '2026-08-12', 'good'),
(4, 3, 1, 'Điều hòa trung tâm Daikin VRV X 18HP', 'EQ-P1-AC01', 'Daikin (Nhật Bản)', '2023-02-01', '2027-02-01', '2026-03-01', '2026-06-01', 'good'),
(5, 4, 1, 'Hệ thống đèn LED Dimming DMX512', 'EQ-P1-LGT01', 'Osram', '2023-01-20', '2026-01-20', '2025-12-01', '2026-06-01', 'good'),
(6, 5, 1, 'Màn chiếu bạc Harkness Matt Plus 14m x 7m', 'EQ-P1-SCR01', 'Harkness Screens (Anh)', '2023-01-10', '2030-01-10', '2026-01-15', '2027-01-15', 'good'),
(7, 7, 1, 'Camera giám sát hồng ngoại Hikvision 4MP', 'EQ-P1-CAM01', 'Hikvision', '2023-01-10', '2026-01-10', '2026-01-10', '2026-07-10', 'good'),
(8, 8, 1, 'Máy chủ chiếu phim Dolby Doremi IMB/ShowVault', 'EQ-P1-SRV01', 'Dolby Labs', '2023-01-15', '2028-01-15', '2026-02-20', '2026-08-20', 'good'),

-- Phòng 2
(9, 1, 2, 'Máy chiếu Barco DP4K-23BLP Laser Smart', 'EQ-P2-PRJ01', 'Barco (Bỉ)', '2023-03-10', '2028-03-10', '2026-01-12', '2026-07-12', 'good'),
(10, 2, 2, 'Bộ khuếch đại công suất QSC DPA-4.5Q (x4)', 'EQ-P2-SND01', 'QSC Audio', '2023-03-10', '2027-03-10', '2026-01-12', '2026-07-12', 'good'),
(11, 3, 2, 'Điều hòa trung tâm Trane Concealed 16HP', 'EQ-P2-AC01', 'Trane (Mỹ)', '2023-03-10', '2027-03-10', '2026-02-15', '2026-05-15', 'check_needed'),
(12, 5, 2, 'Màn chiếu siêu sáng Perlux 180 Harkness', 'EQ-P2-SCR01', 'Harkness Screens', '2023-03-10', '2030-03-10', '2025-11-20', '2026-11-20', 'good'),

-- Phòng 3 (VIP)
(13, 1, 3, 'Máy chiếu Christie CP2309-RGB Laser CineLife', 'EQ-P3-PRJ01', 'Christie Digital', '2023-06-01', '2028-06-01', '2026-02-05', '2026-08-05', 'good'),
(14, 2, 3, 'Hệ thống âm thanh Meyer Sound Ultra-X40', 'EQ-P3-SND01', 'Meyer Sound (Mỹ)', '2023-06-01', '2028-06-01', '2026-02-05', '2026-08-05', 'good'),
(15, 3, 3, 'Hệ thống điều hòa lọc khí ion âm Daikin VIP', 'EQ-P3-AC01', 'Daikin', '2023-06-01', '2028-06-01', '2026-03-01', '2026-06-01', 'good'),

-- Phòng 4 (IMAX)
(16, 1, 4, 'Hệ thống máy chiếu kép IMAX Commercial Laser Dual 4K', 'EQ-P4-PRJ01', 'IMAX Corporation', '2023-08-15', '2033-08-15', '2026-03-10', '2026-09-10', 'good'),
(17, 2, 4, 'Hệ thống loa đa kênh IMAX 12-Channel Sound', 'EQ-P4-SND01', 'IMAX Corporation', '2023-08-15', '2033-08-15', '2026-03-10', '2026-09-10', 'good'),
(18, 5, 4, 'Màn chiếu siêu phẳng IMAX Curved Screen 22m x 16m', 'EQ-P4-SCR01', 'IMAX Corp / Harkness', '2023-08-15', '2033-08-15', '2026-01-05', '2027-01-05', 'good'),
(19, 3, 4, 'Hệ thống điều hòa lưu lượng lớn Carrier Chiller 30HP', 'EQ-P4-AC01', 'Carrier', '2023-08-15', '2028-08-15', '2026-02-28', '2026-05-28', 'good'),

-- Phòng 5 (4DX)
(20, 1, 5, 'Máy chiếu Barco DP4K-32B High Contrast Laser', 'EQ-P5-PRJ01', 'Barco', '2023-10-01', '2028-10-01', '2026-02-18', '2026-08-18', 'good'),
(21, 6, 5, 'Bộ điều khiển truyền động ghế 4DX Motion System Master', 'EQ-P5-4DX01', 'CJ 4DPLEX (Hàn Quốc)', '2023-10-01', '2028-10-01', '2026-03-05', '2026-06-05', 'good'),
(22, 6, 5, 'Hệ thống vòi phun hiệu ứng mưa, gió bão và tuyết 4DX', 'EQ-P5-4DX02', 'CJ 4DPLEX', '2023-10-01', '2027-10-01', '2026-03-05', '2026-06-05', 'good'),

-- Phòng 6 (Đang bảo trì)
(23, 1, 6, 'Máy chiếu Barco Alchemy DP2K-15C', 'EQ-P6-PRJ01', 'Barco', '2022-11-20', '2027-11-20', '2026-01-20', '2026-04-20', 'good'),
(24, 2, 6, 'Bộ giải mã xử lý âm thanh Dolby CP850 bị lỗi ngõ ra', 'EQ-P6-SND01', 'Dolby Labs', '2022-11-20', '2027-11-20', '2026-03-12', '2026-03-20', 'repairing'),

-- Phòng 8 (Có sự cố điều hòa)
(25, 3, 8, 'Máy nén dàn lạnh điều hòa Trane Chiller Block B', 'EQ-P8-AC01', 'Trane', '2022-05-15', '2026-05-15', '2025-11-10', '2026-02-10', 'broken');

-- 10. Screening Schedules (Lịch chiếu phong phú cho hôm nay & sắp tới)
-- Giả định thời điểm hiện tại: 2026-09-14
INSERT INTO `screening_schedules` (`id`, `movie_id`, `room_id`, `start_time`, `end_time`, `format`, `ticket_price`, `status`) VALUES
-- Suất 1: Dune 2 tại Phòng 4 (IMAX)
(1, 1, 4, '2026-09-14 14:00:00', '2026-09-14 16:50:00', 'IMAX 2D Phụ đề', 150000.00, 'screening'),
(2, 1, 4, '2026-09-14 18:00:00', '2026-09-14 20:50:00', 'IMAX 2D Phụ đề', 160000.00, 'scheduled'),
(3, 1, 4, '2026-09-14 21:15:00', '2026-09-15 00:05:00', 'IMAX 2D Phụ đề', 160000.00, 'scheduled'),

-- Suất 2: Deadpool & Wolverine tại Phòng 5 (4DX)
(4, 5, 5, '2026-09-14 15:30:00', '2026-09-14 17:40:00', '4DX 3D Phụ đề', 180000.00, 'screening'),
(5, 5, 5, '2026-09-14 19:00:00', '2026-09-14 21:10:00', '4DX 3D Phụ đề', 190000.00, 'scheduled'),

-- Suất 3: Lật Mặt 7 tại Phòng 1 (Standard)
(6, 4, 1, '2026-09-14 15:00:00', '2026-09-14 17:20:00', '2D Tiếng Việt', 90000.00, 'screening'),
(7, 4, 1, '2026-09-14 18:00:00', '2026-09-14 20:20:00', '2D Tiếng Việt', 100000.00, 'scheduled'),
(8, 4, 1, '2026-09-14 20:45:00', '2026-09-14 23:05:00', '2D Tiếng Việt', 100000.00, 'scheduled'),

-- Suất 4: Mai tại Phòng 2 (Standard)
(9, 3, 2, '2026-09-14 16:30:00', '2026-09-14 18:45:00', '2D Tiếng Việt', 95000.00, 'scheduled'),
(10, 3, 2, '2026-09-14 19:30:00', '2026-09-14 21:45:00', '2D Tiếng Việt', 105000.00, 'scheduled'),

-- Suất 5: Oppenheimer tại Phòng 3 (VIP)
(11, 2, 3, '2026-09-14 18:30:00', '2026-09-14 21:30:00', '2D VIP Phụ đề', 140000.00, 'scheduled'),

-- Suất ngày mai: Inside Out 2 & Godzilla x Kong
(12, 7, 1, '2026-09-15 09:30:00', '2026-09-15 11:10:00', '2D Lồng tiếng', 85000.00, 'scheduled'),
(13, 6, 4, '2026-09-15 14:00:00', '2026-09-15 16:00:00', 'IMAX 3D Phụ đề', 160000.00, 'scheduled');

-- 11. Bookings & Booking Seats & Payments & Tickets mẫu
-- Booking 1: Đã thanh toán thành công 2 vé cho Suất 7 (Lật Mặt 7 - Phòng 1, Ghế D5, D6)
INSERT INTO `bookings` (`id`, `customer_id`, `screening_id`, `booking_code`, `booking_time`, `total_amount`, `status`) VALUES
(1, 1, 7, 'BK-20260914-001', '2026-09-14 10:15:00', 220000.00, 'paid'),
(2, 2, 2, 'BK-20260914-002', '2026-09-14 11:30:00', 320000.00, 'paid');

-- Booking Seats (Ghế D5=41, D6=42 phòng 1 đã đặt)
INSERT INTO `booking_seats` (`id`, `booking_id`, `seat_id`, `price`, `status`, `hold_start`, `hold_expire`) VALUES
(1, 1, 41, 110000.00, 'booked', '2026-09-14 10:15:00', '2026-09-14 10:25:00'),
(2, 1, 42, 110000.00, 'booked', '2026-09-14 10:15:00', '2026-09-14 10:25:00'),
(3, 2, 85, 160000.00, 'booked', '2026-09-14 11:30:00', '2026-09-14 11:40:00'),
(4, 2, 86, 160000.00, 'booked', '2026-09-14 11:30:00', '2026-09-14 11:40:00');

-- Payments
INSERT INTO `payments` (`id`, `booking_id`, `payment_method`, `amount`, `transaction_code`, `payment_time`, `status`) VALUES
(1, 1, 'vnpay', 220000.00, 'VNPAY-TX-9847291', '2026-09-14 10:18:22', 'success'),
(2, 2, 'momo', 320000.00, 'MOMO-TX-1182739', '2026-09-14 11:33:45', 'success');

-- Tickets
INSERT INTO `tickets` (`id`, `booking_id`, `customer_id`, `screening_id`, `seat_id`, `ticket_code`, `qr_code`, `status`) VALUES
(1, 1, 1, 7, 41, 'TCK-20260914-7-D5', 'QR_TCK_D5_9847291', 'active'),
(2, 1, 1, 7, 42, 'TCK-20260914-7-D6', 'QR_TCK_D6_9847291', 'active'),
(3, 2, 2, 2, 85, 'TCK-20260914-2-C1', 'QR_TCK_C1_1182739', 'active'),
(4, 2, 2, 2, 86, 'TCK-20260914-2-C2', 'QR_TCK_C2_1182739', 'active');

-- 12. Incidents (Báo cáo sự cố)
INSERT INTO `incidents` (`id`, `code`, `reporter_id`, `room_id`, `equipment_id`, `title`, `description`, `severity`, `status`, `created_at`) VALUES
(1, 'INC-20260914-001', 4, 8, 25, 'Điều hòa phòng 8 bị ngắt block làm lạnh đột ngột', 'Trong ca chiếu sáng nay nhiệt độ phòng tăng lên 29 độ C, khách hàng phàn nàn nóng. Máy nén Chiller Block B báo lỗi quá tải E4.', 'high', 'in_progress', '2026-09-14 09:30:00'),
(2, 'INC-20260913-002', 5, 6, 24, 'Loa Surround vách phải phòng 6 phát tiếng rè ngắt quãng', 'Kênh surround phải bị méo tiếng khi âm lượng phim vượt mức 80dB. Nghi ngờ tụ lọc tín hiệu của amply Dolby CP850 bị lão hóa.', 'medium', 'accepted', '2026-09-13 14:15:00'),
(3, 'INC-20260910-003', 4, 1, 5, 'Đèn bậc thang hàng E phòng 1 bị đứt dải LED', 'Dải LED bậc thang lối đi hàng E bị tắt, gây khó khăn cho khách di chuyển trong bóng tối.', 'low', 'closed', '2026-09-10 08:20:00');

-- 13. Incident Histories (Lịch sử xử lý sự cố)
INSERT INTO `incident_histories` (`id`, `incident_id`, `employee_id`, `action`, `description`, `spare_parts`, `cost`, `created_at`) VALUES
(1, 1, 6, 'Khảo sát và chẩn đoán', 'Kỹ thuật viên Quân đã đến kiểm tra áp suất gas R410A và rơ-le nhiệt, phát hiện tụ khởi động quạt giải nhiệt dàn nóng bị chập.', 'Tụ ngậm 50uF / 450V Daikin', 350000.00, '2026-09-14 10:00:00'),
(2, 2, 7, 'Tiếp nhận sự cố phòng 6', 'Kỹ thuật viên Hùng đo tín hiệu ngõ ra DSP, lên kế hoạch thay thế bo mạch tiền khuếch đại Dolby.', 'Bo DAC Dolby CP850 Refurbished', 2500000.00, '2026-09-13 16:00:00'),
(3, 3, 7, 'Thay thế và hoàn tất', 'Đã thay mới 2 mét dây LED 12V chống nước và kiểm tra lại nguồn ổn áp.', 'Dây LED Silicon 12V Amber 2m', 150000.00, '2026-09-10 11:30:00');

-- 14. Maintenances (Kế hoạch & Nhật ký bảo trì)
INSERT INTO `maintenances` (`id`, `code`, `equipment_id`, `employee_id`, `type`, `description`, `scheduled_date`, `completed_date`, `result`, `cost`, `note`, `status`) VALUES
(1, 'MAINT-202609-001', 1, 6, 'periodic', 'Bảo dưỡng định kỳ máy chiếu Christie Laser 4K Phòng 1: Vệ sinh lưới lọc bụi, đo quang thông Lumen, hiệu chỉnh hội tụ ống kính 3D.', '2026-09-10', '2026-09-10', 'success', 1200000.00, 'Quang thông đạt 98% tiêu chuẩn DCI Cinema', 'completed'),
(2, 'MAINT-202609-002', 16, 6, 'periodic', 'Bảo dưỡng hệ thống làm mát bằng chất lỏng cụm Laser IMAX Phòng 4', '2026-09-20', NULL, 'pending', 4500000.00, 'Cần phối hợp với chuyên gia kỹ thuật hãng IMAX', 'planned'),
(3, 'MAINT-202609-003', 21, 7, 'repair', 'Kiểm tra pít-tông khí nén mô-đun ghế rung 4DX hàng C phòng 5', '2026-09-15', NULL, 'pending', 1800000.00, 'Đã chuẩn bị ron cao su và dầu thủy lực chuyên dụng', 'in_progress');

-- 15. Work Shifts (Phân ca làm việc)
INSERT INTO `work_shifts` (`id`, `employee_id`, `work_date`, `shift_name`, `start_time`, `end_time`, `position`, `room_id`, `status`) VALUES
(1, 4, '2026-09-14', 'morning', '08:00:00', '16:00:00', 'Soát vé & Điều phối', 1, 'completed'),
(2, 5, '2026-09-14', 'afternoon', '15:30:00', '23:30:00', 'Kiểm tra phòng & Hỗ trợ khách', 4, 'checked_in'),
(3, 6, '2026-09-14', 'morning', '08:00:00', '16:00:00', 'Trực Kỹ thuật âm thanh - hình ảnh', NULL, 'completed'),
(4, 7, '2026-09-14', 'afternoon', '15:30:00', '23:30:00', 'Trực Sửa chữa & Xử lý sự cố', NULL, 'checked_in');

-- 16. Assignments (Phân công nhiệm vụ)
INSERT INTO `assignments` (`id`, `employee_id`, `incident_id`, `maintenance_id`, `assigned_at`, `status`) VALUES
(1, 6, 1, NULL, '2026-09-14 09:40:00', 'in_progress'),
(2, 7, 2, NULL, '2026-09-13 14:30:00', 'accepted'),
(3, 7, NULL, 3, '2026-09-14 08:30:00', 'in_progress');

-- 17. Room Inspections & Details (Checklist phòng chiếu)
INSERT INTO `room_inspections` (`id`, `room_id`, `employee_id`, `inspection_date`, `status`, `note`) VALUES
(1, 1, 4, '2026-09-14 08:30:00', 'pass', 'Tất cả 9 hạng mục vận hành đạt chuẩn trước ca chiếu sáng'),
(2, 8, 5, '2026-09-14 09:15:00', 'fail', 'Điều hòa không mát, nhiệt độ phòng quá cao - đã chuyển tạo sự cố INC-20260914-001');

INSERT INTO `inspection_details` (`id`, `inspection_id`, `item_name`, `status`, `note`) VALUES
-- Inspection 1 (Phòng 1 - Đạt)
(1, 1, 'Máy chiếu', 'pass', 'Hình ảnh sắc nét, màu chuẩn DCI'),
(2, 1, 'Âm thanh', 'pass', 'Tất cả loa vòm và sub hoạt động tốt'),
(3, 1, 'Điều hòa', 'pass', 'Nhiệt độ ổn định 22°C'),
(4, 1, 'Đèn', 'pass', 'Đèn dimming và đèn exit hoạt động chuẩn'),
(5, 1, 'Ghế', 'pass', 'Toàn bộ 72 ghế sạch sẽ, đệm đàn hồi tốt'),
(6, 1, 'Màn hình', 'pass', 'Màn chiếu sạch, không rách hay ố vàng'),
(7, 1, 'Cửa thoát hiểm', 'pass', 'Mở êm ái, khóa từ nhạy'),
(8, 1, 'Vệ sinh', 'pass', 'Sàn sạch bóng, không rác thừa'),
(9, 1, 'PCCC', 'pass', 'Bình chữa cháy CO2 và chuông báo đầy đủ áp suất'),
-- Inspection 2 (Phòng 8 - Không đạt điều hòa)
(10, 2, 'Máy chiếu', 'pass', 'Laser Christie hoạt động tốt'),
(11, 2, 'Âm thanh', 'pass', 'Âm lượng chuẩn'),
(12, 2, 'Điều hòa', 'fail', 'Dàn lạnh không phả hơi lạnh, báo lỗi E4'),
(13, 2, 'Đèn', 'pass', 'Bình thường'),
(14, 2, 'Ghế', 'pass', 'Bình thường'),
(15, 2, 'Màn hình', 'pass', 'Bình thường'),
(16, 2, 'Cửa thoát hiểm', 'pass', 'Bình thường'),
(17, 2, 'Vệ sinh', 'pass', 'Bình thường'),
(18, 2, 'PCCC', 'pass', 'Bình thường');

-- 18. Notifications (Thông báo mẫu)
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES
(1, 2, 'Sự cố mới tại Phòng 8', 'Nhân viên Đỗ Tuấn Kiệt vừa báo cáo sự cố điều hòa phòng 8 (Mức độ: Cao). Vui lòng phân công kỹ thuật viên.', 'incident', 0, '2026-09-14 09:30:00'),
(2, 5, 'Phân công xử lý sự cố', 'Quản lý Phạm Minh Đức đã phân công bạn xử lý sự cố INC-20260914-001 (Điều hòa Phòng 8).', 'incident', 0, '2026-09-14 09:40:00'),
(3, 2, 'Cảnh báo hạn bảo trì', 'Hệ thống máy chiếu IMAX Laser Phòng 4 sắp đến kỳ bảo dưỡng chất lỏng (20/09/2026).', 'maintenance', 0, '2026-09-14 08:00:00'),
(4, 7, 'Đặt vé thành công', 'Bạn đã đặt thành công 2 vé xem phim Lật Mặt 7: Một Điều Ước (Ghế D5, D6) suất 18:00 hôm nay.', 'booking', 1, '2026-09-14 10:18:25');

-- --------------------------------------------------------------------
-- 19. BẢNG concession_items (Menu Bắp Nước F&B)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `concession_items`;
CREATE TABLE `concession_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `category` ENUM('popcorn', 'beverage', 'combo', 'hot_food') NOT NULL DEFAULT 'popcorn',
  `price` DECIMAL(12,2) NOT NULL,
  `cost_price` DECIMAL(12,2) DEFAULT 0,
  `image` LONGTEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `description` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 20. BẢNG inventory_ingredients (Kho Nguyên Vật Liệu)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_ingredients`;
CREATE TABLE `inventory_ingredients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `stock_quantity` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `min_threshold` DECIMAL(10,2) NOT NULL DEFAULT 10,
  `cost_per_unit` DECIMAL(12,2) DEFAULT 0,
  `supplier` VARCHAR(150) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 21. BẢNG concession_recipes (Định Lượng BOM)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `concession_recipes`;
CREATE TABLE `concession_recipes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `ingredient_id` INT NOT NULL,
  `quantity_used` DECIMAL(10,3) NOT NULL,
  `note` VARCHAR(100) NULL,
  CONSTRAINT `fk_recipe_item` FOREIGN KEY (`item_id`) REFERENCES `concession_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recipe_ing` FOREIGN KEY (`ingredient_id`) REFERENCES `inventory_ingredients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 22. BẢNG inventory_logs (Nhật Ký Biến Động Kho)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_logs`;
CREATE TABLE `inventory_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ingredient_id` INT NOT NULL,
  `change_type` ENUM('import', 'usage', 'waste') NOT NULL DEFAULT 'import',
  `quantity` DECIMAL(10,2) NOT NULL,
  `reason` VARCHAR(255) NULL,
  `employee_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 23. BẢNG shift_handovers (Bàn Giao Ca & Quỹ Tiền Mặt)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `shift_handovers`;
CREATE TABLE `shift_handovers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `work_shift_id` INT NOT NULL,
  `employee_id` INT NOT NULL,
  `manager_id` INT NOT NULL,
  `opening_float` DECIMAL(12,2) NOT NULL,
  `cash_sales` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `card_sales` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `qr_sales` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `actual_cash_counted` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `variance` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `cash_dropped_to_safe` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `next_shift_float` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `status` ENUM('pending_review', 'approved') NOT NULL DEFAULT 'pending_review',
  `notes` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 24. BẢNG kdm_licenses (Khóa Bản Quyền KDM)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `kdm_licenses`;
CREATE TABLE `kdm_licenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `movie_id` INT NOT NULL,
  `movie_name` VARCHAR(255) NOT NULL,
  `room_id` INT NOT NULL,
  `room_name` VARCHAR(100) NOT NULL,
  `server_serial` VARCHAR(100) NOT NULL,
  `valid_from` DATETIME NOT NULL,
  `valid_until` DATETIME NOT NULL,
  `status` ENUM('active', 'expiring_soon', 'expired') DEFAULT 'active',
  `key_file` VARCHAR(255) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 25. BẢNG projector_lamp_logs (Tuổi Thọ Bóng Đèn Máy Chiếu)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `projector_lamp_logs`;
CREATE TABLE `projector_lamp_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL,
  `room_name` VARCHAR(100) NOT NULL,
  `projector_model` VARCHAR(100) NOT NULL,
  `lamp_type` VARCHAR(100) NOT NULL,
  `hours_used` INT NOT NULL DEFAULT 0,
  `max_hours_recommended` INT NOT NULL DEFAULT 2000,
  `health_percentage` DECIMAL(5,2) DEFAULT 100.0,
  `temperature_celsius` DECIMAL(5,2) DEFAULT 22.0,
  `status` ENUM('good', 'warning', 'critical') DEFAULT 'good',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 26. BẢNG turnaround_checklists (Checklist Vệ Sinh Khán Phòng)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `turnaround_checklists`;
CREATE TABLE `turnaround_checklists` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL,
  `room_id` INT NOT NULL,
  `room_name` VARCHAR(100) NOT NULL,
  `cleaned_by_name` VARCHAR(150) NOT NULL,
  `target_minutes` INT NOT NULL DEFAULT 15,
  `actual_minutes` INT NOT NULL DEFAULT 10,
  `seats_checked` TINYINT(1) DEFAULT 1,
  `trash_cleared` TINYINT(1) DEFAULT 1,
  `spilled_liquid_cleaned` TINYINT(1) DEFAULT 1,
  `screen_undamaged` TINYINT(1) DEFAULT 1,
  `aircon_normal` TINYINT(1) DEFAULT 1,
  `status` ENUM('ready', 'needs_attention') DEFAULT 'ready',
  `verified_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- KẾT THÚC FILE SQL CINEMA_MANAGEMENT.SQL
-- ====================================================================
