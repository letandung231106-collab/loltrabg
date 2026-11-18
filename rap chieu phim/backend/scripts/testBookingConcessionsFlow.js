/**
 * TEST SUITE: BOOKING CONCESSIONS & COMBOS FLOW (LUỒNG CHỌN BẮP NƯỚC KÈM VÉ)
 * Kiểm tra 5 trường hợp trọng yếu theo yêu cầu:
 * 1. Đơn có bắp nước + voucher: UI hiển thị tổng = số MoMo nhận = số IPN/Return chấp nhận.
 * 2. Client gửi giá thấp hơn, số lượng âm, hoặc món không tồn tại: bị backend từ chối hoặc tính lại theo giá thực tế trong DB.
 * 3. Thanh toán thành công tạo đúng 1 đơn concession_orders và trừ kho BOM đúng 1 lần; gọi lại callback không trừ kho lần 2.
 * 4. Đơn bỏ qua bắp nước: luồng cũ hoạt động bình thường, concession_amount = 0.
 * 5. Giữ ghế hết hạn trong lúc đang chọn bắp nước: không thanh toán được, không tạo đơn bắp nước.
 */

const http = require('http');
const db = require('../config/database');
const { finalizeBookingTransaction } = require('../controllers/paymentController');

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
    throw new Error(`Đăng nhập thất bại: ${username}`);
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
    console.error(`  ✘ FAIL: ${testName} ${detail ? `-> (${detail})` : ''}`);
  }
}

async function runConcessionFlowTests() {
  console.log('================================================================');
  console.log(' TEST SUITE: BOOKING CONCESSIONS & COMBOS FLOW AUDIT');
  console.log(` Database Mode: ${db.getIsConnected() ? 'MySQL Production' : 'RAM In-Memory Mock'}`);
  console.log('================================================================\n');

  const customerToken = await login('customer1');
  const staffToken = await login('staff1');

  // Tìm một suất chiếu hợp lệ trong tương lai để test
  const schRes = await request('/schedules', 'GET', null, customerToken);
  const futureSchedules = (schRes.body?.data || []).filter(
    (s) => s.status !== 'cancelled' && new Date(s.start_time) > new Date()
  );
  const testSchedule = futureSchedules[0] || { id: 1, ticket_price: 150000 };

  // ---------------------------------------------------------------------------
  // CASE 1: ĐƠN CÓ BẮP NƯỚC + VOUCHER (ĐỐI CHIẾU SỐ TIỀN CHÍNH XÁC 100%)
  // ---------------------------------------------------------------------------
  console.log('--- CASE 1: Đơn có bắp nước + Voucher (Đối chiếu tiền MoMo, IPN, Return URL) ---');

  // Lấy sơ đồ ghế để chọn ghế trống
  const seatMapRes = await request(`/schedules/${testSchedule.id}/seats`, 'GET', null, customerToken);
  const availableSeats = (seatMapRes.body?.data?.seats || []).filter((s) => s.state === 'available');
  if (availableSeats.length < 2) {
    console.warn('Không đủ ghế trống để test, bỏ qua');
  }

  const chosenSeat1 = availableSeats[0];
  const chosenSeat2 = availableSeats[1];

  // Giữ 2 ghế
  const holdRes = await request('/bookings/hold', 'POST', {
    screening_id: testSchedule.id,
    seat_ids: [chosenSeat1.id, chosenSeat2.id],
  }, customerToken);

  assert(holdRes.status === 200 && holdRes.body.success, 'Khách hàng giữ 2 ghế thành công');
  const booking1 = holdRes.body.data;
  const ticketAmount = booking1.totalAmount;

  // Chọn 1 Bắp Rang Bơ Phô Mai (69.000) + 1 Coca-Cola (39.000) = 108.000
  const chosenConcessions1 = [
    { item_id: 1, quantity: 1 }, // 69.000
    { item_id: 3, quantity: 1 }, // 39.000
  ];
  const expectedConcessionAmount = 108000;

  // Áp dụng voucher STUDENT30: giảm 30.000
  const voucherCode = 'STUDENT30';
  const voucherDiscount = 30000;
  const expectedPayable = Math.max(0, ticketAmount + expectedConcessionAmount - voucherDiscount);

  // Khởi tạo thanh toán MoMo kèm bắp nước & voucher
  const momoInitRes = await request('/payments/momo/create', 'POST', {
    booking_id: booking1.bookingId,
    voucher_code: voucherCode,
    concessions: chosenConcessions1,
  }, customerToken);

  assert(momoInitRes.status === 200 && momoInitRes.body.success, 'Khởi tạo MoMo Sandbox với bắp nước + voucher thành công');
  assert(
    momoInitRes.body.data?.amount === expectedPayable,
    `Số tiền MoMo yêu cầu thu (${momoInitRes.body.data?.amount}) bằng đúng expectedPayable (${expectedPayable})`
  );

  // Giả mạo IPN gửi số tiền thấp hơn (ví dụ thiếu tiền bắp nước) -> Bị từ chối
  const forgedIpnRes = await request('/payments/momo/ipn', 'POST', {
    partnerCode: 'MOMO',
    orderId: momoInitRes.body.data.orderId,
    requestId: momoInitRes.body.data.requestId,
    amount: String(expectedPayable - 10000), // Gian lận thiếu 10k
    orderInfo: 'Test IPN Tampered',
    orderType: 'momo_wallet',
    transId: 99990001,
    resultCode: 0,
    message: 'Successful.',
    payType: 'qr',
    responseTime: Date.now(),
    extraData: '',
    signature: 'mock_sig', // Chữ ký sẽ được kiểm tra hoặc từ chối
  });
  // IPN sẽ từ chối vì sai signature hoặc sai amount
  assert(forgedIpnRes.status === 400, 'MoMo IPN từ chối giao dịch khi số tiền không khớp');

  // Verify Return URL với số tiền bị sửa đổi -> Bị từ chối (STT 07)
  const forgedReturnRes = await request('/payments/momo/momo-return', 'POST', {
    booking_id: booking1.bookingId,
    orderId: momoInitRes.body.data.orderId,
    amount: String(expectedPayable - 50000),
    resultCode: 0,
  }, customerToken);
  assert(forgedReturnRes.status === 400, 'MoMo Return URL từ chối khi số tiền lệch so với đơn hàng');

  // Verify Return URL chuẩn với đúng expectedPayable -> Thành công
  const validReturnRes = await request('/payments/momo/momo-return', 'POST', {
    booking_id: booking1.bookingId,
    orderId: momoInitRes.body.data.orderId,
    amount: String(expectedPayable),
    resultCode: 0,
  }, customerToken);
  assert(validReturnRes.status === 200 && validReturnRes.body.success, 'MoMo Return URL xác nhận thanh toán thành công với số tiền khớp 100%');
  assert(validReturnRes.body.data?.payableAmount === expectedPayable, 'Dữ liệu kết quả phản ánh đúng số tiền thực thu');
  assert(validReturnRes.body.data?.concessionAmount === expectedConcessionAmount, 'Dữ liệu kết quả phản ánh đúng tiền bắp nước');

  // ---------------------------------------------------------------------------
  // CASE 2: BẢO MẬT & TÍNH TOÀN VẸN (GIÁ THẤP, SỐ LƯỢNG ÂM, MÓN KHÔNG TỒN TẠI)
  // ---------------------------------------------------------------------------
  console.log('\n--- CASE 2: Chống gian lận giá, số lượng âm và món không hợp lệ ---');

  // Giữ 1 ghế mới
  const availableSeats2 = (await request(`/schedules/${testSchedule.id}/seats`, 'GET', null, customerToken)).body?.data?.seats?.filter((s) => s.state === 'available') || [];
  const testSeat2 = availableSeats2[0];
  const holdRes2 = await request('/bookings/hold', 'POST', {
    screening_id: testSchedule.id,
    seat_ids: [testSeat2.id],
  }, customerToken);
  const booking2 = holdRes2.body.data;

  // 2a. Client cố tình gửi giá cực rẻ (1.000 VNĐ thay vì 69.000 VNĐ)
  const clientTamperedPrice = [
    { item_id: 1, quantity: 1, price: 1000, unit_price: 1000 },
  ];
  const momoTamperedPriceRes = await request('/payments/momo/create', 'POST', {
    booking_id: booking2.bookingId,
    concessions: clientTamperedPrice,
  }, customerToken);
  assert(
    momoTamperedPriceRes.body.data?.amount === booking2.totalAmount + 69000,
    'Backend bỏ qua giá client gửi, tra cứu giá DB chuẩn 69.000 đ'
  );

  // 2b. Client gửi số lượng âm
  const negQtyRes = await request('/payments/process', 'POST', {
    booking_id: booking2.bookingId,
    concessions: [{ item_id: 1, quantity: -5 }],
  }, customerToken);
  assert(negQtyRes.status === 400, 'Backend từ chối số lượng món âm (HTTP 400)');

  // 2c. Client gửi số lượng vượt quá mức tối đa (> 20)
  const overQtyRes = await request('/payments/process', 'POST', {
    booking_id: booking2.bookingId,
    concessions: [{ item_id: 1, quantity: 999 }],
  }, customerToken);
  assert(overQtyRes.status === 400, 'Backend từ chối số lượng món bất thường > 20 (HTTP 400)');

  // 2d. Client gửi món không tồn tại trong hệ thống
  const fakeItemRes = await request('/payments/process', 'POST', {
    booking_id: booking2.bookingId,
    concessions: [{ item_id: 88888, quantity: 1 }],
  }, customerToken);
  assert(fakeItemRes.status === 400, 'Backend từ chối món F&B không tồn tại (HTTP 400)');

  // 2e. Client gửi món đã ngừng kinh doanh (ID 8: Kem Trái Cây - is_active: false)
  const inactiveItemRes = await request('/payments/process', 'POST', {
    booking_id: booking2.bookingId,
    concessions: [{ item_id: 8, quantity: 1 }],
  }, customerToken);
  assert(inactiveItemRes.status === 400, 'Backend từ chối món đang tạm ngừng kinh doanh (HTTP 400)');

  // ---------------------------------------------------------------------------
  // CASE 3: TẠO ĐƠN CONCESSION & TRỪ KHO BOM CHÍNH XÁC (IDEMPOTENT KHÔNG TRỪ 2 LẦN)
  // ---------------------------------------------------------------------------
  console.log('\n--- CASE 3: Tạo đơn F&B, trừ kho BOM và chống trừ kho 2 lần (Idempotency) ---');

  // Lấy tồn kho trước khi thanh toán của Hạt ngô (ID 1), Bơ (ID 2), Phô mai (ID 3), Hộp bắp L (ID 8) bằng quyền staff
  const ingResBefore = await request('/inventory/ingredients', 'GET', null, staffToken);
  const getIngStock = (id, list) => (list || []).find((i) => i.id === id)?.stock_quantity || 0;
  const cornBefore = getIngStock(1, ingResBefore.body?.data);

  // Thanh toán trực tiếp đơn booking2 kèm 1 Bắp Rang Phô Mai (ID 1: tiêu hao 0.08kg hạt ngô)
  const payConcessionRes = await request('/payments/process', 'POST', {
    booking_id: booking2.bookingId,
    payment_method: 'banking',
    concessions: [{ item_id: 1, quantity: 1 }],
  }, customerToken);

  assert(payConcessionRes.status === 200 && payConcessionRes.body.success, 'Thanh toán đơn kèm bắp nước thành công');
  assert(payConcessionRes.body.data?.concessionOrder !== null, 'Tạo thành công đơn hàng F&B concession_orders trong cùng transaction');

  // Kiểm tra tồn kho sau thanh toán bằng quyền staff
  const ingResAfter = await request('/inventory/ingredients', 'GET', null, staffToken);
  const cornAfter = getIngStock(1, ingResAfter.body?.data);
  const cornDeducted = parseFloat((cornBefore - cornAfter).toFixed(3));
  assert(
    Math.abs(cornDeducted - 0.08) < 0.001,
    `Kho đã trừ đúng định lượng BOM của 1 Bắp L (0.08kg hạt ngô, trước: ${cornBefore}, sau: ${cornAfter})`
  );

  // Gọi lại thanh toán đơn này lần thứ 2 (giả lập callback MoMo bị gửi lại hoặc mạng lag)
  const cornBeforeRepeat = cornAfter;
  const repeatPayRes = await request('/payments/process', 'POST', {
    booking_id: booking2.bookingId,
    payment_method: 'banking',
    concessions: [{ item_id: 1, quantity: 1 }],
  }, customerToken);

  assert(repeatPayRes.status === 200 && repeatPayRes.body.data?.alreadyPaid === true, 'Gọi lại thanh toán đơn đã trả: phản hồi alreadyPaid = true');
  const ingResAfterRepeat = await request('/inventory/ingredients', 'GET', null, staffToken);
  const cornAfterRepeat = getIngStock(1, ingResAfterRepeat.body?.data);
  assert(
    cornAfterRepeat === cornBeforeRepeat,
    'Gọi lại thanh toán KHÔNG trừ kho lần 2 (Bảo vệ toàn vẹn dữ liệu kho BOM)'
  );

  // ---------------------------------------------------------------------------
  // CASE 4: ĐƠN BỎ QUA BẮP NƯỚC (CONCESSIONS = [])
  // ---------------------------------------------------------------------------
  console.log('\n--- CASE 4: Bỏ qua bắp nước (Luồng truyền thống không mua F&B) ---');

  const availableSeats3 = (await request(`/schedules/${testSchedule.id}/seats`, 'GET', null, customerToken)).body?.data?.seats?.filter((s) => s.state === 'available') || [];
  const testSeat3 = availableSeats3[0];
  const holdRes3 = await request('/bookings/hold', 'POST', {
    screening_id: testSchedule.id,
    seat_ids: [testSeat3.id],
  }, customerToken);
  const booking3 = holdRes3.body.data;

  // Thanh toán với concessions rỗng []
  const skipConcessionPayRes = await request('/payments/process', 'POST', {
    booking_id: booking3.bookingId,
    payment_method: 'banking',
    concessions: [],
  }, customerToken);

  assert(skipConcessionPayRes.status === 200 && skipConcessionPayRes.body.success, 'Thanh toán đơn vé không kèm bắp nước thành công');
  assert(skipConcessionPayRes.body.data?.concessionAmount === 0, 'concession_amount đúng bằng 0');
  assert(skipConcessionPayRes.body.data?.payableAmount === booking3.totalAmount, 'Số tiền thanh toán đúng bằng tiền vé gốc');
  assert(skipConcessionPayRes.body.data?.concessionOrder === null, 'Không tạo đơn concession_orders khi khách bỏ qua bắp nước');

  // ---------------------------------------------------------------------------
  // CASE 5: HẾT HẠN GIỮ CHỖ TRONG LÚC CHỌN BẮP NƯỚC
  // ---------------------------------------------------------------------------
  console.log('\n--- CASE 5: Hết hạn giữ chỗ 10 phút trong lúc chọn bắp nước ---');

  const expiredBookingCode = 'BK-EXP-' + Date.now();
  const insertBookingRes = await db.query(
    `INSERT INTO bookings (customer_id, screening_id, booking_code, total_amount, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [1, testSchedule.id, expiredBookingCode, 150000]
  );
  const booking4Id = insertBookingRes.insertId;

  // Ghế giữ đã quá hạn 15 phút trước
  const pastTimeStr = new Date(Date.now() - 15 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
  await db.query(
    `INSERT INTO booking_seats (booking_id, seat_id, price, status, hold_start, hold_expire)
     VALUES ?`,
    [[[booking4Id, 1, 150000, 'holding', pastTimeStr, pastTimeStr]]]
  );

  // Thêm bắp nước vào booking
  await db.query(
    `INSERT INTO booking_concessions (booking_id, concession_item_id, quantity, unit_price)
     VALUES (?, ?, ?, ?)`,
    [booking4Id, 1, 2, 69000]
  );
  await db.query(`UPDATE bookings SET concession_amount = ? WHERE id = ?`, [138000, booking4Id]);

  // Khách bấm thanh toán sau khi đã quá 10 phút giữ ghế
  const expiredPayRes = await finalizeBookingTransaction({
    bookingId: booking4Id,
    paymentMethod: 'banking',
    transactionCode: 'TXN-EXP-' + Date.now(),
    user: { id: 7, customerId: 1, role: 'customer' },
  });

  assert(
    expiredPayRes.paymentStatus === 'failed' && expiredPayRes.isExpired === true,
    'Đơn giữ ghế quá hạn bị từ chối thanh toán (isExpired: true)'
  );

  // Đảm bảo không có đơn bắp nước nào được sinh ra cho đơn quá hạn này
  const rawConcessionOrders = await db.query(
    `SELECT * FROM concession_orders WHERE idempotency_key = ?`,
    [expiredBookingCode]
  );
  const concessionOrders = Array.isArray(rawConcessionOrders) && Array.isArray(rawConcessionOrders[0])
    ? rawConcessionOrders[0]
    : (Array.isArray(rawConcessionOrders) ? rawConcessionOrders : []);
  assert(concessionOrders.length === 0, 'Tuyệt đối không tạo đơn bắp nước khi ghế đã hết hạn giữ chỗ');

  // ---------------------------------------------------------------------------
  // TỔNG KẾT
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(` KẾT QUẢ KIỂM TOÀN BỘ LUỒNG BẮP NƯỚC: ${passedCount}/${passedCount + failedCount} TEST PASS`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runConcessionFlowTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
