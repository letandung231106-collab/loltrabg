/**
 * QUY TẮC NGHIỆP VỤ: KHÔNG ĐỂ LẠI GHẾ TRỐNG ĐƠN LẺ (SINGLE SEAT GAP RULE) - NIGHT MOVIE
 * 
 * 1. Áp dụng cho: Ghế thường và Ghế VIP ở các hàng A–E.
 * 2. Không cho phép thao tác đặt ghế tạo ra đúng 1 ghế trống bị kẹp giữa hai ghế không thể đặt
 *    (đã bán, đang được giữ hợp lệ hoặc không khả dụng / bảo trì).
 * 3. NGOẠI LỆ: Cho phép ghế trống đơn lẻ ở hai đầu hàng, tức ghế ngoài cùng bên trái (số 1)
 *    hoặc ngoài cùng bên phải (số 12). Ví dụ: A1 trống hoặc A12 trống -> CHO PHÉP.
 * 4. Nếu một ghế đang là ghế trống đơn lẻ ở giữa hàng, khách được phép chọn chính ghế đó để lấp chỗ trống.
 * 5. Kiểm tra toàn bộ nhóm ghế khách chọn cùng lúc, không kiểm tra từng ghế riêng lẻ.
 * 6. Backend phải kiểm tra lại quy tắc trước khi xác nhận giữ ghế hoặc đặt vé.
 * 7. Ghế Couple F1–F12: KHÔNG ÁP DỤNG quy tắc này.
 */

/**
 * Kiểm tra quy tắc ghế trống đơn lẻ cho 1 hàng ghế
 * @param {Array} rowSeats - Danh sách tất cả ghế vật lý trong 1 hàng (đã sắp xếp seat_number tăng dần)
 * @param {Set|Array} selectedSeatIds - Danh sách id các ghế người dùng đang chọn / yêu cầu giữ
 * @param {Function} isSeatUnavailableBefore - Hàm kiểm tra ghế đã không thể đặt trước thao tác
 * @returns {Object} { isValid: boolean, orphanSeat: Object | null, message: string }
 */
function validateRowSingleSeatGap(rowSeats, selectedSeatIds, isSeatUnavailableBefore) {
  const selectedSet = new Set(Array.from(selectedSeatIds).map(Number));
  const n = rowSeats.length;
  // Nếu hàng có ít hơn hoặc bằng 2 ghế thì không thể có ghế bị kẹp giữa 2 ghế
  if (n <= 2) return { isValid: true };

  // Trạng thái sau khi áp dụng lựa chọn của khách hàng
  const isUnavailableAfter = (seat) =>
    selectedSet.has(Number(seat.id)) || isSeatUnavailableBefore(seat);

  // Kiểm tra ghế tại vị trí index i có phải là ghế trống đơn lẻ BỊ KẸP GIỮA HAI GHẾ KHÔNG THỂ ĐẶT không
  // NGOẠI LỆ (Mục 3): Ghế ngoài cùng bên trái (i === 0) hoặc ngoài cùng bên phải (i === n - 1) được phép trống!
  const isTrappedOrphan = (i, isUnavailFn) => {
    // Nếu ghế này không trống -> Không phải ghế trống đơn lẻ
    if (isUnavailFn(rowSeats[i])) return false;

    // NGOẠI LỆ: Ghế ở hai đầu hàng (ngoài cùng bên trái hoặc bên phải) được phép trống đơn lẻ
    if (i === 0 || i === n - 1) return false;

    // Ghế ở giữa hàng (0 < i < n - 1): Bị kẹp nếu CẢ bên trái VÀ bên phải đều là ghế không thể đặt
    const leftBlocked = isUnavailFn(rowSeats[i - 1]);
    const rightBlocked = isUnavailFn(rowSeats[i + 1]);

    return leftBlocked && rightBlocked;
  };

  for (let i = 0; i < n; i++) {
    const orphanAfter = isTrappedOrphan(i, isUnavailableAfter);
    if (orphanAfter) {
      const orphanBefore = isTrappedOrphan(i, isSeatUnavailableBefore);
      // Nếu thao tác này làm xuất hiện ghế trống đơn lẻ mới bị kẹp ở giữa hàng mà trước đó chưa có
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
