import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { SeatMap } from '../../components/customer/SeatMap';
import { PaymentModal } from '../../components/customer/PaymentModal';
import { TicketCard } from '../../components/customer/TicketCard';
import { ArrowLeft, Clock, Calendar, Film, MapPin, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export function BookingFlowPage({
  scheduleId,
  onBack,
  onNavigateMyTickets,
  onOpenAuth,
  initialIssuedTickets = null,
}) {
  const { setSelectedSchedule, proceedToHoldSeats, cancelHold, activeBooking, isHolding, resetBookingState } = useBooking();
  const { isAuthenticated } = useAuth();

  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(Boolean(scheduleId) && !initialIssuedTickets);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [issuedTickets, setIssuedTickets] = useState(initialIssuedTickets);

  useEffect(() => {
    if (initialIssuedTickets) {
      setIssuedTickets(initialIssuedTickets);
      setLoading(false);
    }
  }, [initialIssuedTickets]);

  useEffect(() => {
    if (scheduleId && !initialIssuedTickets) {
      fetchSeatMap();
    }
    return () => {
      // Don't auto reset if user is in active hold session
    };
  }, [scheduleId]);

  const fetchSeatMap = async () => {
    try {
      const res = await api.getScheduleSeatMap(scheduleId);
      if (res.success && res.data) {
        setScheduleData(res.data);
        setSelectedSchedule(res.data.schedule);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tải sơ đồ ghế của suất chiếu.');
    } finally {
      setLoading(false);
    }
  };

  // Tiến hành giữ ghế và mở modal thanh toán
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập tài khoản để tiếp tục giữ ghế và thanh toán.');
      onOpenAuth();
      return;
    }

    try {
      setErrorMsg('');
      if (!isHolding) {
        await proceedToHoldSeats();
      }
      setIsPaymentOpen(true);
      // Refresh seat map to show updated holding state
      fetchSeatMap();
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi giữ ghế.');
      // Refresh seat map to see which seat was conflicted
      fetchSeatMap();
    }
  };

  const handlePaymentSuccess = (paymentResult) => {
    setIsPaymentOpen(false);
    setIssuedTickets(paymentResult);
    resetBookingState();
  };

  const handleCancelHoldSeats = async () => {
    await cancelHold();
    fetchSeatMap();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-ruby-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Đang tải sơ đồ ghế thời gian thực...</p>
      </div>
    );
  }

  // Màn hình hoàn tất đặt vé & Hiển thị vé điện tử
  if (issuedTickets) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-scale-in space-y-6">
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-cinema-900 to-emerald-950 border-2 border-emerald-500/60 text-center shadow-glow-emerald">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2 animate-bounce" />
          <h2 className="text-2xl font-black text-white">THANH TOÁN & ĐẶT VÉ THÀNH CÔNG!</h2>
          <p className="text-xs text-emerald-300 mt-1">
            Đơn hàng #{issuedTickets.bookingCode} đã được xác nhận. Bạn có thể xuất trình mã QR dưới đây khi vào rạp.
          </p>
        </div>

        <div className="space-y-4">
          {issuedTickets.tickets?.map((t) => (
            <TicketCard
              key={t.id}
              ticket={{
                ...t,
                movie_name: issuedTickets.movieName,
                room_name: issuedTickets.roomName,
                start_time: issuedTickets.screeningTime,
                ticket_code: t.ticketCode,
                status: 'active',
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-white font-bold text-sm transition-colors"
          >
            ← Tiếp Tục Mua Vé Khác
          </button>
          <button
            onClick={onNavigateMyTickets}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 text-white font-bold text-sm shadow-glow-red transition-all"
          >
            Xem Tất Cả Vé Của Tôi
          </button>
        </div>
      </div>
    );
  }

  const schedule = scheduleData?.schedule;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Movie Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-cinema-700/60">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cinema-900 hover:bg-cinema-800 text-slate-300 hover:text-white border border-cinema-700/60 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Lịch chiếu
        </button>

        {schedule && (
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-ruby-400" />
              <span className="font-extrabold text-white text-sm">{schedule.movie_name}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-semibold text-gold-400">
              <MapPin className="w-3.5 h-3.5" />
              {schedule.room_name} ({schedule.room_type?.toUpperCase()})
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Calendar className="w-3.5 h-3.5 text-ruby-400" />
              {new Date(schedule.start_time).toLocaleDateString('vi-VN')}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Clock className="w-3.5 h-3.5 text-ruby-400" />
              {new Date(schedule.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        {/* Refresh Live Seat Map Button */}
        <button
          onClick={fetchSeatMap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300 text-xs font-medium border border-cinema-700 transition-colors"
          title="Tải lại trạng thái ghế mới nhất"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới sơ đồ
        </button>
      </div>

      {/* Error Alert (e.g. Concurrency conflict: Ghế vừa được người khác giữ) */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-ruby-950/90 border border-ruby-500 text-ruby-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-glow-red animate-shake">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-ruby-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-ruby-300 hover:text-white font-bold ml-4">
            Đóng
          </button>
        </div>
      )}

      {/* Interactive Seat Map */}
      <SeatMap
        scheduleData={scheduleData}
        onProceedToPayment={handleProceedToPayment}
        onCancelHold={handleCancelHoldSeats}
      />

      {/* Payment Simulator Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
