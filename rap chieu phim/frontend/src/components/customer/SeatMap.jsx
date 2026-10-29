import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { Clock, ShieldAlert, Sparkles, Check, AlertCircle } from 'lucide-react';

export function SeatMap({ scheduleData, onProceedToPayment, onCancelHold }) {
  const { selectedSeats, toggleSeatSelection, activeBooking, formattedHoldTime, isHolding } = useBooking();
  const { isAuthenticated } = useAuth();

  const seats = scheduleData?.seats || [];
  const schedule = scheduleData?.schedule;

  // Group seats by row_number
  const rows = {};
  seats.forEach((seat) => {
    if (!rows[seat.row_number]) {
      rows[seat.row_number] = [];
    }
    rows[seat.row_number].push(seat);
  });

  const rowKeys = Object.keys(rows).sort();

  // Total price of selected seats
  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

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
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                  Mã: {activeBooking.bookingCode}
                </span>
              </div>
              <div className="text-xs text-blue-300">
                Ghế sẽ tự động mở lại cho khách khác nếu chưa thanh toán khi hết giờ.
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

      {/* Screen Curved Projection */}
      <div className="w-full max-w-3xl mb-12 text-center">
        <div className="cinema-screen-curve w-full mx-auto" />
        <div className="cinema-screen-glow h-12 w-full -mt-2 pointer-events-none" />
        <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-1">
          MÀN HÌNH CHIẾU ({schedule?.room_name})
        </div>
      </div>

      {/* Seat Matrix */}
      <div className="w-full max-w-4xl overflow-x-auto pb-4 flex justify-center">
        <div className="inline-block min-w-[580px] space-y-2.5">
          {rowKeys.map((rowKey) => (
            <div key={rowKey} className="flex items-center justify-center gap-2">
              {/* Row Label Left */}
              <div className="w-6 text-center font-bold text-xs text-slate-400 font-mono">{rowKey}</div>

              {/* Seat Buttons in Row */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {rows[rowKey].map((seat) => {
                  const isSelected = selectedSeats.some((s) => s.id === seat.id);
                  const isHoldingByOther = seat.state === 'holding' && !isSelected;
                  const isBooked = seat.state === 'booked';
                  const isBroken = seat.state === 'unavailable';

                  let seatStyle = 'bg-cinema-800 text-slate-300 hover:bg-cinema-700 border-cinema-600/60';
                  let cursor = 'cursor-pointer hover:scale-110';
                  let statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (${seat.seat_type.toUpperCase()}) - ${seat.price.toLocaleString('vi-VN')}đ`;

                  if (isBroken) {
                    seatStyle = 'bg-cinema-900/40 text-slate-600 border-cinema-800 cursor-not-allowed';
                    cursor = 'cursor-not-allowed';
                    statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (Tạm ngừng phục vụ / Hỏng)`;
                  } else if (isBooked) {
                    seatStyle = 'bg-rose-950 text-rose-500 border-rose-800/80 cursor-not-allowed font-bold';
                    cursor = 'cursor-not-allowed';
                    statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (🔴 ĐÃ ĐẶT - Không thể chọn)`;
                  } else if (isHoldingByOther) {
                    seatStyle = 'bg-blue-950 text-blue-400 border-blue-600/80 animate-pulse font-bold';
                    cursor = 'cursor-not-allowed';
                    statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (🔵 ĐANG ĐƯỢC NGƯỜI KHÁC GIỮ)`;
                  } else if (isSelected) {
                    seatStyle = 'bg-gradient-to-t from-gold-600 to-amber-400 text-cinema-950 font-black border-white shadow-glow-amber scale-105';
                    statusTitle = `Ghế ${seat.row_number}${seat.seat_number} (Đã chọn)`;
                  } else if (seat.seat_type === 'vip') {
                    seatStyle = 'bg-cinema-850 text-amber-300 border-amber-500/40 hover:border-amber-400';
                  } else if (seat.seat_type === 'couple') {
                    seatStyle = 'bg-cinema-850 text-pink-400 border-pink-500/40 hover:border-pink-400 w-16';
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={isBooked || isHoldingByOther || isBroken}
                      onClick={() => toggleSeatSelection(seat)}
                      title={statusTitle}
                      className={`h-8 min-w-[32px] sm:h-9 sm:min-w-[36px] rounded-lg border text-xs font-semibold flex items-center justify-center transition-all duration-150 ${seatStyle} ${cursor}`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span>{seat.row_number}{seat.seat_number}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <div className="w-6 text-center font-bold text-xs text-slate-400 font-mono">{rowKey}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Seat Legend (Mục 39) */}
      <div className="w-full max-w-2xl mt-8 pt-6 border-t border-cinema-700/60">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cinema-800 border border-cinema-600 flex items-center justify-center text-[10px]">A1</div>
            <span>🟢 Trống (Ghế Thường)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cinema-850 border border-amber-500/50 text-amber-300 flex items-center justify-center text-[10px]">D1</div>
            <span>👑 Ghế VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-6 rounded-md bg-cinema-850 border border-pink-500/50 text-pink-400 flex items-center justify-center text-[10px]">F1-2</div>
            <span>💖 Ghế Đôi (Couple)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-t from-gold-600 to-amber-400 text-cinema-950 font-bold flex items-center justify-center text-[10px]">✓</div>
            <span>🟡 Đang chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-950 border border-blue-500 text-blue-400 flex items-center justify-center text-[10px] animate-pulse">🔒</div>
            <span>🔵 Đang giữ (10 phút)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-rose-950 border border-rose-800 text-rose-500 flex items-center justify-center text-[10px]">✕</div>
            <span>🔴 Đã đặt (Đã bán)</span>
          </div>
        </div>
      </div>

      {/* Selected Seats Bottom Action Bar */}
      <div className="w-full max-w-4xl mt-8 p-4 sm:p-5 rounded-2xl glass-panel border border-cinema-600 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1">
            Ghế đã chọn: ({selectedSeats.length} ghế)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedSeats.length === 0 ? (
              <span className="text-sm text-slate-500 italic">Chưa chọn ghế nào</span>
            ) : (
              selectedSeats.map((s) => (
                <span
                  key={s.id}
                  className="px-2.5 py-1 rounded-lg bg-ruby-600/30 border border-ruby-500/50 text-ruby-300 font-bold text-xs"
                >
                  {s.row_number}{s.seat_number} ({s.seat_type.toUpperCase()} - {s.price.toLocaleString('vi-VN')}đ)
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Tổng tiền tạm tính:</span>
            <span className="text-2xl font-black text-white font-mono">
              {totalPrice.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">VNĐ</span>
            </span>
          </div>

          {!isHolding ? (
            <button
              disabled={selectedSeats.length === 0}
              onClick={onProceedToPayment}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-ruby-600 via-ruby-700 to-rose-700 hover:from-ruby-500 hover:to-rose-600 text-white font-bold text-sm shadow-glow-red transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Tiếp Tục Đặt Vé ({selectedSeats.length})
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-glow-emerald transition-all"
              >
                Thanh Toán ({formattedHoldTime()})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
