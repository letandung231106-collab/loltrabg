import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Key,
  Video,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  X,
  Tv,
  Thermometer,
  ShieldAlert,
  Flame,
  CheckSquare
} from 'lucide-react';

export function KdmProjectorManager() {
  const [licenses, setLicenses] = useState([]);
  const [lamps, setLamps] = useState([]);
  const [turnarounds, setTurnarounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kdm'); // 'kdm' | 'lamps' | 'turnaround'
  const [msg, setMsg] = useState({ text: '', type: '' });

  // KDM Modal
  const [kdmModalOpen, setKdmModalOpen] = useState(false);
  const [kdmForm, setKdmForm] = useState({
    movie_id: 1,
    movie_name: 'Dune: Hành Tinh Cát 2',
    room_id: 1,
    room_name: 'Phòng 1 - IMAX Laser',
    server_serial: 'DCI-IMAX-98821',
    valid_from: new Date().toISOString().slice(0, 10) + ' 00:00:00',
    valid_until: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10) + ' 23:59:59',
    key_file: 'KDM_KEY_DCI.xml',
  });

  // Turnaround Modal
  const [turnaroundModalOpen, setTurnaroundModalOpen] = useState(false);
  const [turnaroundForm, setTurnaroundForm] = useState({
    schedule_id: 1,
    room_id: 1,
    room_name: 'Phòng 1 - IMAX Laser',
    cleaned_by_name: 'Đỗ Tuấn Kiệt',
    target_minutes: 15,
    actual_minutes: 11,
    seats_checked: true,
    trash_cleared: true,
    spilled_liquid_cleaned: true,
    screen_undamaged: true,
    aircon_normal: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resKdm, resLamps, resTurn] = await Promise.all([
        api.getKdmLicenses(),
        api.getProjectorLamps(),
        api.getTurnaroundChecklists(),
      ]);
      if (resKdm.success) setLicenses(resKdm.data);
      if (resLamps.success) setLamps(resLamps.data);
      if (resTurn.success) setTurnarounds(resTurn.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải dữ liệu kỹ thuật.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleKdmSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createKdmLicense(kdmForm);
      if (res.success) {
        setMsg({ text: 'Nhập khóa KDM bản quyền thành công!', type: 'success' });
        setKdmModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi nhập KDM.', type: 'error' });
    }
  };

  const handleDeleteKdm = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa file khóa KDM này?')) return;
    try {
      await api.deleteKdmLicense(id);
      setMsg({ text: 'Đã xóa khóa KDM.', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.message || 'Không thể xóa KDM.', type: 'error' });
    }
  };

  const handleTurnaroundSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.submitTurnaround(turnaroundForm);
      if (res.success) {
        setMsg({ text: res.message || 'Đã ghi nhận kiểm tra vệ sinh phòng!', type: 'success' });
        setTurnaroundModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi ghi nhận dọn rạp.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Key className="w-7 h-7 text-ruby-500" /> Bản Quyền KDM & Kỹ Thuật Chiếu Phim
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý khóa bản quyền phim KDM, đo nhiệt độ & số giờ chiếu bóng đèn máy chiếu (Lamp Hours)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'kdm' && (
            <button
              onClick={() => setKdmModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Nhập Khóa KDM
            </button>
          )}
          {activeTab === 'turnaround' && (
            <button
              onClick={() => setTurnaroundModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-emerald transition-all flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" /> Checklist Dọn Rạp Suất Mới
            </button>
          )}
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

      {/* Tabs */}
      <div className="p-1 rounded-xl bg-cinema-900 border border-cinema-700/60 inline-flex items-center">
        <button
          onClick={() => setActiveTab('kdm')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'kdm'
              ? 'bg-ruby-600 text-white shadow-glow-red'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5" /> Khóa Bản Quyền KDM ({licenses.length})
        </button>
        <button
          onClick={() => setActiveTab('lamps')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'lamps'
              ? 'bg-ruby-600 text-white shadow-glow-red'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-3.5 h-3.5" /> Giờ Bóng Đèn Máy Chiếu ({lamps.length})
        </button>
        <button
          onClick={() => setActiveTab('turnaround')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'turnaround'
              ? 'bg-ruby-600 text-white shadow-glow-red'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Vệ Sinh Khán Phòng Cấp Tốc ({turnarounds.length})
        </button>
      </div>

      {/* ================= TAB 1: KDM LICENSES ================= */}
      {activeTab === 'kdm' && (
        <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
                <tr>
                  <th className="p-4">Tên Phim & File KDM</th>
                  <th className="p-4">Phòng Chiếu Áp Dụng</th>
                  <th className="p-4">Server DCI Serial</th>
                  <th className="p-4">Thời Hạn Khóa KDM</th>
                  <th className="p-4">Trạng Thái Bản Quyền</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-800">
                {licenses.map((lic) => {
                  const isExpiring = lic.status === 'expiring_soon';
                  const isExpired = lic.status === 'expired';
                  return (
                    <tr key={lic.id} className="hover:bg-cinema-850/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <Key className="w-3.5 h-3.5 text-gold-400" /> {lic.movie_name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{lic.key_file}</div>
                      </td>
                      <td className="p-4 text-slate-200 font-semibold">{lic.room_name}</td>
                      <td className="p-4 font-mono text-amber-400 font-bold">{lic.server_serial}</td>
                      <td className="p-4 text-slate-300">
                        <div className="text-[11px] font-mono text-white">Đến: {lic.valid_until}</div>
                        <div className="text-[10px] text-slate-500">Từ: {lic.valid_from}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          isExpired
                            ? 'bg-rose-950 text-rose-400 border border-rose-600'
                            : isExpiring
                            ? 'bg-amber-950 text-amber-400 border border-amber-600 animate-pulse'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                        }`}>
                          {isExpired ? '✕ Đã hết hạn' : isExpiring ? '⚠️ Sắp hết hạn' : '✓ Hợp lệ (Active)'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteKdm(lic.id)}
                          className="p-1.5 rounded-lg bg-cinema-800 hover:bg-rose-900 text-rose-400 hover:text-rose-200"
                          title="Xóa KDM"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PROJECTOR LAMPS ================= */}
      {activeTab === 'lamps' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lamps.map((lamp) => {
            const isWarning = lamp.status === 'warning';
            const isCritical = lamp.status === 'critical';
            return (
              <div key={lamp.id} className="glass-panel p-5 rounded-3xl border border-cinema-700/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-cinema-800">
                  <div>
                    <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Tv className="w-4 h-4 text-ruby-400" /> {lamp.room_name}
                    </h3>
                    <div className="text-[10px] text-slate-400">{lamp.projector_model}</div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    isCritical
                      ? 'bg-rose-950 text-rose-400 border border-rose-600 animate-pulse'
                      : isWarning
                      ? 'bg-amber-950 text-amber-400 border border-amber-600'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                  }`}>
                    {isCritical ? '⚠️ Cần thay bóng gấp' : isWarning ? 'Cảnh báo mờ' : '● Hoạt động tốt'}
                  </span>
                </div>

                {/* Health Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Độ bền bóng đèn còn lại:</span>
                    <span className="font-mono font-bold text-gold-400">{lamp.health_percentage}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-cinema-950 overflow-hidden p-0.5 border border-cinema-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${lamp.health_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-cinema-900 border border-cinema-800">
                    <div className="text-[10px] text-slate-400">Số giờ đã chiếu</div>
                    <div className="font-mono font-bold text-white mt-0.5">
                      {lamp.hours_used} / {lamp.max_hours_recommended} giờ
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cinema-900 border border-cinema-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">Nhiệt độ phòng máy</div>
                      <div className="font-mono font-bold text-emerald-400 mt-0.5">
                        {lamp.temperature_celsius}°C
                      </div>
                    </div>
                    <Thermometer className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= TAB 3: TURNAROUND CHECKLISTS ================= */}
      {activeTab === 'turnaround' && (
        <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
                <tr>
                  <th className="p-4">Thời gian hoàn tất</th>
                  <th className="p-4">Khán phòng</th>
                  <th className="p-4">Nhân viên vệ sinh</th>
                  <th className="p-4">Thời gian dọn dẹp</th>
                  <th className="p-4">Hạng mục kiểm tra</th>
                  <th className="p-4 text-right">Trạng thái rạp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-800">
                {turnarounds.map((t) => (
                  <tr key={t.id} className="hover:bg-cinema-850/60 transition-colors">
                    <td className="p-4 text-slate-400 font-mono text-[11px]">{t.verified_at}</td>
                    <td className="p-4 font-bold text-white text-sm">{t.room_name}</td>
                    <td className="p-4 text-slate-300 font-semibold">{t.cleaned_by_name}</td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {t.actual_minutes} phút
                      </span>
                      <span className="text-[10px] text-slate-500 block">(Mục tiêu &le; {t.target_minutes} phút)</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-cinema-800 text-emerald-300">✓ Ghế ngồi</span>
                        <span className="px-2 py-0.5 rounded bg-cinema-800 text-emerald-300">✓ Rác sàn</span>
                        <span className="px-2 py-0.5 rounded bg-cinema-800 text-emerald-300">✓ Nước đổ</span>
                        <span className="px-2 py-0.5 rounded bg-cinema-800 text-emerald-300">✓ Màn chiếu</span>
                        <span className="px-2 py-0.5 rounded bg-cinema-800 text-emerald-300">✓ Điều hòa 22°C</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600 text-[10px] font-black uppercase shadow-glow-emerald">
                        ✓ Sẵn sàng đón khách
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nhập Khóa KDM */}
      {kdmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-ruby-500" /> Nhập Khóa Bản Quyền KDM Mới
              </h3>
              <button onClick={() => setKdmModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKdmSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Tên phim *</label>
                <input
                  type="text"
                  required
                  value={kdmForm.movie_name}
                  onChange={(e) => setKdmForm({ ...kdmForm, movie_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Phòng chiếu *</label>
                  <input
                    type="text"
                    required
                    value={kdmForm.room_name}
                    onChange={(e) => setKdmForm({ ...kdmForm, room_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">DCI Server Serial</label>
                  <input
                    type="text"
                    value={kdmForm.server_serial}
                    onChange={(e) => setKdmForm({ ...kdmForm, server_serial: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Hiệu lực từ ngày *</label>
                  <input
                    type="date"
                    required
                    value={kdmForm.valid_from.slice(0, 10)}
                    onChange={(e) => setKdmForm({ ...kdmForm, valid_from: e.target.value + ' 00:00:00' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Hết hạn vào ngày *</label>
                  <input
                    type="date"
                    required
                    value={kdmForm.valid_until.slice(0, 10)}
                    onChange={(e) => setKdmForm({ ...kdmForm, valid_until: e.target.value + ' 23:59:59' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Tên tệp khóa KDM (.xml)</label>
                <input
                  type="text"
                  value={kdmForm.key_file}
                  onChange={(e) => setKdmForm({ ...kdmForm, key_file: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setKdmModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold shadow-glow-red"
                >
                  Xác Nhận Nạp KDM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Checklist Dọn Rạp */}
      {turnaroundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Xác Nhận Vệ Sinh Phòng Chiếu
              </h3>
              <button onClick={() => setTurnaroundModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTurnaroundSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Phòng chiếu *</label>
                <input
                  type="text"
                  required
                  value={turnaroundForm.room_name}
                  onChange={(e) => setTurnaroundForm({ ...turnaroundForm, room_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Người dọn rạp *</label>
                  <input
                    type="text"
                    required
                    value={turnaroundForm.cleaned_by_name}
                    onChange={(e) => setTurnaroundForm({ ...turnaroundForm, cleaned_by_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Thời gian hoàn thành (Phút)</label>
                  <input
                    type="number"
                    value={turnaroundForm.actual_minutes}
                    onChange={(e) => setTurnaroundForm({ ...turnaroundForm, actual_minutes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Checklist checkboxes */}
              <div className="p-3.5 rounded-2xl bg-cinema-950 border border-cinema-800 space-y-2">
                <label className="block font-bold text-emerald-400 text-[11px] mb-1">Checklist tiêu chuẩn vệ sinh rạp:</label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={turnaroundForm.seats_checked}
                    onChange={(e) => setTurnaroundForm({ ...turnaroundForm, seats_checked: e.target.checked })}
                    className="w-4 h-4 accent-ruby-600 rounded"
                  />
                  <span>1. Kiểm tra không để sót đồ đạc khách hàng trên ghế</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={turnaroundForm.trash_cleared}
                    onChange={(e) => setTurnaroundForm({ ...turnaroundForm, trash_cleared: e.target.checked })}
                    className="w-4 h-4 accent-ruby-600 rounded"
                  />
                  <span>2. Dọn sạch rác, vỏ bắp, ly nước trên sàn và hộc ghế</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={turnaroundForm.spilled_liquid_cleaned}
                    onChange={(e) => setTurnaroundForm({ ...turnaroundForm, spilled_liquid_cleaned: e.target.checked })}
                    className="w-4 h-4 accent-ruby-600 rounded"
                  />
                  <span>3. Lau khô nước ngọt đổ, sàn không trơn trượt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={turnaroundForm.aircon_normal}
                    onChange={(e) => setTurnaroundForm({ ...turnaroundForm, aircon_normal: e.target.checked })}
                    className="w-4 h-4 accent-ruby-600 rounded"
                  />
                  <span>4. Điều hòa khán phòng đạt chuẩn 21-23°C</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setTurnaroundModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-glow-emerald"
                >
                  Xác Nhận Mở Cửa Rạp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
