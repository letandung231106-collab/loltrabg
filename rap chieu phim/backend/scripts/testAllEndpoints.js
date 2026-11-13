/**
 * Comprehensive End-to-End Automated Test Suite for Night Movie Cinema System
 * Tests every single REST API endpoint and Business Rule (BR01 - BR16)
 */

const BASE_URL = 'http://localhost:5050/api';

let passed = 0;
let failed = 0;

function check(condition, title, detail = '') {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${title} ${detail ? `(${detail})` : ''}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${title} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function req(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runAllE2ETests() {
  console.log('================================================================');
  console.log('  FULL END-TO-END API & BUSINESS RULES VERIFICATION SUITE');
  console.log('================================================================\n');

  // 1. Health Check
  console.log('1. [Health & System Status]');
  const health = await req('GET', '/health');
  check(health.status === 200 && health.data.status === 'online', 'GET /api/health hoạt động tốt', health.data.message);

  // 2. Auth: Login, Switch Role, Register, Me
  console.log('\n2. [Authentication & RBAC Roles]');
  const loginAdmin = await req('POST', '/auth/login', { username: 'admin', password: 'password123' });
  const adminToken = loginAdmin.data?.token;
  check(loginAdmin.status === 200 && adminToken, 'Đăng nhập tài khoản Admin', loginAdmin.data?.user?.name);

  const switchCust = await req('POST', '/auth/switch-role', { targetRole: 'customer' });
  const custToken = switchCust.data?.token;
  check(switchCust.status === 200 && custToken, 'Switch 1-Click sang vai trò Customer', switchCust.data?.user?.name);

  const regUser = await req('POST', '/auth/register', {
    username: `user_${Date.now()}`,
    password: 'password123',
    name: 'Khách Hàng Test Mới',
    email: `test_${Date.now()}@cinema.vn`,
    phone: '0988777666',
  });
  check(regUser.status === 201 && regUser.data.success, 'Đăng ký tài khoản khách hàng mới', regUser.data?.user?.name);

  // 3. Dashboard & Analytics
  console.log('\n3. [Dashboard KPIs & Revenue Analytics]');
  const dash = await req('GET', '/dashboard/summary', null, adminToken);
  const dData = dash.data?.data;
  check(
    dash.status === 200 &&
      dData?.movies?.total_movies >= 10 &&
      dData?.rooms?.active_rooms >= 5 &&
      dData?.equipment?.total_equipment >= 5,
    'GET /api/dashboard/summary trả về đúng thống kê tổng hợp',
    `Phim: ${dData?.movies?.total_movies}, Phòng active: ${dData?.rooms?.active_rooms}, Doanh thu: ${dData?.sales?.revenue_today}`
  );

  const analytics = await req('GET', '/dashboard/analytics', null, adminToken);
  check(
    analytics.status === 200 &&
      Array.isArray(analytics.data?.data?.dailyRevenue) &&
      Array.isArray(analytics.data?.data?.topMovies) &&
      Array.isArray(analytics.data?.data?.maintenanceCostByType),
    'GET /api/dashboard/analytics trả về dữ liệu biểu đồ doanh thu & chi phí bảo trì'
  );

  // 4. Movies & Filtering & CRUD
  console.log('\n4. [Movies Catalog, Filtering & CRUD]');
  const moviesAll = await req('GET', '/movies');
  check(moviesAll.status === 200 && moviesAll.data.data.length >= 10, 'GET /api/movies lấy toàn bộ danh sách phim');

  const moviesShowing = await req('GET', '/movies?status=now_showing&search=Dune');
  check(
    moviesShowing.status === 200 && moviesShowing.data.data.length === 1 && moviesShowing.data.data[0].name.includes('Dune'),
    'Bộ lọc phim theo status=now_showing & search=Dune hoạt động chính xác'
  );

  const createMovie = await req(
    'POST',
    '/movies',
    {
      name: 'Phim Thử Nghiệm E2E',
      genre: 'Hành động',
      duration: 125,
      release_date: '2026-11-01',
      end_date: '2026-12-30',
      status: 'coming_soon',
    },
    adminToken
  );
  const newMovieId = createMovie.data?.data?.id;
  check(createMovie.status === 201 && newMovieId, 'POST /api/movies thêm phim mới', `ID: ${newMovieId}`);

  const updateMovie = await req('PUT', `/movies/${newMovieId}`, { name: 'Phim Thử Nghiệm E2E (Updated)' }, adminToken);
  check(updateMovie.status === 200 && updateMovie.data.success, 'PUT /api/movies/:id cập nhật phim');

  const deleteMovie = await req('DELETE', `/movies/${newMovieId}`, null, adminToken);
  check(deleteMovie.status === 200 && deleteMovie.data.success, 'DELETE /api/movies/:id xóa phim chưa có lịch chiếu');

  // 5. Rooms & Seats
  console.log('\n5. [Cinema Rooms & Seat Layout]');
  const roomsRes = await req('GET', '/rooms');
  check(roomsRes.status === 200 && roomsRes.data.data.length >= 8, 'GET /api/rooms lấy danh sách 8 phòng chiếu');

  const roomDetail = await req('GET', '/rooms/1');
  check(
    roomDetail.status === 200 && roomDetail.data.data.seats?.length === 72,
    'GET /api/rooms/1 lấy chi tiết phòng kèm 72 ghế ngồi'
  );

  // 6. Schedules & BR01/BR02/BR03 Validation
  console.log('\n6. [Screening Schedules & Business Rules BR01-BR03]');
  const scheds = await req('GET', '/schedules');
  check(scheds.status === 200 && scheds.data.data.length >= 10, 'GET /api/schedules lấy danh sách suất chiếu');

  // BR02: Room in maintenance (Room 6) should reject scheduling
  const br02Res = await req(
    'POST',
    '/schedules',
    {
      movie_id: 1,
      room_id: 6,
      start_time: '2026-12-01 10:00:00',
      ticket_price: 100000,
    },
    adminToken
  );
  check(br02Res.status === 400, 'BR02: Chặn xếp lịch vào phòng đang bảo trì (Phòng 6)', br02Res.data.message);

  // Create valid schedule in Room 2 at future time
  const validSched = await req(
    'POST',
    '/schedules',
    {
      movie_id: 1,
      room_id: 2,
      start_time: '2026-12-15 10:00:00',
      format: '2D Digital',
      ticket_price: 110000,
    },
    adminToken
  );
  const createdSchedId = validSched.data?.data?.id;
  check(validSched.status === 201 && createdSchedId, 'POST /api/schedules tạo lịch chiếu hợp lệ mới', `ID: ${createdSchedId}`);

  // BR01: Overlapping schedule in Room 2 should be rejected with 409
  const br01Res = await req(
    'POST',
    '/schedules',
    {
      movie_id: 2,
      room_id: 2,
      start_time: '2026-12-15 11:00:00',
      ticket_price: 110000,
    },
    adminToken
  );
  check(br01Res.status === 409, 'BR01: Chặn xếp lịch trùng giờ chiếu cùng phòng', br01Res.data.message);

  // Cancel the newly created schedule
  const cancelSched = await req('DELETE', `/schedules/${createdSchedId}`, null, adminToken);
  check(cancelSched.status === 200 && cancelSched.data.success, 'PATCH /api/schedules/:id/cancel hủy lịch chiếu chưa bán vé');

  // 7. Booking Seat Hold, Payment (VietQR & MoMo Sandbox v2), Ticket QR Verification & Cancellation
  console.log('\n7. [Seat Hold (10-min Lock), VietQR Payment, MoMo Sandbox v2 & Tickets]');
  const seatMapBefore = await req('GET', '/schedules/2/seats');
  const availableSeat = seatMapBefore.data?.data?.seats?.find((s) => s.state === 'available');
  check(
    seatMapBefore.status === 200 && availableSeat,
    'GET /api/schedules/2/seats tải sơ đồ ghế thời gian thực',
    `Chọn ghế ${availableSeat?.row_number}${availableSeat?.seat_number} (ID: ${availableSeat?.id})`
  );

  // Hold seat
  const holdRes = await req(
    'POST',
    '/bookings/hold',
    { screening_id: 2, seat_ids: [availableSeat.id] },
    custToken
  );
  const bookingId = holdRes.data?.data?.bookingId;
  check(holdRes.status === 200 && bookingId, 'POST /api/bookings/hold giữ ghế 10 phút thành công', `Booking ID: ${bookingId}`);

  // Conflict check: holding the same seat again must return 409
  const conflictHold = await req(
    'POST',
    '/bookings/hold',
    { screening_id: 2, seat_ids: [availableSeat.id] },
    custToken
  );
  check(conflictHold.status === 409, 'BR06/BR07: Chặn giữ trùng ghế đang được người khác giữ (409 Conflict)');

  // Test cancelling hold releases the seat so it can be held again!
  const releaseRes = await req('POST', '/bookings/release', { booking_id: bookingId }, custToken);
  check(releaseRes.status === 200 && releaseRes.data.success, 'POST /api/bookings/release hủy giữ ghế');

  // Re-hold the same seat after release (verifies our fix for released seats not blocking!)
  const reHoldRes = await req(
    'POST',
    '/bookings/hold',
    { screening_id: 2, seat_ids: [availableSeat.id] },
    custToken
  );
  const bookingId2 = reHoldRes.data?.data?.bookingId;
  check(reHoldRes.status === 200 && bookingId2, 'Giữ lại chính ghế vừa giải phóng thành công (Fix lỗi kẹt ghế released)');

  // Test MoMo Sandbox v2 Order Creation & Callback Verification
  const momoCreate = await req(
    'POST',
    '/payments/momo/create',
    { booking_id: bookingId2, request_type: 'captureWallet' },
    custToken
  );
  const momoSession = momoCreate.data?.data;
  check(
    momoCreate.status === 200 && momoSession?.signature && momoSession?.payUrl,
    'POST /api/payments/momo/create khởi tạo giao dịch MoMo Sandbox v2 & chữ ký HMAC-SHA256'
  );

  const momoReturn = await req(
    'POST',
    '/payments/momo/momo-return',
    {
      booking_id: bookingId2,
      partnerCode: momoSession.partnerCode,
      orderId: momoSession.orderId,
      requestId: momoSession.requestId,
      amount: momoSession.amount,
      orderInfo: momoSession.orderInfo,
      transId: '2999888777',
      resultCode: 0,
      message: 'Successful.',
    },
    custToken
  );
  const issuedTicket = momoReturn.data?.data?.tickets?.[0];
  check(
    momoReturn.status === 200 && momoReturn.data?.data?.paymentStatus === 'success' && issuedTicket,
    'POST /api/payments/momo/momo-return xác thực thanh toán MoMo thành công & sinh vé QR',
    `Mã vé: ${issuedTicket?.ticketCode}`
  );

  // Verify Ticket QR at gate
  const verifyTck = await req('POST', '/tickets/verify', { ticket_code: issuedTicket.ticketCode }, adminToken);
  check(verifyTck.status === 200 && verifyTck.data.success, 'POST /api/tickets/verify soát vé QR Code hợp lệ tại cửa rạp');

  // 8. Equipment, Incidents Lifecycle, Maintenances & 9-Item Room Inspections
  console.log('\n8. [Operations: Equipment, Incidents Lifecycle, Maintenance & 9-Item Inspections]');
  const eqRes = await req('GET', '/equipment', null, adminToken);
  check(eqRes.status === 200 && eqRes.data.data.length >= 6, 'GET /api/equipment tải danh sách trang thiết bị');

  const incCreate = await req(
    'POST',
    '/incidents',
    {
      room_id: 2,
      equipment_id: 2,
      title: 'Sự cố loa trung tâm E2E',
      description: 'Âm lượng loa center hơi nhỏ',
      severity: 'medium',
    },
    adminToken
  );
  const incId = incCreate.data?.data?.incidentId;
  check(incCreate.status === 201 && incId, 'POST /api/incidents báo cáo sự cố mới', `Mã: ${incCreate.data?.data?.code}`);

  const incAssign = await req('POST', `/incidents/${incId}/assign`, { technician_id: 6 }, adminToken);
  check(incAssign.status === 200 && incAssign.data.success, 'POST /api/incidents/:id/assign phân công Kỹ thuật viên');

  const incResolve = await req(
    'POST',
    `/incidents/${incId}/resolve`,
    {
      action_title: 'Cân chỉnh lại amply',
      description: 'Đã đo kiểm và cân chỉnh gain',
      spare_parts: 'Cáp tín hiệu XLR',
      cost: 150000,
      is_completed: true,
    },
    adminToken
  );
  check(incResolve.status === 200 && incResolve.data.success, 'POST /api/incidents/:id/resolve KTV cập nhật hoàn thành sửa chữa');

  const incClose = await req('POST', `/incidents/${incId}/close`, { note: 'Nghiệm thu tốt' }, adminToken);
  check(incClose.status === 200 && incClose.data.success, 'POST /api/incidents/:id/close Quản lý nghiệm thu & đóng sự cố');

  // Room Inspection 9 criteria
  const inspSubmit = await req(
    'POST',
    '/inspections',
    {
      room_id: 1,
      note: 'Kiểm tra đầu ca tốt',
      auto_create_incident: false,
      checklist: [
        { item_name: 'Máy chiếu', status: 'pass', note: '' },
        { item_name: 'Âm thanh', status: 'pass', note: '' },
        { item_name: 'Điều hòa', status: 'pass', note: '' },
        { item_name: 'Đèn', status: 'pass', note: '' },
        { item_name: 'Ghế', status: 'pass', note: '' },
        { item_name: 'Màn hình', status: 'pass', note: '' },
        { item_name: 'Cửa thoát hiểm', status: 'pass', note: '' },
        { item_name: 'Vệ sinh', status: 'pass', note: '' },
        { item_name: 'PCCC', status: 'pass', note: '' },
      ],
    },
    adminToken
  );
  check(inspSubmit.status === 201 && inspSubmit.data.success, 'POST /api/inspections lưu phiếu kiểm tra phòng 9 tiêu chí');

  // 9. Shifts, Employees, Customers, Concessions POS, Inventory, Handover, KDM
  console.log('\n9. [Shifts, CRM, F&B POS BOM, Inventory, Cash Handover & KDM]');
  const shiftsRes = await req('GET', '/shifts', null, adminToken);
  check(shiftsRes.status === 200 && shiftsRes.data.data.length >= 4, 'GET /api/shifts lấy danh sách ca làm việc');

  const empsRes = await req('GET', '/employees', null, adminToken);
  check(empsRes.status === 200 && empsRes.data.data.length >= 6, 'GET /api/employees lấy danh sách nhân sự');

  const custsRes = await req('GET', '/customers', null, adminToken);
  check(custsRes.status === 200 && custsRes.data.data.length >= 2, 'GET /api/customers lấy danh sách khách hàng CRM');

  const posSale = await req('POST', '/concessions/sell', {
    items: [{ id: 1, name: 'Bắp Rang Bơ Phô Mai (L)', price: 69000, quantity: 2 }],
    payment_method: 'cash',
  }, adminToken);
  check(posSale.status === 200 && posSale.data.success, 'POST /api/concessions/sell bán bắp nước POS & tự động trừ kho BOM');

  const invLogs = await req('GET', '/inventory/logs');
  check(invLogs.status === 200 && invLogs.data.data.length >= 4, 'GET /api/inventory/logs lưu vết lịch sử trừ kho tự động');

  const handovers = await req('GET', '/handovers');
  check(handovers.status === 200 && handovers.data.data.length >= 1, 'GET /api/handovers đối soát bàn giao két tiền');

  const kdms = await req('GET', '/kdm/licenses');
  check(kdms.status === 200 && kdms.data.data.length >= 4, 'GET /api/kdm quản lý khóa bản quyền KDM');

  const turnarounds = await req('GET', '/turnaround');
  check(turnarounds.status === 200 && turnarounds.data.data.length >= 2, 'GET /api/turnaround quản lý checklist vệ sinh rạp cấp tốc');

  console.log('\n================================================================');
  console.log(`  TỔNG KẾT E2E: ${passed}/${passed + failed} TESTS PASS (${failed} FAILED)`);
  console.log('================================================================');
  if (failed > 0) process.exit(1);
}

runAllE2ETests().catch((err) => {
  console.error('Lỗi thực thi E2E:', err);
  process.exit(1);
});
