import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Film,
  Ticket,
  Utensils,
  QrCode,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Copy,
  Receipt,
  Download,
  Share2,
} from 'lucide-react';

export function TicketDetailModal({ ticket, isOpen, onClose, onCancelTicket }) {
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

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

  const isActive = ticket.status === 'active';
  const isUsed = ticket.status === 'used';

  // Demo concession bundle attached to this ticket/booking if any
  const concessions = Array.isArray(ticket.concessions) && ticket.concessions.length > 0
    ? ticket.concessions
    : [
        { name: 'Bắp Rang Bơ Phô Mai (L)', quantity: 1, price: 69000 },
        { name: 'Nước Ngọt Coca-Cola (L)', quantity: 2, price: 39000 },
      ];
  const concessionTotal = concessions.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const ticketPrice = Number(ticket.price || ticket.total_amount || 110000);
  const grandTotal = ticketPrice + concessionTotal;

  // Render vé điện tử dạng Canvas Graphic Poster chất lượng cao để tải về điện thoại/máy tính
  const handleDownloadTicketImage = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 600;
      canvas.height = 920;

      // 1. Background gradient đêm rạp chiếu
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#020617');
      bgGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Viền neon vàng amber
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // 2. Header
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NIGHT MOVIE CINEMA', canvas.width / 2, 50);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText('VÉ XEM PHIM ĐIỆN TỬ CHÍNH THỨC', canvas.width / 2, 72);

      // Đường kẻ đứt nét
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(30, 90);
      ctx.lineTo(canvas.width - 30, 90);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Tên Phim
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ticket.movie_name || 'Phim Chiếu Rạp', canvas.width / 2, 130);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillText(
        `${ticket.room_name || 'Cinema Hall'} - ${ticket.screening_format || '2D/IMAX'}`,
        canvas.width / 2,
        155
      );

      // 4. Khối Vị Trí Ghế To Nổi Bật
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(40, 180, canvas.width - 80, 80);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 180, canvas.width - 80, 80);

      ctx.fillStyle = '#fcd34d';
      ctx.font = '900 32px monospace';
      ctx.fillText(
        `GHẾ: ${ticket.row_number || 'D'}${ticket.seat_number || '5'} (${(ticket.seat_type || 'standard').toUpperCase()})`,
        canvas.width / 2,
        230
      );

      // 5. Suất Chiếu & Ngày
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px Arial, sans-serif';
      const safeTimeStr = typeof ticket.start_time === 'string' ? ticket.start_time.replace(' ', 'T') : ticket.start_time;
      ctx.fillText(
        `Suất Chiếu: ${ticket.start_time ? new Date(safeTimeStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '18:30'}  |  Ngày: ${ticket.start_time ? new Date(safeTimeStr).toLocaleDateString('vi-VN') : '14/11/2026'}`,
        canvas.width / 2,
        290
      );

      // 6. Mã Vé Barcode / QR Section
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(canvas.width / 2 - 110, 320, 220, 220);

      const svgElem = document.getElementById('ticket-qr-svg');
      if (svgElem) {
        const svgData = new XMLSerializer().serializeToString(svgElem);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, canvas.width / 2 - 90, 340, 180, 180);

          // Mã vé
          ctx.fillStyle = '#0f172a';
          ctx.font = '900 14px monospace';
          ctx.fillText(ticket.ticket_code || 'TCK-20261114-1', canvas.width / 2, 530);

          // 7. Thông tin bắp nước đính kèm
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 15px Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('COMBO BẮP NƯỚC ĐÃ ĐẶT (NHẬN TẠI QUẦY F&B):', 40, 580);

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '13px Arial, sans-serif';
          concessions.forEach((c, idx) => {
            ctx.fillText(
              `• ${c.quantity}x ${c.name} (${(c.price * c.quantity).toLocaleString('vi-VN')} đ)`,
              50,
              610 + idx * 25
            );
          });

          // Đường kẻ ngang mờ
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(40, 700);
          ctx.lineTo(canvas.width - 40, 700);
          ctx.stroke();

          // 8. Bảng đối soát tài chính
          ctx.textAlign = 'left';
          ctx.fillStyle = '#94a3b8';
          ctx.font = '13px Arial, sans-serif';
          ctx.fillText(`Tổng tiền vé: ${ticketPrice.toLocaleString('vi-VN')} đ`, 40, 730);
          ctx.fillText(`Tổng bắp nước: +${concessionTotal.toLocaleString('vi-VN')} đ`, 40, 755);
          ctx.fillText('Khuyến mãi giảm giá: -20.000 đ', 40, 780);

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 16px Arial, sans-serif';
          ctx.fillText(
            `TỔNG THANH TOÁN: ${Math.max(0, grandTotal - 20000).toLocaleString('vi-VN')} VNĐ (ĐÃ THANH TOÁN)`,
            40,
            815
          );

          // 9. Lưu ý khách hàng
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ef4444';
          ctx.font = 'italic 12px Arial, sans-serif';
          ctx.fillText(
            '* Vui lòng xuất trình mã QR này tại cửa soát vé và quầy F&B trước giờ chiếu 10 phút.',
            canvas.width / 2,
            865
          );

          // Tự động tải về file PNG
          const link = document.createElement('a');
          link.download = `NIGHT_MOVIE_${ticket.ticket_code || 'TICKET'}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          setDownloading(false);
        };
        img.src = blobURL;
      } else {
        setDownloading(false);
      }
    } catch (e) {
      console.error('Lỗi xuất ảnh vé:', e);
      setDownloading(false);
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
        ref={cardRef}
        className="relative w-full max-w-[850px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl bg-[#12151f] border border-white/10 shadow-2xl animate-scale-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '850px',
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
        {/* Nút Đóng (X) cố định ở góc trên bên phải, kích thước rõ ràng 36x36px, màu nền tối viền sáng nổi bật */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Đóng cửa sổ (phím ESC)"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 bg-cinema-950/90 border-b border-cinema-800 flex items-center justify-between shrink-0 pr-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ruby-600/20 border border-ruby-500/40 flex items-center justify-center text-ruby-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Chi Tiết Vé Điện Tử</h3>
              <p className="text-xs text-slate-400 font-mono">#{ticket.booking_code || ticket.ticket_code}</p>
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
          {/* Status Badge & Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cinema-850/80 border border-cinema-700/60">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isActive ? 'bg-emerald-400 animate-pulse' : isUsed ? 'bg-slate-400' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {isActive ? 'Vé Hợp Lệ (Chưa Soát Vé)' : isUsed ? 'Đã Vào Xem Phim' : 'Đã Hủy'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-gold-400 font-bold">
              Mã vé: {ticket.ticket_code}
            </span>
          </div>

          {/* Large QR Code Display for Usher Scanner */}
          <div className="p-5 rounded-3xl bg-white text-center flex flex-col items-center justify-center shadow-lg relative group">
            <QRCodeSVG id="ticket-qr-svg" value={ticket.ticket_code || 'NIGHT-MOVIE'} size={180} />
            <div className="mt-3 text-xs font-mono font-black text-cinema-950 tracking-wider">
              {ticket.ticket_code}
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              Xuất trình mã này cho nhân viên soát vé tại cửa phòng chiếu
            </div>
          </div>

          {/* Movie Details */}
          <div className="p-4 rounded-2xl bg-cinema-950/70 border border-cinema-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-20 rounded-xl overflow-hidden bg-cinema-800 shrink-0">
                <img
                  src={ticket.movie_poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800'}
                  alt={ticket.movie_name || 'Phim'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-ruby-400 font-bold uppercase tracking-wider">
                  {ticket.age_rating || 'T16'} • {ticket.screening_format || '2D Phụ đề'}
                </div>
                <h4 className="text-base font-black text-white truncate">{ticket.movie_name}</h4>
                <div className="text-xs text-slate-400 mt-1">Thời lượng: {ticket.duration || 120} phút</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-cinema-850 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold-400" />
                <span>
                  {ticket.start_time ? new Date(typeof ticket.start_time === 'string' ? ticket.start_time.replace(' ', 'T') : ticket.start_time).toLocaleDateString('vi-VN') : '14/11/2026'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-400" />
                <span className="font-bold text-white">
                  {ticket.start_time
                    ? new Date(typeof ticket.start_time === 'string' ? ticket.start_time.replace(' ', 'T') : ticket.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : '18:30'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-400" />
                <span className="truncate">{ticket.room_name || 'Phòng chiếu'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gold-400" />
                <span className={`font-bold ${ticket.seat_type === 'couple' ? 'text-pink-400' : 'text-amber-400'}`}>
                  Ghế {ticket.row_number}{ticket.seat_number} (
                  {ticket.seat_type === 'couple'
                    ? 'GHẾ ĐÔI / COUPLE - 2 NGƯỜI'
                    : ticket.seat_type === 'vip'
                    ? 'VIP'
                    : 'STANDARD'}
                  )
                </span>
              </div>
            </div>
          </div>

          {/* Food & Beverage (Bắp Nước Đã Mua Kèm) */}
          <div className="p-4 rounded-2xl bg-cinema-950/70 border border-cinema-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Utensils className="w-4 h-4" /> Bắp Nước & Combo Đã Đặt Kèm
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                Lấy tại quầy F&B
              </span>
            </div>

            <div className="space-y-2">
              {concessions.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-cinema-800/60 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cinema-800 text-amber-400 font-mono flex items-center justify-center font-bold text-[11px]">
                      {item.quantity}x
                    </span>
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-300">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Price Breakdown */}
          <div className="p-4 rounded-2xl bg-cinema-850/60 border border-cinema-700/60 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Tiền vé xem phim:</span>
              <span className="font-mono text-white">{ticketPrice.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tiền bắp nước F&B:</span>
              <span className="font-mono text-white">+{concessionTotal.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Mã giảm giá đã áp dụng:</span>
              <span className="font-mono">-20.000 đ</span>
            </div>
            <div className="pt-2 border-t border-cinema-700 flex justify-between items-center text-sm font-black text-white">
              <span>Tổng thanh toán đã trả:</span>
              <span className="text-base text-amber-400 font-mono">
                {Math.max(0, grandTotal - 20000).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-cinema-950/90 border-t border-cinema-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTicketImage}
              disabled={downloading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-cinema-950 font-black text-xs transition-all flex items-center gap-1.5 shadow cursor-pointer"
              title="Lưu ảnh vé vào điện thoại"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Đang tạo ảnh...' : 'Tải Ảnh Vé Về Máy'}</span>
            </button>

            {isActive && onCancelTicket && (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onCancelTicket?.(ticket.id);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy vé
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white text-xs font-bold shadow-glow-red transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
