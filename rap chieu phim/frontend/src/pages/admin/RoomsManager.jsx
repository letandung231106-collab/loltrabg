import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Building, Wrench, AlertTriangle, CheckCircle, Plus, Eye, X } from 'lucide-react';

export function RoomsManager() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Building className="w-7 h-7 text-ruby-500" /> Quản Lý Phòng Chiếu & Ghế
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi sức chứa, thiết bị, tình trạng hoạt động/bảo trì và sơ đồ bố trí ghế
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' :
                    isMaintenance ? 'bg-amber-950 text-amber-400 border border-amber-600' :
                    'bg-rose-950 text-rose-400 border border-rose-600'
                  }`}>
                    ● {room.status}
                  </span>
                </div>

                <h3 className="text-base font-black text-white mb-1">{room.name}</h3>
                <div className="text-xs text-slate-400 mb-3">{room.location}</div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 py-2 border-y border-cinema-700/60 mb-4">
                  <div>Sức chứa: <strong className="text-white">{room.capacity} ghế</strong></div>
                  <div>Thiết bị: <strong className="text-white">{room.total_equipment} cái</strong></div>
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
                  <span className="text-[10px] text-slate-400 font-semibold">Đổi trạng thái:</span>
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
                <span className="text-xs text-slate-400">{roomDetails.location} • Sức chứa: {roomDetails.capacity} ghế</span>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Visual Seat Matrix */}
            <div>
              <div className="text-xs font-bold text-gold-400 uppercase tracking-wider mb-3">
                SƠ ĐỒ BỐ TRÍ GHẾ VẬT LÝ ({roomDetails.seats?.length} ghế):
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
                    {seat.row_number}{seat.seat_number}
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment Attached */}
            <div>
              <div className="text-xs font-bold text-gold-400 uppercase tracking-wider mb-3">
                DANH SÁCH THIẾT BỊ GẮN TRONG PHÒNG ({roomDetails.equipment?.length} thiết bị):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roomDetails.equipment?.map((eq) => (
                  <div key={eq.id} className="p-3 rounded-xl bg-cinema-900 border border-cinema-700 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{eq.name}</div>
                      <div className="text-[10px] text-slate-400">{eq.type_name} • {eq.code}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      eq.status === 'good' ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'
                    }`}>
                      {eq.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
