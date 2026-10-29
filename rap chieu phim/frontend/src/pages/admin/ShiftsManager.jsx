import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Clock, Plus, UserCheck, Calendar, X, CheckCircle } from 'lucide-react';

export function ShiftsManager() {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    employee_id: '',
    work_date: new Date().toISOString().slice(0, 10),
    shift_name: 'morning',
    start_time: '08:00:00',
    end_time: '16:00:00',
    position: 'Soát vé & Điều phối',
    room_id: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftRes, empRes, roomRes] = await Promise.all([
        api.getShifts({ date: selectedDate }),
        api.getEmployees(),
        api.getRooms(),
      ]);
      if (shiftRes.success) setShifts(shiftRes.data);
      if (empRes.success) setEmployees(empRes.data);
      if (roomRes.success) setRooms(roomRes.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải danh sách ca làm việc.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createShift(formData);
      if (res.success) {
        setMsg({ text: 'Phân ca làm việc thành công!', type: 'success' });
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi phân ca.', type: 'error' });
    }
  };

  const handleCheckIn = async (shiftId, newStatus) => {
    try {
      await api.checkInShift(shiftId, newStatus);
      setMsg({ text: `Đã cập nhật trạng thái ca: ${newStatus.toUpperCase()}`, type: 'success' });
      fetchData();
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi cập nhật.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-ruby-500" /> Quản Lý Ca Làm Việc & Điểm Danh
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Phân ca Sáng (08:00 - 16:00), Chiều (15:30 - 23:30), Tối và điểm danh nhân viên rạp
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              employee_id: employees[0]?.id || '',
              work_date: selectedDate,
              shift_name: 'morning',
              start_time: '08:00:00',
              end_time: '16:00:00',
              position: 'Soát vé & Điều phối',
              room_id: rooms[0]?.id || '',
            });
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Phân Ca Làm Việc Mới
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

      {/* Date Filter */}
      <div className="p-4 glass-panel rounded-2xl border border-cinema-700/60 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold-400" />
          <span className="font-bold text-slate-300">Chọn ngày làm việc:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Shifts Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Nhân viên</th>
                <th className="p-4">Bộ phận</th>
                <th className="p-4">Ca & Giờ làm</th>
                <th className="p-4">Vị trí trực</th>
                <th className="p-4">Phòng phân công</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Điểm danh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">Không có ca làm việc nào trong ngày này.</td>
                </tr>
              ) : (
                shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-cinema-850/60 transition-colors">
                    <td className="p-4 font-bold text-white text-sm">
                      {s.employee_name}
                    </td>
                    <td className="p-4 text-slate-300">{s.department}</td>
                    <td className="p-4">
                      <div className="font-bold text-amber-400 uppercase">{s.shift_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.start_time} - {s.end_time}</div>
                    </td>
                    <td className="p-4 text-slate-200">{s.position}</td>
                    <td className="p-4 text-slate-300">{s.room_name || 'Khu vực tiền sảnh'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        s.status === 'checked_in' ? 'bg-blue-950 text-blue-400 border border-blue-600' :
                        s.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' :
                        'bg-amber-950 text-amber-400 border border-amber-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'scheduled' && (
                          <button
                            onClick={() => handleCheckIn(s.id, 'checked_in')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                          >
                            Check-in
                          </button>
                        )}
                        {s.status === 'checked_in' && (
                          <button
                            onClick={() => handleCheckIn(s.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                          >
                            Hoàn Thành
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Phân Ca */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-black text-sm text-white">Phân Ca Làm Việc Mới</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nhân viên *</label>
                <select
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.position} - {emp.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Ngày làm việc</label>
                  <input
                    type="date"
                    required
                    value={formData.work_date}
                    onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Ca làm việc</label>
                  <select
                    value={formData.shift_name}
                    onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="morning">Sáng (Morning)</option>
                    <option value="afternoon">Chiều (Afternoon)</option>
                    <option value="evening">Tối (Evening)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Vị trí trực</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Phòng phân công (tùy chọn)</label>
                <select
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                >
                  <option value="">-- Khu vực chung --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
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
                  Xác Nhận Phân Ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
