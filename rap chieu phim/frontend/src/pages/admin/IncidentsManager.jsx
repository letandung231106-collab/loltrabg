import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Plus, UserCheck, Wrench, CheckCircle2, History, X, Sparkles, MessageSquare } from 'lucide-react';

export function IncidentsManager() {
  const { user, isManager, isTechnician, isStaff } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalData, setAssignModalData] = useState(null); // incident object
  const [resolveModalData, setResolveModalData] = useState(null); // incident object
  const [historyModalData, setHistoryModalData] = useState(null); // incident details object

  // Form states
  const [createForm, setCreateForm] = useState({
    room_id: '',
    equipment_id: '',
    title: '',
    description: '',
    severity: 'medium',
  });

  const [selectedTechId, setSelectedTechId] = useState('');

  const [resolveForm, setResolveForm] = useState({
    action_title: 'Sửa chữa và thay thế linh kiện hoàn tất',
    description: '',
    spare_parts: '',
    cost: 0,
    is_completed: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incRes, roomRes, eqRes, techRes] = await Promise.all([
        api.getIncidents(),
        api.getRooms(),
        api.getEquipment(),
        api.getTechnicians(),
      ]);

      if (incRes.success) setIncidents(incRes.data);
      if (roomRes.success) setRooms(roomRes.data);
      if (eqRes.success) setEquipmentList(eqRes.data);
      if (techRes.success) setTechnicians(techRes.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải dữ liệu sự cố.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createIncident(createForm);
      if (res.success) {
        setMsg({ text: 'Báo cáo sự cố thành công! Đã gửi thông báo đến Quản lý.', type: 'success' });
        setCreateModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi báo cáo sự cố.', type: 'error' });
    }
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!assignModalData || !selectedTechId) return;
    try {
      const res = await api.assignTechnician(assignModalData.id, selectedTechId);
      if (res.success) {
        setMsg({ text: 'Đã phân công kỹ thuật viên thành công!', type: 'success' });
        setAssignModalData(null);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi phân công.', type: 'error' });
    }
  };

  const handleResolveIncident = async (e) => {
    e.preventDefault();
    if (!resolveModalData) return;
    try {
      const res = await api.resolveIncident(resolveModalData.id, resolveForm);
      if (res.success) {
        setMsg({ text: 'Cập nhật kết quả xử lý sự cố thành công!', type: 'success' });
        setResolveModalData(null);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi cập nhật xử lý sự cố.', type: 'error' });
    }
  };

  const handleCloseIncident = async (incidentId) => {
    const note = prompt('Nhập ghi chú nghiệm thu đóng sự cố:');
    if (note === null) return;
    try {
      const res = await api.closeIncident(incidentId, note);
      if (res.success) {
        setMsg({ text: 'Đã nghiệm thu và đóng sự cố thành công! Phòng đã trở lại hoạt động.', type: 'success' });
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi đóng sự cố.', type: 'error' });
    }
  };

  const handleViewHistory = async (incidentId) => {
    try {
      const res = await api.getIncidentById(incidentId);
      if (res.success) {
        setHistoryModalData(res.data);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <AlertTriangle className="w-7 h-7 text-ruby-500" /> Quản Lý & Xử Lý Sự Cố Rạp
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quy trình khép kín: Staff báo cáo ➔ Manager phân công ➔ Technician sửa chữa & ghi nhận chi phí ➔ Manager nghiệm thu & đóng
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Báo Cáo Sự Cố Mới
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

      {/* Incidents Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Mã & Tiêu Đề Sự Cố</th>
                <th className="p-4">Vị trí / Thiết bị</th>
                <th className="p-4">Mức độ</th>
                <th className="p-4">Người báo cáo</th>
                <th className="p-4">Kỹ thuật viên</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Quy trình xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {incidents.map((inc) => {
                const isNew = inc.status === 'new';
                const isAccepted = inc.status === 'accepted';
                const isInProgress = inc.status === 'in_progress';
                const isResolved = inc.status === 'resolved';
                const isClosed = inc.status === 'closed';

                return (
                  <tr key={inc.id} className="hover:bg-cinema-850/60 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{inc.title}</div>
                      <div className="text-[10px] font-mono text-gold-400">{inc.code}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{inc.room_name || 'Khu Vực Chung'}</div>
                      <div className="text-[10px] text-slate-400">{inc.equipment_name || 'Không gắn thiết bị cụ thể'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inc.severity === 'critical' ? 'bg-rose-950 text-rose-400 border border-rose-600 animate-pulse' :
                        inc.severity === 'high' ? 'bg-amber-950 text-amber-400 border border-amber-600' :
                        'bg-blue-950 text-blue-400 border border-blue-600'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {inc.reporter_name}
                    </td>
                    <td className="p-4">
                      {inc.assigned_technician_name ? (
                        <span className="font-bold text-gold-400 flex items-center gap-1">
                          🔧 {inc.assigned_technician_name}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Chưa phân công</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        isNew ? 'bg-rose-950 text-rose-400 border border-rose-600' :
                        isAccepted ? 'bg-amber-950 text-amber-400 border border-amber-600' :
                        isInProgress ? 'bg-blue-950 text-blue-400 border border-blue-600 animate-pulse' :
                        isResolved ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' :
                        'bg-cinema-800 text-slate-400'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Manager Assign Button */}
                        {isManager && (isNew || isAccepted) && (
                          <button
                            onClick={() => {
                              setAssignModalData(inc);
                              setSelectedTechId(inc.technician_id || technicians[0]?.id || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-cinema-950 font-bold text-[11px] transition-colors"
                          >
                            Phân Công KTV
                          </button>
                        )}

                        {/* Technician Resolve Button */}
                        {(isTechnician || isManager) && (isAccepted || isInProgress) && (
                          <button
                            onClick={() => {
                              setResolveModalData(inc);
                              setResolveForm({
                                action_title: 'Sửa chữa và thay thế linh kiện hoàn tất',
                                description: '',
                                spare_parts: '',
                                cost: 0,
                                is_completed: true,
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors"
                          >
                            Cập Nhật Xử Lý
                          </button>
                        )}

                        {/* Manager Close Button (BR14) */}
                        {isManager && isResolved && (
                          <button
                            onClick={() => handleCloseIncident(inc.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors shadow-glow-emerald"
                          >
                            Nghiệm Thu & Đóng
                          </button>
                        )}

                        {/* View History Button (BR15) */}
                        <button
                          onClick={() => handleViewHistory(inc.id)}
                          className="p-1 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300"
                          title="Xem lịch sử xử lý"
                        >
                          <History className="w-4 h-4" />
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

      {/* Modal Báo Cáo Sự Cố Mới */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-4 border-b border-cinema-700">
              <h3 className="font-black text-base text-white">Báo Cáo Sự Cố Kỹ Thuật / Phòng Chiếu</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Tiêu đề sự cố *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Ví dụ: Loa surround vách phải bị rè"
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Phòng chiếu</label>
                  <select
                    value={createForm.room_id}
                    onChange={(e) => setCreateForm({ ...createForm, room_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="">-- Khu vực chung --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Thiết bị gặp sự cố</label>
                  <select
                    value={createForm.equipment_id}
                    onChange={(e) => setCreateForm({ ...createForm, equipment_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="">-- Không rõ / Không có --</option>
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Mức độ nghiêm trọng</label>
                <select
                  value={createForm.severity}
                  onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                >
                  <option value="low">Thấp (Low) - Không ảnh hưởng suất chiếu</option>
                  <option value="medium">Trung bình (Medium) - Cần khắc phục trong ngày</option>
                  <option value="high">Cao (High) - Có thể hoãn suất chiếu</option>
                  <option value="critical">Khẩn cấp (Critical) - Ngừng hoạt động phòng ngay</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Mô tả hiện tượng chi tiết *</label>
                <textarea
                  rows={3}
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Mô tả triệu chứng hư hỏng, thời điểm phát hiện..."
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold shadow-glow-red"
                >
                  Gửi Báo Cáo Sự Cố
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Phân Công Kỹ Thuật Viên (Manager) */}
      {assignModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-black text-sm text-white">Phân Công Kỹ Thuật Viên Xử Lý</h3>
              <button onClick={() => setAssignModalData(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3 rounded-xl bg-cinema-900 text-xs">
              <div className="font-bold text-white mb-1">{assignModalData.title}</div>
              <div className="text-slate-400">Mã sự cố: {assignModalData.code} • Mức độ: <strong className="text-amber-400 uppercase">{assignModalData.severity}</strong></div>
            </div>

            <form onSubmit={handleAssignTechnician} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Chọn Kỹ thuật viên phụ trách *</label>
                <select
                  required
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-gold-500"
                >
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.position} - Đang xử lý: {t.pending_tasks} việc)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setAssignModalData(null)}
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-cinema-950 font-bold shadow-glow-amber"
                >
                  Giao Nhiệm Vụ Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kỹ Thuật Viên Cập Nhật Kết Quả (Technician - BR12, BR15) */}
      {resolveModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-black text-sm text-white">Cập Nhật Tiến Trình & Phương Án Sửa Chữa</h3>
              <button onClick={() => setResolveModalData(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveIncident} className="space-y-4 mt-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Tiêu đề hành động xử lý</label>
                <input
                  type="text"
                  value={resolveForm.action_title}
                  onChange={(e) => setResolveForm({ ...resolveForm, action_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nguyên nhân & Cách khắc phục *</label>
                <textarea
                  rows={3}
                  required
                  value={resolveForm.description}
                  onChange={(e) => setResolveForm({ ...resolveForm, description: e.target.value })}
                  placeholder="Mô tả nguyên nhân hư hỏng, các bước đo đạc, căn chỉnh hoặc thay thế..."
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Linh kiện thay thế (nếu có)</label>
                  <input
                    type="text"
                    value={resolveForm.spare_parts}
                    onChange={(e) => setResolveForm({ ...resolveForm, spare_parts: e.target.value })}
                    placeholder="Ví dụ: Tụ điện 50uF, dây LED 12V..."
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Chi phí vật tư (VNĐ)</label>
                  <input
                    type="number"
                    value={resolveForm.cost}
                    onChange={(e) => setResolveForm({ ...resolveForm, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cinema-900 border border-cinema-700 flex items-center justify-between">
                <span className="font-bold text-slate-300">Đã hoàn thành sửa chữa (Chờ nghiệm thu)?</span>
                <input
                  type="checkbox"
                  checked={resolveForm.is_completed}
                  onChange={(e) => setResolveForm({ ...resolveForm, is_completed: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setResolveModalData(null)}
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-glow-emerald"
                >
                  Lưu & Gửi Báo Cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lịch Sử Xử Lý (Incident History Timeline - BR15) */}
      {historyModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600 overflow-y-auto max-h-[85vh] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <div>
                <h3 className="font-black text-base text-white">Lịch Sử Xử Lý: {historyModalData.code}</h3>
                <span className="text-xs text-slate-400">{historyModalData.title}</span>
              </div>
              <button onClick={() => setHistoryModalData(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {historyModalData.histories?.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">Chưa có lịch sử xử lý.</p>
              ) : (
                historyModalData.histories?.map((h, idx) => (
                  <div key={h.id} className="p-4 rounded-2xl bg-cinema-900 border border-cinema-700 text-xs space-y-1.5 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> {h.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{h.created_at}</span>
                    </div>
                    <div className="text-slate-200 leading-relaxed">{h.description}</div>
                    {(h.spare_parts || parseFloat(h.cost) > 0) && (
                      <div className="pt-2 border-t border-cinema-800 flex items-center gap-4 text-[11px] text-slate-400">
                        {h.spare_parts && <span>Linh kiện: <strong className="text-white">{h.spare_parts}</strong></span>}
                        {parseFloat(h.cost) > 0 && <span>Chi phí: <strong className="text-emerald-400 font-mono">{parseFloat(h.cost).toLocaleString('vi-VN')}đ</strong></span>}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 text-right">Thực hiện bởi: {h.employee_name} ({h.position})</div>
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
