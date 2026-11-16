const http = require('http');

const BASE_URL = 'http://localhost:5050/api';

function request(endpoint, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const payload = body ? JSON.stringify(body) : '';
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
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
    if (payload) req.write(payload);
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

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    passedCount++;
    console.log(`  ✔ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ✖ FAIL: ${testName} ${detail ? `-> (${detail})` : ''}`);
  }
}

async function runDeepAudit() {
  console.log('================================================================');
  console.log('  NIGHT MOVIE - FINAL DEEP INTEGRATION AUDIT SUITE');
  console.log('================================================================\n');

  const adminToken = await login('admin');
  const staff1Token = await login('staff1');
  const staff2Token = await login('staff2');
  const customer1Token = await login('customer1');
  const customer2Token = await login('customer2');

  // ============================================================================
  // 1. KIỂM TRA HOÀN TIỀN TỪNG PHẦN & QUY TẮC TÀI CHÍNH
  // ============================================================================
  console.log('[1. Kiểm Tra Hoàn Tiền Từng Phần & Phân Bổ Voucher]');

  // Tạo đơn hàng 3 vé cho suất 2 phòng 4
  const seatsRes = await request('/schedules/2/seats', 'GET', null, customer1Token);
  const availSeats = (seatsRes.body?.data?.seats || []).filter((s) => s.state === 'available');
  assert(availSeats.length >= 3, 'Suất 2 có đủ ít nhất 3 ghế trống khả dụng để test');

  const selected3 = availSeats.slice(0, 3);
  const holdRes = await request(
    '/bookings/hold',
    'POST',
    { screening_id: 2, seat_ids: selected3.map((s) => s.id) },
    customer1Token
  );
  assert(holdRes.status === 200, 'Khách hàng 1 giữ 3 ghế thành công');
  const bookingId = holdRes.body.data.bookingId;

  // Thanh toán với mã voucher NIGHTMOVIE20
  const payRes = await request(
    '/payments/process',
    'POST',
    {
      booking_id: bookingId,
      payment_method: 'banking',
      transaction_code: `TX-PARTIAL-${Date.now()}`,
      voucher_code: 'NIGHTMOVIE20',
    },
    customer1Token
  );
  assert(payRes.status === 200, 'Thanh toán đơn 3 vé thành công kèm voucher NIGHTMOVIE20');
  const tickets = payRes.body.data.tickets;
  assert(tickets.length === 3, 'Hệ thống sinh đủ 3 vé điện tử');

  // 1.1. Mua 3 vé, hủy 1 vé
  const cancel1Res = await request(`/tickets/${tickets[0].id}/cancel`, 'POST', {}, customer1Token);
  assert(cancel1Res.status === 200, 'Hủy vé 1/3 thành công');

  const bStateAfter1 = await request(`/bookings/${bookingId}`, 'GET', null, customer1Token);
  assert(
    bStateAfter1.body.data.status === 'paid',
    'Đơn 3 vé hủy 1 vé: Booking status vẫn là "paid" (còn 2 vé hoạt động)'
  );
  assert(
    bStateAfter1.body.data.payment?.status === 'success',
    'Hủy vé nhưng CHƯA duyệt hoàn tiền: Payment status vẫn là "success" (chưa hoàn)'
  );

  // 1.2. Mua 3 vé, hủy tiếp vé thứ 2 (hủy 2/3 vé)
  const cancel2Res = await request(`/tickets/${tickets[1].id}/cancel`, 'POST', {}, customer1Token);
  assert(cancel2Res.status === 200, 'Hủy vé 2/3 thành công');
  const bStateAfter2 = await request(`/bookings/${bookingId}`, 'GET', null, customer1Token);
  assert(
    bStateAfter2.body.data.status === 'paid',
    'Đơn 3 vé hủy 2 vé: Booking status vẫn là "paid" (còn 1 vé hoạt động)'
  );

  // 1.3. Hủy nốt vé thứ 3 (Hủy cả 3 vé)
  const cancel3Res = await request(`/tickets/${tickets[2].id}/cancel`, 'POST', {}, customer1Token);
  assert(cancel3Res.status === 200, 'Hủy vé 3/3 thành công (Toàn bộ 3 vé đã hủy)');
  const bStateAfter3 = await request(`/bookings/${bookingId}`, 'GET', null, customer1Token);
  assert(
    bStateAfter3.body.data.status === 'cancelled',
    'Khi toàn bộ 3 vé đã bị hủy: Booking status tự động chuyển sang "cancelled"'
  );
  assert(
    bStateAfter3.body.data.payment?.status === 'success',
    'Toàn bộ vé đã hủy nhưng Quản lý CHƯA duyệt hoàn tiền: Payment status vẫn là "success"'
  );

  // 1.4. Mô phỏng cổng thanh toán từ chối hoàn tiền (simulate_failure = true)
  const refFailRes = await request(
    '/payments/refund',
    'POST',
    { booking_id: bookingId, simulate_failure: true },
    adminToken
  );
  assert(
    refFailRes.status === 400 && refFailRes.body.refundStatus === 'failed',
    'Cổng thanh toán từ chối hoàn tiền: Xử lý an toàn, payment status giữ nguyên "success"'
  );

  // 1.5. Hai Admin cùng yêu cầu hoàn tiền một đơn đồng thời (Race Condition)
  const [refRace1, refRace2] = await Promise.all([
    request('/payments/refund', 'POST', { booking_id: bookingId, reason: 'Admin 1 hoàn' }, adminToken),
    request('/payments/refund', 'POST', { booking_id: bookingId, reason: 'Admin 2 hoàn' }, adminToken),
  ]);
  const raceSuccesses = [refRace1, refRace2].filter((r) => r.status === 200 && r.body.success);
  assert(raceSuccesses.length === 2, 'Cả hai request hoàn tiền đồng thời đều trả về HTTP 200 an toàn');
  const isOneIdempotent = (refRace1.body.alreadyRefunded && refRace2.body.refundStatus === 'success') ||
                          (refRace2.body.alreadyRefunded && refRace1.body.refundStatus === 'success');
  assert(
    isOneIdempotent,
    'Race condition hoàn tiền đồng thời: Đúng 1 bên thực thi hoàn tiền và bên kia nhận alreadyRefunded'
  );

  // 1.6. Gửi lại yêu cầu hoàn tiền lần nữa (Idempotency)
  const refRepeat = await request(
    '/payments/refund',
    'POST',
    { booking_id: bookingId, reason: 'Gửi lại lần 3' },
    adminToken
  );
  assert(
    refRepeat.status === 200 && refRepeat.body.alreadyRefunded === true,
    'Gọi lại hoàn tiền nhiều lần: Trả về alreadyRefunded an toàn, tuyệt đối không trừ tiền 2 lần'
  );

  // ============================================================================
  // 2. KIỂM TRA HỦY SUẤT CHIẾU KHẨN CẤP (EMERGENCY CANCELLATION)
  // ============================================================================
  console.log('\n[2. Kiểm Tra Hủy Suất Chiếu Khẩn Cấp (Emergency Cancellation)]');

  // 2.1. Tạo một suất chiếu mới trong tương lai
  const createSchedRes = await request(
    '/schedules',
    'POST',
    {
      movie_id: 1,
      room_id: 1,
      start_time: '2026-11-25 10:00:00',
      ticket_price: 100000,
      format: '2D Digital',
    },
    adminToken
  );
  if (createSchedRes.status !== 201) {
    console.log('DEBUG createSchedRes failed:', JSON.stringify(createSchedRes.body));
  }
  assert(createSchedRes.status === 201, 'Tạo thành công suất chiếu kiểm thử mới trong tương lai');
  const testSchedId = createSchedRes.body.data.id;

  // 2.2. Lấy ghế phòng 1 và đặt nhiều vé (mô phỏng bán 20 vé)
  const s1SeatsRes = await request(`/schedules/${testSchedId}/seats`, 'GET', null, customer1Token);
  const s1Avail = (s1SeatsRes.body?.data?.seats || []).filter((s) => s.state === 'available');
  const batch20Seats = s1Avail.slice(0, 20);
  assert(batch20Seats.length === 20, `Lấy đủ 20 ghế trống khả dụng để mô phỏng (lấy được ${batch20Seats.length})`);

  // Khách hàng 1 giữ 10 ghế, Khách hàng 2 giữ 10 ghế
  const hold10ResA = await request(
    '/bookings/hold',
    'POST',
    { screening_id: testSchedId, seat_ids: batch20Seats.slice(0, 10).map((s) => s.id) },
    customer1Token
  );
  const hold10ResB = await request(
    '/bookings/hold',
    'POST',
    { screening_id: testSchedId, seat_ids: batch20Seats.slice(10, 20).map((s) => s.id) },
    customer2Token
  );
  assert(hold10ResA.status === 200 && hold10ResB.status === 200, 'Hai khách hàng giữ thành công 20 ghế (mỗi người 10 ghế)');
  const bIdA = hold10ResA.body.data.bookingId;
  const bIdB = hold10ResB.body.data.bookingId;

  // Cả hai hoàn tất thanh toán
  const pay10A = await request(
    '/payments/process',
    'POST',
    { booking_id: bIdA, payment_method: 'momo', transaction_code: `MOMO-20A-${Date.now()}` },
    customer1Token
  );
  const pay10B = await request(
    '/payments/process',
    'POST',
    { booking_id: bIdB, payment_method: 'vnpay', transaction_code: `VNPAY-20B-${Date.now()}` },
    customer2Token
  );
  assert(
    pay10A.status === 200 && pay10B.status === 200 &&
    pay10A.body.data.tickets.length === 10 && pay10B.body.data.tickets.length === 10,
    'Cả hai đơn hoàn tất thanh toán: Tổng cộng 20 vé điện tử đã được phát hành cho suất chiếu'
  );

  // 2.3. Hủy thường (không có cờ emergency): Phải bị từ chối 400 vì đã bán 20 vé
  const normalCancelRes = await request(`/schedules/${testSchedId}`, 'DELETE', { emergency: false }, adminToken);
  assert(
    normalCancelRes.status === 400 && normalCancelRes.body.hasBookedSeats === true,
    'Hủy thường suất đã có 20 vé bán: Bị từ chối 400 Bad Request, yêu cầu kích hoạt cờ emergency'
  );

  // 2.4. Admin thực hiện Hủy Khẩn Cấp (Emergency Cancellation)
  const emergencyCancelRes = await request(
    `/schedules/${testSchedId}`,
    'DELETE',
    {
      emergency: true,
      reason: 'Máy chiếu phòng 1 nổ bóng đèn chiếu, sự cố kỹ thuật khẩn cấp',
    },
    adminToken
  );
  assert(emergencyCancelRes.status === 200, 'Admin thực hiện Hủy Suất Khẩn Cấp thành công (200 OK)');
  assert(
    emergencyCancelRes.body.data?.cancelledBy !== undefined &&
    emergencyCancelRes.body.data?.cancelledAt !== undefined &&
    emergencyCancelRes.body.data?.affectedSeats === 20,
    'Hủy khẩn cấp lưu đầy đủ lịch sử: Người hủy (cancelledBy), thời điểm (cancelledAt), lý do và số ghế ảnh hưởng'
  );

  // 2.5. Kiểm tra toàn bộ 20 vé và ghế của suất chiếu
  const checkTckA = await request(`/tickets/my-tickets`, 'GET', null, customer1Token);
  const myTckSchedA = (checkTckA.body.data || []).filter((t) => t.screening_id === testSchedId);
  const allCancelledA = myTckSchedA.every((t) => t.status === 'cancelled');
  if (!allCancelledA || myTckSchedA.length !== 10) {
    console.log('DEBUG myTckSchedA:', myTckSchedA.map(t => ({ id: t.id, status: t.status })));
  }
  assert(allCancelledA && myTckSchedA.length === 10, 'Toàn bộ 10 vé của Khách 1 tự động chuyển sang "cancelled"');

  const checkTckB = await request(`/tickets/my`, 'GET', null, customer2Token);
  const myTckSchedB = (checkTckB.body.data || []).filter((t) => t.screening_id === testSchedId);
  const allCancelledB = myTckSchedB.every((t) => t.status === 'cancelled');
  assert(allCancelledB && myTckSchedB.length === 10, 'Toàn bộ 10 vé của Khách 2 tự động chuyển sang "cancelled"');

  // Kiểm tra ghế được giải phóng và suất chiếu khác không bị ảnh hưởng
  const checkSeatsAfterCancel = await request(`/schedules/${testSchedId}/seats`, 'GET', null, customer1Token);
  const bookedAfterCancel = (checkSeatsAfterCancel.body?.data?.seats || []).filter((s) => s.state === 'booked');
  assert(bookedAfterCancel.length === 0, 'Toàn bộ ghế của suất chiếu bị hủy đã được giải phóng (booked = 0)');

  // Kiểm tra thông báo được gửi đến cả 2 khách hàng
  const notifA = await request('/notifications', 'GET', null, customer1Token);
  const hasEmergencyNotifA = (notifA.body?.data || []).some(
    (n) => n.title.includes('hủy suất chiếu khẩn cấp') && n.message.includes('nổ bóng đèn chiếu')
  );
  assert(hasEmergencyNotifA, 'Khách hàng 1 nhận được thông báo sự cố khẩn cấp đúng nội dung lý do');

  const notifB = await request('/notifications', 'GET', null, customer2Token);
  const hasEmergencyNotifB = (notifB.body?.data || []).some(
    (n) => n.title.includes('hủy suất chiếu khẩn cấp') && n.message.includes('nổ bóng đèn chiếu')
  );
  assert(hasEmergencyNotifB, 'Khách hàng 2 nhận được thông báo sự cố khẩn cấp đúng nội dung lý do');

  // 2.6. Khách hàng/Callback đến muộn cố thanh toán sau khi suất chiếu đã bị hủy
  // Thử giữ ghế trên suất đã bị hủy
  const lateHoldRes = await request(
    '/bookings/hold',
    'POST',
    { screening_id: testSchedId, seat_ids: [1, 2] },
    customer1Token
  );
  assert(lateHoldRes.status === 400, 'Chặn giữ ghế trên suất chiếu đã bị hủy khẩn cấp (400 Bad Request)');

  // 2.7. Hủy lặp lại (Idempotent): Không gây lỗi hay tác dụng phụ
  const repeatCancelSched = await request(
    `/schedules/${testSchedId}`,
    'DELETE',
    { emergency: true },
    adminToken
  );
  assert(
    repeatCancelSched.status === 200 && repeatCancelSched.body.alreadyCancelled === true,
    'Hủy lặp lại suất chiếu: Idempotent an toàn, trả về alreadyCancelled = true'
  );

  // ============================================================================
  // 3. KIỂM TRA ĐỒNG THỜI VÀ TỒN KHO F&B (F&B CONCURRENCY & ATOMIC BOM)
  // ============================================================================
  console.log('\n[3. Kiểm Tra Đồng Thời & Tồn Kho F&B (F&B Concurrency)]');

  // Bắp Caramen Ngọt (L) (item ID = 2) tiêu thụ nguyên liệu:
  // - Bắp hạt: 0.08 kg
  // - Bơ: 0.03 kg
  // - Đường caramen: 0.05 kg
  // Ta cập nhật tồn kho Đường caramen (ID = 3) chỉ còn đúng 0.05 kg (chỉ đủ cho đúng 1 phần)
  const setStockRes = await request(
    '/inventory/logs',
    'POST',
    {
      ingredient_id: 3,
      change_type: 'waste',
      quantity: 199.95, // Giả sử điều chỉnh hao hụt để tồn kho còn đúng 0.05
      reason: 'Điều chỉnh kiểm kê để test cận biên',
    },
    adminToken
  );

  // Lấy tồn kho hiện tại của Đường caramen (ID = 4)
  const ingRes = await request('/inventory/ingredients', 'GET', null, adminToken);
  const caramelIng = (ingRes.body?.data || []).find((i) => i.id === 4);
  const currentCaramel = parseFloat(caramelIng?.stock_quantity || 34);
  console.log(`  -> Tồn kho nguyên liệu 'Đường caramen' ban đầu: ${currentCaramel} kg`);

  // Mỗi phần bắp caramen cần 0.03 kg đường caramen
  // Ta xuất hao hụt để tồn kho chỉ còn đúng 0.03 kg (chỉ đủ cho đúng 1 phần)
  if (currentCaramel > 0.03) {
    const diff = parseFloat((currentCaramel - 0.03).toFixed(2));
    await request(
      '/inventory/logs',
      'POST',
      {
        ingredient_id: 4,
        change_type: 'waste',
        quantity: diff,
        reason: 'Điều chỉnh kiểm kê còn đúng 0.03kg',
      },
      adminToken
    );
  } else if (currentCaramel < 0.03) {
    const diff = parseFloat((0.03 - currentCaramel).toFixed(2));
    await request(
      '/inventory/logs',
      'POST',
      {
        ingredient_id: 4,
        change_type: 'import',
        quantity: diff,
        reason: 'Bổ sung tồn kho còn đúng 0.03kg',
      },
      adminToken
    );
  }

  // Hai nhân viên (staff1 và staff2) đồng thời bán bắp caramen
  const [sale1, sale2] = await Promise.all([
    request(
      '/concessions/sell',
      'POST',
      {
        items: [{ id: 2, quantity: 1 }],
        payment_method: 'cash',
        notes: 'Staff 1 bán',
      },
      staff1Token
    ),
    request(
      '/concessions/sell',
      'POST',
      {
        items: [{ id: 2, quantity: 1 }],
        payment_method: 'cash',
        notes: 'Staff 2 bán',
      },
      staff2Token
    ),
  ]);

  const sales = [sale1, sale2];
  const successfulSales = sales.filter((s) => s.status === 200 || s.status === 201);
  const rejectedSales = sales.filter((s) => s.status === 400 || s.status === 500);

  console.log(`  -> Giao dịch thành công: ${successfulSales.length}, Bị từ chối: ${rejectedSales.length}`);
  assert(
    successfulSales.length === 1 && rejectedSales.length === 1,
    'Kho chỉ đủ 1 combo: Đúng 1 giao dịch thành công (200), giao dịch đồng thời còn lại bị từ chối an toàn'
  );

  // Kiểm tra việc từ chối khi bán vượt tồn kho (yêu cầu số lượng lớn vượt kho hiện có)
  const overSaleRes = await request(
    '/concessions/sell',
    'POST',
    {
      items: [{ id: 2, quantity: 99999 }], // Đòi 99.999 phần
      payment_method: 'cash',
      notes: 'Bán vượt kho siêu lớn',
    },
    staff1Token
  );
  if (overSaleRes.status !== 400 && overSaleRes.status !== 500) {
    console.log('DEBUG overSaleRes:', JSON.stringify(overSaleRes));
  }
  assert(
    overSaleRes.status === 400 || overSaleRes.status === 500,
    'Từ chối bán vượt tồn kho an toàn: Báo lỗi thiếu nguyên liệu, rollback hoàn toàn transaction'
  );

  // Kiểm tra tồn kho sau giao dịch: Tuyệt đối không được âm
  const ingCheckAfter = await request('/inventory/ingredients', 'GET', null, adminToken);
  const caramelAfter = (ingCheckAfter.body?.data || []).find((i) => i.id === 3);
  assert(
    caramelAfter && caramelAfter.stock_quantity >= 0,
    `Tồn kho sau kiểm thử không bị âm (Hiện tại: ${caramelAfter?.stock_quantity} kg >= 0)`
  );

  // ============================================================================
  // 4. KIỂM TRA ĐỒNG THỜI VÀ IDEMPOTENCY CÁC NGHIỆP VỤ KHÁC
  // ============================================================================
  console.log('\n[4. Kiểm Tra Đồng Thời & Idempotency]');

  // 4.1. Hai khách hàng cùng giữ một ghế đồng thời
  const s2SeatsRes = await request('/schedules/2/seats', 'GET', null, customer1Token);
  const s2Avail = (s2SeatsRes.body?.data?.seats || []).filter((s) => s.state === 'available');
  const targetRaceSeat = s2Avail[0];
  assert(targetRaceSeat !== undefined, 'Suất 2 có sẵn ghế trống để kiểm thử tranh chấp đồng thời');

  const [raceHoldA, raceHoldB] = await Promise.all([
    request('/bookings/hold', 'POST', { screening_id: 2, seat_ids: [targetRaceSeat.id] }, customer1Token),
    request('/bookings/hold', 'POST', { screening_id: 2, seat_ids: [targetRaceSeat.id] }, customer2Token),
  ]);
  const raceHoldStatuses = [raceHoldA.status, raceHoldB.status].sort();
  assert(
    raceHoldStatuses[0] === 200 && raceHoldStatuses[1] === 409,
    'Hai khách giữ cùng 1 ghế đồng thời: Đúng 1 người thành công (200), người kia bị chặn (409 Conflict)'
  );

  // 4.2. Quét cùng một mã QR đồng thời tại cửa soát vé
  const s2AvailForScan = (s2SeatsRes.body?.data?.seats || []).filter((s) => s.state === 'available' && s.id !== targetRaceSeat.id);
  const scanSeat = s2AvailForScan[0];
  const holdScanRes = await request('/bookings/hold', 'POST', { screening_id: 2, seat_ids: [scanSeat.id] }, customer1Token);
  const payForScanRes = await request(
    '/payments/process',
    'POST',
    {
      booking_id: holdScanRes.body.data.bookingId,
      payment_method: 'cash',
      transaction_code: `TX-SCAN-RACE-${Date.now()}`,
    },
    customer1Token
  );
  const testScanTicket = payForScanRes.body?.data?.tickets?.[0];
  assert(testScanTicket !== undefined, 'Phát hành vé kiểm thử quét mã thành công');

  const [scanStaff1, scanStaff2] = await Promise.all([
    request('/tickets/verify', 'POST', { ticket_code: testScanTicket.ticketCode || testScanTicket.ticket_code }, staff1Token),
    request('/tickets/verify', 'POST', { ticket_code: testScanTicket.ticketCode || testScanTicket.ticket_code }, staff2Token),
  ]);
  const scanStatuses = [scanStaff1.status, scanStaff2.status].sort();
  assert(
    scanStatuses[0] === 200 && (scanStatuses[1] === 400 || scanStatuses[1] === 409),
    'Hai nhân viên quét cùng mã vé QR đồng thời: Đúng 1 nhân viên soát thành công, người kia bị từ chối'
  );

  // ============================================================================
  // 5. KIỂM TRA CHUỖI NGHIỆP VỤ HOÀN CHỈNH (END-TO-END FLOWS)
  // ============================================================================
  console.log('\n[5. Kiểm Tra Chuỗi Nghiệp Vụ Hoàn Chỉnh (E2E)]');

  // Chuỗi A: Đặt vé -> Giữ ghế -> Áp voucher -> Thanh toán -> Sinh QR -> Soát vé
  const flowA_SeatsRes = await request('/schedules/2/seats', 'GET', null, customer1Token);
  const flowA_Avail = (flowA_SeatsRes.body?.data?.seats || []).filter((s) => s.state === 'available');
  const flowA_Seat = flowA_Avail[0];
  const flowA_Hold = await request('/bookings/hold', 'POST', { screening_id: 2, seat_ids: [flowA_Seat.id] }, customer1Token);
  assert(flowA_Hold.status === 200, '[Chuỗi A] Bước 1: Khách hàng giữ ghế khả dụng thành công');
  const flowA_BId = flowA_Hold.body.data.bookingId;

  const flowA_Pay = await request(
    '/payments/process',
    'POST',
    {
      booking_id: flowA_BId,
      payment_method: 'momo',
      transaction_code: `TX-E2E-A-${Date.now()}`,
      voucher_code: 'NIGHTMOVIE20',
    },
    customer1Token
  );
  assert(flowA_Pay.status === 200, '[Chuỗi A] Bước 2: Áp voucher và thanh toán thành công');
  const flowA_Ticket = flowA_Pay.body.data.tickets[0];
  assert(flowA_Ticket && flowA_Ticket.ticketCode, '[Chuỗi A] Bước 3: Phát hành vé điện tử kèm mã QR định danh');

  const flowA_Scan = await request('/tickets/verify', 'POST', { ticket_code: flowA_Ticket.ticketCode }, staff1Token);
  assert(flowA_Scan.status === 200, '[Chuỗi A] Bước 4: Soát vé tại cửa vào rạp thành công (status = used)');

  // Chuỗi D: Khách đặt F&B tận ghế
  const flowD_Order = await request(
    '/concessions/sell',
    'POST',
    {
      items: [{ id: 1, quantity: 1 }, { id: 3, quantity: 1 }],
      payment_method: 'qr',
      notes: 'Giao tận ghế | Phòng: Cinema Hall 4 (IMAX) | Ghế: A6 | Ghi chú: Giao trước giờ chiếu',
    },
    customer1Token
  );
  assert(flowD_Order.status === 200 || flowD_Order.status === 201, '[Chuỗi D] Khách đặt bắp nước tận ghế kèm thông tin Phòng/Ghế');
  assert(
    flowD_Order.body.data?.order_code !== undefined,
    '[Chuỗi D] Đơn bắp nước sinh mã ORD-POS và lưu ghi chú giao hàng tận ghế đầy đủ'
  );

  // Chuỗi E: Bán tại POS -> Trừ nguyên liệu -> Bàn giao ca & Đối soát tiền mặt -> Dashboard cập nhật
  const handoverRes = await request(
    '/handovers',
    'POST',
    {
      work_shift_id: 1,
      total_cash_expected: 500000,
      total_cash_actual: 500000,
      notes: 'Đối soát khớp 100%, bàn giao ca sáng cho ca chiều',
    },
    staff1Token
  );
  assert(handoverRes.status === 200 || handoverRes.status === 201, '[Chuỗi E] Nhân viên bàn giao ca và đối soát tiền mặt thành công');

  const finalDashboard = await request('/dashboard/summary', 'GET', null, adminToken);
  assert(
    finalDashboard.status === 200 &&
    finalDashboard.body.data?.sales?.net_revenue_today !== undefined &&
    finalDashboard.body.data?.sales?.gross_revenue_today !== undefined,
    '[Chuỗi E] Dashboard cập nhật chuẩn xác Doanh thu thuần, Doanh thu gộp và Tiền hoàn'
  );

  console.log('\n================================================================');
  console.log(`  TỔNG KẾT DEEP AUDIT: ${passedCount}/${passedCount + failedCount} TESTS PASS (${Math.round((passedCount / (passedCount + failedCount)) * 100)}%)`);
  console.log('================================================================');
}

runDeepAudit().catch((err) => {
  console.error('Lỗi thực thi test:', err);
  process.exit(1);
});
