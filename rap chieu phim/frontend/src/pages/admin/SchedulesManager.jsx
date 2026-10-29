import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar, Plus, Trash2, Clock, Film, Building, AlertTriangle, CheckCircle, X } from 'lucide-react';

export function SchedulesManager() {
  const [schedules, setSchedules] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    movie_id: '',
    room_id: '',
    start_time: '',
    ticket_price: 90000,
    format: '2D Phụ đề',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedRes, movieRes, roomRes] = await Promise.all([
        api.getSchedules(),
        api.getMovies({ status: 'now_showing' }),
        api.getRooms(),
      ]);
      if (schedRes.success) setSchedules(schedRes.data);
      if (movieRes.success) setMovies(movieRes.data);
      if (roomRes.success) setRooms(roomRes.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải dữ liệu lịch chiếu.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const defaultStart = new Date();
    defaultStart.setHours(defaultStart.getHours() + 2, 0, 0, 0);
    const startStr = defaultStart.toISOString().slice(0, 16);

    setFormData({
      movie_id: movies[0]?.id || '',
      room_id: rooms[0]?.id || '',
      start_time: startStr,
      ticket_price: 90000,
      format: '2D Phụ đề',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createSchedule(formData);
      if (res.success) {
        setMsg({ text: res.message || 'Lập lịch chiếu thành công!', type: 'success' });
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi lập lịch chiếu.', type: 'error' });
    }
  };

  const handleCancelSchedule = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy suất chiếu này không?')) return;
    try {
      const res = await api.cancelSchedule(id);
      if (res.success) {
        setMsg({ text: 'Đã hủy lịch chiếu thành công.', type: 'success' });
        fetchData();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Không thể hủy lịch chiếu.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-ruby-500" /> Quản Lý Lịch Chiếu Phim
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tạo và điều phối suất chiếu kèm cơ chế tự động kiểm tra xung đột phòng và thiết bị (BR01, BR02, BR03)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Lập Lịch Chiếu Mới
        </button>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-200' : 'bg-ruby-950 border border-ruby-500 text-ruby-200 shadow-glow-red'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold">Đóng</button>
        </div>
      )}

      {/* Schedules Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Phim</th>
                <th className="p-4">Phòng chiếu</th>
                <th className="p-4">Thời gian bắt đầu</th>
                <th className="p-4">Thời gian kết thúc</th>
                <th className="p-4">Giá vé cơ bản</th>
                <th className="p-4">Vé đã bán</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {schedules.map((s) => (
                <tr key={s.id} className="hover:bg-cinema-850/60 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={s.movie_poster} alt={s.movie_name} className="w-9 h-12 object-cover rounded-lg border border-cinema-700" />
                      <div>
                        <div className="font-bold text-white text-sm">{s.movie_name}</div>
                        <div className="text-[10px] text-slate-400">{s.format}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{s.room_name}</div>
                    <div className="text-[10px] text-gold-400 uppercase font-mono">{s.room_type}</div>
                  </td>
                  <td className="p-4 text-white font-mono font-bold">
                    {s.start_time}
                  </td>
                  <td className="p-4 text-slate-400 font-mono">
                    {s.end_time}
                  </td>
                  <td className="p-4 text-amber-400 font-mono font-bold">
                    {parseFloat(s.ticket_price).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="p-4 text-slate-200">
                    <span className="font-bold text-emerald-400">{s.booked_seats_count || 0}</span> / {s.capacity} ghế
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      s.status === 'scheduled' ? 'bg-blue-950 text-blue-400 border border-blue-600' :
                      s.status === 'screening' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600 animate-pulse' :
                      s.status === 'completed' ? 'bg-cinema-800 text-slate-400' : 'bg-rose-950 text-rose-400'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {s.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancelSchedule(s.id)}
                        className="p-1.5 rounded-lg bg-cinema-800 hover:bg-rose-900 text-rose-400 hover:text-rose-200 transition-colors"
                        title="Hủy lịch chiếu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lập Lịch Chiếu Mới */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-4 border-b border-cinema-700">
              <h3 className="font-black text-base text-white">Lập Lịch Chiếu Mới</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Chọn Phim *</label>
                <select
                  required
                  value={formData.movie_id}
                  onChange={(e) => setFormData({ ...formData, movie_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                >
                  <option value="">-- Chọn phim --</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.duration} phút)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Chọn Phòng Chiếu *</label>
                <select
                  required
                  value={formData.room_id}
                  onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                >
                  <option value="">-- Chọn phòng --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.room_type?.toUpperCase()} - Trạng thái: {r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Thời gian bắt đầu *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Giá vé cơ bản (VNĐ)</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.ticket_price}
                    onChange={(e) => setFormData({ ...formData, ticket_price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Định dạng chiếu</label>
                  <input
                    type="text"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cinema-900 border border-cinema-700 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-gold-400">🛡️ Tự động kiểm tra ràng buộc (Business Rules):</div>
                <div>• BR01: Chặn xung đột giờ chiếu cùng phòng (+15p dọn phòng)</div>
                <div>• BR02: Chặn phòng đang bảo trì / sự cố</div>
                <div>• BR03: Chặn nếu máy chiếu / âm thanh phòng đang hỏng</div>
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
                  Xác Nhận Lập Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
