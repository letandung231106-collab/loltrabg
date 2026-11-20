import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Navigation, Compass, Footprints, Lightbulb, CheckCircle2, AlertCircle, ArrowUp, ArrowRight, ArrowLeft } from 'lucide-react';

export function SeatNavigatorModal({ ticket, isOpen, onClose }) {
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Cơ chế 1: Thoát Modal bằng phím tắt ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cơ chế 2: Khóa cuộn trang nền khi mở Modal và dọn dẹp sạch khi đóng / unmount
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const row = (ticket.row_number || 'D').toUpperCase();
  const seatNum = parseInt(ticket.seat_number, 10) || 5;
  const rowIndex = row.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4, F=5
  const stepCount = Math.max(1, rowIndex * 2 + 1); // Số bậc thang ước tính cần bước lên

  const side = seatNum <= 6 ? 'bên TAY TRÁI' : 'bên TAY PHẢI';
  const aisleNote = seatNum <= 6 ? 'Lối đi số 1 (Cửa phía Tây)' : 'Lối đi số 2 (Cửa phía Đông)';

  const modalContent = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 animate-fade-in ${
        flashlightOn ? 'bg-amber-100/10 backdrop-blur-sm' : 'bg-black/90 backdrop-blur-md'
      }`}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: flashlightOn ? 'rgba(30, 20, 0, 0.85)' : 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => {
        // Cơ chế 3: Click Outside (Bấm ra ngoài vùng nền tối để đóng Modal)
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      {/* Flashlight Soft Glow Effect on Dark Cinema */}
      {flashlightOn && (
        <div className="absolute inset-0 bg-radial-gradient from-amber-100/30 via-transparent to-black pointer-events-none" />
      )}

      <div
        className={`relative w-full max-w-[600px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 animate-scale-up ${
          flashlightOn
            ? 'bg-[#1a1714] border-amber-400 text-white shadow-[0_0_50px_rgba(245,158,11,0.4)]'
            : 'bg-[#12151f] border-white/10 text-slate-100'
        }`}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút Đóng (X) cố định ở góc trên bên phải, kích thước rõ ràng 36x36px */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Đóng (phím ESC)"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-5 border-b border-cinema-800 flex items-center justify-between shrink-0 pr-16 bg-cinema-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Dẫn Đường Tìm Ghế Rạp
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase">
                  Dark Mode Guide
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{ticket.room_name || 'Phòng chiếu'}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div
          className="modal-body flex-1 overflow-y-auto p-6 space-y-6"
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '24px',
          }}
        >
          {/* Target Seat Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-cinema-900 to-amber-500/20 border border-amber-500/50 text-center">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">VỊ TRÍ GHẾ CỦA BẠN</div>
            <div className="text-3xl font-black text-amber-300 font-mono my-1">
              HÀNG {row} — SỐ {seatNum}
            </div>
            <div className="text-xs text-slate-300 truncate">{ticket.movie_name}</div>
          </div>

          {/* Step-by-Step Walking Directions */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-ruby-400" /> Các bước di chuyển trong bóng tối:
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-cinema-850/80 border border-cinema-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-ruby-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <div className="font-bold text-white">Vào cửa phòng chiếu & Chọn lối đi</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Hãy di chuyển theo <strong>{aisleNote}</strong>. Đèn hắt chân bậc thang đang sáng màu vàng.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cinema-850/80 border border-cinema-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-cinema-950 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <div className="font-bold text-white">Bước lên {stepCount} bậc thang</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Hàng <strong>{row}</strong> nằm ở bậc số {stepCount}. Hãy nhìn số hàng phát quang dập nổi bên mép lối đi.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cinema-850/80 border border-cinema-700 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-cinema-950 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <div className="font-bold text-white">Rẽ vào ghế {side}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Đếm từ ngoài vào ghế số <strong>{seatNum}</strong>. Chúc bạn có buổi xem phim thoải mái!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flashlight Soft Beam Toggle */}
          <div className="p-3.5 rounded-2xl bg-cinema-950 border border-cinema-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className={`w-5 h-5 ${flashlightOn ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
              <div>
                <div className="text-xs font-bold text-white">Đèn Pin Dịu Mắt Soi Bậc Thang</div>
                <div className="text-[10px] text-slate-400">Ánh sáng ấm không làm phiền người đang xem</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFlashlightOn(!flashlightOn)}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                flashlightOn
                  ? 'bg-amber-400 text-cinema-950 shadow-glow-amber'
                  : 'bg-cinema-800 hover:bg-cinema-700 text-slate-300'
              }`}
            >
              {flashlightOn ? 'Tắt Đèn' : 'Bật Đèn'}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all cursor-pointer"
          >
            Đã Đến Ghế Ngồi, Tắt Dẫn Đường
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
