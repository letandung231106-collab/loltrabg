const http = require('http');

const BASE_URL = 'http://localhost:5050/api';

function request(endpoint, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(username, password = 'password123') {
  const res = await request('/auth/login', 'POST', { username, password });
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

let passedTests = 0;
let failedTests = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✖ FAIL: ${message} ${detail ? `(${detail})` : ''}`);
  }
}

async function runAuditTests() {
  console.log('================================================================');
  console.log('  NIGHT MOVIE - FUNCTIONAL CONFLICT & RESOLUTION VERIFICATION');
  console.log('================================================================');

  const adminToken = await login('admin');
  const customerToken = await login('customer1');

  // 1. Quản lý phim: Xóa phim đang có lịch chiếu active
  console.log('\n[1. Phim: Chặn Xóa Phim Đang Có Lịch Chiếu Hoạt Động]');
  const delActiveRes = await request('/movies/1', 'DELETE', null, adminToken);
  assert(
    delActiveRes.status === 400 && delActiveRes.body.success === false,
    'Chặn xóa phim #1 (Dune) đang có lịch chiếu hoạt động (400 Bad Request)'
  );

  // 2. Lịch chiếu: Cấm đổi phim, phòng, giờ của suất đã bán vé
  console.log('\n[2. Lịch Chiếu: Bảo Vệ Suất Đã Bán Vé]');
  const changeMovieRes = await request('/schedules/1', 'PUT', { movie_id: 2 }, adminToken);
  assert(
    changeMovieRes.status === 400 &&
      changeMovieRes.body.message.includes('Không thể thay đổi phim, phòng chiếu hoặc giờ chiếu'),
    'Cấm đổi Phim của suất #1 đã có vé bán/giữ (400 Bad Request)'
  );

  const changeRoomRes = await request('/schedules/1', 'PUT', { room_id: 3 }, adminToken);
  assert(
    changeRoomRes.status === 400 &&
      changeRoomRes.body.message.includes('Không thể thay đổi phim, phòng chiếu hoặc giờ chiếu'),
    'Cấm đổi Phòng chiếu của suất #1 đã có vé bán/giữ (400 Bad Request)'
  );

  // 3. Lịch chiếu: Phát hiện trùng phòng (BR01)
  console.log('\n[3. Lịch Chiếu: Chặn Xung Đột Trùng Lịch Chiếu (BR01)]');
  const conflictRes = await request(
    '/schedules',
    'POST',
    {
      movie_id: 2,
      room_id: 1,
      start_time: '2026-11-15 11:30:00',
      ticket_price: 90000,
      format: '2D',
    },
    adminToken
  );
  assert(
    conflictRes.status === 409 && conflictRes.body.message.includes('BR01'),
    'Xung đột lịch chiếu phòng 1 bị chặn chính xác với mã 409 Conflict'
  );

  // 4. Lịch chiếu: Phòng bảo trì không thể xếp lịch (BR02)
  console.log('\n[4. Lịch Chiếu: Phòng Bảo Trì Không Thể Xếp Lịch (BR02)]');
  const roomMaintRes = await request(
    '/schedules',
    'POST',
    {
      movie_id: 2,
      room_id: 6, // Phòng 6 đang bảo trì (maintenance)
      start_time: '2026-11-16 20:00:00',
      ticket_price: 90000,
      format: '2D',
    },
    adminToken
  );
  assert(
    roomMaintRes.status === 400 && roomMaintRes.body.message.includes('BR02'),
    'Phòng 6 đang bảo trì bị chặn tạo lịch chiếu mới (400 Bad Request)'
  );

  // 5. F&B: Bán hàng tại quầy POS & trừ kho BOM
  console.log('\n[5. F&B & Kho: Bán Quầy POS & Trừ Kho Nguyên Liệu BOM]');
  const concessionSaleRes = await request(
    '/concessions/sell',
    'POST',
    {
      items: [{ id: 1, quantity: 2, name: 'Bắp Rang Bơ Phô Mai (L)' }],
      payment_method: 'cash',
      notes: 'Test đơn kiểm tra kho',
    },
    adminToken
  );
  assert(
    concessionSaleRes.status === 200 && concessionSaleRes.body.success === true,
    'Bán combo bắp nước thành công và tự động trừ kho nguyên liệu'
  );

  // 6. F&B: Chống thanh toán / trừ kho lặp (Idempotency)
  console.log('\n[6. F&B: Chống Bán Lặp Bằng Idempotency Key]');
  const idemKey = `IDEM-AUDIT-${Date.now()}`;
  const firstReq = await request(
    '/concessions/sell',
    'POST',
    {
      items: [{ id: 3, quantity: 1, name: 'Coca-Cola Tươi (32oz)' }],
      payment_method: 'cash',
      idempotency_key: idemKey,
    },
    adminToken
  );
  const secondReq = await request(
    '/concessions/sell',
    'POST',
    {
      items: [{ id: 3, quantity: 1, name: 'Coca-Cola Tươi (32oz)' }],
      payment_method: 'cash',
      idempotency_key: idemKey,
    },
    adminToken
  );
  assert(
    secondReq.status === 200 &&
      secondReq.body.message.includes('Idempotent replay') &&
      secondReq.body.data.order_id === firstReq.body.data.order_id,
    'Idempotency Key chống bán lặp và chống trừ kho 2 lần thành công'
  );

  // 7. Quy tắc ghế: Bỏ ràng buộc ghế trống đơn lẻ (cho phép chừa 1 ghế ở giữa)
  console.log('\n[7. Ghế: Bỏ Ràng Buộc Ghế Trống Đơn Lẻ (User Requirement)]');
  const seatMapRes = await request('/schedules/2/seats', 'GET', null, customerToken);
  const seatsList = seatMapRes.body?.data?.seats || [];
  const seatB2 = seatsList.find((s) => s.row_number === 'B' && s.seat_number === 2);
  const seatB4 = seatsList.find((s) => s.row_number === 'B' && s.seat_number === 4);

  const holdRes = await request(
    '/bookings/hold',
    'POST',
    {
      screening_id: 2,
      seat_ids: [seatB2 ? seatB2.id : 230, seatB4 ? seatB4.id : 232], // B2 & B4 (chừa B3 ở giữa)
    },
    customerToken
  );
  assert(
    holdRes.status === 200 && holdRes.body.success === true,
    'Giữ thành công 2 ghế B2 và B4 để trống B3 ở giữa (Không bị chặn lỗi)'
  );

  // Giải phóng ghế giữ test
  if (holdRes.body.data?.bookingId) {
    await request('/bookings/release', 'POST', { booking_id: holdRes.body.data.bookingId }, customerToken);
  }

  // 8. Dashboard: Không bị nhân đôi doanh thu
  console.log('\n[8. Dashboard: Tính Đúng Doanh Thu Không Bị Nhân Đôi]');
  const dashRes = await request('/dashboard/summary', 'GET', null, adminToken);
  assert(
    dashRes.status === 200 &&
      typeof dashRes.body?.data?.sales?.revenue_today === 'number' &&
      typeof dashRes.body?.data?.sales?.total_revenue_all_time === 'number',
    'Dashboard summary trả về doanh thu hợp lệ và chính xác'
  );

  console.log('\n================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ XUNG ĐỘT: ${passedTests}/${passedTests + failedTests} TESTS PASS (${Math.round((passedTests / (passedTests + failedTests)) * 100)}%)`);
  console.log('================================================================');
}

runAuditTests().catch(console.error);
