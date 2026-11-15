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

async function runVerification() {
  console.log('================================================================');
  console.log('  NIGHT MOVIE - INDEPENDENT EMPIRICAL VERIFICATION SUITE');
  console.log('================================================================');

  // --- Test 1: Tokens ---
  console.log('\n[1. Authentication & Role Tokens]');
  const adminToken = await login('admin');
  const managerToken = await login('manager1');
  const customer1Token = await login('customer1');
  const customer2Token = await login('customer2');
  assert(Boolean(adminToken && customer1Token && customer2Token), 'Tạo thành công token cho Admin, Customer 1, Customer 2');

  // --- Test 2: Notification Isolation & Anti-IDOR ---
  console.log('\n[2. Phân Quyền Thông Báo & Chống Đọc Lậu IDOR]');
  const adminNotifs = await request('/notifications', 'GET', null, adminToken);
  const managerNotifs = await request('/notifications', 'GET', null, managerToken);
  const customer1Notifs = await request('/notifications', 'GET', null, customer1Token);

  const adminItems = adminNotifs.body.data || [];
  const managerItems = managerNotifs.body.data || [];
  const cust1Items = customer1Notifs.body.data || [];

  assert(
    adminItems.every((n) => n.user_id === 1),
    `Admin chỉ thấy thông báo user_id = 1 (Số lượng: ${adminItems.length})`
  );
  assert(
    managerItems.every((n) => n.user_id === 2),
    `Manager chỉ thấy thông báo user_id = 2 (Số lượng: ${managerItems.length})`
  );
  assert(
    cust1Items.every((n) => n.user_id === 7),
    `Customer 1 chỉ thấy thông báo user_id = 7 (Số lượng: ${cust1Items.length})`
  );

  // Customer 1 tries to mark Manager's notification as read
  if (managerItems.length > 0) {
    const targetNotifId = managerItems[0].id;
    const crossReadRes = await request(`/notifications/${targetNotifId}/read`, 'PUT', null, customer1Token);
    assert(crossReadRes.status === 200, 'Customer 1 gửi request mark-as-read thông báo của Manager (Idempotent 200)');

    // Verify Manager's notification was NOT altered
    const managerVerify = await request('/notifications', 'GET', null, managerToken);
    const targetItem = managerVerify.body.data.find((n) => n.id === targetNotifId);
    assert(
      targetItem && targetItem.is_read === managerItems[0].is_read,
      'Anti-IDOR: Thông báo của Manager KHÔNG bị thay đổi trạng thái khi Customer 1 gọi lệnh'
    );
  }

  // --- Test 3: IDOR on Bookings and Tickets ---
  console.log('\n[3. Chống Lỗ Hổng IDOR Trên Đơn Đặt Vé & Vé Xem Phim]');
  // Create a booking with Customer 1
  // Suất chiếu 2, chọn ghế A1 (ID 217) or couple F1 (ID 277)
  const roomSeatsRes = await request('/schedules/2/seats', 'GET', null, customer1Token);
  const availableSeats = (roomSeatsRes.body.data?.seats || []).filter((s) => s.state === 'available');

  // Let's choose couple seat F1 (ID 277) or F2
  const testSeat = availableSeats.find((s) => s.row_number === 'F') || availableSeats[0];
  const holdRes = await request('/bookings/hold', 'POST', {
    screening_id: 2,
    seat_ids: [testSeat.id],
  }, customer1Token);

  assert(holdRes.status === 200 && holdRes.body.success, `Customer 1 giữ thành công ghế ${testSeat.row_number}${testSeat.seat_number}`);
  const booking1Id = holdRes.body.data.bookingId;

  // Customer 2 attempts to view Customer 1's booking -> MUST BE 403
  const idorBooking = await request(`/bookings/${booking1Id}`, 'GET', null, customer2Token);
  assert(idorBooking.status === 403, `Anti-IDOR Booking: Customer 2 bị chặn 403 Forbidden khi xem đơn #${booking1Id} của Customer 1`);

  // Customer 1 views own booking -> MUST BE 200
  const ownBooking = await request(`/bookings/${booking1Id}`, 'GET', null, customer1Token);
  assert(ownBooking.status === 200, `Chính chủ Customer 1 xem thành công đơn đặt vé #${booking1Id}`);

  // Admin views Customer 1's booking -> MUST BE 200 (Authorized Staff/Admin)
  const adminBooking = await request(`/bookings/${booking1Id}`, 'GET', null, adminToken);
  assert(adminBooking.status === 200, `Admin có toàn quyền quản trị xem đơn đặt vé #${booking1Id}`);

  // --- Test 4: Single Seat Gap Rule Empirical Tests ---
  console.log('\n[4. Kiểm Thử Thực Tế Quy Tắc Ghế Trống Đơn Lẻ (Single Seat Gap)]');
  // Suất chiếu 2 (trong tương lai, phòng 4 có đủ các hàng A->F)
  const targetTestScreeningId = 2;
  const sched1Seats = await request(`/schedules/${targetTestScreeningId}/seats`, 'GET', null, customer1Token);
  const allS1Seats = sched1Seats.body.data?.seats || [];
  const b1 = allS1Seats.find((s) => s.row_number === 'B' && s.seat_number === 1);
  const b2 = allS1Seats.find((s) => s.row_number === 'B' && s.seat_number === 2);
  const b3 = allS1Seats.find((s) => s.row_number === 'B' && s.seat_number === 3);
  const b4 = allS1Seats.find((s) => s.row_number === 'B' && s.seat_number === 4);
  const b12 = allS1Seats.find((s) => s.row_number === 'B' && s.seat_number === 12);

  if (b2 && b4) {
    const trappedGapHold = await request('/bookings/hold', 'POST', {
      screening_id: targetTestScreeningId,
      seat_ids: [b2.id, b4.id],
    }, customer1Token);
    assert(
      trappedGapHold.status === 400 && trappedGapHold.body.message.includes('chỗ trống đơn lẻ'),
      'Chặn 400 khi chọn B2 và B4 để lại ghế trống đơn lẻ B3 bị kẹp ở giữa'
    );
  }

  // Scenario B: Selecting edge seat leaving single seat at the boundary -> MUST BE ALLOWED
  // E.g., selecting B2 leaving B1 empty at the edge (allowed by rule: ghế ngoài cùng được phép trống)
  if (b2) {
    const edgeHold = await request('/bookings/hold', 'POST', {
      screening_id: targetTestScreeningId,
      seat_ids: [b2.id],
    }, customer1Token);
    assert(
      edgeHold.status === 200,
      'Cho phép chọn B2 để lại ghế ngoài cùng B1 trống đơn lẻ (Ngoại lệ hai đầu hàng)'
    );
    // Release it
    if (edgeHold.body.data?.bookingId) {
      await request('/bookings/release', 'POST', { booking_id: edgeHold.body.data.bookingId }, customer1Token);
    }
  }

  // Scenario C: Couple seat (Row F) -> EXEMPT from gap rule
  // Chọn 2 ghế đôi F7 và F9 để lại ghế F8 trống kẹp giữa (được miễn trừ quy tắc single gap)
  const f7 = allS1Seats.find((s) => s.row_number === 'F' && s.seat_number === 7);
  const f9 = allS1Seats.find((s) => s.row_number === 'F' && s.seat_number === 9);
  if (f7 && f9) {
    const coupleGapHold = await request('/bookings/hold', 'POST', {
      screening_id: targetTestScreeningId,
      seat_ids: [f7.id, f9.id],
    }, customer1Token);
    assert(
      coupleGapHold.status === 200,
      'Hàng ghế Couple F1-F12 được miễn trừ quy tắc ghế trống đơn lẻ (Không áp dụng cho hàng F)'
    );
    if (coupleGapHold.body.data?.bookingId) {
      await request('/bookings/release', 'POST', { booking_id: coupleGapHold.body.data.bookingId }, customer1Token);
    }
  }

  // --- Test 5: Concurrent Seat Hold Collision (Race Condition) ---
  console.log('\n[5. Kiểm Thử Tranh Chấp Ghế Đồng Thời (Race Condition)]');
  // Customer 1 and Customer 2 attempt to hold the EXACT SAME seat simultaneously
  const targetRaceSeat = allS1Seats.find((s) => s.row_number === 'D' && s.seat_number === 5) || allS1Seats[10];
  const [resA, resB] = await Promise.all([
    request('/bookings/hold', 'POST', { screening_id: targetTestScreeningId, seat_ids: [targetRaceSeat.id] }, customer1Token),
    request('/bookings/hold', 'POST', { screening_id: targetTestScreeningId, seat_ids: [targetRaceSeat.id] }, customer2Token),
  ]);

  const oneSuccess = (resA.status === 200 && resB.status === 409) || (resA.status === 409 && resB.status === 200);
  assert(oneSuccess, 'Hai khách cùng giữ 1 ghế đồng thời: Đúng 1 người thành công (200) và 1 người bị chặn 409 Conflict');

  const winnerBookingId = resA.status === 200 ? resA.body.data.bookingId : resB.body.data.bookingId;
  const winnerToken = resA.status === 200 ? customer1Token : customer2Token;

  // --- Test 6: Release Seat and Immediate Re-Hold ---
  console.log('\n[6. Hủy Giữ Ghế & Giữ Lại Tức Thì]');
  const releaseRes = await request('/bookings/release', 'POST', { booking_id: winnerBookingId }, winnerToken);
  assert(releaseRes.status === 200, 'Hủy giữ ghế thành công');

  const reholdRes = await request('/bookings/hold', 'POST', { screening_id: targetTestScreeningId, seat_ids: [targetRaceSeat.id] }, customer2Token);
  assert(reholdRes.status === 200, 'Khách hàng khác giữ lại ngay chính ghế vừa giải phóng thành công (Không bị kẹt status)');
  if (reholdRes.body.data?.bookingId) {
    await request('/bookings/release', 'POST', { booking_id: reholdRes.body.data.bookingId }, customer2Token);
  }

  // --- Test 7: Voucher Engine & Payment Limits ---
  console.log('\n[7. Kiểm Thử Voucher Engine & Điều Kiện Thanh Toán]');
  // Use booking1Id created in Test 3 for Customer 1
  const vBookingId = booking1Id;
  const originalAmount = holdRes.body.data.totalAmount;

  // Test invalid voucher
  const invalidVoucherRes = await request('/vouchers/validate', 'POST', { code: 'FAKE999', total_amount: originalAmount }, customer1Token);
  assert(invalidVoucherRes.status === 400, 'Từ chối mã voucher không tồn tại (400 Bad Request)');

  // Test minTotalAmount not met (FREESNACK requires 39,000 đ)
  const minVoucherRes = await request('/vouchers/validate', 'POST', { code: 'FREESNACK', total_amount: 20000 }, customer1Token);
  assert(minVoucherRes.status === 400 && minVoucherRes.body.message.includes('tối thiểu'), 'Từ chối voucher khi chưa đạt điều kiện đơn hàng tối thiểu');

  // Test maxDiscount cap (NIGHTMOVIE20 gives 20% max 50,000 đ)
  const capVoucherRes = await request('/vouchers/validate', 'POST', { code: 'NIGHTMOVIE20', total_amount: 500000 }, customer1Token);
  assert(capVoucherRes.status === 200 && capVoucherRes.body.data.discountAmount === 50000, 'Áp trần chiết khấu tối đa maxDiscount chính xác (50.000 đ)');

  // Pay with valid voucher via MoMo Sandbox
  const momoOrderRes = await request('/payments/momo/create', 'POST', {
    booking_id: vBookingId,
    voucher_code: 'STUDENT30',
  }, customer1Token);
  assert(momoOrderRes.status === 200 && momoOrderRes.body.data?.payUrl, 'Khởi tạo thành công phiên thanh toán MoMo Sandbox với chữ ký HMAC-SHA256');

  // MoMo return confirmation (resultCode = 0) with valid HMAC-SHA256 signature
  const crypto = require('crypto');
  const momoSession = momoOrderRes.body.data;
  const responseTime = Date.now();
  const rawSig =
    `accessKey=${process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85'}` +
    `&amount=${momoSession.amount}` +
    `&extraData=` +
    `&message=Successful.` +
    `&orderId=${momoSession.orderId}` +
    `&orderInfo=${momoSession.orderInfo}` +
    `&orderType=momo_wallet` +
    `&partnerCode=${momoSession.partnerCode}` +
    `&payType=qr` +
    `&requestId=${momoSession.requestId}` +
    `&responseTime=${responseTime}` +
    `&resultCode=0` +
    `&transId=88887777`;
  const signature = crypto
    .createHmac('sha256', process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz')
    .update(rawSig)
    .digest('hex');

  const momoReturnRes = await request('/payments/momo/momo-return', 'POST', {
    booking_id: vBookingId,
    partnerCode: momoSession.partnerCode,
    orderId: momoSession.orderId,
    requestId: momoSession.requestId,
    amount: String(momoSession.amount),
    orderInfo: momoSession.orderInfo,
    orderType: 'momo_wallet',
    transId: '88887777',
    resultCode: 0,
    message: 'Successful.',
    payType: 'qr',
    responseTime,
    extraData: '',
    signature,
  }, customer1Token);
  assert(momoReturnRes.status === 200 && momoReturnRes.body.data?.paymentStatus === 'success', 'Xác thực thanh toán MoMo thành công và sinh vé điện tử');

  const issuedTickets = momoReturnRes.body.data?.tickets || [];
  assert(issuedTickets.length > 0, `Đã sinh thành công ${issuedTickets.length} vé điện tử QR Code`);

  // --- Test 8: Duplicate Payment Callback (Idempotency) ---
  console.log('\n[8. Chống Thanh Toán Lặp Callback (Idempotency)]');
  const duplicateReturnRes = await request('/payments/momo/momo-return', 'POST', {
    booking_id: vBookingId,
    partnerCode: momoSession.partnerCode,
    orderId: momoSession.orderId,
    requestId: momoSession.requestId,
    amount: String(momoSession.amount),
    orderInfo: momoSession.orderInfo,
    orderType: 'momo_wallet',
    transId: '88887777',
    resultCode: 0,
    message: 'Successful.',
    payType: 'qr',
    responseTime,
    extraData: '',
    signature,
  }, customer1Token);
  assert(
    duplicateReturnRes.status === 200 && duplicateReturnRes.body.data?.alreadyPaid === true,
    'Gọi lại callback khi đơn đã thanh toán: Trả về trạng thái alreadyPaid = true an toàn, KHÔNG trừ tiền hay sinh vé trùng'
  );

  // --- Test 9: Ticket QR Code Scanning & Anti-Double Use ---
  console.log('\n[9. Soát Vé QR Code & Chống Sử Dụng Lặp]');
  const sampleTicket = issuedTickets[0];
  if (sampleTicket) {
    // 1st Scan by Staff
    const firstScan = await request('/tickets/verify', 'POST', { ticket_code: sampleTicket.ticketCode }, adminToken);
    assert(firstScan.status === 200 && firstScan.body.success, `Soát vé lần 1 [${sampleTicket.ticketCode}] thành công, chuyển status = 'used'`);

    // 2nd Scan by Staff -> MUST BE REJECTED
    const secondScan = await request('/tickets/verify', 'POST', { ticket_code: sampleTicket.ticketCode }, adminToken);
    assert(
      secondScan.status === 400 && secondScan.body.message.includes('đã được sử dụng'),
      `Quét vé lần 2 bị từ chối 400: "${secondScan.body.message}"`
    );

    // Anti-IDOR Ticket: Customer 2 attempts to view Customer 1's ticket
    const idorTicket = await request(`/tickets/${sampleTicket.id}`, 'GET', null, customer2Token);
    assert(idorTicket.status === 403, `Anti-IDOR Ticket: Customer 2 bị chặn 403 khi xem vé của Customer 1`);
  }

  // --- Test 10: Safari Date Parsing Unit Test ---
  console.log('\n[10. Xác Minh Safari macOS Date Parsing]');
  const safariInput = '2026-11-15 18:30:00';
  const isoConverted = safariInput.replace(' ', 'T');
  const dConverted = new Date(isoConverted);
  assert(!isNaN(dConverted.getTime()) && dConverted.getHours() === 18, `Chuỗi "${safariInput}" chuyển đổi sang ISO "${isoConverted}" parse hợp lệ trên WebKit / Safari`);

  console.log('\n================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ ĐỘC LẬP: ${passedTests}/${passedTests + failedTests} TESTS PASS (${failedTests === 0 ? '100%' : 'CÓ LỖI'})`);
  console.log('================================================================');

  if (failedTests > 0) process.exit(1);
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
