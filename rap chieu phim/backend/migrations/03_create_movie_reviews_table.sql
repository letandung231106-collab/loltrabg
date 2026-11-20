-- ==============================================================================
-- Migration 03: Tạo bảng movie_reviews phục vụ đánh giá & bình luận phim (STT 17)
-- LƯU Ý: Vui lòng BACKUP cơ sở dữ liệu MySQL trước khi thực thi migration này!
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `movie_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `movie_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `rating` TINYINT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT NULL,
  `is_verified_buyer` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reviews_movie` (`movie_id`),
  INDEX `idx_reviews_user` (`user_id`),
  CONSTRAINT `fk_reviews_movies` FOREIGN KEY (`movie_id`) REFERENCES `movies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nạp dữ liệu đánh giá mẫu ban đầu (idempotent: INSERT IGNORE)
INSERT IGNORE INTO `movie_reviews` (`id`, `movie_id`, `user_id`, `user_name`, `rating`, `comment`, `is_verified_buyer`, `created_at`) VALUES
(1, 1, 7, 'Nguyễn Văn An (Diamond VIP)', 5, 'Phim cực đỉnh, âm thanh Dolby Atmos tại rạp đánh thức mọi giác quan! Hình ảnh sa mạc cát choáng ngợp.', 1, '2026-09-14 10:30:00'),
(2, 1, 8, 'Trần Thị Mai', 5, 'Diễn xuất của Timothée và Zendaya quá tuyệt vời. Rạp chiếu ghế ngồi êm ái, bắp phô mai rất ngon.', 0, '2026-09-14 11:15:00'),
(3, 2, 7, 'Nguyễn Văn An (Diamond VIP)', 5, 'Kiệt tác của Christopher Nolan! Phân cảnh thử bom Trinity khiến cả rạp nín thở. Trải nghiệm điện ảnh đỉnh cao.', 0, '2026-09-14 09:00:00'),
(4, 4, 8, 'Trần Thị Mai', 4, 'Phim gia đình rất xúc động và ý nghĩa!', 0, '2026-09-14 08:45:00');

