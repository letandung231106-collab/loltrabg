import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ClipboardCheck, Plus, CheckCircle, AlertTriangle, Eye, X } from 'lucide-react';

export function InspectionsManager() {
  const [inspections, setInspections] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // 9 tiêu chí kiểm tra phòng bắt buộc theo đề bài (Mục 26)
  const defaultItems = [
    { item_name: 'Máy chiếu (Projector)', status: 'pass', note: '' },
    { item_name: 'Hệ thống âm thanh (Sound System)', status: 'pass', note: '' },
    { item_name: 'Hệ thống điều hòa (AC / HVAC)', status: 'pass', note: '' },
    { item_name: 'Đèn chiếu sáng & dẫn đường (Lights)', status: 'pass', note: '' },
    { item_name: 'Tình trạng ghế ngồi (Seats)', status: 'pass', note: '' },
    { item_name: 'Màn hình chiếu (Screen)', status: 'pass', note: '' },
    { item_name: 'Cửa thoát hiểm & Khóa từ (Exit Doors)', status: 'pass', note: '' },
    { item_name: 'Vệ sinh phòng chiếu (Cleanliness)', status: 'pass', note: '' },
    { item_name: 'Thiết bị PCCC (Fire Safety)', status: 'pass', note: '' },
  ];

  const [formRoomId, setFormRoomId] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formChecklist, setFormChecklist] = useState(defaultItems);
  const [autoCreateIncident, setAutoCreateIncident] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspRes, roomRes] = await Promise.all([
        api.getInspections(),
        api.getRooms(),
      ]);
      if (inspRes.success) setInspections(inspRes.data);
      if (roomRes.success) {
        setRooms(roomRes.data);
        if (roomRes.data.length > 0) setFormRoomId(roomRes.data[0].id);
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải danh sách kiểm tra phòng.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChecklist = () => {
    setFormChecklist(defaultItems.map((i) => ({ ...i, status: 'pass', note: '' })));
    setFormNote('');
    setModalOpen(true);
  };

  const handleItemStatusChange = (index, status) => {
    const updated = [...formChecklist];
    updated[index].status = status;
    setFormChecklist(updated);
  };

  const handleItemNoteChange = (index, note) => {
    const updated = [...formChecklist];
    updated[index].note = note;
    setFormChecklist(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.submitInspection({
        room_id: formRoomId,
        note: formNote,
        checklist: formChecklist,
        auto_create_incident: autoCreateIncident,
      });

      if (res.success) {
        setMsg({ text: res.message || 'Gửi phiếu kiểm tra thành công!', type: 'success' });
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi gửi checklist kiểm tra phòng.', type: 'error' });
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.getInspectionById(id);
      if (res.success) {
        setSelectedInspection(res.data);
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
            <ClipboardCheck className="w-7 h-7 text-ruby-500" /> Kiểm Tra Phòng Chiếu (Checklist 9 Tiêu Chí)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quy trình kiểm tra vận hành trước ca chiếu: Máy chiếu, Âm thanh, Điều hòa, Đèn, Ghế, Màn hình, Thoát hiểm, Vệ sinh, PCCC (BR16)
          </p>
        </div>

        <button
          onClick={handleOpenChecklist}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Thực Hiện Kiểm Tra Phòng
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

      {/* Inspections History Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Phòng chiếu</th>
                <th className="p-4">Thời gian kiểm tra</th>
                <th className="p-4">Nhân viên thực hiện</th>
                <th className="p-4">Ghi chú tổng thể</th>
                <th className="p-4">Đánh giá chung</th>
                <th className="p-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {inspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-cinema-850/60 transition-colors">
                  <td className="p-4 font-bold text-white text-sm">
                    {insp.room_name} <span className="text-[10px] text-gold-400 font-mono">({insp.room_type})</span>
                  </td>
                  <td className="p-4 font-mono text-slate-300">{insp.inspection_date}</td>
                  <td className="p-4 text-slate-200">{insp.employee_name}</td>
                  <td className="p-4 text-slate-400 max-w-xs truncate">{insp.note || 'Đạt chuẩn'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      insp.status === 'pass' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' :
                      insp.status === 'fail' ? 'bg-rose-950 text-rose-400 border border-rose-600 animate-pulse' :
                      'bg-amber-950 text-amber-400 border border-amber-600'
                    }`}>
                      ● {insp.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleViewDetails(insp.id)}
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

      {/* Modal Điền Checklist 9 Tiêu Chí */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <div>
                <h3 className="font-black text-base text-white">Phiếu Kiểm Tra Phòng Chiếu 9 Tiêu Chí</h3>
                <span className="text-xs text-slate-400">Đánh giá tiêu chuẩn kỹ thuật & an toàn khán phòng trước suất chiếu</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Chọn Phòng Chiếu *</label>
                <select
                  required
                  value={formRoomId}
                  onChange={(e) => setFormRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.location})</option>
                  ))}
                </select>
              </div>

              {/* 9 Checklist Items Table */}
              <div className="space-y-2 border border-cinema-700/80 rounded-2xl p-4 bg-cinema-900/60">
                <div className="text-[11px] font-bold text-gold-400 uppercase tracking-wider mb-2">
                  DANH SÁCH 9 HẠNG MỤC KIỂM TRA (MỤC 26):
                </div>

                {formChecklist.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-cinema-900 border border-cinema-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="font-bold text-white text-xs sm:w-1/3">{item.item_name}</div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleItemStatusChange(idx, 'pass')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                          item.status === 'pass'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-cinema-800 text-slate-400 hover:bg-cinema-700'
                        }`}
                      >
                        ✓ Đạt (Pass)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemStatusChange(idx, 'fail')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                          item.status === 'fail'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-cinema-800 text-slate-400 hover:bg-cinema-700'
                        }`}
                      >
                        ✕ Không Đạt (Fail)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemStatusChange(idx, 'action_required')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                          item.status === 'action_required'
                            ? 'bg-amber-600 text-cinema-950'
                            : 'bg-cinema-800 text-slate-400 hover:bg-cinema-700'
                        }`}
                      >
                        ⚠️ Cần xử lý
                      </button>
                    </div>

                    <div className="sm:w-1/3">
                      <input
                        type="text"
                        placeholder="Ghi chú chi tiết nếu có..."
                        value={item.note}
                        onChange={(e) => handleItemNoteChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-cinema-850 border border-cinema-700 text-white text-[11px] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Ghi chú tổng thể phòng</label>
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Nhập nhận xét tổng quan..."
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              {/* Auto Incident Trigger Toggle (BR16) */}
              <div className="p-3 rounded-xl bg-cinema-900 border border-cinema-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">⚡ Tự động tạo sự cố (Incident) khi có mục không đạt (BR16)</div>
                  <div className="text-[10px] text-slate-400">Hệ thống sẽ lập tức tạo báo cáo sự cố gửi Manager khi phát hiện lỗi.</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoCreateIncident}
                  onChange={(e) => setAutoCreateIncident(e.target.checked)}
                  className="w-4 h-4 accent-ruby-600 rounded cursor-pointer"
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
                  Hoàn Thành & Lưu Phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xem Chi Tiết 9 Hạng Mục */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600 overflow-y-auto max-h-[85vh] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <div>
                <h3 className="font-black text-base text-white">Chi Tiết Kiểm Tra: {selectedInspection.room_name}</h3>
                <span className="text-xs text-slate-400">Kiểm tra bởi: {selectedInspection.employee_name} • {selectedInspection.inspection_date}</span>
              </div>
              <button onClick={() => setSelectedInspection(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {selectedInspection.details?.map((d) => (
                <div key={d.id} className="p-3 rounded-xl bg-cinema-900 border border-cinema-700 flex items-center justify-between">
                  <div className="font-bold text-white">{d.item_name}</div>
                  <div className="flex items-center gap-3">
                    {d.note && <span className="text-slate-400 text-[11px] italic">{d.note}</span>}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.status === 'pass' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' :
                      d.status === 'fail' ? 'bg-rose-950 text-rose-400 border border-rose-600' : 'bg-amber-950 text-amber-400'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
