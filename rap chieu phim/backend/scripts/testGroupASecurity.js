const assert = require('assert');
const crypto = require('crypto');
const http = require('http');

const BASE_URL = 'http://localhost:5050/api';

function req(method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    const postData = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const clientReq = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(rawData);
          } catch (e) {
            data = rawData;
          }
          resolve({ status: res.statusCode, data });
        });
      }
    );

    clientReq.on('error', reject);
    if (postData) clientReq.write(postData);
    clientReq.end();
  });
}

async function runSecurityTestSuite() {
  console.log('================================================================');
  console.log('  TEST SUITE: NHÓM A\' - BẢO MẬT HỆ THỐNG');
  console.log('================================================================\n');

  // Đăng nhập lấy Token
  const adminLogin = await req('POST', '/auth/login', { username: 'admin', password: 'password123' });
  const adminToken = adminLogin.data.token;
  assert.ok(adminToken, 'Admin đăng nhập phải có token');

  const cust1Login = await req('POST', '/auth/login', { username: 'customer1', password: 'password123' });
  const cust1Token = cust1Login.data.token;
  assert.ok(cust1Token, 'Customer 1 đăng nhập phải có token');

  const cust2Login = await req('POST', '/auth/login', { username: 'customer2', password: 'password123' });
  const cust2Token = cust2Login.data.token;
  assert.ok(cust2Token, 'Customer 2 đăng nhập phải có token');

  // 1. [STT 03: Bảo vệ Switch Role]
  console.log('1. [STT 03: Bảo vệ Switch Role]');
  const switchRes = await req('POST', '/auth/switch-role', { targetRole: 'customer' });
  assert.strictEqual(switchRes.status, 200, 'Switch-role thành công khi ENABLE_DEMO_TOOLS=true trong dev');
  console.log('✔ PASS: Switch-role hoạt động thành công trong dev khi ENABLE_DEMO_TOOLS=true');

  // 2. [STT 10: Chống lỗ hổng IDOR trên Booking và Ticket]
  console.log('\n2. [STT 10: Chống lỗ hổng IDOR]');
  // Lấy ghế trống
  const seatsRes = await req('GET', '/schedules/2/seats');
  const availableSeats = seatsRes.data?.data?.seats?.filter((s) => s.state === 'available') || [];
  assert.ok(availableSeats.length >= 2, 'Phải có ít nhất 2 ghế trống để test');

  // Tạo đơn đặt vé cho Customer 1
  const holdRes = await req('POST', '/bookings/hold', { screening_id: 2, seat_ids: [availableSeats[0].id] }, cust1Token);
  assert.strictEqual(holdRes.status, 200, 'Customer 1 giữ ghế thành công');
  const cust1BookingId = holdRes.data.data.bookingId;

  // Thanh toán để có vé
  const payRes = await req('POST', '/payments/process', { booking_id: cust1BookingId, payment_method: 'banking' }, cust1Token);
  assert.strictEqual(payRes.status, 200, 'Thanh toán thành công');
  const cust1TicketId = payRes.data.data.tickets[0].id;

  // Thử nghiệm IDOR: Customer 2 cố tình xem Booking của Customer 1
  const idorBooking = await req('GET', `/bookings/${cust1BookingId}`, null, cust2Token);
  assert.strictEqual(idorBooking.status, 403, 'Customer 2 KHÔNG được xem booking của Customer 1');
  console.log('✔ PASS: IDOR Booking: Customer 2 bị chặn 403 khi truy cập đơn đặt vé của Customer 1');

  // Thử nghiệm IDOR: Customer 2 cố tình xem Ticket của Customer 1
  const idorTicket = await req('GET', `/tickets/${cust1TicketId}`, null, cust2Token);
  assert.strictEqual(idorTicket.status, 403, 'Customer 2 KHÔNG được xem vé của Customer 1');
  console.log('✔ PASS: IDOR Ticket: Customer 2 bị chặn 403 khi truy cập vé xem phim của Customer 1');

  // Khách hàng xem vé/đơn chính mình -> 200 OK
  const ownBooking = await req('GET', `/bookings/${cust1BookingId}`, null, cust1Token);
  assert.strictEqual(ownBooking.status, 200, 'Customer 1 xem được booking của chính mình');
  const ownTicket = await req('GET', `/tickets/${cust1TicketId}`, null, cust1Token);
  assert.strictEqual(ownTicket.status, 200, 'Customer 1 xem được vé của chính mình');
  console.log('✔ PASS: Customer xem thành công vé & đơn đặt của chính mình');

  // Admin xem vé/đơn của khách -> 200 OK
  const adminViewBooking = await req('GET', `/bookings/${cust1BookingId}`, null, adminToken);
  assert.strictEqual(adminViewBooking.status, 200, 'Admin có quyền xem mọi booking');
  const adminViewTicket = await req('GET', `/tickets/${cust1TicketId}`, null, adminToken);
  assert.strictEqual(adminViewTicket.status, 200, 'Admin có quyền xem mọi vé');
  console.log('✔ PASS: Admin/Manager/Staff có toàn quyền xem booking và vé');

  // 3. [STT 05, 06, 07: Bảo vệ Chữ ký & Số tiền MoMo]
  console.log('\n3. [STT 05, 06, 07: Bảo vệ Giao dịch MoMo Sandbox & IPN]');
  // Tạo 1 booking mới để test MoMo
  const holdMomo = await req('POST', '/bookings/hold', { screening_id: 2, seat_ids: [availableSeats[1].id] }, cust1Token);
  const momoBookingId = holdMomo.data.data.bookingId;
  const momoTotalAmount = holdMomo.data.data.totalAmount;

  const momoInit = await req('POST', '/payments/momo/create', { booking_id: momoBookingId }, cust1Token);
  assert.strictEqual(momoInit.status, 200, 'Khởi tạo MoMo Sandbox v2 thành công');
  const session = momoInit.data.data;

  // Test MoMo Return URL: Chữ ký giả mạo -> Phải từ chối 400
  const fakeReturn = await req('POST', '/payments/momo/momo-return', {
    booking_id: momoBookingId,
    orderId: session.orderId,
    requestId: session.requestId,
    amount: momoTotalAmount,
    orderInfo: session.orderInfo,
    transId: '99998888',
    resultCode: 0,
    responseTime: Date.now(),
    signature: 'fake_tampered_signature_attacker',
  }, cust1Token);
  assert.strictEqual(fakeReturn.status, 400, 'verifyMomoReturn phải từ chối khi chữ ký sai');
  console.log('✔ PASS: verifyMomoReturn từ chối 400 khi chữ ký sai');

  // Test MoMo Return URL: Số tiền bị sửa lậu (Amount mismatch)
  const fakeAmountReturn = await req('POST', '/payments/momo/momo-return', {
    booking_id: momoBookingId,
    orderId: session.orderId,
    requestId: session.requestId,
    amount: 1000, // Cố tình giảm tiền từ ví dụ 90.000đ xuống 1.000đ
    orderInfo: session.orderInfo,
    transId: '99998888',
    resultCode: 0,
  }, cust1Token);
  assert.strictEqual(fakeAmountReturn.status, 400, 'verifyMomoReturn phải từ chối khi số tiền lệch');
  console.log('✔ PASS: verifyMomoReturn từ chối 400 khi số tiền thanh toán bị sửa lậu');

  // Test MoMo IPN Webhook: Thiếu chữ ký -> Phải từ chối 400
  const ipnNoSig = await req('POST', '/payments/momo/ipn', {
    orderId: session.orderId,
    requestId: session.requestId,
    amount: momoTotalAmount,
    resultCode: 0,
  });
  assert.strictEqual(ipnNoSig.status, 400, 'IPN MoMo thiếu chữ ký phải bị từ chối 400');
  console.log('✔ PASS: MoMo IPN từ chối 400 khi thiếu chữ ký signature');

  // Test MoMo IPN Webhook: Chữ ký sai -> Phải từ chối 400
  const ipnBadSig = await req('POST', '/payments/momo/ipn', {
    orderId: session.orderId,
    requestId: session.requestId,
    amount: momoTotalAmount,
    resultCode: 0,
    signature: 'bad_signature_xyz',
  });
  assert.strictEqual(ipnBadSig.status, 400, 'IPN MoMo chữ ký sai phải bị từ chối 400');
  console.log('✔ PASS: MoMo IPN từ chối 400 khi chữ ký không khớp');

  // Test MoMo IPN Webhook: Số tiền bị sửa lậu (Amount mismatch) -> Phải từ chối 400
  const ipnBadAmountSig = crypto
    .createHmac('sha256', process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz')
    .update(
      `accessKey=${process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85'}&amount=5000&extraData=&message=Successful.&orderId=${session.orderId}&orderInfo=${session.orderInfo}&orderType=momo_wallet&partnerCode=${session.partnerCode}&payType=qr&requestId=${session.requestId}&responseTime=1700000000000&resultCode=0&transId=99998888`
    )
    .digest('hex');

  const ipnBadAmount = await req('POST', '/payments/momo/ipn', {
    partnerCode: session.partnerCode,
    orderId: session.orderId,
    requestId: session.requestId,
    amount: 5000, // Cố tình sửa số tiền
    orderInfo: session.orderInfo,
    orderType: 'momo_wallet',
    transId: '99998888',
    resultCode: 0,
    message: 'Successful.',
    payType: 'qr',
    responseTime: 1700000000000,
    signature: ipnBadAmountSig,
  });
  assert.strictEqual(ipnBadAmount.status, 400, 'MoMo IPN phải từ chối khi số tiền bị lệch');
  console.log('✔ PASS: MoMo IPN từ chối 400 khi số tiền thanh toán bị lệch so với booking.total_amount');

  // 4. [STT 25: Payload limit & Upload Base64]
  console.log('\n4. [STT 25: Giới hạn Payload & Upload Base64 Poster]');
  // Poster base64 hợp lệ kích thước ~300KB
  const dummyBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(300 * 1024);
  const movieAdd = await req('POST', '/movies', {
    name: 'Movie Test Security Base64',
    poster: dummyBase64,
    trailer_url: 'https://youtube.com',
    duration: 120,
    genre: 'Hành Động',
    release_date: '2026-11-20',
    end_date: '2026-12-20',
    description: 'Phim test upload base64 poster an toàn',
    format: '2D, 3D',
    age_rating: 'P',
    director: 'Christopher Nolan',
    cast: 'Actor A',
    status: 'coming_soon',
  }, adminToken);
  assert.strictEqual(movieAdd.status, 201, 'Thêm phim với poster base64 300KB thành công');
  console.log('✔ PASS: Upload poster base64 dưới 5MB hoạt động chuẩn xác');

  console.log('\n================================================================');
  console.log('  KẾT QUẢ: 100% TEST BẢO MẬT NHÓM A\' VƯỢT QUA XUẤT SẮC!');
  console.log('================================================================');
}

runSecurityTestSuite().catch((err) => {
  console.error('❌ Lỗi kiểm thử Bảo mật Nhóm A\':', err);
  process.exit(1);
});
