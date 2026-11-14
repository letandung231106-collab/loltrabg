import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { validateAllSeatsGap } from '../../utils/seatGapValidator';
import {
  Clock,
  Check,
  Eye,
  Heart,
  Crown,
  Footprints,
  ArrowDown,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Virtual3DSeatViewModal } from './Virtual3DSeatViewModal';

export function SeatMap({ scheduleData, onProceedToPayment, onCancelHold }) {
  const {
    selectedSeats,
    toggleSeatSelection,
    activeBooking,
    formattedHoldTime,
    isHolding,
    totalPeople,
  } = useBooking();
  const { isAuthenticated } = useAuth();

  const [previewSeat, setPreviewSeat] = useState(null);
  const [gapError, setGapError] = useState('');

  const seats = scheduleData?.seats || [];
  const schedule = scheduleData?.schedule;

  // Group seats by row_number (A, B, C, D, E, F)
  const rows = {};
  seats.forEach((seat) => {
    if (!rows[seat.row_number]) {
      rows[seat.row_number] = [];
    }
    rows[seat.row_number].push(seat);
  });

  // Ensure row keys are sorted A -> F
  const rowKeys = Object.keys(rows).sort();

  // Total price of selected seats
  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  // Total seating capacity of selected seats (standard/vip = 1, couple = 2)
  const calculatedPeopleCount =
    totalPeople ||
    selectedSeats.reduce((sum, s) => sum + (s.seat_type === 'couple' ? 2 : 1), 0);

  // Xử lý chọn/bỏ chọn ghế có kiểm tra quy tắc không để lại ghế trống đơn lẻ
  const handleSeatClick = (seat) => {
    if (seat.state !== 'available' && !selectedSeats.some((s) => s.id === seat.id)) {
      return;
    }

    const isCurrentlySelected = selectedSeats.some((s) => s.id === seat.id);
    const proposed = isCurrentlySelected
      ? selectedSeats.filter((s) => s.id !== seat.id)
      : [...selectedSeats, seat];

    // Kiểm tra quy tắc Single Seat Gap Rule cho toàn bộ hàng bị ảnh hưởng
    const isUnavailableBefore = (s) => s.state !== 'available';
    const validation = validateAllSeatsGap(
      seats,
      proposed.map((s) => s.id),
      isUnavailableBefore
    );

    if (!validation.isValid) {
      setGapError(
        validation.message ||
          'Không thể chọn ghế này vì sẽ để lại một chỗ trống đơn lẻ. Vui lòng chọn vị trí khác.'
      );
      return;
    }

    setGapError('');
    toggleSeatSelection(seat);
  };

  // Xác thực lại trước khi chuyển sang bước thanh toán/giữ chỗ
  const handleProceed = () => {
    const isUnavailableBefore = (s) => s.state !== 'available';
    const validation = validateAllSeatsGap(
      seats,
      selectedSeats.map((s) => s.id),
      isUnavailableBefore
    );

    if (!validation.isValid) {
      setGapError(
        validation.message ||
          'Không thể chọn ghế này vì sẽ để lại một chỗ trống đơn lẻ. Vui lòng chọn vị trí khác.'
      );
      return;
    }

    setGapError('');
    onProceedToPayment();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 10-Minute Hold Active Banner */}
      {isHolding && activeBooking && (
        <div className="w-full max-w-4xl mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-cinema-900 to-blue-950 border-2 border-blue-500/60 shadow-glow-blue animate-fade-in flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-white text-base flex items-center gap-2">
                <span>Ghế đã được giữ tạm thời</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold font-mono">
                  Mã: {activeBooking.bookingCode}
                </span>
              </div>
              <div className="text-xs text-blue-300">
                Ghế sẽ tự động mở lại cho khách khác nếu chưa hoàn tất thanh toán khi hết giờ.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Thời gian giữ ghế còn lại:</span>
              <span className="text-2xl font-black font-mono tracking-wider text-amber-400 drop-shadow">
                {formattedHoldTime()}
              </span>
            </div>
            <button
              onClick={onProceedToPayment}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white font-bold text-sm shadow-glow-red transition-all animate-pulse"
            >
              Thanh Toán Ngay
            </button>
          </div>
        </div>
      )}

      {/* Thông báo vi phạm quy tắc ghế trống đơn lẻ */}
      {gapError && (
        <div className="w-full max-w-3xl mb-6 p-4 rounded-2xl bg-ruby-950/95 border-2 border-ruby-500 text-ruby-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-glow-red animate-shake">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-ruby-400 shrink-0" />
            <span>{gapError}</span>
          </div>
          <button
            onClick={() => setGapError('')}
            className="text-ruby-300 hover:text-white font-bold ml-3 text-xs"
          >
            ✕ Đóng
          </button>
        </div>
      )}

      {/* Screen Curved Projection */}
      <div className="w-full max-w-3xl mb-10 text-center">
        <div className="cinema-screen-curve w-full mx-auto" />
        <div className="cinema-screen-glow h-10 w-full -mt-2 pointer-events-none" />
        <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-2 flex items-center justify-center gap-2">
          <span className="text-slate-300 font-extrabold">MÀN HÌNH CHIẾU • {schedule?.room_name || 'NIGHT MOVIE CINEMA'}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cinema-800 text-amber-300 border border-amber-500/30 font-semibold hidden sm:inline-block">
            Bấm vào ghế đã chọn để xem góc nhìn 3D
          </span>
        </div>
      </div>

      {/* Cinema Room Layout with Two Side Aisles (Không có lối đi giữa) */}
      <div className="w-full overflow-x-auto pb-4 flex justify-center px-2 sm:px-4">
        <div className="inline-flex items-stretch gap-2 sm:gap-3.5 px-2 sm:px-3 min-w-fit select-none">
          {/* LỐI ĐI 1 - CỬA TÂY (BÊN TRÁI) */}
          <div className="flex flex-col justify-between py-2 px-1.5 sm:px-2 rounded-2xl bg-cinema-900/90 border border-cinema-800 text-slate-400 shrink-0 shadow-lg">
            <div className="flex flex-col items-center gap-1 pb-1.5 border-b border-cinema-800/80">
              <ArrowDown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider whitespace-nowrap">LỐI ĐI 1</span>
              <span className="text-[8px] text-slate-500 font-mono whitespace-nowrap">CỬA TÂY</span>
            </div>

            {/* Đèn LED hắt chân bậc thang theo từng hàng */}
            <div className="flex-1 flex flex-col justify-around py-2">
              {rowKeys.map((r) => (
                <div
                  key={`aisle-left-${r}`}
                  className="flex items-center justify-center gap-1 text-[9px] text-amber-400/80 font-mono py-1"
                  title={`Bậc thang hàng ${r} - Lối đi Trái`}
                >
                  <Footprints className="w-3 h-3 text-amber-400/70" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse" />
                </div>
              ))}
            </div>

            <div className="text-[8px] text-slate-500 text-center pt-1.5 border-t border-cinema-800/80 font-mono whitespace-nowrap">
              BẬC LED
            </div>
          </div>

          {/* KHU VỰC GHẾ TRUNG TÂM (A1-F12 LIỀN MẠCH, KHÔNG CÓ LỐI ĐI GIỮA) */}
          <div className="space-y-2 sm:space-y-2.5">
            {rowKeys.map((rowKey) => {
              const isCoupleRow = rowKey === 'F';

              return (
                <div key={rowKey} className="flex items-center justify-center gap-1 sm:gap-1.5">
                  {/* Row Label Left */}
                  <div className="w-5 sm:w-6 text-center font-black text-xs text-slate-400 font-mono">
                    {rowKey}
                  </div>

                  {/* Seat Buttons in Row */}
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {rows[rowKey].map((seat) => {
                      const isSelected = selectedSeats.some((s) => s.id === seat.id);
                      const isHoldingByOther = seat.state === 'holding' && !isSelected;
                      const isBooked = seat.state === 'booked';
                      const isBroken = seat.state === 'unavailable';
                      const isCouple = seat.seat_type === 'couple' || isCoupleRow;

                      // Base visual styling
                      let seatStyle =
                        'bg-slate-800 text-slate-300 border-slate-600/70 hover:bg-slate-700 hover:border-slate-400 hover:text-white';
                      let cursor = 'cursor-pointer hover:scale-105 active:scale-95';
                      let statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (Ghế Thường) - ${Number(seat.price).toLocaleString('vi-VN')}đ`;

                      if (isBroken) {
                        seatStyle =
                          'bg-zinc-900/60 text-zinc-600 border-zinc-800 cursor-not-allowed';
                        cursor = 'cursor-not-allowed';
                        statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (⚪ Bảo trì / Tạm ngừng phục vụ)`;
                      } else if (isBooked) {
                        seatStyle =
                          'bg-rose-950 text-rose-500 border-rose-800/80 cursor-not-allowed font-bold opacity-80';
                        cursor = 'cursor-not-allowed';
                        statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (🔴 ĐÃ BÁN - Không thể chọn)`;
                      } else if (isHoldingByOther) {
                        seatStyle =
                          'bg-blue-950 text-blue-400 border-blue-500/80 animate-pulse font-bold';
                        cursor = 'cursor-not-allowed';
                        statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (🔵 ĐANG ĐƯỢC GIỮ 10 PHÚT)`;
                      } else if (isSelected) {
                        seatStyle =
                          'bg-gradient-to-t from-orange-600 via-amber-500 to-amber-400 text-cinema-950 font-black border-white shadow-glow-amber scale-105 ring-2 ring-amber-400';
                        statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (🟡 Đang chọn) - ${Number(seat.price).toLocaleString('vi-VN')}đ`;
                      } else if (seat.seat_type === 'vip') {
                        seatStyle =
                          'bg-amber-950/70 text-amber-300 border-amber-500/70 hover:bg-amber-900/80 hover:border-amber-400 hover:text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.15)]';
                        statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (👑 Ghế VIP) - ${Number(seat.price).toLocaleString('vi-VN')}đ`;
                      } else if (isCouple) {
                        seatStyle =
                          'bg-pink-950/70 text-pink-300 border-pink-500/70 hover:bg-pink-900/80 hover:border-pink-400 hover:text-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.15)]';
                        statusTitle = `Ghế Đôi ${seat.row_number}${seat.seat_number} (💖 Ghế Couple - 2 người ngồi) - ${Number(seat.price).toLocaleString('vi-VN')}đ`;
                      }

                      // Width & design: Couple seats have double-cushion width
                      const seatWidth = isCouple
                        ? 'min-w-[46px] sm:min-w-[50px] md:min-w-[54px] px-1'
                        : 'min-w-[28px] sm:min-w-[32px] md:min-w-[34px]';

                      return (
                        <button
                          key={seat.id}
                          disabled={isBooked || isHoldingByOther || isBroken}
                          onClick={() => handleSeatClick(seat)}
                          title={statusTitle}
                          className={`h-8 sm:h-8.5 ${seatWidth} rounded-lg border text-xs font-semibold flex items-center justify-center transition-all duration-150 relative ${seatStyle} ${cursor}`}
                        >
                          {isSelected ? (
                            <div className="flex items-center justify-center gap-1 font-black">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              {isCouple && (
                                <span className="text-[10px] font-mono">
                                  {seat.row_number}{seat.seat_number}
                                </span>
                              )}
                            </div>
                          ) : isCouple ? (
                            /* Minh họa ghế đôi 2 chỗ ngồi với icon trái tim */
                            <div className="flex items-center justify-center gap-0.5 sm:gap-1 w-full">
                              <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-400 fill-pink-500/40 shrink-0" />
                              <span className="font-bold text-[10px] sm:text-[11px] font-mono tracking-tight">
                                {seat.row_number}{seat.seat_number}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold font-mono">
                              {seat.row_number}{seat.seat_number}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Row Label Right */}
                  <div className="w-5 sm:w-6 text-center font-black text-xs text-slate-400 font-mono">
                    {rowKey}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LỐI ĐI 2 - CỬA ĐÔNG (BÊN PHẢI) */}
          <div className="flex flex-col justify-between py-2 px-1.5 sm:px-2 rounded-2xl bg-cinema-900/90 border border-cinema-800 text-slate-400 shrink-0 shadow-lg">
            <div className="flex flex-col items-center gap-1 pb-1.5 border-b border-cinema-800/80">
              <ArrowDown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider whitespace-nowrap">LỐI ĐI 2</span>
              <span className="text-[8px] text-slate-500 font-mono whitespace-nowrap">CỬA ĐÔNG</span>
            </div>

            {/* Đèn LED hắt chân bậc thang theo từng hàng */}
            <div className="flex-1 flex flex-col justify-around py-2">
              {rowKeys.map((r) => (
                <div
                  key={`aisle-right-${r}`}
                  className="flex items-center justify-center gap-1 text-[9px] text-amber-400/80 font-mono py-1"
                  title={`Bậc thang hàng ${r} - Lối đi Phải`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse" />
                  <Footprints className="w-3 h-3 text-amber-400/70" />
                </div>
              ))}
            </div>

            <div className="text-[8px] text-slate-500 text-center pt-1.5 border-t border-cinema-800/80 font-mono whitespace-nowrap">
              BẬC LED
            </div>
          </div>
        </div>
      </div>

      {/* Seat Legend (Bảng Chú Thích Ghế Chuẩn 7 Loại Trạng Thái) */}
      <div className="w-full max-w-4xl mt-8 pt-6 border-t border-cinema-700/60">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs text-slate-300">
          {/* 1. Ghế Thường */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-cinema-900/50 border border-cinema-800">
            <div className="w-7 h-6 rounded-md bg-slate-800 border border-slate-600/70 text-slate-300 flex items-center justify-center text-[10px] font-bold font-mono">
              A1
            </div>
            <div>
              <div className="font-bold text-white text-[11px]">Ghế Thường</div>
              <div className="text-[10px] text-slate-400">A1–C12 (Xanh xám)</div>
            </div>
          </div>

          {/* 2. Ghế VIP */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-cinema-900/50 border border-cinema-800">
            <div className="w-7 h-6 rounded-md bg-amber-950/70 border border-amber-500/70 text-amber-300 flex items-center justify-center text-[10px] font-bold font-mono">
              D1
            </div>
            <div>
              <div className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                <Crown className="w-3 h-3" /> Ghế VIP
              </div>
              <div className="text-[10px] text-slate-400">D1–E12 (Vàng)</div>
            </div>
          </div>

          {/* 3. Ghế Đôi Couple */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-cinema-900/50 border border-cinema-800">
            <div className="w-9 h-6 rounded-md bg-pink-950/70 border border-pink-500/70 text-pink-300 flex items-center justify-center text-[10px] font-bold font-mono gap-0.5">
              <Heart className="w-2.5 h-2.5 text-pink-400 fill-pink-400" /> F1
            </div>
            <div>
              <div className="font-bold text-pink-300 text-[11px] flex items-center gap-1">
                Ghế Couple
              </div>
              <div className="text-[10px] text-slate-400">F1–F12 (2 chỗ)</div>
            </div>
          </div>

          {/* 4. Ghế Đang Chọn */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-cinema-900/50 border border-cinema-800">
            <div className="w-7 h-6 rounded-md bg-gradient-to-t from-orange-600 via-amber-500 to-amber-400 text-cinema-950 font-black flex items-center justify-center text-[10px]">
              ✓
            </div>
            <div>
              <div className="font-bold text-amber-400 text-[11px]">Đang Chọn</div>
              <div className="text-[10px] text-slate-400">Màu cam</div>
            </div>
          </div>

          {/* 5. Ghế Đang Giữ */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-cinema-900/50 border border-cinema-800">
            <div className="w-7 h-6 rounded-md bg-blue-950 border border-blue-500/80 text-blue-400 flex items-center justify-center text-[10px] font-bold animate-pulse">
              🔒
            </div>
            <div>
              <div className="font-bold text-blue-400 text-[11px]">Đang Giữ</div>
              <div className="text-[10px] text-slate-400">10 phút (Xanh)</div>
            </div>
          </div>

          {/* 6. Ghế Đã Bán */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-cinema-900/50 border border-cinema-800">
            <div className="w-7 h-6 rounded-md bg-rose-950 border border-rose-800/80 text-rose-500 flex items-center justify-center text-[10px] font-bold">
              ✕
            </div>
            <div>
              <div className="font-bold text-rose-400 text-[11px]">Đã Bán</div>
              <div className="text-[10px] text-slate-400">Màu đỏ</div>
            </div>
          </div>

          {/* 7. Ghế Bảo Trì */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-cinema-900/50 border border-cinema-800">
            <div className="w-7 h-6 rounded-md bg-zinc-900/80 border border-zinc-800 text-zinc-600 flex items-center justify-center text-[10px]">
              —
            </div>
            <div>
              <div className="font-bold text-zinc-500 text-[11px]">Bảo Trì</div>
              <div className="text-[10px] text-slate-400">Xám tối</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Seats Bottom Action Bar */}
      <div className="w-full max-w-4xl mt-8 p-4 sm:p-5 rounded-2xl glass-panel border border-cinema-600/80 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Ghế đã chọn:</span>
            <strong className="text-white font-mono text-sm">
              {selectedSeats.length} mã ghế ({calculatedPeopleCount} người ngồi)
            </strong>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {selectedSeats.length === 0 ? (
              <span className="text-xs text-slate-500 italic">
                Chưa chọn ghế nào. Vui lòng bấm vào sơ đồ để chọn chỗ ngồi.
              </span>
            ) : (
              selectedSeats.map((s) => {
                const isCouple = s.seat_type === 'couple';
                const isVip = s.seat_type === 'vip';

                let badgeStyle =
                  'bg-slate-800/80 border-slate-600/60 text-slate-200';
                if (isCouple) {
                  badgeStyle =
                    'bg-pink-950/80 border-pink-500/60 text-pink-300';
                } else if (isVip) {
                  badgeStyle =
                    'bg-amber-950/80 border-amber-500/60 text-amber-300';
                }

                return (
                  <div key={s.id} className="inline-flex items-center gap-1">
                    <span
                      className={`px-2.5 py-1 rounded-lg border font-bold text-xs flex items-center gap-1 shadow-sm ${badgeStyle}`}
                    >
                      {isCouple ? (
                        <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                      ) : isVip ? (
                        <Crown className="w-3 h-3 text-amber-400" />
                      ) : null}
                      <span>
                        {s.row_number}{s.seat_number}{' '}
                        {isCouple
                          ? '(Đôi - 2 người)'
                          : isVip
                          ? '(VIP)'
                          : '(Thường)'}{' '}
                        • {Number(s.price).toLocaleString('vi-VN')}đ
                      </span>
                    </span>
                    <button
                      onClick={() => setPreviewSeat(s)}
                      className="p-1 rounded-md bg-cinema-800 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-[10px] flex items-center gap-0.5 transition-colors"
                      title="Xem mô phỏng góc nhìn 3D"
                    >
                      <Eye className="w-3 h-3" /> 3D
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Tổng tiền tạm tính:</span>
            <span className="text-2xl font-black text-amber-400 font-mono tracking-tight drop-shadow">
              {totalPrice.toLocaleString('vi-VN')}{' '}
              <span className="text-xs font-normal text-slate-400">VNĐ</span>
            </span>
          </div>

          {!isHolding ? (
            <button
              disabled={selectedSeats.length === 0}
              onClick={handleProceed}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-ruby-600 via-ruby-700 to-rose-700 hover:from-ruby-500 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-glow-red transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              Tiếp Tục Đặt Vé ({selectedSeats.length} ghế • {calculatedPeopleCount} người)
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onCancelHold}
                className="px-4 py-2.5 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Hủy giữ ghế
              </button>
              <button
                onClick={onProceedToPayment}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-glow-emerald transition-all hover:scale-105"
              >
                Thanh Toán ({formattedHoldTime()})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Virtual 3D Seat View Modal */}
      <Virtual3DSeatViewModal
        seat={previewSeat}
        schedule={schedule}
        isOpen={Boolean(previewSeat)}
        onClose={() => setPreviewSeat(null)}
      />
    </div>
  );
}
