/**
 * ĐÃ BỎ RÀNG BUỘC GHẾ TRỐNG ĐƠN LẺ THEO YÊU CẦU CỦA HỆ THỐNG
 * Cho phép khách hàng tự do chọn bất kỳ ghế nào, kể cả việc chừa 1 ghế ở giữa hai ghế.
 */

function validateRowSingleSeatGap() {
  return { isValid: true };
}

function validateAllSeatsGap() {
  return { isValid: true };
}

module.exports = {
  validateRowSingleSeatGap,
  validateAllSeatsGap,
};
