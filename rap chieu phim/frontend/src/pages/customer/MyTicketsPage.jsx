import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TicketCard } from '../../components/customer/TicketCard';
import { Ticket, Film, AlertCircle, RefreshCw } from 'lucide-react';

export function MyTicketsPage({ onNavigateBooking }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const res = await api.getMyTickets();
      if (res.success) setTickets(res.data);
    } catch (err) {
      setMsg({ text: err.message || 'Không thể tải danh sách vé.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm('Bạn có chắc chắn muốn yêu cầu hủy vé xem phim này không?')) return;
    try {
      const res = await api.cancelTicket(ticketId);
      if (res.success) {
        setMsg({ text: res.message || 'Đã hủy vé thành công!', type: 'success' });
        fetchMyTickets();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi hủy vé.', type: 'error' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Ticket className="w-8 h-8 text-ruby-500" /> Vé Của Tôi & Lịch Sử Đặt Vé
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý vé điện tử và xuất trình mã QR tại cửa kiểm soát
          </p>
        </div>
        <button
          onClick={fetchMyTickets}
          className="p-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 border border-cinema-700/60 transition-colors"
          title="Làm mới"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-ruby-950/80 border-ruby-500 text-ruby-200'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold ml-4">
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-ruby-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs">Đang tải vé của bạn...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-16 text-center glass-panel rounded-3xl border border-cinema-700 space-y-4">
          <Ticket className="w-16 h-16 text-slate-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">Bạn chưa có vé xem phim nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hãy khám phá ngay các bộ phim bom tấn đang chiếu và đặt vé để thưởng thức cùng bạn bè!
          </p>
          <button
            onClick={onNavigateBooking}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 text-white font-bold text-sm shadow-glow-red transition-all"
          >
            Khám Phá Phim Ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onCancel={handleCancelTicket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
