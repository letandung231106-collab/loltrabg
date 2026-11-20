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
  console.log('  NIGHT MOVIE - DEEP DATA INTEGRITY & AUDIT TEST SUITE');
  console.log('================================================================');

  const adminToken = await login('admin');
  const staffToken = await login('staff1');
  const customerToken = await login('customer1');

  // ============================================================================
  // PHẦN 1: QUẢN LÝ PHIM (SOFT DELETE & STATUS CONSISTENCY)
  // ============================================================================
  console.log('\n[1. Phim: Soft-delete, Lọc Trạng Thái & Chống Lập Lịch Phim Ngừng Chiếu]');
  // 1.1. Chặn xóa cứng phim đang có lịch chiếu active
  const delActiveRes = await request('/movies/1', 'DELETE', null, adminToken);
  assert(
    delActiveRes.status === 400 && delActiveRes.body.success === false,
    'Phim có lịch chiếu active: Chặn xóa cứng (400 Bad Request)'
  );

  // 1.2. Chuyển phim #4 (Godzilla) sang 'ended' hoặc kiểm tra phim ended
  await request('/movies/4', 'PUT', { status: 'ended' }, adminToken);
  const getEndedMovie = await request('/movies/4', 'GET');
  assert(
    getEndedMovie.status === 200 && getEndedMovie.body.data?.status === 'ended',
    'Phim ngừng chiếu (ended) vẫn tra cứu được chi tiết và lịch sử bình thường'
  );

  // 1.3. Phim ended không xuất hiện trong danh sách now_showing
  const showingMoviesRes = await request('/movies?status=now_showing', 'GET');
  const hasEndedInShowing = (showingMoviesRes.body.data || []).some((m) => m.id === 4);
  assert(
    !hasEndedInShowing,
    'Phim ngừng chiếu (ended) KHÔNG xuất hiện trong danh sách phim đang chiếu (now_showing)'
  );

  // 1.4. Cấm lập lịch chiếu cho phim đã ngừng chiếu (ended)
  const scheduleEndedRes = await request(
    '/schedules',
    'POST',
    {
      movie_id: 4,
      room_id: 1,
      start_time: '2026-11-20 18:00:00',
      ticket_price: 90000,
    },
    adminToken
  );
  assert(
    scheduleEndedRes.status === 400 && scheduleEndedRes.body.message.includes('NGỪNG CHIẾU'),
    'Cấm tạo lịch chiếu mới cho phim đang ở trạng thái NGỪNG CHIẾU (400 Bad Request)'
  );

  // Phục hồi lại phim #4 sang now_showing để không ảnh hưởng dữ liệu khác
  await request('/movies/4', 'PUT', { status: 'now_showing' }, adminToken);

  // ============================================================================
  // PHẦN 2: LỊCH CHIẾU & VÉ ĐÃ BÁN (SCHEDULES & TICKETS INTEGRITY)
  // ============================================================================
  console.log('\n[2. Lịch Chiếu: Quy Tắc Cập Nhật & Hủy Suất Khẩn Cấp]');
  // 2.1. Cấm chỉnh sửa suất chiếu trong quá khứ
  const pastScheduleRes = await request(
    '/schedules/99', // Suất chiếu ngày 2026-11-10
    'PUT',
    { ticket_price: 120000 },
    adminToken
  );
  assert(
    pastScheduleRes.status === 400 && pastScheduleRes.body.message.includes('quá khứ'),
    'Cấm chỉnh sửa suất chiếu đã diễn ra trong quá khứ (400 Bad Request)'
  );

  // 2.2. Cấm đổi phim / phòng / giờ của suất đã bán vé
  const changeMovieRes = await request('/schedules/1', 'PUT', { movie_id: 2 }, adminToken);
  assert(
    changeMovieRes.status === 400 && changeMovieRes.body.message.includes('Không thể thay đổi phim, phòng chiếu hoặc giờ chiếu'),
    'Cấm đổi Phim của suất #1 đã có vé bán/giữ (400 Bad Request)'
  );

  // 2.3. Cấm lập lịch vào thời gian trong quá khứ
  const pastCreateRes = await request(
    '/schedules',
    'POST',
    {
      movie_id: 1,
      room_id: 1,
      start_time: '2020-01-01 10:00:00',
      ticket_price: 90000,
    },
    adminToken
  );
  assert(
    pastCreateRes.status === 400 && pastCreateRes.body.message.includes('quá khứ'),
    'Cấm tạo lịch chiếu có thời gian bắt đầu ở quá khứ (400 Bad Request)'
  );

  // 2.4. Phát hiện trùng phòng (BR01) & Phòng bảo trì (BR02)
  const sched2Res = await request('/schedules/2', 'GET');
  const sched2 = sched2Res.body?.data;
  let conflictStartTime = '2026-11-19 18:30:00';
  if (sched2 && sched2.start_time) {
    const d = new Date(sched2.start_time);
    d.setMinutes(d.getMinutes() + 30);
    const pad = (n) => String(n).padStart(2, '0');
    conflictStartTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  }
  const conflictRes = await request(
    '/schedules',
    'POST',
    {
      movie_id: 1,
      room_id: 4,
      start_time: conflictStartTime, // Trùng suất 2 phòng 4
      ticket_price: 90000,
    },
    adminToken
  );
  assert(conflictRes.status === 409 && conflictRes.body.message.includes('BR01'), 'Chặn trùng lịch chiếu phòng 4 (409 Conflict)');

  const maintRes = await request(
    '/schedules',
    'POST',
    {
      movie_id: 1,
      room_id: 6,
      start_time: '2026-11-20 20:00:00',
      ticket_price: 90000,
    },
    adminToken
  );
  assert(maintRes.status === 400 && maintRes.body.message.includes('BR02'), 'Chặn xếp lịch vào phòng đang bảo trì (400 Bad Request)');

  // 2.5. Hủy lịch chiếu khẩn cấp (Emergency Cancel)
  // Tạo 1 suất demo để test hủy khẩn cấp
  const demoSchedRes = await request(
    '/schedules',
    'POST',
    {
      movie_id: 1,
      room_id: 7,
      start_time: '2026-11-25 19:00:00',
      ticket_price: 95000,
      format: '2D',
    },
    adminToken
  );
  const demoSchedId = demoSchedRes.body?.data?.id;

  if (demoSchedId) {
    // Thử hủy bình thường khi chưa có vé
    const cancelEmptyRes = await request(`/schedules/${demoSchedId}`, 'DELETE', null, adminToken);
    assert(cancelEmptyRes.status === 200, 'Hủy suất chiếu chưa có vé thành công (200 OK)');
  }

  // ============================================================================
  // PHẦN 3: NGHIỆP VỤ HỦY VÉ, THANH TOÁN & DOANH THU DASHBOARD
  // ============================================================================
  console.log('\n[3. Đặt Vé, Hủy Vé, Hoàn Tiền & Doanh Thu]');
  // Tạo 1 đơn hàng mới có 3 vé cho customer1 tại suất chiếu tương lai (suất 2)
  const seatMapRes = await request('/schedules/2/seats', 'GET', null, customerToken);
  const availableSeats = (seatMapRes.body?.data?.seats || []).filter((s) => s.state === 'available');
  const threeSeats = availableSeats.slice(0, 3);

  const hold3Res = await request(
    '/bookings/hold',
    'POST',
    {
      screening_id: 2,
      seat_ids: threeSeats.map((s) => s.id),
    },
    customerToken
  );
  assert(hold3Res.status === 200, `Khách hàng giữ thành công 3 ghế cho suất chiếu tương lai`);
  const booking3Id = hold3Res.body?.data?.bookingId;

  // Thanh toán thành công cho đơn 3 vé
  const payRes = await request(
    '/payments/process',
    'POST',
    {
      booking_id: booking3Id,
      payment_method: 'banking',
      transaction_code: `TX-AUDIT-${Date.now()}`,
    },
    customerToken
  );
  const tickets = payRes.body?.data?.tickets || [];
  assert(payRes.status === 200 && tickets.length === 3, 'Thanh toán thành công và sinh đủ 3 vé điện tử');

  const ticket1 = tickets[0];
  const ticket2 = tickets[1];
  const ticket3 = tickets[2];

  // 3.1. Hủy 1 trong 3 vé (Đơn có 3 vé, hủy 1 vé)
  const cancel1Res = await request(`/tickets/${ticket1.id}/cancel`, 'POST', {}, customerToken);
  assert(cancel1Res.status === 200, 'Khách hàng hủy thành công vé thứ nhất');

  // Kiểm tra trạng thái booking sau khi hủy 1 vé: Phải vẫn là 'paid' (vì còn 2 vé active)
  const checkBookingPartial = await request(`/bookings/${booking3Id}`, 'GET', null, customerToken);
  assert(
    checkBookingPartial.body?.data?.status === 'paid',
    'Đơn hàng có 3 vé, hủy 1 vé: Trạng thái đơn vẫn là "paid" (chưa hủy toàn bộ)'
  );

  // 3.2. Không tự động coi hủy vé là hoàn tiền:
  // Payment status vẫn phải là 'success'
  const checkPaymentBeforeRefund = await request(`/bookings/${booking3Id}`, 'GET', null, customerToken);
  assert(
    checkPaymentBeforeRefund.body?.data?.payment?.status === 'success',
    'Hủy vé nhưng CHƯA hoàn tiền: Giao dịch thanh toán vẫn giữ nguyên status "success"'
  );

  // 3.3. Nhân viên hủy vé thay khách hàng (Staff cancel ticket)
  const staffCancelRes = await request(`/tickets/${ticket2.id}/cancel`, 'POST', {}, staffToken);
  assert(staffCancelRes.status === 200, 'Nhân viên (Staff) hủy thành công vé thứ hai thay cho khách hàng');

  // 3.4. Hủy nốt vé thứ 3 (Hủy toàn bộ 3 vé của đơn)
  const cancel3Res = await request(`/tickets/${ticket3.id}/cancel`, 'POST', {}, customerToken);
  assert(cancel3Res.status === 200, 'Hủy thành công vé thứ ba (Toàn bộ 3 vé đã bị hủy)');

  const checkBookingAllCancelled = await request(`/bookings/${booking3Id}`, 'GET', null, customerToken);
  assert(
    checkBookingAllCancelled.body?.data?.status === 'cancelled',
    'Khi toàn bộ vé bị hủy: Đơn đặt vé tự động đồng bộ sang status "cancelled"'
  );

  // 3.5. Kiểm thử Hoàn tiền thất bại (simulate_failure = true)
  const refundFailRes = await request(
    '/payments/refund',
    'POST',
    {
      booking_id: booking3Id,
      reason: 'Khách yêu cầu hoàn tiền',
      simulate_failure: true,
    },
    adminToken
  );
  assert(
    refundFailRes.status === 400 && refundFailRes.body.refundStatus === 'failed',
    'Mô phỏng cổng thanh toán từ chối hoàn tiền: Hệ thống xử lý an toàn, không đổi status'
  );

  // 3.6. Hoàn tiền thành công (Manager/Admin thực hiện hoàn tiền)
  const refundSuccessRes = await request(
    '/payments/refund',
    'POST',
    {
      booking_id: booking3Id,
      reason: 'Khách bận việc đột xuất',
    },
    adminToken
  );
  assert(
    refundSuccessRes.status === 200 && refundSuccessRes.body.refundStatus === 'success',
    'Quản trị viên hoàn tiền thành công: Trạng thái payment chuyển sang "refunded"'
  );

  // 3.7. Callback / Gọi hoàn tiền lặp lại (Idempotency)
  const refundRepeatRes = await request(
    '/payments/refund',
    'POST',
    {
      booking_id: booking3Id,
      reason: 'Khách bận việc đột xuất',
    },
    adminToken
  );
  if (refundRepeatRes.status !== 200 || !refundRepeatRes.body.alreadyRefunded) {
    console.log('DEBUG refundRepeatRes:', JSON.stringify(refundRepeatRes));
  }
  assert(
    refundRepeatRes.status === 200 && refundRepeatRes.body.alreadyRefunded === true,
    'Gọi hoàn tiền lặp lại: Idempotent an toàn, trả về alreadyRefunded mà không trừ tiền 2 lần'
  );

  // 3.8. Dashboard phân biệt Gross Revenue, Refunded Amount & Net Revenue
  const dashboardRes = await request('/dashboard/summary', 'GET', null, adminToken);
  const sales = dashboardRes.body?.data?.sales;
  assert(
    typeof sales?.gross_revenue_today === 'number' &&
      typeof sales?.refunded_amount_today === 'number' &&
      typeof sales?.net_revenue_today === 'number' &&
      sales?.net_revenue_today === sales?.gross_revenue_today - sales?.refunded_amount_today,
    'Dashboard phân biệt chuẩn: Doanh thu thuần = Doanh thu gộp - Tiền hoàn (Net = Gross - Refunded)'
  );

  // ============================================================================
  // PHẦN 4: KHO NGUYÊN LIỆU F&B & TRIGGER LOGS
  // ============================================================================
  console.log('\n[4. F&B POS & Kho Nguyên Liệu]');
  // 4.1. Bán combo có nhiều nguyên liệu (Bắp L: ngô + bơ + phô mai)
  const saleMultiRes = await request(
    '/concessions/sell',
    'POST',
    {
      items: [
        { id: 1, quantity: 1, name: 'Bắp Rang Bơ Phô Mai (L)' }, // tốn ngô, bơ, phô mai
        { id: 3, quantity: 2, name: 'Coca-Cola Tươi (32oz)' }, // tốn siro coca
      ],
      payment_method: 'cash',
      notes: 'Bán nhiều món cùng lúc',
    },
    adminToken
  );
  assert(
    saleMultiRes.status === 200 && saleMultiRes.body.success === true,
    'Bán combo nhiều nguyên liệu và nước ngọt thành công'
  );

  // 4.2. Từ chối bán vượt số lượng tồn kho (Chặn tồn kho âm)
  const overStockRes = await request(
    '/concessions/sell',
    'POST',
    {
      items: [{ id: 1, quantity: 9999, name: 'Bắp Rang Bơ Phô Mai (L)' }],
      payment_method: 'cash',
    },
    adminToken
  );
  assert(
    overStockRes.status === 400 && overStockRes.body.message.includes('Kho không đủ nguyên liệu'),
    'Từ chối an toàn khi bán vượt tồn kho (Không che giấu lỗi, không cho tồn kho âm)'
  );

  console.log('\n================================================================');
  console.log(`  TỔNG KẾT KIỂM THỬ: ${passedTests}/${passedTests + failedTests} TESTS PASS (${Math.round((passedTests / (passedTests + failedTests)) * 100)}%)`);
  console.log('================================================================');
}

runAuditTests().catch(console.error);
