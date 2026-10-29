import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Wrench, Plus, Search, AlertTriangle, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export function EquipmentManager() {
  const [equipment, setEquipment] = useState([]);
  const [types, setTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eqRes, typeRes, roomRes, alertRes] = await Promise.all([
        api.getEquipment({
          status: statusFilter !== 'all' ? statusFilter : undefined,
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-ruby-500" /> Quản Lý Trang Thiết Bị Rạp Phim
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi 8 danh mục thiết bị: Máy chiếu, Âm thanh, Điều hòa, Chiếu sáng, Màn hình, 4DX, Camera, Server
          </p>
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

      {/* Maintenance & Health Alerts */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 shadow-glow-amber space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase">
            <AlertTriangle className="w-4 h-4" /> CẢNH BÁO BẢO TRÌ & THIẾT BỊ HỎNG ({alerts.length} thiết bị):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="p-2.5 rounded-xl bg-cinema-900 border border-cinema-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white truncate max-w-[180px]">{a.name}</div>
                  <div className="text-[10px] text-slate-400">{a.room_name || 'Khu vực chung'} • Hạn: {a.next_maintenance}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-400 border border-rose-600">
                  {a.status}
                </span>
              </div>
            ))}
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
            <span className="text-slate-400 font-semibold">Tình trạng:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
            >
              <option value="all">Tất cả ({equipment.length})</option>
              <option value="good">Hoạt động tốt (Good)</option>
              <option value="check_needed">Cần kiểm tra (Check Needed)</option>
              <option value="repairing">Đang sửa chữa (Repairing)</option>
              <option value="broken">Hỏng (Broken)</option>
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
                <th className="p-4">Bảo trì gần nhất</th>
                <th className="p-4">Kỳ bảo trì tới</th>
                <th className="p-4">Tình trạng</th>
                <th className="p-4 text-right">Đổi trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {equipment.map((eq) => (
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
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      eq.status === 'good' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' :
                      eq.status === 'check_needed' ? 'bg-amber-950 text-amber-400 border border-amber-600' :
                      eq.status === 'repairing' ? 'bg-blue-950 text-blue-400 border border-blue-600' :
                      'bg-rose-950 text-rose-400 border border-rose-600 animate-pulse'
                    }`}>
                      {eq.status}
                    </span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
