-- ====================================================================
-- MIGRATION: THÊM BẢNG booking_concessions VÀ CỘT concession_amount
-- DỰ ÁN: NIGHT MOVIE - CINEMA OPERATIONS & BOOKING SYSTEM
-- ====================================================================
-- QUAN TRỌNG: Vui lòng BACKUP toàn bộ cơ sở dữ liệu MySQL trước khi chạy!
-- Migration này chỉ bổ sung cột và bảng mới, TUYỆT ĐỐI KHÔNG xóa dữ liệu cũ.
-- ====================================================================

-- 1. Bổ sung cột concession_amount vào bảng bookings (nếu chưa có)
ALTER TABLE `bookings`
  ADD COLUMN IF NOT EXISTS `concession_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER `total_amount`;

-- 2. Tạo bảng booking_concessions lưu danh sách bắp nước & combo đi kèm đơn vé
CREATE TABLE IF NOT EXISTS `booking_concessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL COMMENT 'Mã đơn đặt vé',
  `concession_item_id` INT NOT NULL COMMENT 'Mã sản phẩm bắp nước/combo',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT 'Số lượng đặt (1 - 20)',
  `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Đơn giá thực tế tại thời điểm mua',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_booking_concessions_booking` (`booking_id`),
  INDEX `idx_booking_concessions_item` (`concession_item_id`),
  CONSTRAINT `fk_booking_concessions_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_concessions_item` FOREIGN KEY (`concession_item_id`) REFERENCES `concession_items` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết bắp nước & combo đặt cùng vé xem phim';
