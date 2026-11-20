-- ==============================================================================
-- Migration 02: Bổ sung cột voucher_code và discount_amount vào bảng bookings (STT 22)
-- LƯU Ý: Vui lòng BACKUP cơ sở dữ liệu MySQL trước khi thực thi migration này!
-- ==============================================================================

SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'bookings' 
    AND COLUMN_NAME = 'voucher_code'
);

SET @stmt = IF(
  @col_exists = 0,
  'ALTER TABLE `bookings` ADD COLUMN `voucher_code` VARCHAR(50) NULL AFTER `total_amount`, ADD COLUMN `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `voucher_code`',
  'SELECT "Column voucher_code already exists"'
);

PREPARE add_voucher_cols FROM @stmt;
EXECUTE add_voucher_cols;
DEALLOCATE PREPARE add_voucher_cols;
