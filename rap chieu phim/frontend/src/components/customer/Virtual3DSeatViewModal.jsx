import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, Monitor, MapPin } from 'lucide-react';

export function Virtual3DSeatViewModal({ seat, schedule, isOpen, onClose }) {
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

  if (!isOpen || !seat) return null;

  // Tính toán góc nhìn và khoảng cách dựa vào hàng ghế (A -> F) và số ghế (1 -> 12)
  const rowChar = (seat.row_number || 'D').toUpperCase();
  const rowIdx = rowChar.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4, F=5
  const seatNum = parseInt(seat.seat_number, 10) || 5;

  // Ghế càng gần màn hình (A, B) màn hình càng to và hơi nghiêng lên.
  // Ghế càng xa (E, F) góc nhìn càng bao quát toàn cảnh.
  // Ghế ở giữa (5, 6, 7) nhìn thẳng tâm, ghế mép trái (<4) nhìn lệch sang phải, mép phải (>8) nhìn lệch sang trái.
  const screenScale = Math.max(0.6, 1.35 - rowIdx * 0.12); // A=1.35x, F=0.75x
  const screenRotateX = Math.max(0, (3 - rowIdx) * 4); // Hàng A ngước nhìn 12 độ
  const screenRotateY = (seatNum - 6) * -3.5; // Lệch góc quay trái/phải theo số ghế
  const distanceMeters = (rowIdx + 2) * 2.8; // 5m -> 19m

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
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
      <div
        className="relative w-full max-w-[700px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl bg-[#12151f] border border-white/10 shadow-2xl animate-scale-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          background: '#12151f',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút Đóng (X) cố định ở góc trên bên phải, kích thước 36x36px */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Đóng (phím ESC)"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 bg-cinema-950/90 border-b border-cinema-800 flex items-center justify-between shrink-0 pr-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                Mô Phỏng Góc Nhìn 3D Từ Ghế {seat.row_number}{seat.seat_number}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono uppercase">
                  {seat.seat_type || 'STANDARD'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {schedule?.room_name || 'Phòng Chiếu'} • Khoảng cách tới màn hình: ~{distanceMeters.toFixed(1)}m
              </p>
            </div>
          </div>
        </div>

        {/* 3D Simulated Perspective Viewport Body */}
        <div
          className="modal-body flex-1 overflow-y-auto p-6 flex flex-col items-center space-y-4"
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '24px',
          }}
        >
          <div
            className="w-full h-72 sm:h-80 bg-cinema-950 rounded-2xl border-2 border-cinema-800 overflow-hidden relative flex items-center justify-center shadow-inner"
            style={{ perspective: '800px' }}
          >
            {/* Ceiling Lights / Projector Beam */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 blur-3xl pointer-events-none rounded-full" />

            {/* Simulated 3D Curved Cinema Screen */}
            <div
              className="relative transition-transform duration-500 ease-out flex flex-col items-center shadow-2xl"
              style={{
                transform: `scale(${screenScale}) rotateX(${screenRotateX}deg) rotateY(${screenRotateY}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="w-[380px] sm:w-[440px] aspect-[16/9] rounded-xl overflow-hidden border-2 border-white/60 shadow-[0_0_40px_rgba(245,158,11,0.25)] relative bg-black">
                {/* Poster / Video simulation */}
                <img
                  src={
                    schedule?.movie_poster ||
                    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800'
                  }
                  alt="Màn hình chiếu"
                  className="w-full h-full object-cover opacity-85"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                <div className="absolute bottom-3 inset-x-0 text-center">
                  <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase px-2 py-0.5 rounded bg-black/60 border border-amber-500/30">
                    Phim: {schedule?.movie_name || 'Night Movie Cinema'}
                  </span>
                </div>
              </div>

              {/* Screen Base Glow */}
              <div className="w-full h-3 bg-amber-400/30 blur-md -mt-1 rounded-full pointer-events-none" />
            </div>

            {/* Front Row Seats Silhouettes in Dark */}
            <div className="absolute -bottom-4 inset-x-0 flex justify-center gap-1.5 opacity-40 pointer-events-none">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-9 rounded-t-xl bg-cinema-850 border border-cinema-700/50 shadow-md"
                />
              ))}
            </div>
          </div>

          {/* Seat Position Commentary */}
          <div className="w-full p-3.5 rounded-2xl bg-cinema-900 border border-cinema-800 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-white block">Đánh giá góc nhìn vị trí này:</span>
              <span className="text-slate-400 text-[11px]">
                {rowIdx <= 1
                  ? '👁️ Màn hình cực lớn, chiếm trọn tầm mắt. Khuyên dùng cho fan trải nghiệm hành động giật gân.'
                  : rowIdx <= 3
                  ? '👑 Góc nhìn VÀNG tiêu chuẩn Hollywood: Không mỏi cổ, cân bằng âm thanh stereo Dolby tốt nhất.'
                  : 'Góc nhìn toàn cảnh bao quát rạp, phù hợp xem cặp đôi và thưởng thức kỹ xảo điện ảnh.'}
              </span>
            </div>

            <div className="text-right shrink-0 ml-4 font-mono">
              <span className="text-[10px] text-slate-500 block">Độ bao phủ:</span>
              <span className="text-sm font-black text-amber-400">
                {Math.round(screenScale * 75)}° FOV
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all cursor-pointer"
          >
            Đã Hiểu, Chọn Ghế Này
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
