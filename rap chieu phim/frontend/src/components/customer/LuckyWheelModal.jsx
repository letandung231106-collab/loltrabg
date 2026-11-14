import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { WHEEL_PRIZES, voucherWallet } from '../../services/voucherWallet';
import {
  Gift,
  X,
  Award,
  Zap,
  CheckCircle,
  HelpCircle,
  Flame,
  RotateCw,
  Ticket,
  ChevronRight,
} from 'lucide-react';

export function LuckyWheelModal({ isOpen, onClose, onVoucherClaimed, onNavigateBooking }) {
  const [spinsLeft, setSpinsLeft] = useState(() => voucherWallet.getRemainingSpins());
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);

  if (!isOpen) return null;

  const numSlices = WHEEL_PRIZES.length;
  const sliceAngle = 360 / numSlices;
  const radius = 150;
  const center = 150;

  // Tính toán đường cong SVG (Arc Path) cho từng múi quạt hình nón của vòng quay
  const createSlicePath = (index) => {
    const startAngle = (index * sliceAngle - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * sliceAngle - 90) * (Math.PI / 180);

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  const handleSpin = () => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    setWonPrize(null);

    // Chọn giải thưởng theo xác suất
    const rand = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;

    for (let i = 0; i < WHEEL_PRIZES.length; i++) {
      cumulative += WHEEL_PRIZES[i].probability;
      if (rand <= cumulative) {
        selectedIndex = i;
        break;
      }
    }

    const prize = WHEEL_PRIZES[selectedIndex];
    // Kim chỉ đặt tại đỉnh (270 độ / góc 12 giờ)
    // Để múi selectedIndex dừng ngay dưới kim:
    const targetOffset = 360 - (selectedIndex * sliceAngle + sliceAngle / 2);
    const fullRotations = 360 * 6; // Quay 6 vòng hoành tráng
    const newRotation = rotation + fullRotations + targetOffset - (rotation % 360);

    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(prize);
      const remaining = voucherWallet.decrementSpin();
      setSpinsLeft(remaining);
      voucherWallet.addVoucher(prize);

      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 },
      });

      if (onVoucherClaimed) {
        onVoucherClaimed(prize);
      }
    }, 4500);
  };

  const handleAddMoreSpins = () => {
    const updated = voucherWallet.addSpins(2);
    setSpinsLeft(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-cinema-900 via-cinema-950 to-black border-2 border-amber-500/60 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
        {/* Glowing Ambient Top Effect */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-cinema-800/80 hover:bg-cinema-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-cinema-700"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="pt-6 pb-3 px-6 text-center border-b border-cinema-800/80 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-1.5">
            <Gift className="w-3.5 h-3.5 text-amber-400" /> VÒNG QUAY MAY MẮN NIGHT MOVIE
          </div>
          <h3 className="text-2xl font-black text-white tracking-wide">QUAY LÀ TRÚNG VOUCHER</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Trúng 100% - Tự động cộng vào ví và giảm giá khi mua vé!
          </p>
        </div>

        {/* Wheel Body */}
        <div className="p-5 flex flex-col items-center justify-center relative z-10">
          {/* Wheel Container with Pointer */}
          <div className="relative my-2 flex items-center justify-center">
            {/* Outer Decorative Neon Ring */}
            <div className="absolute w-[314px] h-[314px] rounded-full border-4 border-dashed border-amber-500/40 animate-[spin_40s_linear_infinite] pointer-events-none" />

            {/* Pointer Indicator (Kim chỉ vàng kim loại) */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.8)]">
              <div className="w-6 h-6 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full border-2 border-white flex items-center justify-center shadow">
                <div className="w-2 h-2 bg-cinema-950 rounded-full" />
              </div>
              <div className="w-0 h-0 -mt-1 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-400" />
            </div>

            {/* SVG Rendered Wheel Slices */}
            <div
              className="w-[290px] h-[290px] sm:w-[300px] sm:h-[300px] rounded-full border-4 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] relative flex items-center justify-center overflow-hidden transition-all duration-[4500ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {/* Wheel Pie Slices */}
                {WHEEL_PRIZES.map((prize, idx) => (
                  <path
                    key={prize.id}
                    d={createSlicePath(idx)}
                    fill={prize.color}
                    stroke="#1e293b"
                    strokeWidth="2"
                    className="hover:opacity-90 transition-opacity"
                  />
                ))}

                {/* Prize Text & Icon for Each Slice */}
                {WHEEL_PRIZES.map((prize, idx) => {
                  const midAngle = idx * sliceAngle + sliceAngle / 2;
                  return (
                    <g
                      key={`text-${prize.id}`}
                      transform={`rotate(${midAngle}, ${center}, ${center})`}
                    >
                      {/* Text aligned along slice radius */}
                      <text
                        x={center}
                        y={42}
                        fill="#ffffff"
                        fontSize="12"
                        fontWeight="900"
                        textAnchor="middle"
                        style={{
                          letterSpacing: '0.02em',
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                        {prize.title}
                      </text>
                      <text
                        x={center}
                        y={58}
                        fill="rgba(255,255,255,0.85)"
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {prize.code}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Center Golden Knob Button */}
              <button
                type="button"
                disabled={isSpinning || spinsLeft <= 0}
                onClick={handleSpin}
                className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-gold-400 to-amber-200 border-4 border-cinema-950 flex flex-col items-center justify-center shadow-2xl z-20 hover:scale-105 active:scale-95 transition-transform group cursor-pointer disabled:cursor-not-allowed"
                title="Bấm để quay"
              >
                <Gift className="w-6 h-6 text-cinema-950 group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black tracking-wider uppercase text-cinema-950 -mt-0.5">
                  QUAY
                </span>
              </button>
            </div>
          </div>

          {/* Action Spin Button & Status */}
          <div className="w-full mt-4 space-y-2.5 text-center">
            <button
              disabled={isSpinning || spinsLeft <= 0}
              onClick={handleSpin}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-ruby-600 hover:from-amber-400 hover:to-ruby-500 text-white font-black text-sm shadow-glow-red transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {isSpinning ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" /> Đang quay hồi hộp...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 text-amber-200" /> BẤM ĐỂ QUAY (Còn {spinsLeft} lượt)
                </>
              )}
            </button>

            {spinsLeft === 0 ? (
              <div className="text-xs text-slate-400 flex items-center justify-center gap-2 py-1">
                <span>Hết lượt quay hôm nay?</span>
                <button
                  type="button"
                  onClick={handleAddMoreSpins}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  + Nhận thêm 2 lượt miễn phí
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Lượt quay làm mới mỗi ngày. Dễ dàng đổi quà không giới hạn!
              </p>
            )}
          </div>

          {/* Winning Announcement Card */}
          {wonPrize && (
            <div className="w-full mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-cinema-900 to-emerald-950 border border-emerald-500/80 shadow-glow-emerald text-center animate-scale-in">
              <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto mb-1 animate-bounce" />
              <div className="text-[10px] text-emerald-300 font-black uppercase tracking-wider">
                CHÚC MỪNG BẠN ĐÃ TRÚNG THƯỞNG!
              </div>
              <h4 className="text-base font-black text-white mt-0.5">{wonPrize.title}</h4>
              <p className="text-xs text-slate-300">{wonPrize.desc}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-900/60 border border-emerald-400 text-amber-300 font-mono font-black text-xs">
                MÃ: {wonPrize.code}
              </div>
              <p className="text-[11px] text-emerald-300 mt-2">
                ✓ Đã lưu vào Ví Voucher cá nhân. Hệ thống sẽ tự động áp dụng khi thanh toán vé!
              </p>

              {onNavigateBooking && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateBooking();
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 mx-auto shadow-sm"
                >
                  <span>Dùng Ngay Để Đặt Vé</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
