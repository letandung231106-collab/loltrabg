-- ============================================================================
-- NIGHT MOVIE – ROW LEVEL SECURITY (RLS) & DATA INTEGRITY PROPOSAL (GIAI ĐOẠN 2)
-- TRẠNG THÁI: ĐỀ XUẤT CHỜ PHÊ DUYỆT (CHƯA THỰC THI LÊN PRODUCTION)
-- LƯU Ý KIẾN TRÚC:
--   1. Express Backend kết nối qua DATABASE_URL với role `postgres` (rolbypassrls = true)
--      -> Bật RLS KHÔNG làm gián đoạn 23 controllers Express hiện tại.
--   2. Bật RLS khóa hoàn toàn truy cập trực tiếp qua Supabase PostgREST (anon / authenticated)
--      để không ai dùng VITE_SUPABASE_ANON_KEY đọc trộm dữ liệu khách hàng khác hoặc bảng nội bộ.
--   3. Tuyệt đối KHÔNG dùng email/ID do client tự gửi làm căn cứ phân quyền; chỉ dùng auth.uid().
-- ============================================================================

BEGIN;

-- 1. Chuẩn bị cột liên kết Supabase Auth UUID (không phá hủy dữ liệu cũ, sẵn sàng cho Giai đoạn 3)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Bổ sung index hiệu năng cho bảng payment_gateway_sessions (Step 2.1)
CREATE INDEX IF NOT EXISTS idx_pg_sessions_provider_status
  ON public.payment_gateway_sessions (provider, status, created_at DESC);

-- 2. Các hàm helper SECURITY DEFINER tra cứu danh tính & vai trò từ auth.uid()
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(r.name)
  FROM public.users u
  JOIN public.roles r ON r.id = u.role_id
  WHERE u.auth_user_id = auth.uid()
    AND u.status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.customers c
  JOIN public.users u ON u.id = c.user_id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- 3. Bật RLS trên toàn bộ 35 bảng NIGHT MOVIE (không đụng 14 bảng của dự án khác)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_concessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concession_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concession_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concession_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concession_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kdm_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projector_lamp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnaround_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateway_sessions ENABLE ROW LEVEL SECURITY;

-- 4. NHÓM A: DANH MỤC CÔNG KHAI (CHỈ ĐỌC CHO ANON/AUTHENTICATED, GHI CHỈ ADMIN/MANAGER)
CREATE POLICY movies_public_read ON public.movies FOR SELECT USING (true);
CREATE POLICY movies_admin_write ON public.movies FOR ALL
  USING (public.current_app_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_app_role() IN ('admin', 'manager'));

CREATE POLICY rooms_public_read ON public.cinema_rooms FOR SELECT USING (true);
CREATE POLICY rooms_admin_write ON public.cinema_rooms FOR ALL
  USING (public.current_app_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_app_role() IN ('admin', 'manager'));

CREATE POLICY seats_public_read ON public.seats FOR SELECT USING (true);
CREATE POLICY seats_admin_write ON public.seats FOR ALL
  USING (public.current_app_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_app_role() IN ('admin', 'manager'));

CREATE POLICY schedules_public_read ON public.screening_schedules FOR SELECT USING (true);
CREATE POLICY schedules_admin_write ON public.screening_schedules FOR ALL
  USING (public.current_app_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_app_role() IN ('admin', 'manager'));

CREATE POLICY concessions_public_read ON public.concession_items FOR SELECT USING (true);
CREATE POLICY concessions_admin_write ON public.concession_items FOR ALL
  USING (public.current_app_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_app_role() IN ('admin', 'manager'));

CREATE POLICY reviews_public_read ON public.movie_reviews FOR SELECT USING (true);
CREATE POLICY reviews_owner_insert ON public.movie_reviews FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());
CREATE POLICY reviews_admin_manage ON public.movie_reviews FOR DELETE
  USING (user_id = public.current_app_user_id() OR public.current_app_role() IN ('admin', 'manager'));

-- 5. NHÓM B: DỮ LIỆU CÁ NHÂN KHÁCH HÀNG (CÁCH LY TUYỆT ĐỐI GIỮA USER A VÀ USER B)
CREATE POLICY users_self_or_admin_read ON public.users FOR SELECT
  USING (id = public.current_app_user_id() OR public.current_app_role() IN ('admin', 'manager'));
CREATE POLICY users_admin_manage ON public.users FOR ALL
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

CREATE POLICY customers_self_read ON public.customers FOR SELECT
  USING (user_id = public.current_app_user_id() OR public.current_app_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY customers_self_update ON public.customers FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());
CREATE POLICY customers_admin_manage ON public.customers FOR ALL
  USING (public.current_app_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_app_role() IN ('admin', 'manager'));

CREATE POLICY bookings_owner_or_ops_read ON public.bookings FOR SELECT
  USING (
    customer_id = public.current_customer_id()
    OR public.current_app_role() IN ('admin', 'manager', 'staff')
  );
CREATE POLICY bookings_admin_manage ON public.bookings FOR ALL
  USING (public.current_app_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_app_role() IN ('admin', 'manager'));

CREATE POLICY booking_seats_owner_or_ops_read ON public.booking_seats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_seats.booking_id
        AND (b.customer_id = public.current_customer_id() OR public.current_app_role() IN ('admin', 'manager', 'staff'))
    )
  );

CREATE POLICY booking_concessions_owner_or_ops_read ON public.booking_concessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_concessions.booking_id
        AND (b.customer_id = public.current_customer_id() OR public.current_app_role() IN ('admin', 'manager', 'staff'))
    )
  );

CREATE POLICY tickets_owner_or_ops_read ON public.tickets FOR SELECT
  USING (
    customer_id = public.current_customer_id()
    OR public.current_app_role() IN ('admin', 'manager', 'staff')
  );

CREATE POLICY payments_owner_or_mgr_read ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND (b.customer_id = public.current_customer_id() OR public.current_app_role() IN ('admin', 'manager'))
    )
  );

CREATE POLICY notifications_self_read ON public.notifications FOR SELECT
  USING (user_id = public.current_app_user_id() OR public.current_app_role() IN ('admin', 'manager'));
CREATE POLICY notifications_self_update ON public.notifications FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

-- 6. NHÓM C: VẬN HÀNH NỘI BỘ & BẢNG NHẠY CẢM (KHÓA TUYỆT ĐỐI KHÁCH HÀNG & ANON)
CREATE POLICY roles_admin_only ON public.roles FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager'));

CREATE POLICY employees_ops_read ON public.employees FOR SELECT
  USING (user_id = public.current_app_user_id() OR public.current_app_role() IN ('admin', 'manager', 'technician'));
CREATE POLICY employees_admin_manage ON public.employees FOR ALL
  USING (public.current_app_role() IN ('admin', 'manager'))
  WITH CHECK (public.current_app_role() IN ('admin', 'manager'));

CREATE POLICY pos_orders_ops_only ON public.concession_orders FOR SELECT
  USING (customer_id = public.current_customer_id() OR public.current_app_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY pos_items_ops_only ON public.concession_order_items FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY inventory_ops_only ON public.inventory_ingredients FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY recipes_ops_only ON public.concession_recipes FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY inventory_logs_ops_only ON public.inventory_logs FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'staff'));

CREATE POLICY tech_equipment_types_ops ON public.equipment_types FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'technician', 'staff'));
CREATE POLICY tech_equipment_ops ON public.equipment FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'technician', 'staff'));
CREATE POLICY tech_incidents_ops ON public.incidents FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'technician', 'staff'));
CREATE POLICY tech_incident_histories_ops ON public.incident_histories FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'technician', 'staff'));
CREATE POLICY tech_maintenances_ops ON public.maintenances FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'technician'));
CREATE POLICY tech_kdm_ops ON public.kdm_licenses FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'technician'));
CREATE POLICY tech_lamps_ops ON public.projector_lamp_logs FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'technician'));

CREATE POLICY ops_inspections ON public.room_inspections FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY ops_inspection_details ON public.inspection_details FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY ops_shifts ON public.work_shifts FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'staff', 'technician'));
CREATE POLICY ops_assignments ON public.assignments FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'technician'));
CREATE POLICY ops_handovers ON public.shift_handovers FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY ops_turnaround ON public.turnaround_checklists FOR SELECT
  USING (public.current_app_role() IN ('admin', 'manager', 'staff'));

-- payment_gateway_sessions: KHÔNG có policy cho anon/authenticated -> CHỈ backend/service_role truy cập!

COMMIT;
