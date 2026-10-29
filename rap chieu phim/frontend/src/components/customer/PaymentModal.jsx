import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  QrCode,
  Wallet,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Zap,
  Copy,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export function PaymentModal({ isOpen, onClose, onSuccess }) {
  const { activeBooking, formattedHoldTime, holdRemainingSeconds, resetBookingState } = useBooking();
  const [paymentMethod, setPaymentMethod] = useState('banking');
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState('');

  if (!isOpen || !activeBooking) return null;

  const handlePay = async (options = {}) => {
    const { isFailure = false, method = paymentMethod } = options;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.processPayment({
        booking_id: activeBooking.bookingId,
        payment_method: method,
        simulate_failure: isFailure,
      });

      if (res.success && res.data?.paymentStatus === 'success') {
        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        onSuccess(res.data);
      } else if (res.data?.paymentStatus === 'failed') {
        setErrorMsg('Mô phỏng thanh toán thất bại! Ghế đã được tự động giải phóng.');
        resetBookingState();
        setTimeout(() => onClose(), 1800);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi xử lý thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const methods = [
    { id: 'banking', name: 'Chuyển Khoản Ngân Hàng (VietQR)', icon: QrCode, desc: 'Quét mã QR 24/7 qua app ngân hàng' },
    { id: 'momo', name: 'Ví Điện Tử MoMo', icon: Wallet, desc: 'Thanh toán siêu tốc 1-chạm MoMo' },
    { id: 'vnpay', name: 'Cổng VNPAY-QR', icon: QrCode, desc: 'Hỗ trợ tất cả ngân hàng nội địa' },
    { id: 'credit_card', name: 'Thẻ Quốc Tế (Visa / Master)', icon: CreditCard, desc: 'Cổng thẻ tín dụng & ghi nợ' },
  ];

  const isUrgentTime = holdRemainingSeconds !== null && holdRemainingSeconds < 120;
  const vietQrUrl = `https://img.vietqr.io/image/970436-9988776655-compact.png?amount=${activeBooking.totalAmount}&addInfo=${activeBooking.bookingCode}&accountName=NIGHT%20MOVIE%20CINEMA`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-cinema-600 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cinema-700/60">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-ruby-400" /> Thanh Toán Vé Xem Phim
            </h3>
            <span className="text-xs text-slate-400">Mã đơn: <b className="text-amber-300 font-mono">{activeBooking.bookingCode}</b></span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-cinema-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hold Seat Countdown Banner */}
        <div className={`my-3 p-3 rounded-xl border flex items-center justify-between text-xs ${
          isUrgentTime
            ? 'bg-rose-950/80 border-rose-500/80 text-rose-200 animate-pulse'
            : 'bg-blue-950/60 border-blue-600/50 text-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Thời gian giữ ghế còn:</span>
          </div>
          <span className="font-mono font-black text-base text-amber-400">{formattedHoldTime()}</span>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-ruby-950 border border-ruby-600 text-ruby-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-ruby-400 shrink-0" /> {errorMsg}
          </div>
        )}

        {/* --- DEMO THANH TOÁN (1-CLICK TEST) SECTION --- */}
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-cinema-900 to-amber-950/50 border-2 border-amber-500/60 shadow-glow-amber">
          <div className="flex items-center justify-between mb-2.5">
            <span className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" /> ⚡ Demo Thanh Toán Thử Nghiệm
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              Dành cho Test / Chạy thử
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mb-3">
            Bấm 1 chạm để hoàn tất giao dịch ngay mà không cần liên kết thẻ ngân hàng thực tế:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1-Click Instant Success */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePay({ isFailure: false, method: 'banking' })}
              className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-emerald transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Thanh Toán Thành Công (1-Click)</span>
            </button>

            {/* View VietQR Code */}
            <button
              type="button"
              onClick={() => setShowQrModal(!showQrModal)}
              className="px-3 py-2.5 rounded-xl bg-cinema-800 hover:bg-cinema-750 text-amber-300 hover:text-white border border-amber-500/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQrModal ? 'Ẩn Mã VietQR' : 'Xem Mã Quét VietQR'}</span>
            </button>
          </div>

          {/* Simulate Failure Button */}
          <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Kiểm tra cơ chế giải phóng ghế (BR09):</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePay({ isFailure: true })}
              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 underline"
            >
              <AlertTriangle className="w-3 h-3" /> Mô Phỏng Thất Bại
            </button>
          </div>
        </div>

        {/* VietQR Interactive Drawer */}
        {showQrModal && (
          <div className="mb-4 p-4 rounded-2xl bg-cinema-950 border border-emerald-500/50 animate-scale-in space-y-3">
            <div className="text-center">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Mã VietQR Chuyển Khoản Rạp Night Movie</h4>
              <p className="text-[10px] text-slate-400">Quét mã bằng app ngân hàng bất kỳ để chuyển tiền</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl">
              <img
                src={vietQrUrl}
                alt="VietQR Code"
                className="w-36 h-36 object-contain border border-slate-200 rounded-lg shrink-0"
                onError={(e) => {
                  // Fallback placeholder QR if external API unavailable
                  e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(activeBooking.bookingCode);
                }}
              />
              <div className="space-y-1 text-slate-800 text-xs w-full">
                <div>
                  <span className="text-[10px] text-slate-500 block">Ngân hàng:</span>
                  <b className="text-blue-900">Vietcombank (VCB)</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Số tài khoản:</span>
                  <div className="flex items-center justify-between bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-900">
                    <span>9988776655</span>
                    <button onClick={() => copyToClipboard('9988776655', 'acc')} className="text-blue-600 hover:text-blue-800">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Chủ tài khoản:</span>
                  <b className="text-slate-900">NIGHT MOVIE CINEMA</b>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Nội dung chuyển khoản:</span>
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold text-amber-900">
                    <span>{activeBooking.bookingCode}</span>
                    <button onClick={() => copyToClipboard(activeBooking.bookingCode, 'msg')} className="text-amber-700 hover:text-amber-900">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => handlePay({ isFailure: false, method: 'banking' })}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow-emerald"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Tôi Đã Chuyển Khoản Xong (Xác Nhận Ngay)</span>
            </button>
          </div>
        )}

        {/* Order Summary */}
        <div className="p-3.5 rounded-2xl bg-cinema-900/90 border border-cinema-700/60 mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Danh sách ghế:</span>
            <span className="font-bold text-white font-mono">
              {activeBooking.seats?.map((s) => `${s.row_number}${s.seat_number}`).join(', ')}
            </span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Số lượng vé:</span>
            <span className="font-bold text-white">{activeBooking.seats?.length || 1} vé</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-cinema-700/80">
            <span className="font-bold text-slate-200 text-sm">Tổng thanh toán:</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {activeBooking.totalAmount?.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-bold text-slate-300">Phương thức thanh toán:</label>
          {methods.map((m) => {
            const Icon = m.icon;
            const isSelected = paymentMethod === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-ruby-950/40 border-ruby-500 shadow-glow-red ring-1 ring-ruby-500'
                    : 'bg-cinema-900/60 border-cinema-700/60 hover:bg-cinema-850 hover:border-cinema-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-ruby-600 text-white' : 'bg-cinema-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">{m.name}</div>
                    <div className="text-[10px] text-slate-400">{m.desc}</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-ruby-500 bg-ruby-600' : 'border-cinema-600'}`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Pay Button */}
        <button
          onClick={() => handlePay({ isFailure: false })}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-glow-emerald transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ShieldCheck className="w-5 h-5" />
          {loading ? 'Đang xác thực giao dịch...' : `Thanh Toán Ngay (${activeBooking.totalAmount?.toLocaleString('vi-VN')} VNĐ)`}
        </button>
      </div>
    </div>
  );
}

