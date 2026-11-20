/**
 * NIGHT MOVIE – Giai đoạn 2.3: Kiểm thử chuyên sâu 3 lỗ hổng Auth trong chế độ RAM cô lập
 * (Đảm bảo KHÔNG ghi/sửa bất kỳ dữ liệu thật nào trên Supabase Production)
 */
const http = require('http');

const BASE_URL = 'http://127.0.0.1:5050/api';

function request(pathUrl, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + pathUrl);
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = {};
          try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = { raw }; }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let passed = 0;
let failed = 0;
function assert(cond, label, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✔ PASS: ${label}${detail ? ' — ' + detail : ''}`);
  } else {
    failed++;
    console.error(`  ✘ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
  }
}

async function run() {
  console.log('================================================================');
  console.log('  PHASE 2.3 – AUTH SECURITY HARDENING SUITE (ISOLATED RAM MODE)');
  console.log('================================================================\n');

  // 1. Đăng ký tài khoản mới với mật khẩu riêng mạnh (khác password123 & admin123)
  const customPass = 'MyRealStrongPass!2026';
  const reg = await request('/auth/register', 'POST', {
    username: 'sec_cust_a',
    password: customPass,
    name: 'Khach Bao Mat A',
    email: 'sec.a@nightmovie.test',
    phone: '0901112223',
  });
  assert(reg.status === 201 && Boolean(reg.body?.token), 'Đăng ký tài khoản mới với mật khẩu riêng thành công (201)');

  // 2. Xác minh backdoor password123 & admin123 bị chặn 100% (không bỏ qua bcrypt)
  const badP123 = await request('/auth/login', 'POST', { username: 'sec_cust_a', password: 'password123' });
  assert(badP123.status === 401, 'Đăng nhập tài khoản mới bằng backdoor "password123" bị chặn (401)', `HTTP ${badP123.status}`);

  const badA123 = await request('/auth/login', 'POST', { username: 'sec_cust_a', password: 'admin123' });
  assert(badA123.status === 401, 'Đăng nhập tài khoản mới bằng backdoor "admin123" bị chặn (401)', `HTTP ${badA123.status}`);

  const okReal = await request('/auth/login', 'POST', { username: 'sec_cust_a', password: customPass });
  assert(okReal.status === 200 && Boolean(okReal.body?.token), 'Đăng nhập tài khoản mới bằng mật khẩu thật thành công (200)');
  const secAToken = okReal.body.token;

  // 3. Đổi mật khẩu bằng currentPassword = 'password123' / 'admin123' phải bị từ chối
  const badChange1 = await request('/auth/profile', 'PUT', { currentPassword: 'password123', newPassword: 'NewPass!999' }, secAToken);
  assert(badChange1.status === 400, 'Đổi mật khẩu với currentPassword="password123" bị chặn (400)', `HTTP ${badChange1.status}`);

  const badChange2 = await request('/auth/profile', 'PUT', { currentPassword: 'admin123', newPassword: 'NewPass!999' }, secAToken);
  assert(badChange2.status === 400, 'Đổi mật khẩu với currentPassword="admin123" bị chặn (400)', `HTTP ${badChange2.status}`);

  // 4. Forgot-password không thể đổi mật khẩu tài khoản mới hay admin
  const fpRes = await request('/auth/forgot-password', 'POST', { username: 'sec_cust_a', newPassword: 'hacked123' });
  assert(fpRes.status === 501, 'POST /api/auth/forgot-password bị vô hiệu hóa (501)', `HTTP ${fpRes.status}`);
  const stillReal = await request('/auth/login', 'POST', { username: 'sec_cust_a', password: customPass });
  assert(stillReal.status === 200, 'Mật khẩu tài khoản không bị thay đổi sau khi gọi forgot-password (200)');

  // 5. Customer A KHÔNG thể sửa hồ sơ Customer B hoặc nâng role / membership_level / points
  const adminLogin = await request('/auth/login', 'POST', { username: 'admin', password: 'password123' });
  const staffLogin = await request('/auth/login', 'POST', { username: 'staff1', password: 'password123' });
  const managerLogin = await request('/auth/login', 'POST', { username: 'manager1', password: 'password123' });
  const cust1Login = await request('/auth/login', 'POST', { username: 'customer1', password: 'password123' });
  const cust2Login = await request('/auth/login', 'POST', { username: 'customer2', password: 'password123' });

  assert(adminLogin.status === 200 && managerLogin.status === 200 && staffLogin.status === 200 && cust1Login.status === 200 && cust2Login.status === 200, 'Admin, Manager, Staff, Customer1, Customer2 đăng nhập bằng bcrypt thật thành công');

  const adminToken = adminLogin.body.token;
  const custBefore = await request('/customers', 'GET', null, adminToken);
  const cust2Before = (custBefore.body?.data || []).find((c) => c.id === cust2Login.body.user.customerId);

  const tamperCust = await request(
    '/auth/profile',
    'PUT',
    {
      id: cust2Login.body.user.customerId,
      userId: cust2Login.body.user.id,
      customerId: cust2Login.body.user.customerId,
      name: 'Customer1 Updated Self',
      role: 'admin',
      role_id: 1,
      membership_level: 'diamond',
      points: 999999,
    },
    cust1Login.body.token
  );
  assert(tamperCust.status === 200, 'Customer1 gọi PUT /api/auth/profile với trường giả mạo chỉ cập nhật chính mình (200)');

  const custAfter = await request('/customers', 'GET', null, adminToken);
  const cust1After = (custAfter.body?.data || []).find((c) => c.id === cust1Login.body.user.customerId);
  const cust2After = (custAfter.body?.data || []).find((c) => c.id === cust2Login.body.user.customerId);

  assert(Boolean(cust2Before?.name) && cust2After?.name === cust2Before?.name, 'Customer A KHÔNG làm thay đổi hồ sơ Customer B', `cust2.name=${cust2After?.name}`);
  assert(Boolean(cust1After?.membership_level) && cust1After?.membership_level !== 'diamond' && cust1After?.name === 'Customer1 Updated Self', 'Customer A chỉ sửa tên chính mình, KHÔNG thể tự nâng membership_level thành diamond', `name=${cust1After?.name}, level=${cust1After?.membership_level}`);
  assert(tamperCust.body?.user?.role === 'customer', 'Customer A KHÔNG thể tự nâng role thành admin', `role=${tamperCust.body?.user?.role}`);

  // 6. Staff KHÔNG thể sửa hồ sơ nhân viên khác (Admin/Manager) khi truyền employeeId/userId giả
  const empsBefore = await request('/employees', 'GET', null, adminToken);
  const adminEmpBefore = (empsBefore.body?.data || []).find((e) => e.user_id === adminLogin.body.user.id);
  const managerEmpBefore = (empsBefore.body?.data || []).find((e) => e.user_id === managerLogin.body.user.id);

  const tamperStaff = await request(
    '/auth/profile',
    'PUT',
    {
      id: adminEmpBefore?.id,
      userId: adminLogin.body.user.id,
      employeeId: adminEmpBefore?.id,
      name: 'Staff1 Updated Self',
      role: 'admin',
      position: 'CEO',
    },
    staffLogin.body.token
  );
  assert(tamperStaff.status === 200, 'Staff1 cập nhật hồ sơ cá nhân thành công (200)');

  const empsAfter = await request('/employees', 'GET', null, adminToken);
  const adminEmpAfter = (empsAfter.body?.data || []).find((e) => e.user_id === adminLogin.body.user.id);
  const staffEmpAfter = (empsAfter.body?.data || []).find((e) => e.user_id === staffLogin.body.user.id);
  assert(adminEmpAfter?.name === adminEmpBefore?.name, 'Staff1 KHÔNG thể sửa hồ sơ Admin', `admin.name=${adminEmpAfter?.name}`);
  assert(staffEmpAfter?.name === 'Staff1 Updated Self' && staffEmpAfter?.position !== 'CEO', 'Staff1 chỉ sửa được tên mình, KHÔNG thể tự đổi position thành CEO');

  // 7. Manager & Admin cập nhật đúng hồ sơ của mình mà không ảnh hưởng người khác
  const mgrUpdate = await request('/auth/profile', 'PUT', { name: 'Manager1 Self Updated' }, managerLogin.body.token);
  const admUpdate = await request('/auth/profile', 'PUT', { name: 'Admin Self Updated' }, adminToken);
  assert(mgrUpdate.status === 200 && admUpdate.status === 200, 'Manager và Admin cập nhật hồ sơ cá nhân bình thường (200)');
  const empsFinal = await request('/employees', 'GET', null, adminToken);
  const mgrFinal = (empsFinal.body?.data || []).find((e) => e.user_id === managerLogin.body.user.id);
  const admFinal = (empsFinal.body?.data || []).find((e) => e.user_id === adminLogin.body.user.id);
  assert(mgrFinal?.name === 'Manager1 Self Updated' && admFinal?.name === 'Admin Self Updated' && mgrFinal?.id !== admFinal?.id, 'Cập nhật Manager & Admin tách biệt chính xác theo user_id');

  console.log('\n================================================================');
  console.log(`  TỔNG KẾT PHASE 2.3 AUTH HARDENING: ${passed} PASS | ${failed} FAIL`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
