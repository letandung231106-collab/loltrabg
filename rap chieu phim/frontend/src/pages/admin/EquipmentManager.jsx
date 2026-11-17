import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Wrench, Plus, Search, AlertTriangle, ShieldCheck, CheckCircle2, Clock, Filter, XCircle } from 'lucide-react';
import { ModalPortal } from '../../components/common/ModalPortal';

const toLocalDateStr = (d = new Date()) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

export function EquipmentManager() {
  const [equipment, setEquipment] = useState([]);
  const [types, setTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'good' | 'non_operational' | 'check_needed' | 'repairing' | 'broken'
  const [typeFilter, setTypeFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Modal Thêm Thiết Bị Mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    equipment_type_id: '1',
    room_id: '1',
    manufacturer: 'Christie Digital (Mỹ)',
    purchase_date: toLocalDateStr(new Date()),
    warranty_end: toLocalDateStr(new Date(Date.now() + 3 * 365 * 86400000)),
    next_maintenance: toLocalDateStr(new Date(Date.now() + 180 * 86400000)),
    status: 'good',
  });

  useEffect(() => {
    fetchData();
  }, [typeFilter, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqRes, typeRes, roomRes, alertRes] = await Promise.all([
        api.getEquipment({
          type_id: typeFilter !== 'all' ? typeFilter : undefined,
          search: search || undefined,
        }),
        api.getEquipmentTypes(),
        api.getRooms(),
        api.getMaintenanceAlerts(),
      ]);

      if (eqRes.success) setEquipment(eqRes.data);
      if (typeRes.success) setTypes(typeRes.data);
      if (roomRes.success) setRooms(roomRes.data);
      if (alertRes.success) setAlerts(alertRes.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải trang thiết bị.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.updateEquipment(id, { status: newStatus });
      setMsg({ text: 'Cập nhật tình trạng thiết bị thành công!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi cập nhật thiết bị.', type: 'error' });
    }
  };

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createEquipment({
        ...formData,
        equipment_type_id: parseInt(formData.equipment_type_id, 10) || 1,
        room_id: formData.room_id ? parseInt(formData.room_id, 10) : null,
      });
      if (res.success) {
        setMsg({ text: res.message || 'Đã thêm thiết bị mới thành công!', type: 'success' });
        setIsAddModalOpen(false);
        setFormData((prev) => ({ ...prev, name: '' }));
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Không thể thêm thiết bị.', type: 'error' });
    }
  };

  // Thống kê phân loại thiết bị Đang hoạt động vs Chưa hoạt động (Hỏng / Đang sửa / Cần kiểm tra)
  const goodCount = equipment.filter((e) => e.status === 'good').length;
  const brokenCount = equipment.filter((e) => e.status === 'broken').length;
  const repairingCount = equipment.filter((e) => e.status === 'repairing').length;
  const checkNeededCount = equipment.filter((e) => e.status === 'check_needed').length;
  const nonOperationalCount = brokenCount + repairingCount + checkNeededCount;

  const filteredEquipment = equipment.filter((eq) => {
    if (roomFilter !== 'all' && String(eq.room_id) !== String(roomFilter)) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'non_operational') return eq.status !== 'good';
    return eq.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-ruby-500" /> Quản Lý Trang Thiết Bị Rạp Phim
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Phân loại thiết bị đang hoạt động và thiết bị chưa hoạt động (Hỏng hóc, Đang sửa chữa, Cần kiểm tra bảo trì)
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm Thiết Bị Mới
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

      {/* Bảng Phân Loại Nhanh Thiết Bị Đang Hoạt Động vs Thiết Bị Chưa Hoạt Động */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-cinema-800 border-ruby-500 shadow-glow-red'
              : 'bg-cinema-900/80 border-cinema-700/60 hover:border-cinema-600'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-400">Tổng trang thiết bị</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{equipment.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Toàn bộ phòng chiếu</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('good')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'good'
              ? 'bg-emerald-950/50 border-emerald-500 shadow-glow-emerald'
              : 'bg-cinema-900/80 border-cinema-700/60 hover:border-emerald-500/40'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đang hoạt động tốt
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{goodCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sẵn sàng phục vụ</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('non_operational')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'non_operational'
              ? 'bg-rose-950/60 border-rose-500 shadow-glow-red'
              : 'bg-cinema-900/80 border-cinema-700/60 hover:border-rose-500/40'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Chưa hoạt động
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">{nonOperationalCount}</div>
          <div className="text-[10px] text-rose-300/80 mt-0.5">Hỏng / Đang sửa / Kiểm tra</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('repairing')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'repairing'
              ? 'bg-sky-950/60 border-sky-500'
              : 'bg-cinema-900/80 border-cinema-700/60 hover:border-sky-500/40'
          }`}
        >
          <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Đang sửa chữa
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono mt-1">{repairingCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">KTV đang bảo dưỡng</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('broken')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'broken'
              ? 'bg-rose-950/60 border-rose-500'
              : 'bg-cinema-900/80 border-cinema-700/60 hover:border-rose-500/40'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Hỏng hóc (Ngưng)
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">{brokenCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cần thay thế / khắc phục</div>
        </button>
      </div>

      {/* Maintenance & Health Alerts */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase">
              <AlertTriangle className="w-4 h-4" /> DANH SÁCH THIẾT BỊ CHƯA HOẠT ĐỘNG & SẮP ĐẾN KỲ BẢO TRÌ ({alerts.length} thiết bị):
            </div>
            {nonOperationalCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('non_operational')}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline"
              >
                Chỉ hiện {nonOperationalCount} thiết bị chưa hoạt động →
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {alerts.slice(0, 6).map((a) => {
              const isGoodMaintSoon = a.status === 'good';
              const badgeLabel =
                a.status === 'broken'
                  ? 'Hỏng hóc'
                  : a.status === 'repairing'
                  ? 'Đang sửa chữa'
                  : a.status === 'check_needed'
                  ? 'Cần kiểm tra'
                  : 'Sắp tới hạn bảo trì';
              const badgeStyle =
                a.status === 'broken'
                  ? 'bg-rose-950 text-rose-400 border-rose-600'
                  : a.status === 'repairing'
                  ? 'bg-sky-950 text-sky-400 border-sky-600'
                  : 'bg-amber-950 text-amber-300 border-amber-500/60';
              return (
                <div key={a.id} className="p-2.5 rounded-xl bg-cinema-900 border border-cinema-700 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{a.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {a.room_name || 'Khu vực chung'} • Hạn bảo trì: {a.next_maintenance}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap border shrink-0 ${badgeStyle}`}>
                    {badgeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Row */}
      <div className="p-4 glass-panel rounded-2xl border border-cinema-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên thiết bị, mã số, hãng sản xuất..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Loại thiết bị:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
            >
              <option value="all">Tất cả loại ({types.length})</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Phòng chiếu:</span>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
            >
              <option value="all">Tất cả phòng ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Phân loại tình trạng:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
            >
              <option value="all">Tất cả ({equipment.length})</option>
              <option value="good">Đang hoạt động tốt ({goodCount})</option>
              <option value="non_operational">Chưa hoạt động - Tổng hợp ({nonOperationalCount})</option>
              <option value="check_needed">↳ Cần kiểm tra ({checkNeededCount})</option>
              <option value="repairing">↳ Đang sửa chữa ({repairingCount})</option>
              <option value="broken">↳ Hỏng hóc / Ngưng ({brokenCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Mã & Tên Thiết Bị</th>
                <th className="p-4">Loại thiết bị</th>
                <th className="p-4">Phòng chiếu</th>
                <th className="p-4">Hãng sản xuất</th>
                <th className="p-4 whitespace-nowrap">Bảo trì gần nhất</th>
                <th className="p-4 whitespace-nowrap">Kỳ bảo trì tới</th>
                <th className="p-4 whitespace-nowrap">Tình trạng</th>
                <th className="p-4 text-right whitespace-nowrap">Đổi trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không có thiết bị nào thuộc nhóm phân loại này.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((eq) => (
                <tr key={eq.id} className="hover:bg-cinema-850/60 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{eq.name}</div>
                    <div className="text-[10px] font-mono text-gold-400">{eq.code}</div>
                  </td>
                  <td className="p-4 text-slate-300">{eq.type_name}</td>
                  <td className="p-4">
                    <span className="font-semibold text-white">{eq.room_name || 'Khu Vực Chung'}</span>
                  </td>
                  <td className="p-4 text-slate-400">{eq.manufacturer}</td>
                  <td className="p-4 text-slate-300 font-mono">{eq.last_maintenance || 'Chưa thực hiện'}</td>
                  <td className="p-4 text-amber-400 font-mono font-bold">{eq.next_maintenance}</td>
                  <td className="p-4 whitespace-nowrap">
                    {eq.status === 'good' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        Hoạt động tốt
                      </span>
                    ) : eq.status === 'check_needed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        Cần kiểm tra
                      </span>
                    ) : eq.status === 'repairing' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 animate-pulse" />
                        Đang sửa chữa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 animate-pulse" />
                        Hỏng hóc
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <select
                      value={eq.status}
                      onChange={(e) => handleStatusUpdate(eq.id, e.target.value)}
                      className="px-2 py-1 rounded-lg bg-cinema-900 border border-cinema-700 text-white text-[11px] focus:outline-none"
                    >
                      <option value="good">Good</option>
                      <option value="check_needed">Check Needed</option>
                      <option value="repairing">Repairing</option>
                      <option value="broken">Broken</option>
                    </select>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Thiết Bị Mới */}
      <ModalPortal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Trang Thiết Bị Rạp Chiếu Mới"
        subtitle="Gắn thiết bị vào phòng chiếu hoặc khu vực kỹ thuật chung"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateEquipment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Tên trang thiết bị *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Máy chiếu Laser Christie CP4420-RGB 4K"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Danh mục thiết bị *</label>
              <select
                value={formData.equipment_type_id}
                onChange={(e) => setFormData({ ...formData, equipment_type_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phòng chiếu lắp đặt</label>
              <select
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
              >
                <option value="">Khu Vực Kỹ Thuật Chung</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Hãng sản xuất</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Christie Digital / Dolby Labs"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tình trạng ban đầu</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
              >
                <option value="good">Hoạt động tốt (Good)</option>
                <option value="check_needed">Cần kiểm tra (Check Needed)</option>
                <option value="repairing">Đang sửa chữa (Repairing)</option>
                <option value="broken">Hỏng hóc (Broken)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Ngày lắp đặt / mua *</label>
              <input
                type="date"
                required
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Kỳ bảo trì định kỳ kế tiếp *</label>
              <input
                type="date"
                required
                value={formData.next_maintenance}
                onChange={(e) => setFormData({ ...formData, next_maintenance: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-cinema-700/60">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-300 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold shadow-glow-red transition-all cursor-pointer"
            >
              Lưu Thiết Bị Mới
            </button>
          </div>
        </form>
      </ModalPortal>
    </div>
  );
}
