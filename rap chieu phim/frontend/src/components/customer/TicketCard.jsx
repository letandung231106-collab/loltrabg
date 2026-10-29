import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Film, Calendar, Clock, MapPin, CheckCircle, Sparkles, XCircle } from 'lucide-react';

export function TicketCard({ ticket, onCancel }) {
  const isUsed = ticket.status === 'used';
  const isCancelled = ticket.status === 'cancelled';
  const isActive = ticket.status === 'active';

  return (
    <div className="relative glass-panel rounded-3xl overflow-hidden border border-cinema-600/80 shadow-2xl flex flex-col md:flex-row transition-all hover:border-ruby-500/50">
      {/* Left Movie Banner */}
      <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden">
        <img
          src={ticket.movie_poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800'}
          alt={ticket.movie_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 md:bg-gradient-to-r md:from-transparent md:to-cinema-950" />
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
            isActive ? 'bg-emerald-600 text-white shadow-glow-emerald' : isUsed ? 'bg-cinema-700 text-slate-300' : 'bg-rose-600 text-white'
          }`}>
            {isActive ? '● VÉ HỢP LỆ' : isUsed ? '✓ ĐÃ SOÁT VÉ' : '✕ ĐÃ HỦY'}
          </span>
        </div>
      </div>

      {/* Center Ticket Details */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold text-ruby-400 tracking-wider uppercase mb-1">
            VÉ ĐIỆN TỬ NIGHT MOVIE
          </div>
          <h4 className="text-xl font-black text-white leading-tight mb-3">
            {ticket.movie_name}
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold-400" />
              <span>{ticket.start_time ? new Date(ticket.start_time).toLocaleDateString('vi-VN') : '14/09/2026'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-400" />
              <span className="font-bold text-white">
                {ticket.start_time ? new Date(ticket.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '18:00'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold-400" />
              <span>{ticket.room_name || 'Cinema Hall'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-gold-400" />
              <span>{ticket.screening_format || '2D Phụ đề'}</span>
            </div>
          </div>
        </div>

        {/* Seat Badge & Code */}
        <div className="pt-3 border-t border-cinema-700/60 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] text-slate-400">VỊ TRÍ GHẾ</div>
            <div className="text-xl font-black text-amber-400 font-mono">
              HÀNG {ticket.row_number} - GHẾ {ticket.seat_number}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 text-right">MÃ VÉ</div>
            <div className="text-xs font-mono font-bold text-slate-200">
              {ticket.ticket_code}
            </div>
          </div>
        </div>

        {/* Cancel Action if applicable */}
        {isActive && onCancel && (
          <div className="mt-4 pt-2 text-right">
            <button
              onClick={() => onCancel(ticket.id)}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline"
            >
              Yêu cầu hủy vé này
            </button>
          </div>
        )}
      </div>

      {/* Right QR Code Section (Barcode & Scanner) */}
      <div className="p-6 md:w-48 bg-cinema-900 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-cinema-700/60 text-center">
        <div className="p-2.5 bg-white rounded-2xl shadow-lg mb-2">
          <QRCodeSVG value={ticket.ticket_code || 'TCK-DEMO'} size={100} />
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1">Quét tại cửa soát vé</div>
      </div>
    </div>
  );
}
