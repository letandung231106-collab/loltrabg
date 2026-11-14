import React from 'react';
import { X, Eye, Monitor, MapPin } from 'lucide-react';

export function Virtual3DSeatViewModal({ seat, schedule, isOpen, onClose }) {
  if (!isOpen || !seat) return null;

  // Tính toán góc nhìn và khoảng cách dựa vào hàng ghế (A -> F) và số ghế (1 -> 12)
  const rowChar = seat.row_number.toUpperCase();
  const rowIdx = rowChar.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3, E=4, F=5
  const seatNum = parseInt(seat.seat_number, 10) || 5;

  // Ghế càng gần màn hình (A, B) màn hình càng to và hơi nghiêng lên.
  // Ghế càng xa (E, F) góc nhìn càng bao quát toàn cảnh.
  // Ghế ở giữa (5, 6, 7) nhìn thẳng tâm, ghế mép trái (<4) nhìn lệch sang phải, mép phải (>8) nhìn lệch sang trái.
  const screenScale = 1.35 - rowIdx * 0.12; // A=1.35x, F=0.75x
  const screenRotateX = Math.max(0, (3 - rowIdx) * 4); // Hàng A ngước nhìn 12 độ
  const screenRotateY = (seatNum - 6) * -3.5; // Lệch góc quay trái/phải theo số ghế
  const distanceMeters = (rowIdx + 2) * 2.8; // 5m -> 19m

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[130] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-cinema-900 via-cinema-950 to-black border border-cinema-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="px-6 py-4 bg-cinema-950/90 border-b border-cinema-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                Mô Phỏng Góc Nhìn 3D Từ Ghế {seat.row_number}{seat.seat_number}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {seat.seat_type?.toUpperCase()}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {schedule?.room_name || 'Phòng Chiếu'} • Khoảng cách tới màn hình: ~{distanceMeters.toFixed(1)}m
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cinema-800 hover:bg-cinema-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Simulated Perspective Viewport */}
        <div className="p-6 flex flex-col items-center">
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
                    'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'
                  }
                  alt="Màn hình chiếu"
                  className="w-full h-full object-cover opacity-85"
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
          <div className="w-full mt-4 p-3.5 rounded-2xl bg-cinema-900 border border-cinema-800 flex items-center justify-between text-xs">
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
            onClick={onClose}
            className="w-full mt-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all"
          >
            Đã Hiểu, Chọn Ghế Này
          </button>
        </div>
      </div>
    </div>
  );
}
