import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ClipboardList, Plus, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';

export function MaintenanceManager() {
  const [maintenances, setMaintenances] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    equipment_id: '',
    employee_id: '',
    type: 'periodic',
    description: '',
    scheduled_date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [maintRes, eqRes, techRes] = await Promise.all([
        api.getMaintenances(),
        api.getEquipment(),
        api.getTechnicians(),
      ]);
      if (maintRes.success) setMaintenances(maintRes.data);
      if (eqRes.success) setEquipmentList(eqRes.data);
      if (techRes.success) setTechnicians(techRes.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải kế hoạch bảo trì.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createMaintenance(formData);
      if (res.success) {
        setMsg({ text: 'Lập kế hoạch bảo trì thành công!', type: 'success' });
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi lập phiếu bảo trì.', type: 'error' });
    }
  };

  const handleCompleteMaintenance = async (id) => {
    const cost = prompt('Nhập chi phí bảo trì thực tế (VNĐ):', '500000');
    if (cost === null) return;
    try {
      await api.updateMaintenance(id, {
        status: 'completed',
        result: 'success',
        cost: parseFloat(cost) || 0,
        note: 'Đã hoàn thành bảo trì định kỳ đạt chuẩn kỹ thuật',
      });
      setMsg({ text: 'Đã hoàn thành phiếu bảo trì và gia hạn thiết bị!', type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi cập nhật.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-ruby-500" /> Kế Hoạch & Nhật Ký Bảo Trì Thiết Bị
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Lập kế hoạch bảo trì định kỳ, đột xuất và lưu vết chi phí bảo dưỡng (Mục 25)
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              equipment_id: equipmentList[0]?.id || '',
              employee_id: technicians[0]?.id || '',
              type: 'periodic',
              description: 'Bảo dưỡng định kỳ lưới lọc và cụm quang học',
              scheduled_date: new Date().toISOString().slice(0, 10),
              note: '',
            });
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Lập Phiếu Bảo Trì Mới
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

      {/* Maintenances Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Mã & Nội Dung</th>
                <th className="p-4">Thiết bị</th>
                <th className="p-4">Phòng chiếu</th>
                <th className="p-4">Loại bảo trì</th>
                <th className="p-4">Ngày dự kiến</th>
                <th className="p-4">Kỹ thuật viên</th>
                <th className="p-4">Chi phí</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {maintenances.map((m) => (
                <tr key={m.id} className="hover:bg-cinema-850/60 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{m.description}</div>
                    <div className="text-[10px] font-mono text-gold-400">{m.code}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{m.equipment_name}</div>
                    <div className="text-[10px] text-slate-400">{m.type_name}</div>
                  </td>
                  <td className="p-4 text-slate-300">{m.room_name || 'Khu vực chung'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full bg-cinema-800 text-slate-300 font-bold uppercase text-[10px]">
                      {m.type}
                    </span>
                  </td>
                  <td className="p-4 text-amber-400 font-mono font-semibold">{m.scheduled_date}</td>
                  <td className="p-4 text-slate-300">{m.technician_name || 'Chưa phân công'}</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">
                    {parseFloat(m.cost) > 0 ? `${parseFloat(m.cost).toLocaleString('vi-VN')}đ` : '0đ'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      m.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' :
                      m.status === 'in_progress' ? 'bg-blue-950 text-blue-400 border border-blue-600 animate-pulse' :
                      'bg-amber-950 text-amber-400 border border-amber-600'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {m.status !== 'completed' && (
                      <button
                        onClick={() => handleCompleteMaintenance(m.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                      >
                        Nghiệm Thu Xong
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lập Phiếu Bảo Trì */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-black text-sm text-white">Lập Kế Hoạch Bảo Trì Thiết Bị</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Chọn Thiết bị *</label>
                <select
                  required
                  value={formData.equipment_id}
                  onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.room_name || 'Chung'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Loại bảo trì</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="periodic">Bảo trì định kỳ</option>
                    <option value="emergency">Bảo trì đột xuất</option>
                    <option value="repair">Sửa chữa lớn</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Ngày thực hiện *</label>
                  <input
                    type="date"
                    required
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Phân công Kỹ thuật viên</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                >
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nội dung công việc bảo trì *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả các hạng mục kiểm tra, thay dầu, đo đạc quang thông..."
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-cinema-700">
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
                  Lưu Phiếu Bảo Trì
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
