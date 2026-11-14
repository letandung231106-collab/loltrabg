import React, { useRef, useState } from 'react';
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

  if (!isOpen || !ticket) return null;

  const isActive = ticket.status === 'active';
  const isUsed = ticket.status === 'used';

  // Demo concession bundle attached to this ticket/booking if any
  const concessions = ticket.concessions || [
    { name: 'Bắp Rang Bơ Phô Mai (L)', quantity: 1, price: 69000 },
    { name: 'Nước Ngọt Coca-Cola (L)', quantity: 2, price: 39000 },
  ];
  const concessionTotal = concessions.reduce((sum, item) => sum + item.price * item.quantity, 0);
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

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText('VỊ TRÍ GHẾ NGỒI', canvas.width / 2, 205);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 32px monospace';
      ctx.fillText(`HÀNG ${ticket.row_number} - GHẾ ${ticket.seat_number}`, canvas.width / 2, 245);

      // 5. Suất chiếu & Ngày giờ
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Ngày chiếu: ${new Date(ticket.start_time || Date.now()).toLocaleDateString('vi-VN')}`, 50, 290);
      ctx.fillText(
        `Giờ chiếu: ${new Date(ticket.start_time || Date.now()).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        50,
        315
      );
      ctx.fillText(`Mã vé: ${ticket.ticket_code}`, 50, 340);
      ctx.fillText(`Mã đơn: ${ticket.booking_code || 'BK-ONLINE'}`, 50, 365);

      // 6. QR Code Section (Lấy trực tiếp từ SVG trên DOM)
      const qrSvg = document.getElementById('ticket-qr-svg');
      if (qrSvg) {
        const svgData = new XMLSerializer().serializeToString(qrSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          // Vẽ nền trắng cho QR
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(175, 400, 250, 250);
          ctx.drawImage(img, 190, 415, 220, 220);

          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(ticket.ticket_code, canvas.width / 2, 640);

          // 7. Footer Lưu ý
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 14px Arial, sans-serif';
          ctx.fillText('✓ VÉ HỢP LỆ - XUẤT TRÌNH TẠI CỬA SOÁT VÉ', canvas.width / 2, 700);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '12px Arial, sans-serif';
          ctx.fillText('Kèm combo: Bắp Rang Bơ (L) + Nước Ngọt (L) tại quầy F&B', canvas.width / 2, 730);

          ctx.fillStyle = '#64748b';
          ctx.font = '11px Arial, sans-serif';
          ctx.fillText('Hotline hỗ trợ: 0375358344 • Website: nightmovie.vn', canvas.width / 2, 770);

          // Tải ảnh về
          const imageURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `Ve_Xem_Phim_${ticket.ticket_code}.png`;
          link.href = imageURL;
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

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div
        ref={cardRef}
        className="bg-cinema-900 border border-cinema-700/80 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-cinema-950/90 border-b border-cinema-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ruby-600/20 border border-ruby-500/40 flex items-center justify-center text-ruby-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Chi Tiết Vé Điện Tử</h3>
              <p className="text-xs text-slate-400 font-mono">#{ticket.booking_code || ticket.ticket_code}</p>
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Badge & Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cinema-850 border border-cinema-700/60">
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
            <QRCodeSVG id="ticket-qr-svg" value={ticket.ticket_code} size={180} />
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
                  alt={ticket.movie_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-ruby-400 font-bold uppercase tracking-wider">
                  {ticket.age_rating || 'T16'} • {ticket.screening_format || '2D Phụ đề'}
                </div>
                <h4 className="text-base font-black text-white">{ticket.movie_name}</h4>
                <div className="text-xs text-slate-400 mt-1">Thời lượng: {ticket.duration || 120} phút</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-cinema-850 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold-400" />
                <span>
                  {ticket.start_time ? new Date(ticket.start_time).toLocaleDateString('vi-VN') : '13/11/2026'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-400" />
                <span className="font-bold text-white">
                  {ticket.start_time
                    ? new Date(ticket.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                    : '18:30'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-400" />
                <span>{ticket.room_name || 'Phòng chiếu'}</span>
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
              onClick={handleDownloadTicketImage}
              disabled={downloading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-cinema-950 font-black text-xs transition-all flex items-center gap-1.5 shadow"
              title="Lưu ảnh vé vào điện thoại"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Đang tạo ảnh...' : 'Tải Ảnh Vé Về Máy'}</span>
            </button>

            {isActive && onCancelTicket && (
              <button
                onClick={() => {
                  onClose();
                  onCancelTicket(ticket.id);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-xs font-bold transition-colors"
              >
                Hủy vé
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white text-xs font-bold shadow-glow-red transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
