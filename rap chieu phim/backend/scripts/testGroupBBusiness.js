const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const db = require('../config/database');

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

async function runGroupBTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: NHÓM B - NGHIỆP VỤ (STT 20, 21, 22)');
  console.log('================================================================\n');

  // Đăng nhập lấy Token
  const adminLogin = await req('POST', '/auth/login', { username: 'admin', password: 'password123' });
  const adminToken = adminLogin.data.token;
  assert.ok(adminToken, 'Admin phải đăng nhập thành công');

  const custLogin = await req('POST', '/auth/login', { username: 'customer1', password: 'password123' });
  const custToken = custLogin.data.token;
  assert.ok(custToken, 'Customer 1 phải đăng nhập thành công');

  // -------------------------------------------------------------
  // 1. [STT 22: Voucher Engine & Quy tắc tính tiền thực thu]
  // -------------------------------------------------------------
  console.log('1. [STT 22: Voucher Engine & Quy tắc tính tiền thực thu]');

  // 1.1 Lấy danh sách voucher
  const listVouchers = await req('GET', '/vouchers');
  assert.strictEqual(listVouchers.status, 200, 'GET /api/vouchers phải trả về 200');
  assert.ok(Array.isArray(listVouchers.data.data), 'Danh sách voucher phải là mảng');
  assert.ok(listVouchers.data.data.some((v) => v.code === 'NIGHTMOVIE20'));
  console.log(`✔ PASS: GET /api/vouchers tải thành công ${listVouchers.data.data.length} mã giảm giá`);

  // 1.2 Validate voucher % có trần tối đa (NIGHTMOVIE20: 20% max 50k)
  const valVoucher1 = await req('POST', '/vouchers/validate', { code: 'NIGHTMOVIE20', total_amount: 300000 });
  assert.strictEqual(valVoucher1.status, 200);
  assert.strictEqual(valVoucher1.data.data.discountAmount, 50000, 'Chiết khấu 20% của 300k phải bị chặn ở trần 50k');
  assert.strictEqual(valVoucher1.data.data.payableAmount, 250000, 'Số tiền thực thu phải là 250k');
  console.log('✔ PASS: Áp dụng trần chiết khấu tối đa maxDiscount chính xác (50.000 đ)');

  // 1.3 Validate voucher không tồn tại
  const valFake = await req('POST', '/vouchers/validate', { code: 'FAKE_CODE_999', total_amount: 100000 });
  assert.strictEqual(valFake.status, 400, 'Mã giả mạo phải bị từ chối 400');
  console.log('✔ PASS: Từ chối mã voucher không hợp lệ / giả mạo');

  // 1.4 Validate voucher có điều kiện đơn tối thiểu (STUDENT30: tối thiểu 60k)
  const valMinTotal = await req('POST', '/vouchers/validate', { code: 'STUDENT30', total_amount: 40000 });
  assert.strictEqual(valMinTotal.status, 400, 'Đơn dưới 60k phải bị từ chối mã STUDENT30');
  console.log('✔ PASS: Kiểm tra điều kiện đơn hàng tối thiểu minTotalAmount chính xác');

  // -------------------------------------------------------------
  // 1.5 Luồng Đặt vé -> Áp Voucher -> Thanh toán MoMo Sandbox -> Nhận vé
  // -------------------------------------------------------------
  console.log('\n--- [LUỒNG TOÀN TRÌNH: ĐẶT VÉ -> ÁP VOUCHER -> THANH TOÁN -> NHẬN VÉ] ---');
  const seatsRes = await req('GET', '/schedules/2/seats');
  const availableSeats = seatsRes.data?.data?.seats?.filter((s) => s.state === 'available') || [];
  assert.ok(availableSeats.length >= 1, 'Phải có ghế trống để đặt vé');
  const selectedSeat = availableSeats[0];

  // Giữ ghế
  const holdRes = await req('POST', '/bookings/hold', { screening_id: 2, seat_ids: [selectedSeat.id] }, custToken);
  assert.strictEqual(holdRes.status, 200, 'Giữ ghế thành công');
  const bookingId = holdRes.data.data.bookingId;
  const initialTotal = holdRes.data.data.totalAmount;

  // Khởi tạo MoMo Sandbox có kèm voucher STUDENT30 (giảm 30.000 đ)
  const momoCreate = await req('POST', '/payments/momo/create', {
    booking_id: bookingId,
    voucher_code: 'STUDENT30',
  }, custToken);
  assert.strictEqual(momoCreate.status, 200, 'Tạo giao dịch MoMo với voucher thành công');

  const momoSession = momoCreate.data.data;
  const expectedPayable = Math.max(0, initialTotal - 30000);
  assert.strictEqual(Number(momoSession.amount), expectedPayable, 'Số tiền gửi sang MoMo phải là số tiền thực thu (đã trừ voucher)');
  console.log(`✔ PASS: Số tiền thực thu thanh toán MoMo: Gốc ${initialTotal}đ - Voucher 30.000đ = ${momoSession.amount}đ`);

  // Thanh toán MoMo Return URL với số tiền thực thu
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

  const momoReturn = await req('POST', '/payments/momo/momo-return', {
    booking_id: bookingId,
    partnerCode: momoSession.partnerCode,
    orderId: momoSession.orderId,
    requestId: momoSession.requestId,
    amount: momoSession.amount,
    orderInfo: momoSession.orderInfo,
    transId: '88887777',
    resultCode: 0,
    responseTime,
    signature,
  }, custToken);

  assert.strictEqual(momoReturn.status, 200, 'Xác thực MoMo Return với số tiền thực thu thành công');
  assert.strictEqual(momoReturn.data.data.paymentStatus, 'success', 'Trạng thái thanh toán phải là success');
  assert.ok(momoReturn.data.data.tickets.length > 0, 'Vé điện tử phải được xuất thành công');
  const issuedTicket = momoReturn.data.data.tickets[0];
  console.log(`✔ PASS: Thanh toán thành công & xuất vé QR [${issuedTicket.ticketCode}] với số tiền thực thu chuẩn.`);

  // -------------------------------------------------------------
  // 2. [STT 20: Kiểm tra hold_expire > NOW() khi thanh toán]
  // -------------------------------------------------------------
  console.log('\n2. [STT 20: Kiểm tra hold_expire > NOW() trong transaction thanh toán]');

  const { finalizeBookingTransaction } = require('../controllers/paymentController');

  // Tạo 1 booking giả lập trong DB hiện tại
  const newBookingRes = await db.query(
    `INSERT INTO bookings (customer_id, screening_id, booking_code, total_amount, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [1, 2, 'BK-EXPIRED-TEST', 150000]
  );
  const testBookingId = newBookingRes.insertId;

  // Ghế giữ đã quá hạn 5 phút trước
  const pastTimeStr = new Date(Date.now() - 5 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  await db.query(
    `INSERT INTO booking_seats (booking_id, seat_id, price, status, hold_start, hold_expire)
     VALUES ?`,
    [[[testBookingId, 225, 150000, 'holding', pastTimeStr, pastTimeStr]]]
  );

  const paymentResult = await finalizeBookingTransaction({
    bookingId: testBookingId,
    paymentMethod: 'banking',
    transactionCode: 'TXN-EXPIRED-TEST',
    user: { id: 7, customerId: 1, role: 'customer' },
  });

  assert.strictEqual(paymentResult.paymentStatus, 'failed', 'Trạng thái thanh toán phải là failed khi ghế hết hạn');
  assert.ok(
    paymentResult.message.includes('hết hạn') || paymentResult.message.includes('giải phóng'),
    `Lỗi phải nêu rõ hết hạn giữ chỗ: "${paymentResult.message}"`
  );
  console.log(`✔ PASS: Giao dịch từ chối thành công khi hold_expire < NOW(): "${paymentResult.message}"`);

  // Kiểm tra ghế và booking đã được tự động giải phóng
  const updatedSeats = await db.query(`SELECT status FROM booking_seats WHERE booking_id = ?`, [testBookingId]);
  const seatStatus = Array.isArray(updatedSeats) ? updatedSeats[0]?.status : updatedSeats?.status;
  assert.strictEqual(seatStatus, 'released', 'Ghế phải được chuyển trạng thái sang released');

  const updatedBookings = await db.query(`SELECT status FROM bookings WHERE id = ?`, [testBookingId]);
  const bookingStatus = Array.isArray(updatedBookings) ? updatedBookings[0]?.status : updatedBookings?.status;
  assert.strictEqual(bookingStatus, 'expired', 'Booking phải được chuyển trạng thái sang expired');
  console.log('✔ PASS: Hệ thống tự động chuyển trạng thái ghế sang "released" và đơn đặt sang "expired"');

  // -------------------------------------------------------------
  // 3. [STT 21: Soát vé nguyên tử (Atomic Update) chống Race Condition]
  // -------------------------------------------------------------
  console.log('\n3. [STT 21: Soát vé Atomic UPDATE ... WHERE status = \'active\']');

  // Gửi ĐỒNG THỜI 2 request soát vé cho cùng một mã vé issuedTicket.ticketCode
  const [res1, res2] = await Promise.all([
    req('POST', '/tickets/verify', { ticket_code: issuedTicket.ticketCode }, adminToken),
    req('POST', '/tickets/verify', { ticket_code: issuedTicket.ticketCode }, adminToken),
  ]);

  const statuses = [res1.status, res2.status];
  const successCount = statuses.filter((s) => s === 200).length;
  const conflictCount = statuses.filter((s) => s === 409 || s === 400).length;

  assert.strictEqual(successCount, 1, 'Đúng 1 request soát vé thành công (200 OK)');
  assert.strictEqual(conflictCount, 1, 'Đúng 1 request bị từ chối (409 Conflict hoặc 400)');
  console.log(`✔ PASS: Race condition test: 2 request soát vé đồng thời -> 1 Thành công (200), 1 Bị chặn (${conflictCount === 1 ? 'Conflict' : 'Error'})`);

  console.log('\n================================================================');
  console.log('  KẾT QUẢ: TOÀN BỘ TEST NHÓM B - NGHIỆP VỤ ĐẠT 100%');
  console.log('================================================================');
}

runGroupBTests().catch((err) => {
  console.error('❌ Lỗi kiểm thử Nhóm B:', err);
  process.exit(1);
});
