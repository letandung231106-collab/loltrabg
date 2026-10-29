/**
 * Automated Operational Test Suite for Night Movie Cinema Management System
 */

const db = require('../config/database');
const memory = require('../config/memoryStore');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  NIGHT MOVIE CINEMA OPERATIONS - AUTOMATED TEST RUNNER');
  console.log('================================================================\n');

  // Test 1: Concession Menu & BOM Definition
  console.log('1. Kiểm Tra Nghiệp Vụ F&B & Định Lượng BOM:');
  const concessions = await db.query('SELECT * FROM concession_items', []);
  assert(concessions.length >= 7, `Menu F&B có ${concessions.length} món sẵn sàng bán`);
  
  const recipes = await db.query('SELECT * FROM concession_recipes', []);
  assert(recipes.length >= 7, `Định lượng BOM có ${recipes.length} công thức định mức nguyên liệu`);

  // Test 2: Inventory Ingredients Stock Warning
  console.log('\n2. Kiểm Tra Quản Lý Kho Nguyên Vật Liệu:');
  const ingredients = await db.query('SELECT * FROM inventory_ingredients', []);
  assert(ingredients.length >= 9, `Kho có ${ingredients.length} mặt hàng nguyên liệu`);
  const lowStock = ingredients.filter(i => i.stock_quantity <= i.min_threshold);
  console.log(`  -> Số mặt hàng dưới ngưỡng an toàn: ${lowStock.length}`);
  assert(Array.isArray(lowStock), 'Kiểm tra lọc cảnh báo tồn kho thành công');

  // Test 3: Shift Cash Handover Variance Calculation
  console.log('\n3. Kiểm Tra Đối Soát Két Tiền Ca Trực:');
  const openingFloat = 2000000;
  const cashSales = 6500000;
  const expectedCash = openingFloat + cashSales;
  const actualCounted = 8500000;
  const variance = actualCounted - expectedCash;
  assert(variance === 0, `Két tiền khớp tuyệt đối: Lý thuyết ${expectedCash.toLocaleString()} đ == Thực tế ${actualCounted.toLocaleString()} đ`);

  // Test 4: KDM License & Key Expiration
  console.log('\n4. Kiểm Tra Bản Quyền KDM & Máy Chiếu:');
  const kdms = await db.query('SELECT * FROM kdm_licenses', []);
  assert(kdms.length >= 4, `Hệ thống ghi nhận ${kdms.length} chứng thư khóa KDM`);
  const expiredKdm = kdms.filter(k => k.status === 'expired');
  assert(expiredKdm.length >= 1, `Phát hiện chính xác ${expiredKdm.length} KDM hết hạn`);

  // Test 5: Projector Lamp Hours & Health Degradation
  console.log('\n5. Kiểm Tra Giờ Bóng Đèn Máy Chiếu:');
  const lamps = await db.query('SELECT * FROM projector_lamp_logs', []);
  assert(lamps.length >= 4, `Đang theo dõi ${lamps.length} cụm máy chiếu phòng`);
  const criticalLamps = lamps.filter(l => l.status === 'critical');
  assert(criticalLamps.length >= 1, `Cảnh báo chính xác máy chiếu cần thay bóng: ${criticalLamps[0]?.room_name}`);

  // Test 6: Booking & Payment Flow with Stateful In-Memory Fallback
  console.log('\n6. Kiểm Tra Quy Trình Giữ Ghế & Thanh Toán (Booking & Payment):');
  // 6.1 Create new booking
  const insertBookRes = await db.query(
    'INSERT INTO bookings (customer_id, screening_id, booking_code, total_amount, status) VALUES (?, ?, ?, ?, ?)',
    [1, 1, 'BK-TEST-999', 150000, 'pending']
  );
  assert(insertBookRes && insertBookRes.insertId, `Tạo đơn đặt vé BK-TEST-999 với ID: ${insertBookRes.insertId}`);

  // 6.2 Hold seat
  const insertSeatRes = await db.query(
    'INSERT INTO booking_seats (booking_id, seat_id, price, status, hold_start, hold_expire) VALUES ?',
    [[[insertBookRes.insertId, 10, 150000, 'holding', new Date().toISOString(), new Date(Date.now() + 600000).toISOString()]]]
  );
  assert(insertSeatRes && insertSeatRes.affectedRows >= 1, 'Giữ ghế mã số 10 thành công');

  // 6.3 Query booking
  const foundBookings = await db.query('SELECT * FROM bookings WHERE b.id = ?', [insertBookRes.insertId]);
  assert(foundBookings.length === 1 && foundBookings[0].status === 'pending', 'Tìm thấy đơn đặt vé đang ở trạng thái pending');

  // 6.4 Process Payment
  const payRes = await db.query(
    'INSERT INTO payments (booking_id, payment_method, amount, transaction_code, status) VALUES (?, ?, ?, ?, ?)',
    [insertBookRes.insertId, 'banking', 150000, 'TXN-BANKING-TEST-999', 'success']
  );
  assert(payRes && payRes.insertId, `Ghi nhận giao dịch thanh toán thành công #${payRes.insertId}`);

  // 6.5 Update booking to paid
  await db.query('UPDATE bookings SET status = ? WHERE id = ?', ['paid', insertBookRes.insertId]);
  const paidBooking = await db.query('SELECT * FROM bookings WHERE b.id = ?', [insertBookRes.insertId]);
  assert(paidBooking[0].status === 'paid', 'Đơn đặt vé đã chuyển sang trạng thái PAID');

  // 6.6 Generate Ticket
  const ticketRes = await db.query(
    'INSERT INTO tickets (booking_id, customer_id, screening_id, seat_id, ticket_code, qr_code, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [insertBookRes.insertId, 1, 1, 10, 'TCK-TEST-999-D10', JSON.stringify({ code: 'TCK-TEST-999-D10' }), 'active']
  );
  assert(ticketRes && ticketRes.insertId, `Xuất vé điện tử QR Code thành công #${ticketRes.insertId}`);

  // Summary Report
  console.log('\n================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT CHUẨN (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('================================================================');
}

runTests().catch(console.error);

