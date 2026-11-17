import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Wrench, Search, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  good: {
    label: 'Hoạt động tốt',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  check_needed: {
    label: 'Cần kiểm tra',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  repairing: {
    label: 'Đang sửa chữa',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotClass: 'bg-sky-400 animate-pulse',
  },
  broken: {
    label: 'Hỏng',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotClass: 'bg-rose-400 animate-pulse',
  },
};

const getStatusInfo = (status) => {
  const key = String(status || '').toLowerCase();
  return STATUS_CONFIG[key] || {
    label: status || 'Không rõ',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dotClass: 'bg-slate-400',
  };
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Chưa có';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getAlertBadge = (alert) => {
  const reason = alert.alert_reason || 'due_soon';
  const days = alert.days_until_maintenance;

  if (reason === 'broken') {
    return {
      label: alert.status === 'repairing' ? 'Đang sửa chữa' : 'Hỏng',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      dotClass: 'bg-rose-400 animate-pulse',
    };
  }

  if (reason === 'check_needed') {
    return {
      label: 'Cần kiểm tra',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dotClass: 'bg-amber-400',
    };
  }

  if (reason === 'overdue') {
    const overdueDays = days !== null && days !== undefined ? Math.abs(days) : 0;
    return {
      label: overdueDays > 0 ? `Quá hạn ${overdueDays} ngày` : 'Quá hạn bảo trì',
      badgeClass: 'bg-red-600/20 text-red-300 border-red-500/40 font-bold',
      dotClass: 'bg-red-400 animate-ping',
    };
  }

  // due_soon (trong 14 ngày)
  const dueDays = days !== null && days !== undefined ? days : 0;
  return {
    label: dueDays <= 0 ? 'Hôm nay đến hạn' : `Còn ${dueDays} ngày`,
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dotClass: 'bg-amber-400',
  };
};

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
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);

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

  const handleAlertClick = (id) => {
    if (statusFilter !== 'all' || typeFilter !== 'all' || search) {
      setStatusFilter('all');
      setTypeFilter('all');
      setSearch('');
    }
    setHighlightedId(id);
    setTimeout(() => {
      const el = document.getElementById(`equipment-row-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
    setTimeout(() => {
      setHighlightedId(null);
    }, 3200);
  };

  // Tính số liệu cho tiêu đề cảnh báo trung tính
  const brokenCount = alerts.filter((a) => a.alert_reason === 'broken').length;
  const overdueCount = alerts.filter((a) => a.alert_reason === 'overdue').length;
  const dueSoonCount = alerts.filter((a) => a.alert_reason === 'due_soon').length;
  const checkNeededCount = alerts.filter((a) => a.alert_reason === 'check_needed').length;

  const titleParts = [];
  if (brokenCount > 0) titleParts.push(`${brokenCount} hỏng`);
  if (overdueCount > 0) titleParts.push(`${overdueCount} quá hạn bảo trì`);
  if (dueSoonCount > 0) titleParts.push(`${dueSoonCount} sắp đến hạn`);
  if (checkNeededCount > 0) titleParts.push(`${checkNeededCount} cần kiểm tra`);
  const alertTitle = `CẢNH BÁO THIẾT BỊ (${alerts.length})${titleParts.length > 0 ? `: ${titleParts.join(' · ')}` : ''}`;

  const displayedAlerts = showAllAlerts ? alerts : alerts.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
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
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold cursor-pointer">Đóng</button>
        </div>
      )}

      {/* Maintenance & Health Alerts */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 shadow-glow-amber space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{alertTitle}</span>
            </div>
            {alerts.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllAlerts(!showAllAlerts)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>{showAllAlerts ? 'Thu gọn' : `Xem thêm (+${alerts.length - 3})`}</span>
                {showAllAlerts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {displayedAlerts.map((a) => {
              const badge = getAlertBadge(a);
              return (
                <div
                  key={a.id}
                  onClick={() => handleAlertClick(a.id)}
                  title={`Bấm để xem chi tiết thiết bị ${a.name}`}
                  className="p-3 rounded-xl bg-cinema-900/90 border border-cinema-700/80 hover:border-amber-500/60 hover:bg-cinema-850 transition-all flex items-center justify-between gap-2.5 cursor-pointer shadow-sm group"
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 text-xs leading-snug"
                      title={a.name}
                    >
                      {a.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>{a.room_name || 'Khu vực chung'}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-300">Hạn: {formatDate(a.next_maintenance)}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border shrink-0 inline-flex items-center gap-1 whitespace-nowrap ${badge.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                    {badge.label}
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
            <span className="text-slate-400 font-semibold">Tình trạng:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
            >
              <option value="all">Tất cả ({equipment.length})</option>
              <option value="good">Hoạt động tốt</option>
              <option value="check_needed">Cần kiểm tra</option>
              <option value="repairing">Đang sửa chữa</option>
              <option value="broken">Hỏng</option>
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
              {equipment.map((eq) => {
                const isHighlighted = highlightedId === eq.id;
                return (
                  <tr
                    key={eq.id}
                    id={`equipment-row-${eq.id}`}
                    className={`transition-all duration-300 ${
                      isHighlighted
                        ? 'bg-amber-500/20 ring-2 ring-amber-500/70 shadow-lg'
                        : 'hover:bg-cinema-850/60'
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-white text-sm line-clamp-2" title={eq.name}>
                        {eq.name}
                      </div>
                      <div className="text-[10px] font-mono text-gold-400">{eq.code}</div>
                    </td>
                    <td className="p-4 text-slate-300">{eq.type_name}</td>
                    <td className="p-4">
                      <span className="font-semibold text-white">{eq.room_name || 'Khu Vực Chung'}</span>
                    </td>
                    <td className="p-4 text-slate-400">{eq.manufacturer}</td>
                    <td className="p-4 text-slate-300 font-mono">{formatDate(eq.last_maintenance)}</td>
                    <td className="p-4 text-amber-400 font-mono font-bold">{formatDate(eq.next_maintenance)}</td>
                    <td className="p-4 whitespace-nowrap">
                      {(() => {
                        const info = getStatusInfo(eq.status);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${info.badgeClass}`}>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${info.dotClass}`} />
                            {info.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={eq.status}
                        onChange={(e) => handleStatusUpdate(eq.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-cinema-900 border border-cinema-700 text-white text-[11px] focus:outline-none"
                      >
                        <option value="good">Hoạt động tốt</option>
                        <option value="check_needed">Cần kiểm tra</option>
                        <option value="repairing">Đang sửa chữa</option>
                        <option value="broken">Hỏng</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
