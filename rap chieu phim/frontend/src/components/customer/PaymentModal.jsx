import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  RefreshCw,
  KeyRound,
} from 'lucide-react';

export function PaymentModal({ isOpen, onClose, onSuccess }) {
  const { activeBooking, formattedHoldTime, holdRemainingSeconds, resetBookingState } = useBooking();
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [momoRequestType, setMomoRequestType] = useState('captureWallet');
  const [momoSession, setMomoSession] = useState(null);
  const [momoLoading, setMomoLoading] = useState(false);
  const [showSignatureInfo, setShowSignatureInfo] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState('');

  // Tự động khởi tạo phiên MoMo Sandbox khi chọn phương thức MoMo
  useEffect(() => {
    if (isOpen && activeBooking && paymentMethod === 'momo') {
      handleCreateMomoOrder(momoRequestType);
    }
  }, [isOpen, activeBooking?.bookingId, paymentMethod, momoRequestType]);

  if (!isOpen || !activeBooking) return null;

  const handleCreateMomoOrder = async (reqType = momoRequestType) => {
    setMomoLoading(true);
    setErrorMsg('');
    try {
      const res = await api.createMomoPayment({
        booking_id: activeBooking.bookingId,
        request_type: reqType,
      });
      if (res.success && res.data) {
        setMomoSession(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Không thể khởi tạo giao dịch MoMo Sandbox.');
    } finally {
      setMomoLoading(false);
    }
  };

  const handleMomoCallbackConfirm = async (resultCode = 0) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.verifyMomoReturn({
        booking_id: activeBooking.bookingId,
        partnerCode: momoSession?.partnerCode || 'MOMO',
        orderId: momoSession?.orderId || `MOMO_${activeBooking.bookingCode}_${Date.now()}`,
        requestId: momoSession?.requestId || `REQ_${Date.now()}`,
        amount: activeBooking.totalAmount,
        orderInfo: momoSession?.orderInfo || `Thanh toan ve xem phim ${activeBooking.bookingCode}`,
        transId: Math.floor(2000000000 + Math.random() * 900000000),
        resultCode,
        message: resultCode === 0 ? 'Successful.' : 'Transaction denied by user.',
        responseTime: Date.now(),
      });

      if (res.success && res.data?.paymentStatus === 'success') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
        onSuccess(res.data);
      } else if (res.data?.paymentStatus === 'failed') {
        setErrorMsg('Giao dịch MoMo Sandbox bị từ chối/hủy (ResultCode: 1006)! Ghế đã được tự động giải phóng.');
        resetBookingState();
        setTimeout(() => onClose(), 2000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi xác thực giao dịch MoMo Sandbox.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMomoGatewayRedirect = () => {
    if (momoSession?.payUrl) {
      window.location.href = momoSession.payUrl;
    } else {
      handleCreateMomoOrder(momoRequestType);
    }
  };

  const handlePay = async (options = {}) => {
    const { isFailure = false, method = paymentMethod } = options;

    if (method === 'momo' && !isFailure) {
      return handleMomoCallbackConfirm(0);
    }
    if (method === 'momo' && isFailure) {
      return handleMomoCallbackConfirm(1006);
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.processPayment({
        booking_id: activeBooking.bookingId,
        payment_method: method,
        simulate_failure: isFailure,
      });

      if (res.success && res.data?.paymentStatus === 'success') {
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
    {
      id: 'momo',
      name: 'Ví Điện Tử MoMo (Sandbox v2)',
      icon: Wallet,
      desc: 'Cổng MoMo Payment Gateway v2 • HMAC-SHA256 • QR & Thẻ Test',
      badge: 'SANDBOX READY',
    },
    { id: 'banking', name: 'Chuyển Khoản Ngân Hàng (VietQR)', icon: QrCode, desc: 'Quét mã QR 24/7 qua app ngân hàng' },
    { id: 'vnpay', name: 'Cổng VNPAY-QR', icon: QrCode, desc: 'Hỗ trợ tất cả ngân hàng nội địa' },
    { id: 'credit_card', name: 'Thẻ Quốc Tế (Visa / Master)', icon: CreditCard, desc: 'Cổng thẻ tín dụng & ghi nợ' },
  ];

  const isUrgentTime = holdRemainingSeconds !== null && holdRemainingSeconds < 120;
  const vietQrUrl = `https://img.vietqr.io/image/970436-9988776655-compact.png?amount=${activeBooking.totalAmount}&addInfo=${activeBooking.bookingCode}&accountName=NIGHT%20MOVIE%20CINEMA`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-cinema-600 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cinema-700/60">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-ruby-400" /> Thanh Toán Vé Xem Phim
            </h3>
            <span className="text-xs text-slate-400">
              Mã đơn: <b className="text-amber-300 font-mono">{activeBooking.bookingCode}</b>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-cinema-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hold Seat Countdown Banner */}
        <div
          className={`my-3 p-3 rounded-xl border flex items-center justify-between text-xs ${
            isUrgentTime
              ? 'bg-rose-950/80 border-rose-500/80 text-rose-200 animate-pulse'
              : 'bg-blue-950/60 border-blue-600/50 text-blue-200'
          }`}
        >
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

        {/* --- MOMO SANDBOX V2 INTERACTIVE PANEL --- */}
        {paymentMethod === 'momo' && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#4a002d]/90 via-cinema-950 to-[#3b0024]/80 border-2 border-[#d82d8b]/70 shadow-xl space-y-3.5 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#a50064] text-white font-black text-[11px] leading-tight flex items-center justify-center shadow">
                  mo<br />mo
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    Cổng Thanh Toán MoMo Sandbox v2
                  </h4>
                  <p className="text-[10px] text-pink-200/80">
                    Chuẩn chữ ký điện tử HMAC-SHA256 • Tích hợp IPN & Return URL
                  </p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-200 font-bold border border-pink-400/40">
                TEST ENVIRONMENT
              </span>
            </div>

            {/* Chọn hình thức MoMo (requestType) */}
            <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-pink-500/30 text-[11px]">
              {[
                { id: 'captureWallet', label: 'Ví MoMo QR' },
                { id: 'payWithATM', label: 'Thẻ ATM Nội Địa' },
                { id: 'payWithCC', label: 'Visa / Master' },
              ].map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => setMomoRequestType(rt.id)}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all ${
                    momoRequestType === rt.id
                      ? 'bg-[#a50064] text-white shadow'
                      : 'text-pink-200/70 hover:text-white'
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>

            {momoLoading ? (
              <div className="py-6 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-pink-400 animate-spin mx-auto" />
                <p className="text-xs text-pink-200">Đang khởi tạo giao dịch & ký số HMAC-SHA256 với MoMo Sandbox...</p>
              </div>
            ) : (
              momoSession && (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/95 p-3.5 rounded-xl text-slate-800">
                    <div className="p-2 border-2 border-[#a50064] rounded-xl bg-white shrink-0">
                      <img
                        src={momoSession.qrCodeUrl}
                        alt="MoMo Sandbox QR"
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                    <div className="space-y-1.5 text-xs w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Partner Code:</span>
                        <span className="font-mono font-bold text-[#a50064]">{momoSession.partnerCode}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Mã đơn MoMo (orderId):</span>
                        <div className="flex items-center justify-between bg-pink-50 border border-pink-200 px-2 py-0.5 rounded font-mono font-bold text-[#a50064] text-[11px]">
                          <span className="truncate max-w-[190px]">{momoSession.orderId}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(momoSession.orderId, 'momo_order')}
                            className="text-[#a50064] hover:opacity-75 ml-1"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Loại giao dịch:</span>
                        <span className="font-mono font-semibold text-slate-700">{momoSession.requestType}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-[11px] font-bold text-slate-600">Số tiền:</span>
                        <span className="text-sm font-black text-[#a50064]">
                          {momoSession.amount?.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Signature Inspector Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowSignatureInfo(!showSignatureInfo)}
                      className="text-[11px] text-pink-300 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {showSignatureInfo ? 'Ẩn thông số chữ ký HMAC-SHA256' : 'Xem chữ ký HMAC-SHA256 & Request ID'}
                    </button>
                    {showSignatureInfo && (
                      <div className="mt-2 p-2.5 rounded-xl bg-black/60 border border-pink-500/30 font-mono text-[10px] text-pink-200 space-y-1 break-all">
                        <div>
                          <b className="text-pink-400">requestId:</b> {momoSession.requestId}
                        </div>
                        <div>
                          <b className="text-pink-400">signature (HMAC-SHA256):</b> {momoSession.signature}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for MoMo Sandbox */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenMomoGatewayRedirect}
                      className="px-3 py-2.5 rounded-xl bg-[#a50064] hover:bg-[#be0074] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Mở Trang Cổng MoMo Sandbox</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleMomoCallbackConfirm(0)}
                      className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow-emerald transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Xác Nhận Quét MoMo Ngay</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-pink-500/30 flex items-center justify-between">
                    <span className="text-[10px] text-pink-200/70">Kiểm tra kịch bản hủy giao dịch MoMo (BR09):</span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleMomoCallbackConfirm(1006)}
                      className="text-[11px] font-bold text-rose-300 hover:text-rose-200 flex items-center gap-1 underline"
                    >
                      <AlertTriangle className="w-3 h-3" /> Giả Lập Hủy MoMo (1006)
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        )}

        {/* --- DEMO THANH TOÁN NHANH (CHO VIETQR / PHƯƠNG THỨC KHÁC) --- */}
        {paymentMethod !== 'momo' && (
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
              <button
                type="button"
                disabled={loading}
                onClick={() => handlePay({ isFailure: false, method: paymentMethod })}
                className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-emerald transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Thanh Toán Thành Công (1-Click)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(!showQrModal)}
                className="px-3 py-2.5 rounded-xl bg-cinema-800 hover:bg-cinema-750 text-amber-300 hover:text-white border border-amber-500/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>{showQrModal ? 'Ẩn Mã VietQR' : 'Xem Mã Quét VietQR'}</span>
              </button>
            </div>

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
        )}

        {/* VietQR Interactive Drawer */}
        {showQrModal && paymentMethod !== 'momo' && (
          <div className="mb-4 p-4 rounded-2xl bg-cinema-950 border border-emerald-500/50 animate-scale-in space-y-3">
            <div className="text-center">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Mã VietQR Chuyển Khoản Rạp Night Movie
              </h4>
              <p className="text-[10px] text-slate-400">Quét mã bằng app ngân hàng bất kỳ để chuyển tiền</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl">
              <img
                src={vietQrUrl}
                alt="VietQR Code"
                className="w-36 h-36 object-contain border border-slate-200 rounded-lg shrink-0"
                onError={(e) => {
                  e.target.src =
                    'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +
                    encodeURIComponent(activeBooking.bookingCode);
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
                    <button
                      onClick={() => copyToClipboard('9988776655', 'acc')}
                      className="text-blue-600 hover:text-blue-800"
                    >
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
                    <button
                      onClick={() => copyToClipboard(activeBooking.bookingCode, 'msg')}
                      className="text-amber-700 hover:text-amber-900"
                    >
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
                    ? m.id === 'momo'
                      ? 'bg-[#4a002d]/60 border-[#d82d8b] ring-1 ring-[#d82d8b]'
                      : 'bg-ruby-950/40 border-ruby-500 shadow-glow-red ring-1 ring-ruby-500'
                    : 'bg-cinema-900/60 border-cinema-700/60 hover:bg-cinema-850 hover:border-cinema-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected
                        ? m.id === 'momo'
                          ? 'bg-[#a50064] text-white'
                          : 'bg-ruby-600 text-white'
                        : 'bg-cinema-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-2">
                      <span>{m.name}</span>
                      {m.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/30 text-pink-200 border border-pink-400/40 font-extrabold">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{m.desc}</div>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? m.id === 'momo'
                        ? 'border-pink-400 bg-[#a50064]'
                        : 'border-ruby-500 bg-ruby-600'
                      : 'border-cinema-600'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Pay Button */}
        <button
          onClick={() =>
            paymentMethod === 'momo' ? handleOpenMomoGatewayRedirect() : handlePay({ isFailure: false })
          }
          disabled={loading || momoLoading}
          className={`w-full py-3.5 rounded-xl text-white font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
            paymentMethod === 'momo'
              ? 'bg-gradient-to-r from-[#a50064] via-[#c81e78] to-[#a50064] hover:opacity-95 shadow-lg'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-glow-emerald'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          {loading
            ? 'Đang xác thực giao dịch...'
            : paymentMethod === 'momo'
            ? `Thanh Toán Qua Cổng MoMo Sandbox (${activeBooking.totalAmount?.toLocaleString('vi-VN')} VNĐ)`
            : `Thanh Toán Ngay (${activeBooking.totalAmount?.toLocaleString('vi-VN')} VNĐ)`}
        </button>
      </div>
    </div>
  );
}
