-- ============================================================================
-- NIGHT MOVIE – MIGRATION GIAI ĐOẠN 2.1 (NON-DESTRUCTIVE, ĐÃ PHÊ DUYỆT)
-- Phạm vi:
--   1. Bổ sung cột users.auth_user_id UUID NULL + UNIQUE INDEX (chưa gán UUID)
--   2. Bổ sung index idx_pg_sessions_provider_status trên payment_gateway_sessions
-- KHÔNG bật RLS, KHÔNG sửa/xóa dữ liệu thật, KHÔNG đụng 14 bảng dự án khác.
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id_unique
  ON public.users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pg_sessions_provider_status
  ON public.payment_gateway_sessions (provider, status, created_at DESC);
