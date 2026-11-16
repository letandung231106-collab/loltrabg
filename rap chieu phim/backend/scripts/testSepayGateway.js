/**
 * Test Suite: SePay Automated Payment Gateway Integration
 * Ngân hàng thụ hưởng: BIDV (8813341949 - LE TAN DUNG)
 */
const http = require('http');

function apiCall(endpoint, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5050${endpoint}`);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runSepayTests() {
  console.log('================================================================');
  console.log('  TEST SUITE: SEPAY AUTOMATED PAYMENT GATEWAY (BIDV 8813341949) ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✔ PASS: ${message}`);
    } else {
      console.error(`  ✘ FAIL: ${message}`);
    }
  }

  // 1. Kiểm tra cấu hình SePay thông tin tài khoản BIDV
  console.log('[1. Thông Tin Cổng Thanh Toán SePay]');
  const infoRes = await apiCall('/api/sepay/info');
  assert(infoRes.status === 200 && infoRes.data.success, 'API /api/sepay/info phản hồi HTTP 200');
  assert(infoRes.data.data?.accountNumber === '8813341949', 'Số tài khoản thụ hưởng đúng là 8813341949');
  assert(infoRes.data.data?.bank === 'BIDV', 'Ngân hàng thụ hưởng là BIDV');
  assert(infoRes.data.data?.accountHolder === 'LE TAN DUNG', 'Tên chủ tài khoản đúng là LE TAN DUNG');

  // 2. Đăng ký phiên POS F&B
  console.log('\n[2. Đăng Ký Phiên Thanh Toán POS Quầy Bắp Nước]');
  const testOrderCode = `NIGHTMOVIE POS ${Math.floor(100000 + Math.random() * 900000)}`;
  const regPosRes = await apiCall('/api/sepay/register-pos-session', 'POST', {
    orderCode: testOrderCode,
    items: [
      { id: 1, name: 'Bắp Rang Bơ Phô Mai (L)', quantity: 2, price: 69000 },
      { id: 3, name: 'Coca-Cola Tươi (32oz)', quantity: 2, price: 39000 },
    ],
    totalAmount: 216000,
    staffId: 1,
  });
  assert(regPosRes.status === 200 && regPosRes.data.success, 'Đăng ký phiên SePay POS thành công');
  assert(regPosRes.data.data?.amount === 216000, 'Số tiền ghi nhận chính xác 216.000 đ');
  assert(regPosRes.data.data?.qrUrl && regPosRes.data.data.qrUrl.includes('8813341949'), 'Sinh URL VietQR SePay chứa đúng STK 8813341949');

  // 3. Polling trạng thái trước khi chuyển khoản
  console.log('\n[3. Polling Trạng Thái Thanh Toán]');
  const pendingStatus = await apiCall(`/api/sepay/status/${encodeURIComponent(testOrderCode)}`);
  assert(pendingStatus.status === 200 && pendingStatus.data.isPaid === false, 'Trạng thái ban đầu: isPaid = false (Đang chờ khách quét QR)');

  // 4. Bỏ qua giao dịch tiền ra (transferType != 'in')
  console.log('\n[4. Bảo Mật Webhook: Bỏ Qua Giao Dịch Tiền Ra]');
  const outTxRes = await apiCall('/api/sepay/webhook', 'POST', {
    id: 99901,
    gateway: 'BIDV',
    accountNumber: '8813341949',
    content: testOrderCode,
    transferType: 'out',
    transferAmount: 216000,
  });
  assert(outTxRes.status === 200, 'Webhook nhận giao dịch tiền ra');
  const checkOutStatus = await apiCall(`/api/sepay/status/${encodeURIComponent(testOrderCode)}`);
  assert(checkOutStatus.data.isPaid === false, 'Giao dịch tiền ra KHÔNG kích hoạt thanh toán (isPaid vẫn là false)');

  // 5. Tiếp nhận Webhook SePay biến động số dư thực tế
  console.log('\n[5. Webhook Nhận Tiền Vào (transferType: in) Tự Động Xử Lý]');
  const webhookRes = await apiCall('/api/sepay/webhook', 'POST', {
    id: 99902,
    gateway: 'BIDV',
    transactionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    accountNumber: '8813341949',
    code: null,
    content: `${testOrderCode}`,
    transferType: 'in',
    transferAmount: 216000,
    referenceCode: `FT-BIDV-${Date.now()}`,
    description: `LE TAN DUNG chuyen khoan ${testOrderCode}`,
  });
  assert(webhookRes.status === 200 && webhookRes.data.success, 'Webhook tiếp nhận và xử lý thành công HTTP 200');
  assert(webhookRes.data.data?.matched === true, 'SePay nhận diện khớp chính xác mã đơn hàng POS');
  assert(webhookRes.data.data?.result?.order_id !== undefined, 'Hệ thống đã tự động tạo đơn và trừ kho BOM');

  // 6. Polling trạng thái sau khi Webhook xử lý
  console.log('\n[6. Polling Trạng Thái Sau Khi SePay Ghi Nhận]');
  const paidStatus = await apiCall(`/api/sepay/status/${encodeURIComponent(testOrderCode)}`);
  assert(paidStatus.status === 200 && paidStatus.data.isPaid === true, 'Trạng thái cập nhật tức thì: isPaid = true');
  assert(paidStatus.data.type === 'pos', 'Loại đơn hàng nhận diện là POS');
  assert(paidStatus.data.transaction?.gateway === 'BIDV', 'Thông tin giao dịch BIDV ghi nhận đầy đủ');

  // 7. Chống ghi nhận trùng lặp (Idempotency)
  console.log('\n[7. Tính Bất Biến & Chống Gửi Lại Webhook Trùng (Idempotency)]');
  const dupWebhookRes = await apiCall('/api/sepay/webhook', 'POST', {
    id: 99903,
    gateway: 'BIDV',
    accountNumber: '8813341949',
    content: testOrderCode,
    transferType: 'in',
    transferAmount: 216000,
    referenceCode: `FT-BIDV-DUP-${Date.now()}`,
  });
  assert(dupWebhookRes.status === 200, 'Gửi lại Webhook không gây crash server');

  // 8. Đăng ký & Giả Lập Thanh Toán Vé Xem Phim (Booking)
  console.log('\n[8. Tích Hợp SePay Cho Vé Xem Phim]');
  const testBkCode = `BK-${Date.now().toString().slice(-6)}`;
  const regBkRes = await apiCall('/api/sepay/register-booking-session', 'POST', {
    bookingId: 1,
    bookingCode: testBkCode,
    totalAmount: 180000,
  });
  assert(regBkRes.status === 200 && regBkRes.data.success, 'Đăng ký phiên SePay cho vé xem phim thành công');

  const simBkRes = await apiCall('/api/sepay/simulate-payment', 'POST', {
    orderCode: testBkCode,
    amount: 180000,
  });
  assert(simBkRes.status === 200 && simBkRes.data.success, 'Giả lập thanh toán vé xem phim qua SePay thành công');

  const paidBkStatus = await apiCall(`/api/sepay/status/${encodeURIComponent(testBkCode)}`);
  assert(paidBkStatus.status === 200 && paidBkStatus.data.isPaid === true, 'Kiểm tra trạng thái vé xem phim: isPaid = true');

  console.log('\n================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ SEPAY: ${passed}/${total} TESTS PASS (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runSepayTests().catch((e) => {
  console.error('Fatal Test Error:', e);
  process.exit(1);
});
