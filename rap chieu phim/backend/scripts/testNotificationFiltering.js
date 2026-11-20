/**
 * Automated Test Suite: Notification Isolation & Mark as Read Verification
 * Verifies that:
 * 1. Each user (admin, manager1, tech1, customer1) strictly only sees their own notifications.
 * 2. Admin does NOT see notifications belonging to manager1, tech1, or customer1.
 * 3. Mark single notification as read decrements unreadCount.
 * 4. Cross-user isolation: User cannot mark another user's notification as read (IDOR protection).
 * 5. Mark all as read updates all notifications belonging to that user.
 * 6. Read state persists across subsequent queries.
 */

const http = require('http');

const BASE_URL = 'http://localhost:5050/api';

function request(urlPath, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + urlPath);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(username, password = 'password123') {
  const res = await request('/auth/login', 'POST', { username, password });
  if (!res.body?.token) {
    throw new Error(`Đăng nhập thất bại cho user ${username}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✖ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✔ PASS: ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: PHÂN QUYỀN THÔNG BÁO & ĐÁNH DẤU ĐÃ ĐỌC (NOTIFICATIONS)');
  console.log('================================================================\n');

  // 1. Kiểm tra tài khoản admin (user_id = 1)
  console.log('1. [Kiểm Tra Cách Ly Thông Báo Của Admin]');
  const adminToken = await login('admin');
  const adminNotifs = await request('/notifications', 'GET', null, adminToken);
  assert(adminNotifs.status === 200, 'GET /api/notifications trả về HTTP 200 cho Admin');
  const adminItems = adminNotifs.body.data || [];
  assert(
    adminItems.every((n) => n.user_id === 1),
    `Admin chỉ thấy thông báo của chính mình (Hiện có ${adminItems.length} thông báo)`
  );
  assert(
    !adminItems.some((n) => [2, 5, 7].includes(n.user_id)),
    'Admin KHÔNG thấy bất kỳ thông báo nào của manager1 (user 2), tech1 (user 5), customer1 (user 7)'
  );

  // 2. Kiểm tra tài khoản manager1 (user_id = 2)
  console.log('\n2. [Kiểm Tra Thông Báo Của Manager 1]');
  const managerToken = await login('manager1');
  let managerNotifs = await request('/notifications', 'GET', null, managerToken);
  assert(managerNotifs.status === 200, 'GET /api/notifications trả về HTTP 200 cho Manager1');
  let managerItems = managerNotifs.body.data || [];
  assert(
    managerItems.every((n) => n.user_id === 2),
    `Tất cả thông báo của Manager 1 đều có user_id = 2`
  );

  // Nếu manager đang có 0 thông báo chưa đọc (do bài test trước đã đánh dấu tất cả),
  // tạo thêm thông báo mới qua nghiệp vụ báo cáo sự cố để kiểm tra luồng đánh dấu đọc
  if (managerNotifs.body.unreadCount === 0) {
    await request(
      '/incidents',
      'POST',
      {
        room_id: 1,
        title: 'Sự cố thử nghiệm thông báo',
        description: 'Kiểm tra thông báo tự động gửi cho Quản lý',
        severity: 'low',
      },
      adminToken
    );
    managerNotifs = await request('/notifications', 'GET', null, managerToken);
    managerItems = managerNotifs.body.data || [];
  }
  assert(managerNotifs.body.unreadCount > 0, `Manager 1 có ${managerNotifs.body.unreadCount} thông báo chưa đọc`);

  // 3. Kiểm tra tài khoản tech1 (user_id = 5)
  console.log('\n3. [Kiểm Tra Thông Báo Của Technician 1]');
  const techToken = await login('tech1');
  const techNotifs = await request('/notifications', 'GET', null, techToken);
  assert(techNotifs.status === 200, 'GET /api/notifications trả về HTTP 200 cho Tech1');
  const techItems = techNotifs.body.data || [];
  assert(
    techItems.every((n) => n.user_id === 5),
    'Tech 1 chỉ thấy thông báo của mình (user_id = 5)'
  );

  // 4. Kiểm tra tài khoản customer1 (user_id = 7)
  console.log('\n4. [Kiểm Tra Thông Báo Của Customer 1]');
  const customerToken = await login('customer1');
  const customerNotifs = await request('/notifications', 'GET', null, customerToken);
  assert(customerNotifs.status === 200, 'GET /api/notifications trả về HTTP 200 cho Customer1');
  const customerItems = customerNotifs.body.data || [];
  assert(
    customerItems.every((n) => n.user_id === 7),
    'Customer 1 chỉ thấy thông báo đặt vé của mình (user_id = 7)'
  );

  // 5. Kiểm tra Đánh dấu đã đọc từng thông báo & Ngăn chặn can thiệp chéo (Cross-User IDOR)
  console.log('\n5. [Đánh Dấu Đã Đọc Từng Thông Báo & Chặn IDOR]');
  const unreadItem = managerItems.find((n) => !n.is_read) || managerItems[0];
  const initialUnreadCount = managerNotifs.body.unreadCount;

  // Customer 1 cố tình đánh dấu đã đọc thông báo của Manager
  const crossUserRead = await request(`/notifications/${unreadItem.id}/read`, 'PUT', null, customerToken);
  assert(crossUserRead.status === 200, `Gửi yêu cầu đánh dấu đã đọc thông báo #${unreadItem.id} với token Customer 1`);

  // Kiểm tra Manager 1: thông báo vẫn chưa bị đọc lậu
  const managerCheckBefore = await request('/notifications', 'GET', null, managerToken);
  const targetCheck = managerCheckBefore.body.data.find((n) => n.id === unreadItem.id);
  assert(Boolean(targetCheck.is_read) === false, `Chống IDOR: Thông báo #${unreadItem.id} của Manager vẫn chưa đọc sau khi Customer 1 cố can thiệp`);
  assert(managerCheckBefore.body.unreadCount === initialUnreadCount, `Số lượng chưa đọc của Manager vẫn giữ nguyên ${initialUnreadCount}`);

  // Bây giờ chính chủ Manager 1 đánh dấu đã đọc thông báo này
  const validRead = await request(`/notifications/${unreadItem.id}/read`, 'PUT', null, managerToken);
  assert(validRead.status === 200 && validRead.body.success, `Manager 1 đánh dấu đã đọc thông báo #${unreadItem.id} thành công`);

  const managerCheckAfter = await request('/notifications', 'GET', null, managerToken);
  const targetAfter = managerCheckAfter.body.data.find((n) => n.id === unreadItem.id);
  assert(Boolean(targetAfter.is_read) === true, `Thông báo #${unreadItem.id} đã chuyển sang trạng thái đã đọc (is_read = true)`);
  assert(managerCheckAfter.body.unreadCount === initialUnreadCount - 1, `Số lượng chuông thông báo của Manager giảm chính xác xuống còn ${initialUnreadCount - 1}`);

  // 6. Kiểm tra "Đánh dấu đã đọc tất cả" (id = 'all')
  console.log('\n6. [Đánh Dấu Đã Đọc Tất Cả (id = all)]');
  const readAllRes = await request('/notifications/all/read', 'PUT', null, managerToken);
  assert(readAllRes.status === 200 && readAllRes.body.success, 'Manager 1 gửi yêu cầu đánh dấu đã đọc tất cả thành công');

  const managerFinal = await request('/notifications', 'GET', null, managerToken);
  assert(
    managerFinal.body.data.every((n) => Boolean(n.is_read) === true),
    'Tất cả thông báo của Manager 1 đã chuyển thành đã đọc'
  );
  assert(managerFinal.body.unreadCount === 0, 'UnreadCount trên chuông của Manager 1 trở về 0');

  // 7. Kiểm tra trạng thái đã đọc được lưu bền vững khi gọi lại (giả lập tải lại trang)
  console.log('\n7. [Kiểm Tra Bền Vững Trạng Thái (Reload Simulation)]');
  const managerReload = await request('/notifications', 'GET', null, managerToken);
  assert(managerReload.body.unreadCount === 0, 'Tải lại danh sách thông báo: vẫn duy trì 0 chưa đọc');

  console.log('\n================================================================');
  console.log('  KẾT QUẢ: 100% CÁC BÀI TEST THÔNG BÁO ĐÃ VƯỢT QUA XUẤT SẮC!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Lỗi thực thi test:', err);
  process.exit(1);
});
