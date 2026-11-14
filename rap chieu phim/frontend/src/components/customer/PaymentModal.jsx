import React, { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { api } from '../../services/api';
import { voucherWallet } from '../../services/voucherWallet';
import { loyaltyService } from '../../services/loyaltyService';
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
  ExternalLink,
  RefreshCw,
  KeyRound,
  Tag,
  Check,
  Utensils,
  Award,
} from 'lucide-react';

export const AVAILABLE_VOUCHERS = [
  { code: 'NIGHTMOVIE20', discountPercent: 20, maxDiscount: 50000, desc: 'Giảm 20% tối đa 50k' },
  { code: 'FREESNACK', discountAmount: 39000, desc: 'Tặng nước ngọt 39k' },
  { code: 'STUDENT30', discountAmount: 30000, desc: 'Giảm 30k học sinh - sinh viên' },
  { code: 'VIP10', discountPercent: 10, maxDiscount: 40000, desc: 'Thành viên VIP giảm 10%' },
];

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  selectedConcessions = [],
}) {
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

  // Voucher / Promotion state
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');

  // Loyalty Points state
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(() => loyaltyService.getPoints());

  // Tự động khởi tạo phiên MoMo Sandbox khi chọn phương thức MoMo
  useEffect(() => {
    if (isOpen && activeBooking && paymentMethod === 'momo') {
      handleCreateMomoOrder(momoRequestType);
    }
  }, [isOpen, activeBooking?.bookingId, paymentMethod, momoRequestType]);

  // Cập nhật lại số điểm loyalty khả dụng mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setAvailablePoints(loyaltyService.getPoints());
    }
  }, [isOpen]);

  if (!isOpen || !activeBooking) return null;

  // Tính toán chi phí: vé + bắp nước - giảm giá voucher - trừ điểm loyalty
  const ticketAmount = Number(activeBooking.totalAmount || 0);
  const concessionAmount = selectedConcessions.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
    0
  );
  const subtotal = ticketAmount + concessionAmount;

  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.discountAmount) {
      discountAmount = appliedVoucher.discountAmount;
    } else if (appliedVoucher.discountPercent) {
      discountAmount = Math.min(
        (subtotal * appliedVoucher.discountPercent) / 100,
        appliedVoucher.maxDiscount || Infinity
      );
    }
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const amountAfterVoucher = Math.max(0, subtotal - discountAmount);
  // Điểm thưởng loyalty tối đa có thể trừ: tối đa bằng số tiền còn lại và tối đa bằng availablePoints
  const loyaltyDeduction = useLoyaltyPoints ? Math.min(amountAfterVoucher, availablePoints) : 0;
  const finalTotalAmount = Math.max(0, amountAfterVoucher - loyaltyDeduction);

  const handleApplyVoucher = (codeToApply) => {
    const code = (codeToApply || voucherInput || '').trim().toUpperCase();
    setVoucherError('');
    if (!code) {
      setVoucherError('Vui lòng nhập mã giảm giá.');
      return;
    }
    const walletVouchers = voucherWallet.getMyVouchers().filter((v) => !v.isUsed);
    const found = walletVouchers.find((v) => v.code === code) || AVAILABLE_VOUCHERS.find((v) => v.code === code);
    if (!found) {
      setVoucherError('Mã giảm giá không tồn tại hoặc đã hết hạn.');
      return;
    }
    setAppliedVoucher(found);
    setVoucherInput(found.code);
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError('');
  };

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

  const handleOpenMomoGatewayRedirect = () => {
    if (!momoSession?.payUrl) {
      return handlePay({ isFailure: false, method: 'momo' });
    }
    window.open(momoSession.payUrl, '_blank', 'width=980,height=720');
  };

  const handlePaymentSuccessPostActions = async (method) => {
    // 1. Đánh dấu voucher đã dùng
    if (appliedVoucher?.code) {
      voucherWallet.markAsUsed(appliedVoucher.code);
    }

    // 2. Trừ điểm loyalty nếu có dùng
    if (useLoyaltyPoints && loyaltyDeduction > 0) {
      loyaltyService.redeemPoints(loyaltyDeduction, `Thanh toán đơn ${activeBooking.bookingCode}`);
    }

    // 3. Tích lũy 5% điểm thưởng cho số tiền thanh toán thực tế
    loyaltyService.addPoints(finalTotalAmount, `Tích điểm đơn vé ${activeBooking.bookingCode}`);

    // 4. Bán bắp nước vào kho BOM
    if (selectedConcessions.length > 0) {
      try {
        await api.sellConcessions({
          items: selectedConcessions.map((c) => ({
            id: c.id,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
          })),
          payment_method: method,
        });
      } catch (e) {
        console.warn('Ghi nhận trừ kho bắp nước tự động:', e.message);
      }
    }
  };

  const handleMomoCallbackConfirm = async (resultCode = 0) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.verifyMomoReturn({
        booking_id: activeBooking.bookingId,
        orderId: momoSession?.orderId || `MOMO_${activeBooking.bookingCode}_${Date.now()}`,
        requestId: momoSession?.requestId || `REQ_${Date.now()}`,
        amount: String(finalTotalAmount),
        orderInfo: `Thanh toan ve xem phim Night Movie - Ma don ${activeBooking.bookingCode}`,
        resultCode: resultCode,
        transId: String(Math.floor(2000000000 + Math.random() * 900000000)),
        message: resultCode === 0 ? 'Successful.' : 'Transaction denied by user.',
        signature: momoSession?.signature || 'sandbox_sig',
      });

      if (res.success && res.data?.paymentStatus === 'success') {
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.6 },
        });

        await handlePaymentSuccessPostActions('momo');
        onSuccess(res.data);
      } else {
        setErrorMsg(res.data?.message || 'Giao dịch MoMo bị từ chối hoặc bị hủy.');
        resetBookingState();
        setTimeout(() => onClose(), 2000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi xác thực thanh toán MoMo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async ({ isFailure = false, method = paymentMethod }) => {
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

        await handlePaymentSuccessPostActions(method);
        onSuccess(res.data);
      } else if (res.data?.paymentStatus === 'failed') {
        setErrorMsg('Mô phỏng thanh toán thất bại! Ghế đã được tự động giải phóng.');
        resetBookingState();
        setTimeout(() => onClose(), 2500);
      } else {
        setErrorMsg(res.message || 'Thanh toán không thành công.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi xử lý thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const vietQrUrl = `https://img.vietqr.io/image/970418-8813341949-compact2.png?amount=${finalTotalAmount}&addInfo=${encodeURIComponent(
    activeBooking.bookingCode
  )}&accountName=${encodeURIComponent('NIGHT MOVIE CINEMA')}`;

  const currentTier = loyaltyService.getTier(availablePoints);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-cinema-900 border border-cinema-700/80 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in relative">
        {/* Header */}
        <div className="px-6 py-4 bg-cinema-950/90 border-b border-cinema-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ruby-600/20 border border-ruby-500/40 flex items-center justify-center text-ruby-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Thanh Toán & Xuất Vé Điện Tử</h3>
              <p className="text-xs text-slate-400">
                Đơn hàng: <span className="font-mono text-gold-400 font-bold">{activeBooking.bookingCode}</span>
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 10-Minute Hold Countdown Bar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-950/50 border border-blue-500/40 text-blue-200 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
              <span>Thời gian giữ ghế tạm thời còn lại:</span>
            </div>
            <span className="font-mono text-sm font-black text-amber-400 tracking-wider">
              {formattedHoldTime()}
            </span>
          </div>

          {/* Payment Methods Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Chọn phương thức thanh toán:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('momo');
                  setShowQrModal(false);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  paymentMethod === 'momo'
                    ? 'bg-pink-950/50 border-pink-500 text-white shadow-glow-red'
                    : 'bg-cinema-850 border-cinema-700 text-slate-300 hover:border-cinema-600'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#a50064] flex items-center justify-center text-white font-black text-sm shrink-0 shadow">
                  M
                </div>
                <div>
                  <div className="font-extrabold text-xs">MoMo Sandbox</div>
                  <div className="text-[10px] text-slate-400">Ví MoMo / QR MoMo</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('vietqr');
                  setShowQrModal(true);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  paymentMethod === 'vietqr'
                    ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-glow-emerald'
                    : 'bg-cinema-850 border-cinema-700 text-slate-300 hover:border-cinema-600'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs">VietQR 247</div>
                  <div className="text-[10px] text-slate-400">Mọi App Ngân Hàng</div>
                </div>
              </button>
            </div>
          </div>

          {/* MoMo Simulator Panel */}
          {paymentMethod === 'momo' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#a50064]/20 via-cinema-900 to-[#a50064]/20 border border-pink-500/50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-pink-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-pink-400" /> Cổng Thanh Toán MoMo Payment v2
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-600/30 text-pink-300 border border-pink-500/40">
                  HMAC-SHA256
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenMomoGatewayRedirect}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#a50064] to-[#d82d8b] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Mở Cổng MoMo Sandbox
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleMomoCallbackConfirm(0)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Xác Nhận MoMo Thành Công
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

          {/* VietQR Code Display */}
          {showQrModal && paymentMethod !== 'momo' && (
            <div className="p-4 rounded-2xl bg-cinema-950 border border-emerald-500/50 animate-scale-in space-y-3">
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
                    <b className="text-blue-900">BIDV</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Số tài khoản:</span>
                    <div className="flex items-center justify-between bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-900">
                      <span>8813341949</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('8813341949', 'acc')}
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
                        type="button"
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

          {/* --- VOUCHER & DISCOUNT CODE SECTION --- */}
          <div className="p-3.5 rounded-2xl bg-cinema-950/70 border border-cinema-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Mã Giảm Giá / Khuyến Mãi
              </label>
              {appliedVoucher && (
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold"
                >
                  Gỡ mã
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã (Vd: NIGHTMOVIE20)"
                value={voucherInput}
                onChange={(e) => {
                  setVoucherInput(e.target.value.toUpperCase());
                  setVoucherError('');
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-ruby-500"
              />
              <button
                type="button"
                onClick={() => handleApplyVoucher()}
                className="px-4 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                Áp dụng
              </button>
            </div>

            {voucherError && (
              <p className="text-[11px] text-rose-400 font-semibold">{voucherError}</p>
            )}

            {/* Vouchers trong ví của bạn & Gợi ý nhanh */}
            <div className="space-y-1.5 pt-1">
              {voucherWallet.getMyVouchers().filter((v) => !v.isUsed).length > 0 && (
                <div>
                  <div className="text-[10px] text-amber-400 font-bold mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-gold-400" /> Voucher trong Ví của bạn (Bấm để dùng):
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {voucherWallet.getMyVouchers().filter((v) => !v.isUsed).map((v) => (
                      <button
                        key={v.id || v.code}
                        type="button"
                        onClick={() => handleApplyVoucher(v.code)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono font-bold transition-all flex items-center gap-1 ${
                          appliedVoucher?.code === v.code
                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-glow-emerald'
                            : 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                        }`}
                      >
                        <span>{v.code}</span>
                        <span className="text-[9px] opacity-80">({v.title || v.desc})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voucher Chips gợi ý */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400">Gợi ý 1-chạm:</span>
              {AVAILABLE_VOUCHERS.map((v) => (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => handleApplyVoucher(v.code)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono font-bold transition-all ${
                    appliedVoucher?.code === v.code
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-cinema-900 border-cinema-700 text-slate-300 hover:border-amber-400 hover:text-amber-300'
                  }`}
                >
                  {v.code}
                </button>
              ))}
            </div>

            {appliedVoucher && (
              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check className="w-3.5 h-3.5" /> Đã áp dụng mã {appliedVoucher.code} ({appliedVoucher.desc})
                </div>
                <span className="font-black font-mono text-emerald-400">
                  -{discountAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}
          </div>

          {/* --- LOYALTY POINTS REDEMPTION (Điểm thưởng thành viên) --- */}
          <div className="p-3.5 rounded-2xl bg-cinema-950/70 border border-amber-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Điểm Thưởng Khách Hàng Thân Thiết</span>
              </div>
              <span
                className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md text-cinema-950"
                style={{ backgroundColor: currentTier.color }}
              >
                Hạng {currentTier.name.split(' ')[0]}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-400">
                Bạn có: <strong className="text-amber-400 font-mono">{availablePoints.toLocaleString('vi-VN')}</strong> điểm
                <span className="text-[10px] block opacity-80">(1 điểm = 1 VNĐ, trừ thẳng vào tiền vé)</span>
              </div>

              {availablePoints > 0 && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useLoyaltyPoints}
                    onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                    className="w-4 h-4 rounded text-ruby-600 focus:ring-ruby-500 bg-cinema-900 border-cinema-700"
                  />
                  <span className="text-xs font-bold text-amber-300">Dùng điểm thưởng</span>
                </label>
              )}
            </div>

            {useLoyaltyPoints && (
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex justify-between items-center">
                <span>Trừ điểm loyalty:</span>
                <span className="font-mono font-black">-{loyaltyDeduction.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="p-3.5 rounded-2xl bg-cinema-900/90 border border-cinema-700/60 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Danh sách ghế:</span>
              <span className="font-bold text-white font-mono">
                {activeBooking.seats?.map((s) => `${s.row_number}${s.seat_number}`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Tiền vé ({activeBooking.seats?.length || 1} ghế):</span>
              <span className="font-bold text-white">{ticketAmount.toLocaleString('vi-VN')} VNĐ</span>
            </div>

            {selectedConcessions.length > 0 && (
              <div className="flex justify-between text-amber-300 pt-1 border-t border-cinema-800">
                <span className="flex items-center gap-1">
                  <Utensils className="w-3 h-3" /> Bắp nước & combo ({selectedConcessions.reduce((sum, c) => sum + c.quantity, 0)} món):
                </span>
                <span className="font-bold">+{concessionAmount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}

            {appliedVoucher && (
              <div className="flex justify-between text-emerald-400 pt-1 border-t border-cinema-800">
                <span>Khuyến mãi ({appliedVoucher.code}):</span>
                <span className="font-bold">-{discountAmount.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}

            {useLoyaltyPoints && loyaltyDeduction > 0 && (
              <div className="flex justify-between text-amber-400 pt-1 border-t border-cinema-800">
                <span>Điểm thưởng loyalty:</span>
                <span className="font-bold">-{loyaltyDeduction.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400 text-[11px] pt-1">
              <span>Tích lũy điểm đơn này (+5%):</span>
              <span className="text-amber-400 font-bold">+{Math.round(finalTotalAmount * 0.05).toLocaleString('vi-VN')} pts</span>
            </div>

            <div className="pt-2 border-t border-cinema-700 flex justify-between items-center text-sm font-black text-white">
              <span>Tổng thanh toán:</span>
              <span className="text-xl text-amber-400 font-mono">
                {finalTotalAmount.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-cinema-950/90 border-t border-cinema-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Đóng
          </button>

          {paymentMethod === 'momo' ? (
            <button
              type="button"
              disabled={loading || momoLoading}
              onClick={() => handleMomoCallbackConfirm(0)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-black shadow-glow-red transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang phát hành vé...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Thanh Toán MoMo (
                  {finalTotalAmount.toLocaleString('vi-VN')} đ)
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePay({ isFailure: false, method: 'banking' })}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-glow-emerald transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang phát hành vé...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Xác Nhận Thanh Toán (
                  {finalTotalAmount.toLocaleString('vi-VN')} đ)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
