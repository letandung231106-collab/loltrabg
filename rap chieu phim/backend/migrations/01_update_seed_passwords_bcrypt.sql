-- ==============================================================================
-- Migration 01: Cập nhật hash bcrypt thật cho tài khoản seed demo (STT 02)
-- Mật khẩu mặc định tương ứng của các tài khoản là: 'password123'
-- Hash được sinh bởi bcryptjs cost factor 10
-- ==============================================================================

UPDATE `users`
SET `password` = '$2a$10$40y5qsZxBNRDCnF9ucv3W.CJ7H9ND61dPPmfBlgjebG9jWAVFB/ke'
WHERE `id` IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
