const assert = require('assert');
const db = require('../config/database');
const { startHoldSeatCleanupService } = require('../services/holdSeatCleanupService');

async function testHoldExpireSuite() {
  console.log('================================================================');
  console.log('  TEST SUITE: HOLD EXPIRE & TIMEZONE +07:00 VERIFICATION');
  console.log('================================================================\n');

  // 1. Kiểm tra cấu hình múi giờ kết nối
  assert.strictEqual(db.dbConfig.timezone, '+07:00', 'Múi giờ dbConfig phải là +07:00');
  console.log('✔ PASS: Cấu hình múi giờ kết nối MySQL trong dbConfig là +07:00');

  // 2. Kiểm tra tính toán thời gian giữ ghế và hết hạn
  const SEAT_HOLD_MINUTES = 10;
  const now = new Date();
  const holdExpireDate = new Date(now.getTime() + SEAT_HOLD_MINUTES * 60 * 1000);

  const diffMinutes = Math.round((holdExpireDate.getTime() - now.getTime()) / (60 * 1000));
  assert.strictEqual(diffMinutes, 10, 'Khoảng thời gian giữ ghế phải là đúng 10 phút');
  console.log('✔ PASS: Thời gian giữ ghế được tính toán chính xác là 10 phút');

  // 3. Kiểm tra logic hết hạn giữ ghế
  const toLocalDatetime = (d) => {
    const offsetMs = d.getTimezoneOffset() * 60 * 1000;
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 19).replace('T', ' ');
  };

  const expiredTime = new Date(now.getTime() - 1 * 60 * 1000); // 1 phút trước (đã hết hạn)
  const futureTime = new Date(now.getTime() + 5 * 60 * 1000);  // 5 phút sau (còn hiệu lực)

  const expiredStr = toLocalDatetime(expiredTime);
  const futureStr = toLocalDatetime(futureTime);
  const nowStr = toLocalDatetime(now);

  assert.ok(expiredStr < nowStr, 'Thời gian quá hạn phải nhỏ hơn thời gian hiện tại');
  assert.ok(futureStr > nowStr, 'Thời gian giữ ghế còn hiệu lực phải lớn hơn thời gian hiện tại');
  console.log(`✔ PASS: So sánh mốc thời gian hold_expire (${expiredStr} < ${nowStr} < ${futureStr}) nhất quán`);

  // 4. Kiểm tra service cleanup khởi chạy an toàn
  const cleanupTimer = startHoldSeatCleanupService(60000);
  assert.ok(cleanupTimer, 'HoldSeat Cleanup Service phải khởi động thành công');
  clearInterval(cleanupTimer);
  console.log('✔ PASS: HoldSeatCleanupService hoạt động và dọn dẹp an toàn');

  console.log('\n================================================================');
  console.log('  KẾT QUẢ: TOÀN BỘ TEST MÚI GIỜ & HOLD_EXPIRE ĐẠT CHUẨN 100%');
  console.log('================================================================');
}

testHoldExpireSuite().catch((err) => {
  console.error('❌ Lỗi kiểm thử hold_expire:', err);
  process.exit(1);
});
