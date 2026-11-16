/**
 * ĐÃ BỎ RÀNG BUỘC GHẾ TRỐNG ĐƠN LẺ THEO YÊU CẦU CỦA HỆ THỐNG
 * Cho phép khách hàng tự do chọn bất kỳ ghế nào, kể cả việc chừa 1 ghế ở giữa hai ghế.
 */

export function validateRowSingleSeatGap() {
  return { isValid: true };
}

export function validateAllSeatsGap() {
  return { isValid: true };
}
