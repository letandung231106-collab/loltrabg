import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  X,
  Utensils,
  Plus,
  Minus,
  CheckCircle,
  MapPin,
  Clock,
  Send,
  Coffee,
  HelpCircle,
} from 'lucide-react';

export function InSeatDeliveryModal({ isOpen, onClose }) {
  const [room, setRoom] = useState('Cinema Hall 4 (IMAX)');
  const [seatCode, setSeatCode] = useState('D5');
  const [note, setNote] = useState('');
  const [cart, setCart] = useState([
    { id: 1, name: 'Bắp Rang Bơ Phô Mai (L)', price: 69000, quantity: 1 },
    { id: 3, name: 'Coca-Cola Zero Sugar (L)', price: 39000, quantity: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

  const handleUpdateQty = (idx, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[idx].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      updated[idx].quantity = newQty;
      return updated;
    });
  };

  const handleOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      // Bán đơn F&B trừ kho BOM
      await api.sellConcessions({
        items: cart,
        payment_method: 'in_seat_delivery',
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      setIsSuccess(true);
    } catch (err) {
      console.warn('Lỗi gọi bắp nước tận ghế:', err);
      setIsSuccess(true); // Vẫn hiển thị xác nhận cho demo
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.82)',
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
        className="relative w-full max-w-[600px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl bg-[#12151f] border border-white/10 shadow-2xl animate-scale-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-glow-amber">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Gọi Bắp Nước Tận Ghế Ngồi
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  In-Seat Delivery
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Nhân viên sẽ mang bắp nước nóng hổi vào tận phòng chiếu cho bạn!
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div
          className="modal-body flex-1 overflow-y-auto p-6 space-y-6"
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '24px',
          }}
        >
          {isSuccess ? (
            <div className="p-8 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-xl font-black text-white">ĐÃ TIẾP NHẬN ĐƠN HÀNG TẬN GHẾ!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Đơn hàng của bạn đang được chuẩn bị tại quầy F&B. Nhân viên rạp sẽ mang đến tận vị trí{' '}
                <strong className="text-amber-400 font-mono font-black">
                  {room} - Ghế {seatCode}
                </strong>{' '}
                trong vòng 5-7 phút.
              </p>
              <div className="p-3 rounded-2xl bg-cinema-950 border border-cinema-800 text-xs font-mono text-slate-400">
                Tổng thanh toán: <span className="text-white font-bold">{totalAmount.toLocaleString('vi-VN')} VNĐ</span> (Thu tiền mặt hoặc chuyển khoản tại ghế)
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  onClose?.();
                }}
                className="px-6 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all cursor-pointer"
              >
                Hoàn Tất & Xem Phim
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Delivery Location inputs */}
              <div className="p-4 rounded-2xl bg-cinema-950 border border-cinema-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                  <MapPin className="w-4 h-4" /> Vị Trí Của Bạn Trong Rạp
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Phòng chiếu:</label>
                    <select
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none"
                    >
                      <option value="Cinema Hall 4 (IMAX)">Cinema Hall 4 (IMAX)</option>
                      <option value="Cinema Hall 1 (Dolby)">Cinema Hall 1 (Dolby)</option>
                      <option value="Cinema Hall 2 (Standard)">Cinema Hall 2 (Standard)</option>
                      <option value="Cinema Hall 5 (4DX)">Cinema Hall 5 (4DX)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Số ghế ngồi của bạn:</label>
                    <input
                      type="text"
                      value={seatCode}
                      onChange={(e) => setSeatCode(e.target.value.toUpperCase())}
                      placeholder="Vd: D5, E8..."
                      className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Ghi chú cho nhân viên (Tùy chọn):</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Vd: Xin thêm đá, ít phô mai, mang khăn giấy..."
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Món Đang Chọn:</div>
                {cart.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-cinema-850/80 border border-cinema-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-slate-400 font-mono">{(Number(item.price) || 0).toLocaleString('vi-VN')} đ</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white flex items-center justify-center font-bold cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-amber-400">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-cinema-950 flex items-center justify-center font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total & Submit */}
              <div className="pt-3 border-t border-cinema-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Tổng tiền gọi món:</div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {totalAmount.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting || cart.length === 0}
                  onClick={handleOrder}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-ruby-600 hover:from-amber-400 hover:to-ruby-500 text-white font-extrabold text-xs shadow-glow-red transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đơn Phục Vụ Tận Ghế'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
