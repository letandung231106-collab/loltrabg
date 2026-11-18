/**
 * NIGHT MOVIE – Giai đoạn 3: Bộ kiểm thử Hybrid Supabase Auth & Google OAuth + Employee Strong Password
 * Chạy cô lập hoàn toàn trong chế độ RAM (KHÔNG ghi/sửa bất kỳ dòng dữ liệu thật nào trên Supabase).
 */
process.env.DATABASE_URL = '';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '33099';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'phase3_oauth_test_secret_key_minimum_32_characters_2026';

const http = require('http');
const app = require('../server');
const db = require('../config/database');
const memory = require('../config/memoryStore');
const {
  getSupabaseServerClient,
  verifySupabaseAccessToken,
  setTokenVerifierForTest,
} = require('../services/supabaseAuthService');

// Bảng giả lập phản hồi từ Supabase Auth getUser(token) cho từng kịch bản kiểm thử
const MOCK_TOKENS = {
  'tok-new-google-user': {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'newgoogle@gmail.com',
    email_confirmed_at: '2026-11-18T10:00:00.000Z',
    app_metadata: { provider: 'google', role: 'admin' }, // Cố tình chèn role=admin để test chống leo thang quyền
    user_metadata: { full_name: 'Google New Customer', email_verified: true, role: 'admin', employeeId: 1 },
  },
  'tok-existing-cust1': {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'khach1@gmail.com', // Sẽ cập nhật khớp email của customer1 trong memoryStore
    email_confirmed_at: '2026-11-18T10:00:00.000Z',
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Customer One Google', email_verified: true },
  },
  'tok-another-uuid-same-cust1-email': {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'khach1@gmail.com',
    email_confirmed_at: '2026-11-18T10:00:00.000Z',
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Attacker Different UUID', email_verified: true },
  },
  'tok-admin-email': {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'admin@cinema.vn',
    email_confirmed_at: '2026-11-18T10:00:00.000Z',
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Admin Google Attempt', email_verified: true },
  },
  'tok-staff-email': {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'staff1@cinema.vn',
    email_confirmed_at: '2026-11-18T10:00:00.000Z',
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Staff Google Account', email_verified: true },
  },
  'tok-unverified-email': {
    id: '66666666-6666-4666-8666-666666666666',
    email: 'unverified@gmail.com',
    email_confirmed_at: null,
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Unverified User', email_verified: false },
  },
  'tok-locked-user': {
    id: '77777777-7777-4777-8777-777777777777',
    email: 'lockedgoogle@gmail.com',
    email_confirmed_at: '2026-11-18T10:00:00.000Z',
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Locked Google User', email_verified: true },
  },
  'tok-staff-email-dup-uuid': {
    id: '22222222-2222-4222-8222-222222222222', // Trùng UUID đã liên kết với customer1
    email: 'staff1@cinema.vn',
    email_confirmed_at: '2026-11-18T10:00:00.000Z',
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Staff Reusing Customer UUID', email_verified: true },
  },
  'tok-staff-second-uuid': {
    id: '88888888-8888-4888-8888-888888888888',
    email: 'staff1@cinema.vn',
    email_confirmed_at: '2026-11-18T10:00:00.000Z',
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Staff Second UUID Overwrite Attempt', email_verified: true },
  },
};

setTokenVerifierForTest(async (token) => {
  if (token === 'tok-supabase-down') {
    const e = new Error('Dịch vụ xác thực Supabase tạm thời không phản hồi. Vui lòng thử lại sau.');
    e.statusCode = 503;
    e.code = 'SUPABASE_AUTH_UNAVAILABLE';
    throw e;
  }
  if (token === 'tok-expired') {
    const e = new Error('JWT expired');
    e.statusCode = 401;
    e.code = 'INVALID_SUPABASE_TOKEN';
    throw e;
  }
  if (!MOCK_TOKENS[token]) {
    const e = new Error('Invalid Supabase access token');
    e.statusCode = 401;
    e.code = 'INVALID_SUPABASE_TOKEN';
    throw e;
  }
  return MOCK_TOKENS[token];
});

async function run() {
  // Đồng bộ email thật từ memoryStore cho kịch bản test (chỉ trong RAM)
  const cust1Row = memory.customers.find((c) => c.user_id === memory.users.find((u) => u.username === 'customer1')?.id);
  const adminEmp = memory.employees.find((e) => e.user_id === memory.users.find((u) => u.username === 'admin')?.id);
  const staffEmp = memory.employees.find((e) => e.user_id === memory.users.find((u) => u.username === 'staff1')?.id);
  if (cust1Row?.email) {
    MOCK_TOKENS['tok-existing-cust1'].email = cust1Row.email;
    MOCK_TOKENS['tok-another-uuid-same-cust1-email'].email = cust1Row.email;
  }
  if (adminEmp?.email) MOCK_TOKENS['tok-admin-email'].email = adminEmp.email;
  if (staffEmp?.email) {
    MOCK_TOKENS['tok-staff-email'].email = staffEmp.email;
    MOCK_TOKENS['tok-staff-email-dup-uuid'].email = staffEmp.email;
    MOCK_TOKENS['tok-staff-second-uuid'].email = staffEmp.email;
  }

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  let passed = 0;
  let failed = 0;
  const assertPass = (cond, label, detail = '') => {
    if (cond) {
      passed++;
      console.log(`  ✔ PASS: ${label}${detail ? ' — ' + detail : ''}`);
    } else {
      failed++;
      console.error(`  ✘ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    }
  };

  const req = async (p, opts = {}) => {
    const r = await fetch(base + p, opts);
    const t = await r.text();
    let json = null;
    try { json = JSON.parse(t); } catch {}
    return { status: r.status, json };
  };

  try {
    console.log('================================================================');
    console.log('  PHASE 3 – SUPABASE AUTH, GOOGLE OAUTH & EMPLOYEE PASSWORD SUITE');
    console.log('================================================================\n');

    // Đăng nhập Admin để test Phần 0
    const admLogin = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    });
    assertPass(admLogin.status === 200 && Boolean(admLogin.json?.token), 'Đăng nhập Admin bằng username/password cũ vẫn hoạt động (200)');
    const adminToken = admLogin.json.token;

    console.log('\n[PHẦN 0. Loại bỏ mật khẩu mặc định password123 khi tạo nhân viên]');
    const empNoPass = await req('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newstaff_nopass', name: 'Staff Khong Pass', role: 'staff' }),
    });
    assertPass(empNoPass.status === 400, 'Từ chối tạo nhân viên khi bỏ trống trường password (400)', `HTTP ${empNoPass.status}`);

    const empWeakPass = await req('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newstaff_weak', password: 'password123', name: 'Staff Weak', role: 'staff' }),
    });
    assertPass(empWeakPass.status === 400, 'Từ chối tạo nhân viên bằng mật khẩu yếu "password123" (400)', `HTTP ${empWeakPass.status}`);

    const empStrong = await req('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newstaff_strong', password: 'StaffStrong2026!', name: 'Staff Manh', email: 'strong@cinema.vn', role: 'staff' }),
    });
    assertPass(empStrong.status === 201, 'Tạo nhân viên với mật khẩu đủ mạnh thành công (201)', `HTTP ${empStrong.status}`);

    const empStrongLogin = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newstaff_strong', password: 'StaffStrong2026!' }),
    });
    assertPass(empStrongLogin.status === 200 && empStrongLogin.json?.user?.role === 'staff', 'Nhân viên mới đăng nhập thành công bằng mật khẩu thật (200)');

    console.log('\n[PHẦN 1-3. Hybrid Supabase Token Exchange & Account Linking]');
    // 1. Google user mới + chống nâng quyền từ Google metadata / req.body
    const gNew = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-new-google-user', 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin', roleId: 1, employeeId: 1 }), // Cố tình truyền role giả
    });
    assertPass(
      gNew.status === 200 && gNew.json?.action === 'created_new_customer' && gNew.json?.user?.role === 'customer' && gNew.json?.user?.roleId === 5 && Boolean(gNew.json?.token),
      'Google user mới tạo tài khoản customer chuẩn (KHÔNG thể leo thang quyền admin)',
      `action=${gNew.json?.action}, role=${gNew.json?.user?.role}, customerId=${gNew.json?.user?.customerId}`
    );

    const gNewDash = await req('/api/dashboard/summary', { headers: { Authorization: `Bearer ${gNew.json.token}` } });
    assertPass(gNewDash.status === 403, 'Google user mới bị chặn truy cập API Admin /api/dashboard/summary (403)', `HTTP ${gNewDash.status}`);

    const gNewMe = await req('/api/auth/me', { headers: { Authorization: `Bearer ${gNew.json.token}` } });
    assertPass(gNewMe.status === 200 && gNewMe.json?.user?.role === 'customer', 'Backend JWT cấp cho Google user hoạt động với /api/auth/me (200)');

    // 2. Google user đã liên kết -> đăng nhập lại không tạo trùng
    const gAgain = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-new-google-user', 'Content-Type': 'application/json' },
    });
    assertPass(
      gAgain.status === 200 && gAgain.json?.action === 'existing_linked' && gAgain.json?.user?.id === gNew.json?.user?.id,
      'Google user đã liên kết đăng nhập lại KHÔNG tạo tài khoản trùng',
      `action=${gAgain.json?.action}, sameId=${gAgain.json?.user?.id === gNew.json?.user?.id}`
    );

    // 3. Customer cũ liên kết thành công (email đã xác minh) & giữ nguyên đăng nhập mật khẩu cũ
    const gCust1 = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-existing-cust1', 'Content-Type': 'application/json' },
    });
    assertPass(
      gCust1.status === 200 && gCust1.json?.action === 'linked_existing_customer' && gCust1.json?.user?.role === 'customer' && gCust1.json?.user?.customerId === cust1Row.id,
      'Customer cũ (customer1) liên kết Google thành công, giữ đúng customerId & role',
      `action=${gCust1.json?.action}, custId=${gCust1.json?.user?.customerId}`
    );

    const cust1OldPass = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'customer1', password: 'password123' }),
    });
    assertPass(cust1OldPass.status === 200, 'Customer cũ sau khi liên kết vẫn đăng nhập bình thường bằng username/password cũ (200)');

    // 4. Không được ghi đè auth_user_id đã tồn tại của customer1
    const gOverwrite = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-another-uuid-same-cust1-email', 'Content-Type': 'application/json' },
    });
    assertPass(gOverwrite.status === 409 && gOverwrite.json?.code === 'ACCOUNT_ALREADY_LINKED', 'Từ chối ghi đè auth_user_id đã tồn tại bằng UUID khác (409)', `HTTP ${gOverwrite.status}`);

    // 5. Admin KHÔNG được auto-link theo email
    const gAdmin = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-admin-email', 'Content-Type': 'application/json' },
    });
    assertPass(gAdmin.status === 403 && gAdmin.json?.code === 'INTERNAL_ACCOUNT_REQUIRES_MANUAL_LINK', 'Admin KHÔNG được auto-link Google theo email (403)', `HTTP ${gAdmin.status}`);

    // 6. Staff KHÔNG được auto-link theo email
    const gStaff = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-staff-email', 'Content-Type': 'application/json' },
    });
    assertPass(gStaff.status === 403 && gStaff.json?.code === 'INTERNAL_ACCOUNT_REQUIRES_MANUAL_LINK', 'Staff KHÔNG được auto-link Google theo email (403)', `HTTP ${gStaff.status}`);

    // 7. Staff liên kết thủ công bằng mật khẩu nội bộ + đối chiếu email + chống ghi đè + chặn UUID trùng
    const noJwtLink = await req('/api/auth/link-supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'password123', accessToken: 'tok-staff-email' }),
    });
    assertPass(noJwtLink.status === 401, 'POST /api/auth/link-supabase không có JWT bị chặn (401)', `HTTP ${noJwtLink.status}`);

    const staffLogin = await req('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'staff1', password: 'password123' }),
    });
    const staffToken = staffLogin.json.token;

    const badLinkPass = await req('/api/auth/link-supabase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'wrong_password', accessToken: 'tok-staff-email' }),
    });
    assertPass(badLinkPass.status === 401, 'Staff liên kết Google sai mật khẩu nội bộ bị chặn (401)', `HTTP ${badLinkPass.status}`);

    const wrongEmailLink = await req('/api/auth/link-supabase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'password123', accessToken: 'tok-existing-cust1' }),
    });
    assertPass(
      wrongEmailLink.status === 403 && wrongEmailLink.json?.code === 'EMAIL_MISMATCH',
      'CHẶN liên kết Google khi email Supabase KHÔNG khớp email tài khoản đang đăng nhập (403)',
      `HTTP ${wrongEmailLink.status} (${wrongEmailLink.json?.code})`
    );

    const dupUuidLink = await req('/api/auth/link-supabase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'password123', accessToken: 'tok-staff-email-dup-uuid' }),
    });
    assertPass(dupUuidLink.status === 409 && dupUuidLink.json?.code === 'AUTH_UUID_ALREADY_LINKED', 'KHÔNG thể liên kết một UUID đã thuộc tài khoản khác (409)', `HTTP ${dupUuidLink.status}`);

    const okLinkStaff = await req('/api/auth/link-supabase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'password123', accessToken: 'tok-staff-email' }),
    });
    assertPass(okLinkStaff.status === 200, 'Staff xác minh mật khẩu nội bộ + khớp email -> liên kết Google thủ công thành công (200)');

    const overwriteStaffLink = await req('/api/auth/link-supabase', {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'password123', accessToken: 'tok-staff-second-uuid' }),
    });
    assertPass(
      overwriteStaffLink.status === 409 && overwriteStaffLink.json?.code === 'ALREADY_LINKED',
      'CHẶN ghi đè auth_user_id đã liên kết qua /api/auth/link-supabase (409)',
      `HTTP ${overwriteStaffLink.status}`
    );

    const gStaffLinked = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-staff-email', 'Content-Type': 'application/json' },
    });
    assertPass(gStaffLinked.status === 200 && gStaffLinked.json?.user?.role === 'staff', 'Staff đã liên kết thủ công đăng nhập Google nhận đúng role=staff từ DB (200)');

    // 12. Xử lý an toàn khi Supabase không phản hồi (503)
    const gSbDown = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-supabase-down', 'Content-Type': 'application/json' },
    });
    assertPass(
      gSbDown.status === 503 && gSbDown.json?.code === 'SUPABASE_AUTH_UNAVAILABLE',
      'Xử lý an toàn khi dịch vụ Supabase Auth không phản hồi (503)',
      `HTTP ${gSbDown.status} (${gSbDown.json?.code})`
    );

    // 8. Email chưa xác minh bị từ chối
    const gUnver = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-unverified-email', 'Content-Type': 'application/json' },
    });
    assertPass(gUnver.status === 403 && gUnver.json?.code === 'EMAIL_NOT_VERIFIED', 'Email chưa xác minh bị từ chối (403)', `HTTP ${gUnver.status}`);

    // 9. Token giả bị từ chối
    const gFake = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer forged.jwt.token.here', 'Content-Type': 'application/json' },
    });
    assertPass(gFake.status === 401, 'Token giả bị từ chối (401)', `HTTP ${gFake.status}`);

    // 10. Token hết hạn bị từ chối
    const gExp = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-expired', 'Content-Type': 'application/json' },
    });
    assertPass(gExp.status === 401, 'Token hết hạn bị từ chối (401)', `HTTP ${gExp.status}`);

    // 11. User bị khóa không được cấp Backend JWT
    const gLockedCreate = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-locked-user', 'Content-Type': 'application/json' },
    });
    await db.query(`UPDATE users SET status = ? WHERE id = ?`, ['locked', gLockedCreate.json.user.id]);
    const gLockedDenied = await req('/api/auth/supabase-exchange', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok-locked-user', 'Content-Type': 'application/json' },
    });
    assertPass(gLockedDenied.status === 403 && gLockedDenied.json?.code === 'ACCOUNT_DISABLED', 'User bị khóa không được cấp Backend JWT (403)', `HTTP ${gLockedDenied.status}`);

    console.log('\n[PHẦN 4. Kiểm thử trực tiếp GoTrueClient trên Node.js v20 (KHÔNG override verifier)]');
    setTokenVerifierForTest(null);

    // Tạo local GoTrue Auth HTTP stub để test thực tế đường dẫn GoTrueClient.getUser(token) trên Node v20
    const fakeAuthServer = http.createServer((reqIn, resIn) => {
      if (reqIn.url && reqIn.url.startsWith('/auth/v1/user')) {
        const auth = String(reqIn.headers.authorization || '');
        if (auth === 'Bearer gotrue-valid-token') {
          resIn.writeHead(200, { 'Content-Type': 'application/json' });
          return resIn.end(JSON.stringify({
            id: '99999999-9999-4999-8999-999999999999',
            email: 'gotrue.verified@gmail.com',
            email_confirmed_at: '2026-11-18T10:00:00.000Z',
            app_metadata: { provider: 'google' },
            user_metadata: { full_name: 'GoTrue Node20 User', email_verified: true },
          }));
        }
        if (auth === 'Bearer gotrue-unverified-token') {
          resIn.writeHead(200, { 'Content-Type': 'application/json' });
          return resIn.end(JSON.stringify({
            id: '99999999-9999-4999-8999-999999999998',
            email: 'gotrue.unverified@gmail.com',
            email_confirmed_at: null,
            app_metadata: { provider: 'google' },
            user_metadata: { full_name: 'GoTrue Unverified', email_verified: false },
          }));
        }
        if (auth === 'Bearer gotrue-banned-token') {
          resIn.writeHead(200, { 'Content-Type': 'application/json' });
          return resIn.end(JSON.stringify({
            id: '99999999-9999-4999-8999-999999999997',
            email: 'gotrue.banned@gmail.com',
            email_confirmed_at: '2026-11-18T10:00:00.000Z',
            banned_until: '2099-01-01T00:00:00.000Z',
            app_metadata: { provider: 'google' },
            user_metadata: { full_name: 'GoTrue Banned', email_verified: true },
          }));
        }
        if (auth === 'Bearer gotrue-503-token') {
          resIn.writeHead(503, { 'Content-Type': 'application/json' });
          return resIn.end(JSON.stringify({ message: 'Service Unavailable' }));
        }
        resIn.writeHead(401, { 'Content-Type': 'application/json' });
        return resIn.end(JSON.stringify({ error: 'invalid_jwt', message: 'invalid JWT: token is expired' }));
      }
      resIn.writeHead(404);
      resIn.end();
    });

    await new Promise((resolve) => fakeAuthServer.listen(0, '127.0.0.1', resolve));
    const stubPort = fakeAuthServer.address().port;
    const prevSbUrl = process.env.SUPABASE_URL;
    const prevSbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      process.env.SUPABASE_URL = `http://127.0.0.1:${stubPort}`;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_local_unit_test_key_only';

      const authClientWrapper = getSupabaseServerClient();
      assertPass(
        Boolean(authClientWrapper && authClientWrapper.auth && typeof authClientWrapper.auth.getUser === 'function' && !authClientWrapper.realtime),
        `Khởi tạo GoTrueClient thành công trên Node.js ${process.version} (không khởi tạo Realtime/WebSocket)`
      );

      const okVerify = await verifySupabaseAccessToken('gotrue-valid-token');
      assertPass(
        okVerify.authUserId === '99999999-9999-4999-8999-999999999999' && okVerify.email === 'gotrue.verified@gmail.com' && okVerify.emailVerified === true,
        'GoTrueClient.getUser(token) xác minh thành công token hợp lệ'
      );

      let expiredCode = null;
      let expiredStatus = null;
      try {
        await verifySupabaseAccessToken('gotrue-expired-or-invalid');
      } catch (e) {
        expiredCode = e.code;
        expiredStatus = e.statusCode;
      }
      assertPass(
        expiredStatus === 401 && expiredCode === 'INVALID_SUPABASE_TOKEN',
        'GoTrueClient.getUser(token) từ chối token không hợp lệ / hết hạn (401)',
        `HTTP ${expiredStatus} (${expiredCode})`
      );

      let unverCode = null;
      let unverStatus = null;
      try {
        await verifySupabaseAccessToken('gotrue-unverified-token');
      } catch (e) {
        unverCode = e.code;
        unverStatus = e.statusCode;
      }
      assertPass(
        unverStatus === 403 && unverCode === 'EMAIL_NOT_VERIFIED',
        'GoTrueClient giữ nguyên kiểm tra email_confirmed_at -> chặn email chưa xác minh (403)',
        `HTTP ${unverStatus} (${unverCode})`
      );

      let bannedCode = null;
      let bannedStatus = null;
      try {
        await verifySupabaseAccessToken('gotrue-banned-token');
      } catch (e) {
        bannedCode = e.code;
        bannedStatus = e.statusCode;
      }
      assertPass(
        bannedStatus === 403 && bannedCode === 'SUPABASE_USER_BANNED',
        'GoTrueClient giữ nguyên kiểm tra banned_until -> chặn tài khoản bị ban (403)',
        `HTTP ${bannedStatus} (${bannedCode})`
      );

      // Test mất kết nối mạng thật (đóng stub server -> ECONNREFUSED)
      await new Promise((resolve) => fakeAuthServer.close(resolve));
      let downCode = null;
      let downStatus = null;
      try {
        await verifySupabaseAccessToken('gotrue-valid-token');
      } catch (e) {
        downCode = e.code;
        downStatus = e.statusCode;
      }
      assertPass(
        downStatus === 503 && downCode === 'SUPABASE_AUTH_UNAVAILABLE',
        'GoTrueClient xử lý an toàn khi Supabase Auth mất kết nối mạng (503)',
        `HTTP ${downStatus} (${downCode})`
      );
    } finally {
      if (prevSbUrl === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = prevSbUrl;
      if (prevSbKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prevSbKey;
      try { fakeAuthServer.close(); } catch {}
    }

    console.log('\n================================================================');
    console.log(`  TỔNG KẾT PHASE 3 OAUTH & PASSWORD SUITE: ${passed} PASS | ${failed} FAIL`);
    console.log('================================================================');
  } finally {
    setTokenVerifierForTest(null);
    server.close(() => process.exit(failed > 0 ? 1 : 0));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
