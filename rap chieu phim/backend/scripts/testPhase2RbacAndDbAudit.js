/**
 * NIGHT MOVIE – Giai đoạn 2.1: Bộ kiểm thử RBAC, Chống IDOR, Khóa 5 Endpoint & Production Guards (Non-Destructive)
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = 'phase2_audit_verification_secret_key_min_32_chars_2026';
}
process.env.VERCEL = '1';

const app = require('../../../api/index.js');
const { isOwnedByCustomer } = require('../utils/ownershipHelper');

async function run() {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  let passed = 0;
  let failed = 0;

  const assertPass = (cond, label, detail = '') => {
    if (cond) {
      passed++;
      console.log(`  ✔ PASS: ${label}${detail ? ' — ' + detail : ''}`);
    } else {
      failed++;
      console.log(`  ✘ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    }
  };

  const req = async (p, opts = {}) => {
    const res = await fetch(base + p, opts);
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, json };
  };

  const loginAs = async (username, password = 'password123') => {
    const r = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return { status: r.status, token: r.json?.token, user: r.json?.user };
  };

  try {
    console.log('================================================================');
    console.log('  PHASE 2.1 – RBAC, IDOR & ENDPOINT HARDENING VERIFICATION SUITE');
    console.log('================================================================\n');

    const health = await req('/api/health');
    assertPass(
      health.status === 200 && health.json?.database === 'connected (Supabase PostgreSQL)',
      'Kết nối Supabase PostgreSQL thật qua api/index.js',
      health.json?.database
    );

    const admin = await loginAs('admin');
    const manager = await loginAs('manager1');
    const staff = await loginAs('staff1');
    const tech = await loginAs('tech1');
    const cust1 = await loginAs('customer1');
    const cust2 = await loginAs('customer2');

    assertPass(admin.status === 200 && admin.user?.role === 'admin', 'Đăng nhập Admin');
    assertPass(manager.status === 200 && manager.user?.role === 'manager', 'Đăng nhập Manager (manager1)');
    assertPass(staff.status === 200 && staff.user?.role === 'staff', 'Đăng nhập Staff (staff1)');
    assertPass(tech.status === 200 && tech.user?.role === 'technician', 'Đăng nhập Technician (tech1)');
    assertPass(cust1.status === 200 && cust1.user?.role === 'customer', 'Đăng nhập Customer A (customer1)', `userId=${cust1.user?.id}, customerId=${cust1.user?.customerId}`);
    assertPass(cust2.status === 200 && cust2.user?.role === 'customer', 'Đăng nhập Customer B (customer2)', `userId=${cust2.user?.id}, customerId=${cust2.user?.customerId}`);

    console.log('\n[1. Anonymous bị chặn (401) tại 5 endpoint đã khóa (+ /kdm/lamps)]');
    for (const [label, method, ep, body] of [
      ['GET /api/handovers', 'GET', '/api/handovers', null],
      ['GET /api/inventory/ingredients', 'GET', '/api/inventory/ingredients', null],
      ['GET /api/inventory/logs', 'GET', '/api/inventory/logs', null],
      ['GET /api/kdm/licenses', 'GET', '/api/kdm/licenses', null],
      ['GET /api/kdm/lamps', 'GET', '/api/kdm/lamps', null],
      ['GET /api/turnaround', 'GET', '/api/turnaround', null],
      ['POST /api/sepay/simulate-payment', 'POST', '/api/sepay/simulate-payment', { orderCode: 'FAKE-1', amount: 1000 }],
    ]) {
      const r = await req(ep, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      assertPass(r.status === 401, `Anonymous bị chặn tại ${label} (401)`, `HTTP ${r.status}`);
    }

    console.log('\n[2. Customer bị chặn (403) tại toàn bộ chức năng nội bộ & quản trị]');
    for (const [label, method, ep, body] of [
      ['GET /api/handovers', 'GET', '/api/handovers', null],
      ['GET /api/inventory/ingredients', 'GET', '/api/inventory/ingredients', null],
      ['GET /api/inventory/logs', 'GET', '/api/inventory/logs', null],
      ['GET /api/kdm/licenses', 'GET', '/api/kdm/licenses', null],
      ['GET /api/kdm/lamps', 'GET', '/api/kdm/lamps', null],
      ['GET /api/turnaround', 'GET', '/api/turnaround', null],
      ['POST /api/sepay/simulate-payment', 'POST', '/api/sepay/simulate-payment', { orderCode: 'FAKE-1', amount: 1000 }],
      ['GET /api/dashboard/summary', 'GET', '/api/dashboard/summary', null],
      ['GET /api/dashboard/analytics', 'GET', '/api/dashboard/analytics', null],
      ['GET /api/customers', 'GET', '/api/customers', null],
      ['GET /api/employees', 'GET', '/api/employees', null],
      ['GET /api/tickets (all)', 'GET', '/api/tickets', null],
      ['POST /api/payments/refund', 'POST', '/api/payments/refund', { booking_id: 1 }],
    ]) {
      const r = await req(ep, {
        method,
        headers: {
          Authorization: `Bearer ${cust1.token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      assertPass(r.status === 403, `Customer bị chặn tại ${label} (403)`, `HTTP ${r.status}`);
    }

    console.log('\n[3. Ma trận phân quyền Staff, Technician, Manager, Admin]');
    for (const [label, token, ep, expectStatus] of [
      ['Staff -> GET /api/handovers (ALLOW)', staff.token, '/api/handovers', 200],
      ['Staff -> GET /api/inventory/ingredients (ALLOW)', staff.token, '/api/inventory/ingredients', 200],
      ['Staff -> GET /api/inventory/logs (ALLOW)', staff.token, '/api/inventory/logs', 200],
      ['Staff -> GET /api/turnaround (ALLOW)', staff.token, '/api/turnaround', 200],
      ['Staff -> GET /api/tickets (ALLOW)', staff.token, '/api/tickets', 200],
      ['Staff -> GET /api/kdm/licenses (DENY)', staff.token, '/api/kdm/licenses', 403],
      ['Staff -> GET /api/dashboard/summary (DENY)', staff.token, '/api/dashboard/summary', 403],
      ['Staff -> GET /api/employees (DENY)', staff.token, '/api/employees', 403],
      ['Tech -> GET /api/kdm/licenses (ALLOW)', tech.token, '/api/kdm/licenses', 200],
      ['Tech -> GET /api/kdm/lamps (ALLOW)', tech.token, '/api/kdm/lamps', 200],
      ['Tech -> GET /api/turnaround (ALLOW)', tech.token, '/api/turnaround', 200],
      ['Tech -> GET /api/handovers (DENY)', tech.token, '/api/handovers', 403],
      ['Tech -> GET /api/inventory/ingredients (DENY)', tech.token, '/api/inventory/ingredients', 403],
      ['Tech -> GET /api/inventory/logs (DENY)', tech.token, '/api/inventory/logs', 403],
      ['Manager -> GET /api/dashboard/analytics (ALLOW)', manager.token, '/api/dashboard/analytics', 200],
      ['Manager -> GET /api/inventory/ingredients (ALLOW)', manager.token, '/api/inventory/ingredients', 200],
      ['Manager -> GET /api/handovers (ALLOW)', manager.token, '/api/handovers', 200],
      ['Manager -> GET /api/kdm/licenses (ALLOW)', manager.token, '/api/kdm/licenses', 200],
      ['Admin -> GET /api/dashboard/analytics (ALLOW)', admin.token, '/api/dashboard/analytics', 200],
      ['Admin -> GET /api/inventory/ingredients (ALLOW)', admin.token, '/api/inventory/ingredients', 200],
      ['Admin -> GET /api/customers (ALLOW)', admin.token, '/api/customers', 200],
      ['Admin -> GET /api/employees (ALLOW)', admin.token, '/api/employees', 200],
    ]) {
      const r = await req(ep, { headers: { Authorization: `Bearer ${token}` } });
      assertPass(r.status === expectStatus, `${label} (${expectStatus})`, `HTTP ${r.status}`);
    }

    console.log('\n[4. Chặn giả lập thanh toán SePay trong Production (kể cả Admin)]');
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const simInProd = await req('/api/sepay/simulate-payment', {
      method: 'POST',
      headers: { Authorization: `Bearer ${admin.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode: 'PROD-TEST-1', amount: 100000 }),
    });
    process.env.NODE_ENV = prevEnv;
    assertPass(simInProd.status === 403, 'POST /api/sepay/simulate-payment bị chặn tuyệt đối khi NODE_ENV=production (403)', `HTTP ${simInProd.status}`);

    console.log('\n[5. Chống IDOR tuyệt đối: Customer A vs Customer B & không so với users.id]');
    // Unit verification: user with users.id=2 & customerId=1 MUST NOT own booking with customer_id=2
    assertPass(isOwnedByCustomer(2, 1) === false, 'ownershipHelper không nhầm lẫn users.id=2 với customers.id=2');
    assertPass(isOwnedByCustomer(1, 1) === true, 'ownershipHelper xác nhận đúng chủ sở hữu customer_id=1');
    assertPass(isOwnedByCustomer(1, null) === false, 'ownershipHelper từ chối khi customer không có hồ sơ (null)');

    const c1Bookings = await req('/api/bookings/my-bookings', { headers: { Authorization: `Bearer ${cust1.token}` } });
    const c2Bookings = await req('/api/bookings/my-bookings', { headers: { Authorization: `Bearer ${cust2.token}` } });
    assertPass(c1Bookings.status === 200 && c2Bookings.status === 200, 'Cả 2 khách hàng đọc được my-bookings của riêng mình');

    const c1BookingId = c1Bookings.json?.data?.[0]?.id;
    const c2BookingId = c2Bookings.json?.data?.[0]?.id;

    if (c1BookingId) {
      const r1 = await req(`/api/bookings/${c1BookingId}?customerId=${cust1.user.customerId}`, {
        headers: { Authorization: `Bearer ${cust2.token}` },
      });
      assertPass(r1.status === 403, `Customer B (kể cả giả mạo query customerId) KHÔNG đọc được booking #${c1BookingId} của Customer A (403)`, `HTTP ${r1.status}`);

      const r2 = await req('/api/payments/momo/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cust2.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: c1BookingId, customerId: cust1.user.customerId, concessions: [{ item_id: 1, quantity: 1 }] }),
      });
      assertPass(r2.status === 403, `Customer B KHÔNG thể khởi tạo MoMo/ghi bắp nước lên booking #${c1BookingId} của Customer A (403)`, `HTTP ${r2.status}`);

      const r3 = await req('/api/payments/process', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cust2.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: c1BookingId, customerId: cust1.user.customerId }),
      });
      assertPass(r3.status === 403, `Customer B KHÔNG thể thanh toán booking #${c1BookingId} của Customer A (403)`, `HTTP ${r3.status}`);

      const r4 = await req('/api/sepay/register-booking-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cust2.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: c1BookingId, bookingCode: 'BK-FAKE', totalAmount: 100000 }),
      });
      assertPass(r4.status === 403, `Customer B KHÔNG thể đăng ký phiên SePay lên booking #${c1BookingId} của Customer A (403)`, `HTTP ${r4.status}`);

      const r5 = await req('/api/bookings/release', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cust2.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: c1BookingId, customerId: cust1.user.customerId }),
      });
      assertPass(r5.status === 404 || r5.status === 403, `Customer B KHÔNG thể hủy giữ ghế booking #${c1BookingId} của Customer A (403/404)`, `HTTP ${r5.status}`);
    }

    if (c2BookingId) {
      const r = await req(`/api/bookings/${c2BookingId}`, { headers: { Authorization: `Bearer ${cust1.token}` } });
      assertPass(r.status === 403, `Customer A KHÔNG đọc được booking #${c2BookingId} của Customer B (403)`, `HTTP ${r.status}`);
    }

    const c1Tickets = await req('/api/tickets/my-tickets', { headers: { Authorization: `Bearer ${cust1.token}` } });
    const c1TicketId = c1Tickets.json?.data?.[0]?.id;
    if (c1TicketId) {
      const rt1 = await req(`/api/tickets/${c1TicketId}`, { headers: { Authorization: `Bearer ${cust2.token}` } });
      assertPass(rt1.status === 403, `Customer B KHÔNG đọc được vé #${c1TicketId} của Customer A (403)`, `HTTP ${rt1.status}`);

      const rt2 = await req(`/api/tickets/${c1TicketId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cust2.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: cust1.user.customerId }),
      });
      assertPass(rt2.status === 403, `Customer B KHÔNG thể hủy vé #${c1TicketId} của Customer A (403)`, `HTTP ${rt2.status}`);
    }

    console.log('\n[6. Chống tự nâng quyền, Backdoor mật khẩu & Forgot-Password]');
    const prevDemo = process.env.ENABLE_DEMO_TOOLS;
    process.env.ENABLE_DEMO_TOOLS = 'false';
    const sw = await req('/api/auth/switch-role', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staff.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole: 'admin' }),
    });
    process.env.ENABLE_DEMO_TOOLS = prevDemo;
    assertPass(sw.status === 403, 'Staff không thể tự nâng quyền qua /api/auth/switch-role (403)', `HTTP ${sw.status}`);

    // Backdoor 'admin123' phải bị từ chối trên tất cả tài khoản (bcrypt thật không khớp admin123)
    for (const u of ['admin', 'manager1', 'staff1', 'tech1', 'customer1']) {
      const rBad = await loginAs(u, 'admin123');
      assertPass(rBad.status === 401, `Backdoor admin123 bị từ chối cho tài khoản ${u} (401)`, `HTTP ${rBad.status}`);
    }

    // Forgot-password phải bị khóa & trả thông báo trung tính giống nhau (không lộ user tồn tại)
    const fpAdmin = await req('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', newPassword: 'hackedpassword' }),
    });
    const fpFake = await req('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'khong_ton_tai_xyz_999', newPassword: 'hackedpassword' }),
    });
    assertPass(
      fpAdmin.status === 501 && fpFake.status === 501 && fpAdmin.json?.message === fpFake.json?.message,
      'POST /api/auth/forgot-password bị vô hiệu hóa & không tiết lộ tài khoản tồn tại (501)',
      `admin=${fpAdmin.status}, fake=${fpFake.status}`
    );

    // Xác minh tài khoản admin vẫn đăng nhập được bằng mật khẩu thật (không bị đổi bởi forgot-password)
    const adminStillOk = await loginAs('admin', 'password123');
    assertPass(adminStillOk.status === 200 && Boolean(adminStillOk.token), 'Tài khoản admin vẫn giữ nguyên mật khẩu gốc & đăng nhập bình thường (200)');

    console.log('\n================================================================');
    console.log(`  TỔNG KẾT PHASE 2.1 VERIFICATION: ${passed} PASS | ${failed} FAIL`);
    console.log('================================================================');
  } finally {
    server.close(() => process.exit(failed > 0 ? 1 : 0));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
