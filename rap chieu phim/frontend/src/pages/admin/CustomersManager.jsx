import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserCheck, Search, DollarSign, Ticket, Eye, X } from 'lucide-react';

export function CustomersManager() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({ search: search || undefined });
      if (res.success) setCustomers(res.data);
    } catch (err) {
      console.error('Lỗi tải khách hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = async (id) => {
    setHistoryLoading(true);
    try {
      const res = await api.getCustomerById(id);
      if (res.success) setSelectedCustomer(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-ruby-500" /> Quản Lý Khách Hàng (CRM)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi danh sách khách hàng, hạng thẻ thành viên, tổng chi tiêu và lịch sử đặt vé (Mục 22)
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 glass-panel rounded-2xl border border-cinema-700/60 flex items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên khách, email, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Tổng cộng: <strong className="text-white">{customers.length} khách hàng</strong>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Khách Hàng</th>
                <th className="p-4">Email</th>
                <th className="p-4">Điện thoại</th>
                <th className="p-4">Hạng thẻ</th>
                <th className="p-4">Tổng đơn đặt</th>
                <th className="p-4">Tổng vé đã mua</th>
                <th className="p-4">Tổng chi tiêu</th>
                <th className="p-4 text-right">Lịch sử</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-cinema-850/60 transition-colors">
                  <td className="p-4 font-bold text-white text-sm">
                    {c.name}
                  </td>
                  <td className="p-4 text-slate-300">{c.email}</td>
                  <td className="p-4 font-mono text-slate-400">{c.phone}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.membership_level === 'platinum' ? 'bg-purple-950 text-purple-300 border border-purple-500' :
                      c.membership_level === 'gold' ? 'bg-amber-950 text-amber-300 border border-amber-500' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {c.membership_level}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{c.total_bookings} đơn</td>
                  <td className="p-4 text-slate-300">{c.total_tickets} vé</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">
                    {parseFloat(c.total_spent).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleViewCustomer(c.id)}
                      className="p-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600 overflow-y-auto max-h-[85vh] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <div>
                <h3 className="font-black text-base text-white">{selectedCustomer.name}</h3>
                <span className="text-xs text-slate-400">{selectedCustomer.email} • {selectedCustomer.phone}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-gold-400 uppercase tracking-wider">LỊCH SỬ ĐẶT VÉ:</div>
              {selectedCustomer.bookings?.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">Khách hàng chưa có giao dịch nào.</p>
              ) : (
                selectedCustomer.bookings?.map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-cinema-900 border border-cinema-700 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{b.movie_name}</div>
                      <div className="text-[10px] text-slate-400">{b.room_name} • {b.start_time}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400">{parseFloat(b.total_amount).toLocaleString('vi-VN')}đ</div>
                      <span className="text-[10px] font-bold uppercase text-emerald-400">{b.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
