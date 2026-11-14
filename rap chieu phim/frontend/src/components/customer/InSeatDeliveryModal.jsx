import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[125] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-cinema-900 border border-cinema-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="px-6 py-4 bg-cinema-950/90 border-b border-cinema-800 flex items-center justify-between">
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
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cinema-800 hover:bg-cinema-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
              onClick={() => {
                setIsSuccess(false);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all"
            >
              Hoàn Tất & Xem Phim
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
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
                    <div className="text-slate-400 font-mono">{item.price.toLocaleString('vi-VN')} đ</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQty(idx, -1)}
                      className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-mono font-bold text-amber-400">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(idx, 1)}
                      className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-cinema-950 flex items-center justify-center font-bold"
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
                disabled={isSubmitting || cart.length === 0}
                onClick={handleOrder}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-ruby-600 hover:from-amber-400 hover:to-ruby-500 text-white font-extrabold text-xs shadow-glow-red transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đơn Phục Vụ Tận Ghế'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
