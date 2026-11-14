/**
 * QUY TẮC NGHIỆP VỤ: KHÔNG ĐỂ LẠI GHẾ TRỐNG ĐƠN LẺ (SINGLE SEAT GAP RULE)
 * - Phạm vi: Hàng thường (A, B, C) và Hàng VIP (D, E).
 * - Không áp dụng cho ghế Couple: F1–F12.
 * - Thông báo chuẩn: "Không thể chọn ghế này vì sẽ để lại một chỗ trống đơn lẻ. Vui lòng chọn vị trí khác."
 */

/**
 * Kiểm tra quy tắc ghế trống đơn lẻ cho 1 hàng ghế
 * @param {Array} rowSeats - Danh sách tất cả ghế vật lý trong 1 hàng (đã sắp xếp seat_number tăng dần)
 * @param {Set|Array} selectedSeatIds - Danh sách id các ghế người dùng đang chọn / yêu cầu giữ
 * @param {Function} isSeatUnavailableBefore - Hàm kiểm tra ghế đã không thể đặt trước thao tác (đã bán, đang giữ hợp lệ, bảo trì/hỏng)
 * @returns {Object} { isValid: boolean, orphanSeat: Object | null, message: string }
 */
function validateRowSingleSeatGap(rowSeats, selectedSeatIds, isSeatUnavailableBefore) {
  const selectedSet = new Set(Array.from(selectedSeatIds).map(Number));
  const n = rowSeats.length;
  if (n <= 1) return { isValid: true };

  // Trạng thái sau khi áp dụng lựa chọn của khách hàng
  const isUnavailableAfter = (seat) =>
    selectedSet.has(Number(seat.id)) || isSeatUnavailableBefore(seat);

  // Kiểm tra ghế tại vị trí index i có phải là ghế trống đơn lẻ không
  const isOrphan = (i, isUnavailFn) => {
    if (isUnavailFn(rowSeats[i])) return false; // Ghế đã bị chiếm hoặc không thể đặt thì không phải ghế trống
    const leftBlocked = i === 0 || isUnavailFn(rowSeats[i - 1]);
    const rightBlocked = i === n - 1 || isUnavailFn(rowSeats[i + 1]);
    return leftBlocked && rightBlocked;
  };

  for (let i = 0; i < n; i++) {
    const orphanAfter = isOrphan(i, isUnavailableAfter);
    if (orphanAfter) {
      const orphanBefore = isOrphan(i, isSeatUnavailableBefore);
      // Nếu thao tác này làm xuất hiện ghế trống đơn lẻ mới mà trước đó không có
      if (!orphanBefore) {
        return {
          isValid: false,
          orphanSeat: rowSeats[i],
          message: 'Không thể chọn ghế này vì sẽ để lại một chỗ trống đơn lẻ. Vui lòng chọn vị trí khác.',
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Kiểm tra toàn bộ danh sách ghế chọn trên tất cả các hàng bị ảnh hưởng
 * @param {Array} allSeats - Toàn bộ ghế vật lý của phòng chiếu
 * @param {Set|Array} selectedSeatIds - Danh sách id các ghế người dùng chọn
 * @param {Function} isSeatUnavailableBefore - Hàm kiểm tra ghế đã không thể đặt trước thao tác
 * @returns {Object} { isValid: boolean, message?: string, orphanSeat?: Object }
 */
function validateAllSeatsGap(allSeats, selectedSeatIds, isSeatUnavailableBefore) {
  const selectedSet = new Set(Array.from(selectedSeatIds).map(Number));
  const selectedSeatsList = allSeats.filter((s) => selectedSet.has(Number(s.id)));

  // Gom các hàng cần kiểm tra (chỉ hàng A, B, C, D, E; bỏ qua hàng F)
  const affectedRows = [
    ...new Set(
      selectedSeatsList
        .filter((s) => s.seat_type !== 'couple' && ['A', 'B', 'C', 'D', 'E'].includes(s.row_number))
        .map((s) => s.row_number)
    ),
  ];

  if (affectedRows.length === 0) {
    return { isValid: true };
  }

  // Nhóm ghế theo từng hàng
  const rowMap = {};
  allSeats.forEach((seat) => {
    if (affectedRows.includes(seat.row_number)) {
      if (!rowMap[seat.row_number]) rowMap[seat.row_number] = [];
      rowMap[seat.row_number].push(seat);
    }
  });

  for (const rowKey of affectedRows) {
    const rowSeats = (rowMap[rowKey] || []).sort((a, b) => a.seat_number - b.seat_number);
    const result = validateRowSingleSeatGap(rowSeats, selectedSet, isSeatUnavailableBefore);
    if (!result.isValid) {
      return result;
    }
  }

  return { isValid: true };
}

module.exports = {
  validateRowSingleSeatGap,
  validateAllSeatsGap,
};
