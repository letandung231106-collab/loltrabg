import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  DollarSign,
  Plus,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Calculator,
  Lock,
  Calendar,
  User,
  ShieldCheck,
  X,
  CreditCard,
  QrCode,
  Banknote
} from 'lucide-react';

export function ShiftHandoverManager() {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    work_shift_id: 1,
    employee_id: 4,
    manager_id: 2,
    opening_float: 2000000,
    cash_sales: 6500000,
    card_sales: 9200000,
    qr_sales: 5800000,
    actual_cash_counted: 8500000,
    cash_dropped_to_safe: 6000000,
    next_shift_float: 2500000,
    notes: 'Ca chiều đông khách, hoạt động trơn tru.',
  });

  useEffect(() => {
    fetchHandovers();
  }, []);

  const fetchHandovers = async () => {
    setLoading(true);
    try {
      const res = await api.getHandovers();
      if (res.success) setHandovers(res.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải danh sách bàn giao ca.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Tính toán đối soát tự động
  const expectedCash = parseFloat(formData.opening_float || 0) + parseFloat(formData.cash_sales || 0);
  const currentVariance = parseFloat(formData.actual_cash_counted || 0) - expectedCash;
  const totalRevenue = parseFloat(formData.cash_sales || 0) + parseFloat(formData.card_sales || 0) + parseFloat(formData.qr_sales || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createHandover(formData);
      if (res.success) {
        setMsg({ text: res.message || 'Đã tạo biên bản bàn giao ca!', type: 'success' });
        setModalOpen(false);
        fetchHandovers();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tạo biên bản.', type: 'error' });
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await api.approveHandover(id, { status: 'approved' });
      if (res.success) {
        setMsg({ text: 'Quản lý đã duyệt đối soát két tiền ca trực!', type: 'success' });
        fetchHandovers();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Không thể duyệt biên bản.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-ruby-500" /> Bàn Giao Ca & Đối Soát Két Tiền
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kiểm đếm tiền mặt tại quầy, đối soát chênh lệch doanh thu vé/bắp nước & nộp quỹ két chính
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Lập Biên Bản Bàn Giao Ca
        </button>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-200' : 'bg-ruby-950 border border-ruby-500 text-ruby-200'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold">Đóng</button>
        </div>
      )}

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-cinema-700/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Doanh thu tiền mặt</div>
            <div className="text-lg font-black text-white font-mono">
              {handovers.reduce((s, h) => s + (h.cash_sales || 0), 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cinema-700/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Quẹt thẻ POS</div>
            <div className="text-lg font-black text-white font-mono">
              {handovers.reduce((s, h) => s + (h.card_sales || 0), 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cinema-700/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Chuyển khoản QR</div>
            <div className="text-lg font-black text-white font-mono">
              {handovers.reduce((s, h) => s + (h.qr_sales || 0), 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cinema-700/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gold-600/20 text-gold-400 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Tiền đã nộp vào két an toàn</div>
            <div className="text-lg font-black text-gold-400 font-mono">
              {handovers.reduce((s, h) => s + (h.cash_dropped_to_safe || 0), 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      </div>

      {/* Handovers Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Thời gian & Ca</th>
                <th className="p-4">Nhân viên chốt ca</th>
                <th className="p-4">Tiền đầu ca</th>
                <th className="p-4">Tiền mặt thu</th>
                <th className="p-4">Tiền đếm thực tế</th>
                <th className="p-4">Chênh lệch két</th>
                <th className="p-4">Nộp két an toàn</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Quản lý duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {handovers.map((h) => {
                const isExact = Math.abs(h.variance || 0) === 0;
                return (
                  <tr key={h.id} className="hover:bg-cinema-850/60 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-slate-300 font-bold">{h.created_at}</div>
                      <div className="text-[10px] text-ruby-400 font-semibold">Ca làm việc #{h.work_shift_id}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {h.employee_name}
                      </div>
                      <div className="text-[10px] text-slate-400">{h.notes}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {h.opening_float?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-4 font-mono text-emerald-400 font-semibold">
                      +{h.cash_sales?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      {h.actual_cash_counted?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-4 font-mono font-bold">
                      <span className={isExact ? 'text-emerald-400' : 'text-rose-400'}>
                        {h.variance > 0 ? `+${h.variance.toLocaleString('vi-VN')}` : h.variance?.toLocaleString('vi-VN')} đ
                        {isExact ? ' (Khớp 100%)' : ''}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-gold-400 font-bold">
                      {h.cash_dropped_to_safe?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        h.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                          : 'bg-amber-950 text-amber-400 border border-amber-600'
                      }`}>
                        {h.status === 'approved' ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {h.status !== 'approved' ? (
                        <button
                          onClick={() => handleApprove(h.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-glow-emerald"
                        >
                          Duyệt Chốt Két
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-end gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {h.manager_name}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lập Biên Bản Bàn Giao Ca */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-ruby-500" />
                Lập Biên Bản Đối Soát & Bàn Giao Két Tiền
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              {/* Cash Reconciliation Calculation Box */}
              <div className="p-4 rounded-2xl bg-cinema-950/90 border border-cinema-700/80 space-y-3">
                <div className="font-extrabold text-white text-xs flex items-center justify-between">
                  <span>Tự động đối soát doanh thu ca</span>
                  <span className="text-gold-400 font-mono">Tổng thu: {totalRevenue.toLocaleString('vi-VN')} đ</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-cinema-900 border border-cinema-800 text-center">
                    <div className="text-[10px] text-slate-400">💵 Tiền Mặt</div>
                    <div className="font-mono font-bold text-white">{parseFloat(formData.cash_sales || 0).toLocaleString('vi-VN')} đ</div>
                  </div>
                  <div className="p-2 rounded-xl bg-cinema-900 border border-cinema-800 text-center">
                    <div className="text-[10px] text-slate-400">💳 Quẹt Thẻ</div>
                    <div className="font-mono font-bold text-blue-400">{parseFloat(formData.card_sales || 0).toLocaleString('vi-VN')} đ</div>
                  </div>
                  <div className="p-2 rounded-xl bg-cinema-900 border border-cinema-800 text-center">
                    <div className="text-[10px] text-slate-400">📱 Chuyển QR</div>
                    <div className="font-mono font-bold text-purple-400">{parseFloat(formData.qr_sales || 0).toLocaleString('vi-VN')} đ</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-cinema-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">Tiền mặt lý thuyết (Đầu ca + Thu):</span>
                  <span className="font-mono font-black text-white">{expectedCash.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Form Input Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Tiền lẻ đầu ca (VNĐ) *</label>
                  <input
                    type="number"
                    step={1000}
                    required
                    value={formData.opening_float}
                    onChange={(e) => setFormData({ ...formData, opening_float: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Doanh thu tiền mặt thu được *</label>
                  <input
                    type="number"
                    step={1000}
                    required
                    value={formData.cash_sales}
                    onChange={(e) => setFormData({ ...formData, cash_sales: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Doanh thu qua thẻ POS</label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.card_sales}
                    onChange={(e) => setFormData({ ...formData, card_sales: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Doanh thu quét mã QR</label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.qr_sales}
                    onChange={(e) => setFormData({ ...formData, qr_sales: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Physical Cash Counted */}
              <div className="p-3.5 rounded-2xl bg-ruby-950/40 border border-ruby-600/40 space-y-2">
                <label className="block font-bold text-ruby-300">Tiền mặt kiểm đếm thực tế trong két (VNĐ) *</label>
                <input
                  type="number"
                  step={1000}
                  required
                  value={formData.actual_cash_counted}
                  onChange={(e) => setFormData({ ...formData, actual_cash_counted: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-950 border border-ruby-500/60 text-white font-mono text-sm font-bold focus:outline-none"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 font-semibold">Chênh lệch két thực tế:</span>
                  <span className={`font-mono font-bold text-sm ${currentVariance === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentVariance > 0 ? `+${currentVariance.toLocaleString('vi-VN')}` : currentVariance.toLocaleString('vi-VN')} đ
                    {currentVariance === 0 ? ' (Khớp tuyệt đối ✓)' : ' (Lệch két ⚠️)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Tiền nộp về két chính rạp</label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.cash_dropped_to_safe}
                    onChange={(e) => setFormData({ ...formData, cash_dropped_to_safe: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Tiền để lại ca sau (Float)</label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.next_shift_float}
                    onChange={(e) => setFormData({ ...formData, next_shift_float: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Ghi chú bàn giao</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú về tiền rách, giao dịch hủy hoặc sự cố ca trực..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold shadow-glow-red"
                >
                  Ký & Lưu Bàn Giao
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
