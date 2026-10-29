import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Search,
  CheckCircle,
  FileText,
  Clock,
  Filter,
  X,
  RefreshCw,
  TrendingDown
} from 'lucide-react';

export function InventoryManager() {
  const [ingredients, setIngredients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'logs'
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Import / Export Modal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    ingredient_id: '',
    change_type: 'import',
    quantity: 10,
    reason: 'Nhập hàng định kỳ',
    employee_id: 2,
  });

  // New Ingredient Modal
  const [ingModalOpen, setIngModalOpen] = useState(false);
  const [ingForm, setIngForm] = useState({
    code: '',
    name: '',
    unit: 'kg',
    stock_quantity: 50,
    min_threshold: 15,
    cost_per_unit: 45000,
    supplier: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resIng, resLogs] = await Promise.all([
        api.getIngredients(),
        api.getInventoryLogs(),
      ]);
      if (resIng.success) setIngredients(resIng.data);
      if (resLogs.success) setLogs(resLogs.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải dữ liệu kho.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLogModal = (ingredientId = null, type = 'import') => {
    setLogForm({
      ingredient_id: ingredientId || (ingredients[0]?.id || ''),
      change_type: type,
      quantity: type === 'import' ? 50 : 5,
      reason: type === 'import' ? 'Nhập kho từ nhà cung cấp' : type === 'waste' ? 'Hao hụt / Hỏng rách bao bì' : 'Xuất quầy bán',
      employee_id: 2,
    });
    setLogModalOpen(true);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createInventoryLog(logForm);
      if (res.success) {
        setMsg({ text: res.message || 'Cập nhật kho thành công!', type: 'success' });
        setLogModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tạo phiếu kho.', type: 'error' });
    }
  };

  const handleIngSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createIngredient(ingForm);
      if (res.success) {
        setMsg({ text: 'Thêm nguyên vật liệu mới thành công!', type: 'success' });
        setIngModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi thêm nguyên liệu.', type: 'error' });
    }
  };

  const lowStockCount = ingredients.filter((i) => i.stock_quantity <= i.min_threshold).length;

  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-ruby-500" /> Quản Lý Kho Nguyên Vật Liệu F&B
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kiểm soát tồn kho hạt bắp, bơ, siro nước ngọt, ly cốc & lịch sử biến động hao hụt
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenLogModal(null, 'import')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-emerald transition-all flex items-center gap-1.5"
          >
            <ArrowDownRight className="w-4 h-4" /> Tạo Phiếu Nhập Kho
          </button>
          <button
            onClick={() => handleOpenLogModal(null, 'waste')}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <TrendingDown className="w-4 h-4" /> Báo Cáo Hao Hụt
          </button>
          <button
            onClick={() => setIngModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm Nguyên Liệu
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-200' : 'bg-ruby-950 border border-ruby-500 text-ruby-200'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold">Đóng</button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-cinema-700/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-ruby-600/20 text-ruby-400 flex items-center justify-center font-bold">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Tổng mặt hàng nguyên liệu</div>
            <div className="text-xl font-black text-white font-mono">{ingredients.length} loại</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cinema-700/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Cảnh báo sắp hết hàng</div>
            <div className="text-xl font-black text-amber-400 font-mono">{lowStockCount} mặt hàng</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-cinema-700/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-semibold">Giao dịch biến động kho</div>
            <div className="text-xl font-black text-white font-mono">{logs.length} lượt</div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="p-1 rounded-xl bg-cinema-900 border border-cinema-700/60 flex items-center">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'stock'
                ? 'bg-ruby-600 text-white shadow-glow-red'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" /> Bảng Tồn Kho Hiện Tại
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-ruby-600 text-white shadow-glow-red'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Lịch Sử Nhập / Xuất / Hao Hụt ({logs.length})
          </button>
        </div>

        {activeTab === 'stock' && (
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nguyên liệu..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
            />
          </div>
        )}
      </div>

      {/* ================= STOCK LEVEL TABLE ================= */}
      {activeTab === 'stock' && (
        <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
                <tr>
                  <th className="p-4">Mã & Tên nguyên vật liệu</th>
                  <th className="p-4">Đơn vị</th>
                  <th className="p-4">Số lượng tồn kho</th>
                  <th className="p-4">Mức an toàn tối thiểu</th>
                  <th className="p-4">Đơn giá vốn</th>
                  <th className="p-4">Nhà cung cấp</th>
                  <th className="p-4">Tình trạng</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-800">
                {filteredIngredients.map((ing) => {
                  const isLow = ing.stock_quantity <= ing.min_threshold;
                  return (
                    <tr key={ing.id} className={`hover:bg-cinema-850/60 transition-colors ${isLow ? 'bg-amber-950/20' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{ing.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{ing.code}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-300">{ing.unit}</td>
                      <td className="p-4">
                        <span className={`text-sm font-black font-mono ${isLow ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                          {ing.stock_quantity.toLocaleString('vi-VN')} {ing.unit}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {ing.min_threshold} {ing.unit}
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        {ing.cost_per_unit?.toLocaleString('vi-VN')} đ/{ing.unit}
                      </td>
                      <td className="p-4 text-slate-400">{ing.supplier}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isLow
                            ? 'bg-rose-950 text-rose-400 border border-rose-600'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                        }`}>
                          {isLow ? '⚠️ Sắp hết hàng' : '● Tồn an toàn'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenLogModal(ing.id, 'import')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-700 text-emerald-200 text-[10px] font-bold"
                            title="Nhập thêm"
                          >
                            + Nhập
                          </button>
                          <button
                            onClick={() => handleOpenLogModal(ing.id, 'waste')}
                            className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-700 text-amber-200 text-[10px] font-bold"
                            title="Báo hao hụt"
                          >
                            Hao hụt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= INVENTORY LOGS TABLE ================= */}
      {activeTab === 'logs' && (
        <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
                <tr>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Nguyên vật liệu</th>
                  <th className="p-4">Loại biến động</th>
                  <th className="p-4">Số lượng thay đổi</th>
                  <th className="p-4">Lý do / Nghiệp vụ</th>
                  <th className="p-4">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-cinema-850/60 transition-colors">
                    <td className="p-4 text-slate-400 font-mono text-[11px]">{log.created_at}</td>
                    <td className="p-4 font-bold text-white">{log.ingredient_name}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        log.change_type === 'import'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                          : log.change_type === 'waste'
                          ? 'bg-rose-950 text-rose-400 border border-rose-600'
                          : 'bg-blue-950 text-blue-400 border border-blue-600'
                      }`}>
                        {log.change_type === 'import' ? '⬇ Nhập kho' : log.change_type === 'waste' ? '✕ Hao hụt / Hỏng' : '⬆ Tiêu hao bán'}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-sm">
                      <span className={log.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {log.quantity > 0 ? `+${log.quantity}` : log.quantity} {log.ingredient_unit}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{log.reason}</td>
                    <td className="p-4 text-slate-400 font-semibold">{log.employee_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nhập Kho / Báo Hao Hụt */}
      {logModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-ruby-500" />
                {logForm.change_type === 'import' ? 'Tạo Phiếu Nhập Kho' : 'Báo Cáo Hao Hụt / Hỏng'}
              </h3>
              <button onClick={() => setLogModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Nguyên vật liệu *</label>
                <select
                  value={logForm.ingredient_id}
                  onChange={(e) => setLogForm({ ...logForm, ingredient_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                >
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code} - Hiện còn: {i.stock_quantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Loại phiếu</label>
                  <select
                    value={logForm.change_type}
                    onChange={(e) => setLogForm({ ...logForm, change_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="import">Nhập kho (+)</option>
                    <option value="waste">Hao hụt / Bắp cháy / Rách (-)</option>
                    <option value="usage">Xuất nội bộ (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Số lượng *</label>
                  <input
                    type="number"
                    required
                    step={0.1}
                    value={logForm.quantity}
                    onChange={(e) => setLogForm({ ...logForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Lý do / Ghi chú</label>
                <textarea
                  rows={2}
                  value={logForm.reason}
                  onChange={(e) => setLogForm({ ...logForm, reason: e.target.value })}
                  placeholder="Ghi rõ nhà cung cấp, hóa đơn nhập hoặc nguyên nhân hao hụt..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold shadow-glow-red"
                >
                  Xác Nhận Lưu Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Mặt Hàng Nguyên Liệu Mới */}
      {ingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-ruby-500" />
                Thêm Nguyên Liệu Vào Danh Mục Kho
              </h3>
              <button onClick={() => setIngModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIngSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Tên nguyên liệu *</label>
                <input
                  type="text"
                  required
                  value={ingForm.name}
                  onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
                  placeholder="Hạt ngô, Đường men, Ly giấy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Mã nguyên liệu</label>
                  <input
                    type="text"
                    value={ingForm.code}
                    onChange={(e) => setIngForm({ ...ingForm, code: e.target.value })}
                    placeholder="ING-CORN-02"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    value={ingForm.unit}
                    onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}
                    placeholder="kg, lít, cái, hộp..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Tồn kho ban đầu</label>
                  <input
                    type="number"
                    value={ingForm.stock_quantity}
                    onChange={(e) => setIngForm({ ...ingForm, stock_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Mức cảnh báo tối thiểu</label>
                  <input
                    type="number"
                    value={ingForm.min_threshold}
                    onChange={(e) => setIngForm({ ...ingForm, min_threshold: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Nhà cung cấp</label>
                <input
                  type="text"
                  value={ingForm.supplier}
                  onChange={(e) => setIngForm({ ...ingForm, supplier: e.target.value })}
                  placeholder="Tên công ty / nhà phân phối..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setIngModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold shadow-glow-red"
                >
                  Lưu Mặt Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
