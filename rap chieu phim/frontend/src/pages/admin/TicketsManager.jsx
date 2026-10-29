import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Ticket, Search, QrCode, CheckCircle, XCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';

export function TicketsManager() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, search]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.getAllTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      if (res.success) setTickets(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách vé:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTicket = async (codeToVerify) => {
    const code = codeToVerify || verifyCode;
    if (!code) return;
    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await api.verifyTicket(code);
      setVerifyResult({ success: true, message: res.message, data: res.data });
      fetchTickets();
    } catch (err) {
      setVerifyResult({ success: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-ruby-500" /> Quản Lý Vé & Soát Vé QR
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu thông tin vé đã phát hành và xác thực check-in tại cửa kiểm soát
          </p>
        </div>
      </div>

      {/* QR Code Scanner / Ticket Verifier Tool */}
      <div className="p-5 rounded-3xl glass-panel border border-gold-500/50 shadow-glow-amber space-y-4">
        <div className="flex items-center gap-2 text-gold-400 font-extrabold text-sm">
          <QrCode className="w-5 h-5" /> SOÁT VÉ ĐIỆN TỬ TẠI CỬA KHÁN PHÒNG (STAFF CHECK-IN)
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="Nhập mã vé (ví dụ: TCK-20260914-7-D5) hoặc quét mã QR..."
              className="w-full px-4 py-3 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs font-mono focus:outline-none focus:border-gold-500"
            />
          </div>
          <button
            onClick={() => handleVerifyTicket()}
            disabled={verifying || !verifyCode}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-cinema-950 font-black text-xs shadow-glow-amber transition-all disabled:opacity-50"
          >
            {verifying ? 'Đang kiểm tra...' : 'Xác Thực & Soát Vé'}
          </button>
        </div>

        {/* Verification Result Banner */}
        {verifyResult && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 animate-scale-in ${
              verifyResult.success
                ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                : 'bg-rose-950 border-rose-500 text-rose-200'
            }`}
          >
            {verifyResult.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-bold text-white text-sm">
                {verifyResult.success ? 'HỢP LỆ - SOÁT VÉ THÀNH CÔNG!' : 'KHÔNG HỢP LỆ HOẶC ĐÃ DÙNG'}
              </div>
              <div>{verifyResult.message}</div>
            </div>
            <button onClick={() => setVerifyResult(null)} className="font-bold text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Filter Row */}
      <div className="p-4 glass-panel rounded-2xl border border-cinema-700/60 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã vé, tên khách, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none"
          >
            <option value="all">Tất cả ({tickets.length})</option>
            <option value="active">Active (Hợp lệ)</option>
            <option value="used">Used (Đã soát)</option>
            <option value="cancelled">Cancelled (Đã hủy)</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Mã vé</th>
                <th className="p-4">Phim & Suất chiếu</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Phòng & Ghế</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-cinema-850/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-amber-400">
                    {t.ticket_code}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{t.movie_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{t.start_time}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{t.customer_name}</div>
                    <div className="text-[10px] text-slate-400">{t.customer_phone}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-white">{t.room_name}</div>
                    <div className="text-[10px] text-ruby-400 font-mono font-bold">
                      Hàng {t.row_number} - Ghế {t.seat_number} ({t.seat_type})
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      t.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' :
                      t.status === 'used' ? 'bg-cinema-800 text-slate-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {t.status === 'active' ? '● Hợp lệ' : t.status === 'used' ? '✓ Đã soát vé' : '✕ Đã hủy'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {t.status === 'active' && (
                      <button
                        onClick={() => handleVerifyTicket(t.ticket_code)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                      >
                        Soát Vé Ngay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
