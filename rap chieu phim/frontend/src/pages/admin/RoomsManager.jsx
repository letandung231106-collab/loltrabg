import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Building,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Plus,
  Eye,
  X,
  Edit2,
  Trash2,
  Layers,
  MapPin,
  Info,
} from 'lucide-react';

export function RoomsManager() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Create & Edit Room Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    room_type: 'standard',
    location: 'Tầng 2 - Khu Phim 1',
    description: '',
    rows: 6,
    seatsPerRow: 12,
    status: 'active',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.getRooms();
      if (res.success) setRooms(res.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải danh sách phòng.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRoom = async (roomId) => {
    setDetailsLoading(true);
    setSelectedRoom(roomId);
    try {
      const res = await api.getRoomById(roomId);
      if (res.success) setRoomDetails(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await api.updateRoomStatus(roomId, newStatus);
      setMsg({ text: `Đã chuyển trạng thái phòng thành: ${newStatus.toUpperCase()}`, type: 'success' });
      fetchRooms();
      if (selectedRoom === roomId) {
        handleViewRoom(roomId);
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi cập nhật trạng thái phòng.', type: 'error' });
    }
  };

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormData({
      name: `Cinema Hall ${rooms.length + 1} (Standard)`,
      room_type: 'standard',
      location: 'Tầng 2 - Rạp Trung Tâm',
      description: 'Phòng chiếu tiêu chuẩn trang bị âm thanh vòm Dolby Atmos',
      rows: 6,
      seatsPerRow: 12,
      status: 'active',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      room_type: room.room_type,
      location: room.location || '',
      description: room.description || '',
      rows: 6,
      seatsPerRow: 12,
      status: room.status,
    });
    setIsCreateOpen(true);
  };

  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        const res = await api.updateRoom(editingRoom.id, {
          name: formData.name,
          room_type: formData.room_type,
          location: formData.location,
          description: formData.description,
          status: formData.status,
        });
        setMsg({ text: res.message || 'Cập nhật phòng chiếu thành công!', type: 'success' });
      } else {
        const res = await api.createRoom(formData);
        setMsg({ text: res.message || 'Tạo phòng chiếu mới thành công!', type: 'success' });
      }
      setIsCreateOpen(false);
      fetchRooms();
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi lưu phòng chiếu.', type: 'error' });
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${room.name}"? Thao tác này sẽ xóa cả danh sách ghế liên quan.`)) {
      return;
    }
    try {
      const res = await api.deleteRoom(room.id);
      setMsg({ text: res.message || 'Đã xóa phòng chiếu thành công!', type: 'success' });
      fetchRooms();
      if (selectedRoom === room.id) setSelectedRoom(null);
    } catch (err) {
      setMsg({ text: err.message || 'Không thể xóa phòng chiếu.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Building className="w-7 h-7 text-ruby-500" /> Quản Lý Phòng Chiếu & Sơ Đồ Ghế
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi sức chứa, thiết bị, tình trạng hoạt động/bảo trì và sơ đồ bố trí ghế
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Phòng Chiếu Mới
        </button>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
              : 'bg-ruby-950 border border-ruby-500 text-ruby-200'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold">
            Đóng
          </button>
        </div>
      )}

      {/* Rooms Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {rooms.map((room) => {
          const isActive = room.status === 'active';
          const isMaintenance = room.status === 'maintenance';
          const isIncident = room.status === 'incident';

          return (
            <div
              key={room.id}
              className={`p-5 rounded-3xl glass-panel border shadow-xl flex flex-col justify-between transition-all ${
                isIncident
                  ? 'border-rose-500/80 shadow-glow-red'
                  : isMaintenance
                  ? 'border-amber-500/80 shadow-glow-amber'
                  : 'border-cinema-700/70 hover:border-ruby-500/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cinema-800 text-gold-400 border border-gold-500/30 font-mono">
                    {room.room_type}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : isMaintenance
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? 'bg-emerald-400' : isMaintenance ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'
                    }`} />
                    {isActive ? 'Đang hoạt động' : isMaintenance ? 'Đang bảo trì' : 'Tạm dừng'}
                  </span>
                </div>

                <h3 className="text-base font-black text-white mb-1">{room.name}</h3>
                <div className="text-xs text-slate-400 mb-3">{room.location}</div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 py-2 border-y border-cinema-700/60 mb-4">
                  <div>
                    Sức chứa: <strong className="text-white">{room.capacity} ghế</strong>
                  </div>
                  <div>
                    Thiết bị: <strong className="text-white">{room.total_equipment || 0} cái</strong>
                  </div>
                  {parseInt(room.faulty_equipment_count, 10) > 0 && (
                    <div className="col-span-2 text-rose-400 font-bold">
                      ⚠️ {room.faulty_equipment_count} thiết bị đang gặp sự cố
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[10px] text-slate-400 font-semibold">Trạng thái:</span>
                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(room.id, e.target.value)}
                    className="flex-1 px-2 py-1 rounded-lg bg-cinema-900 border border-cinema-700 text-white text-[11px] focus:outline-none"
                  >
                    <option value="active">Active (Hoạt động)</option>
                    <option value="maintenance">Maintenance (Bảo trì)</option>
                    <option value="incident">Incident (Sự cố)</option>
                    <option value="paused">Paused (Tạm dừng)</option>
                  </select>
                </div>

                <button
                  onClick={() => handleViewRoom(room.id)}
                  className="w-full py-2 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-200 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-cinema-700"
                >
                  <Eye className="w-3.5 h-3.5" /> Xem Sơ Đồ & Thiết Bị
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleOpenEdit(room)}
                    className="py-1.5 rounded-lg bg-cinema-900 hover:bg-cinema-850 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 border border-cinema-700/60"
                  >
                    <Edit2 className="w-3 h-3 text-gold-400" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room)}
                    className="py-1.5 rounded-lg bg-cinema-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 border border-cinema-700/60 hover:border-rose-500/50"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" /> Xóa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Details Modal */}
      {selectedRoom && roomDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600 overflow-y-auto max-h-[90vh] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-cinema-700">
              <div>
                <h3 className="text-xl font-black text-white">{roomDetails.name}</h3>
                <span className="text-xs text-slate-400">
                  {roomDetails.location} • Sức chứa: {roomDetails.capacity} ghế • Loại: {roomDetails.room_type}
                </span>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Visual Seat Matrix */}
            <div>
              <div className="text-xs font-bold text-gold-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" /> SƠ ĐỒ BỐ TRÍ GHẾ VẬT LÝ ({roomDetails.seats?.length} ghế):
              </div>
              <div className="p-4 rounded-2xl bg-cinema-900 border border-cinema-700 flex flex-wrap gap-2 justify-center max-h-56 overflow-y-auto">
                {roomDetails.seats?.map((seat) => (
                  <div
                    key={seat.id}
                    className={`w-9 h-8 rounded-lg text-xs font-bold flex items-center justify-center border ${
                      seat.seat_type === 'vip'
                        ? 'bg-amber-950/40 text-amber-300 border-amber-500/50'
                        : seat.seat_type === 'couple'
                        ? 'bg-pink-950/40 text-pink-300 border-pink-500/50 w-16'
                        : 'bg-cinema-800 text-slate-300 border-cinema-700'
                    }`}
                  >
                    {seat.row_number}
                    {seat.seat_number}
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment Attached */}
            <div>
              <div className="text-xs font-bold text-gold-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4" /> DANH SÁCH THIẾT BỊ GẮN TRONG PHÒNG ({roomDetails.equipment?.length || 0} thiết bị):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roomDetails.equipment?.map((eq) => (
                  <div
                    key={eq.id}
                    className="p-3 rounded-xl bg-cinema-900 border border-cinema-700 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{eq.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {eq.type_name} • {eq.code}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        eq.status === 'good' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                      }`}
                    >
                      {eq.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Room Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-cinema-600/70 overflow-hidden">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white mb-1 flex items-center gap-2">
              <Building className="w-5 h-5 text-ruby-500" />
              {editingRoom ? 'Chỉnh Sửa Phòng Chiếu' : 'Khởi Tạo Phòng Chiếu Mới'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              {editingRoom
                ? 'Cập nhật tên, loại phòng, vị trí và mô tả phòng chiếu'
                : 'Hệ thống sẽ tự động cấu hình sơ đồ ghế (Standard, VIP, Couple) theo số hàng'}
            </p>

            <form onSubmit={handleSubmitRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên phòng chiếu</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cinema Hall 1 (Standard Dolby)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Loại phòng</label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs focus:outline-none"
                  >
                    <option value="standard">Standard (Tiêu chuẩn)</option>
                    <option value="imax">IMAX Laser 3D</option>
                    <option value="4dx">4DX Motion World</option>
                    <option value="gold_class">Gold Class Luxury</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs focus:outline-none"
                  >
                    <option value="active">Active (Hoạt động)</option>
                    <option value="maintenance">Maintenance (Bảo trì)</option>
                    <option value="incident">Incident (Sự cố)</option>
                    <option value="paused">Paused (Tạm dừng)</option>
                  </select>
                </div>
              </div>

              {!editingRoom && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-cinema-900 border border-cinema-700/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Số dãy ghế (Hàng A-J)
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="10"
                      value={formData.rows}
                      onChange={(e) => setFormData({ ...formData, rows: parseInt(e.target.value, 10) || 6 })}
                      className="w-full px-3 py-2 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Số ghế mỗi hàng (1-18)
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="18"
                      value={formData.seatsPerRow}
                      onChange={(e) =>
                        setFormData({ ...formData, seatsPerRow: parseInt(e.target.value, 10) || 12 })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 text-[10px] text-gold-400 font-mono">
                    👉 Tổng sức chứa dự kiến: {formData.rows * formData.seatsPerRow} ghế (Bao gồm Standard, VIP, Couple)
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vị trí phòng</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Tầng 2 - Cụm Rạp Phía Đông"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả / Ghi chú</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú về thiết bị hoặc quy định của phòng..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all"
                >
                  {editingRoom ? 'Lưu Thông Tin Phòng' : 'Tạo Phòng & Khởi Tạo Ghế'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
