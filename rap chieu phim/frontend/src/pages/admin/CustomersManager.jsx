import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserCheck, Search, DollarSign, Ticket, Eye, Edit2, X, CheckCircle, AlertCircle } from 'lucide-react';

export function CustomersManager() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    membership_level: 'standard',
  });
  const [msg, setMsg] = useState({ text: '', type: '' });

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

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setEditFormData({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      membership_level: c.membership_level || 'standard',
    });
    setIsEditOpen(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.updateCustomer(editingCustomer.id, editFormData);
      setMsg({ text: res.message || 'Cập nhật thông tin khách hàng thành công!', type: 'success' });
      setIsEditOpen(false);
      fetchCustomers();
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi cập nhật khách hàng.', type: 'error' });
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

      {msg.text && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
              : 'bg-ruby-950 border border-ruby-500 text-ruby-200'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold">
            Đóng
          </button>
        </div>
      )}

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
                <th className="p-4 whitespace-nowrap">Điện thoại</th>
                <th className="p-4 whitespace-nowrap">Hạng thẻ</th>
                <th className="p-4 whitespace-nowrap">Tổng đơn đặt</th>
                <th className="p-4 whitespace-nowrap">Tổng vé đã mua</th>
                <th className="p-4 whitespace-nowrap">Tổng chi tiêu</th>
                <th className="p-4 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-cinema-850/60 transition-colors">
                  <td className="p-4 font-bold text-white text-sm">{c.name}</td>
                  <td className="p-4 text-slate-300">{c.email}</td>
                  <td className="p-4 font-mono text-slate-400">{c.phone}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        c.membership_level === 'platinum'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : c.membership_level === 'gold'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        c.membership_level === 'platinum' ? 'bg-purple-400' : c.membership_level === 'gold' ? 'bg-amber-400' : 'bg-slate-400'
                      }`} />
                      {c.membership_level === 'platinum' ? 'Platinum' : c.membership_level === 'gold' ? 'Gold' : 'Standard'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{c.total_bookings} đơn</td>
                  <td className="p-4 text-slate-300">{c.total_tickets} vé</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">
                    {parseFloat(c.total_spent).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-gold-400 transition-colors"
                        title="Chỉnh sửa thông tin & Hạng thẻ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleViewCustomer(c.id)}
                        className="p-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300 transition-colors"
                        title="Xem lịch sử đơn đặt vé"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                <span className="text-xs text-slate-400">
                  {selectedCustomer.email} • {selectedCustomer.phone}
                </span>
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
                  <div
                    key={b.id}
                    className="p-3 rounded-xl bg-cinema-900 border border-cinema-700 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{b.movie_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {b.room_name} • {b.start_time}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400">
                        {parseFloat(b.total_amount).toLocaleString('vi-VN')}đ
                      </div>
                      <span className="text-[10px] font-bold uppercase text-emerald-400">{b.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600 overflow-hidden">
            <button
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-gold-400" />
              Cập Nhật Khách Hàng
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Chỉnh sửa thông tin liên hệ và phân hạng thành viên VIP
            </p>

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Hạng thẻ thành viên</label>
                <select
                  value={editFormData.membership_level}
                  onChange={(e) => setEditFormData({ ...editFormData, membership_level: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none font-bold"
                >
                  <option value="standard">Standard - Thành viên tiêu chuẩn</option>
                  <option value="silver">Silver - Thành viên Bạc (Tích điểm 5%)</option>
                  <option value="gold">Gold - Thành viên Vàng (Tích điểm 10%)</option>
                  <option value="platinum">Platinum - Thành viên Bạch Kim (Tích điểm 15%)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all"
                >
                  Lưu Thông Tin Khách Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
