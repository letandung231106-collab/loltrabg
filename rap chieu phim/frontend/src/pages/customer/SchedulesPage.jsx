import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Calendar, Clock, Film, MapPin, Sparkles, ChevronRight, Ticket, Filter } from 'lucide-react';

export function SchedulesPage({ onSelectSchedule }) {
  const [schedules, setSchedules] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMovieId, setSelectedMovieId] = useState('all');
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [loading, setLoading] = useState(true);

  // Generate 7 days for the date selector
  const dateOptions = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = idx === 0 ? 'Hôm nay' : idx === 1 ? 'Ngày mai' : `Thứ ${d.getDay() === 0 ? 'CN' : d.getDay() + 1}`;
    return {
      dateStr,
      dayName,
      dayNumber: d.getDate(),
      month: d.getMonth() + 1,
    };
  });

  useEffect(() => {
    fetchSchedulesAndMetadata();
  }, [selectedDate, selectedMovieId]);

  const fetchSchedulesAndMetadata = async () => {
    setLoading(true);
    try {
      const [schedRes, movieRes, roomRes] = await Promise.all([
        api.getSchedules({
          date: selectedDate,
          movie_id: selectedMovieId !== 'all' ? selectedMovieId : undefined,
        }),
        api.getMovies({ status: 'now_showing' }),
        api.getRooms(),
      ]);

      if (schedRes.success) setSchedules(schedRes.data);
      if (movieRes.success) setMovies(movieRes.data);
      if (roomRes.success) setRooms(roomRes.data);
    } catch (err) {
      console.error('Lỗi tải lịch chiếu:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group schedules by movie
  const schedulesByMovie = {};
  schedules.forEach((s) => {
    if (selectedRoomType !== 'all' && s.room_type !== selectedRoomType) return;
    if (!schedulesByMovie[s.movie_id]) {
      schedulesByMovie[s.movie_id] = {
        movie_id: s.movie_id,
        movie_name: s.movie_name,
        movie_poster: s.movie_poster,
        duration: s.duration,
        genre: s.genre,
        age_rating: s.age_rating,
        schedules: [],
      };
    }
    schedulesByMovie[s.movie_id].schedules.push(s);
  });

  const movieGroupList = Object.values(schedulesByMovie);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Calendar className="w-8 h-8 text-ruby-500" />
          Lịch Chiếu Phim Rạp NIGHT MOVIE
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chọn ngày và khung giờ chiếu để đặt ghế yêu thích của bạn
        </p>
      </div>

      {/* Date Bar Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {dateOptions.map((item) => {
          const isSelected = selectedDate === item.dateStr;
          return (
            <button
              key={item.dateStr}
              onClick={() => setSelectedDate(item.dateStr)}
              className={`p-3 min-w-[100px] rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-gradient-to-b from-ruby-600 to-rose-800 text-white border-ruby-400 shadow-glow-red scale-105'
                  : 'bg-cinema-900 border-cinema-700/60 text-slate-400 hover:bg-cinema-850 hover:text-white'
              }`}
            >
              <span className="text-[11px] font-semibold">{item.dayName}</span>
              <span className="text-xl font-black font-mono my-0.5">{item.dayNumber}</span>
              <span className="text-[10px] opacity-80">Tháng {item.month}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl border border-cinema-700/60">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gold-400" />
            <span className="font-bold text-slate-300">Lọc theo phim:</span>
            <select
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
            >
              <option value="all">Tất cả phim ({movies.length})</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Định dạng phòng:</span>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
            >
              <option value="all">Tất cả định dạng</option>
              <option value="standard">Standard (Dolby 7.1)</option>
              <option value="vip">VIP Prime Lounge</option>
              <option value="imax">IMAX Laser Theater</option>
              <option value="4dx">4DX Motion Dynamic</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Tổng cộng: <strong className="text-white">{schedules.length} suất chiếu</strong> trong ngày
        </div>
      </div>

      {/* Schedule Grouped List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-ruby-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs">Đang cập nhật danh sách lịch chiếu...</p>
        </div>
      ) : movieGroupList.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-cinema-700">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">Không có suất chiếu phù hợp</h4>
          <p className="text-slate-400 text-xs">Vui lòng chọn ngày khác hoặc thử định dạng phòng khác.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {movieGroupList.map((group) => (
            <div
              key={group.movie_id}
              className="glass-panel p-5 sm:p-6 rounded-3xl border border-cinema-700/80 shadow-xl flex flex-col md:flex-row gap-6 hover:border-ruby-500/40 transition-all"
            >
              {/* Poster Thumbnail */}
              <div className="w-24 sm:w-32 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden border border-cinema-700 bg-cinema-900 shadow-md">
                <img
                  src={group.movie_poster}
                  alt={group.movie_name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Movie Info & Screenings */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-ruby-600 text-white text-[10px] font-black uppercase">
                      {group.age_rating}
                    </span>
                    <span className="text-xs text-ruby-400 font-semibold">{group.genre}</span>
                  </div>
                  <h3 className="text-xl font-black text-white">{group.movie_name}</h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Thời lượng: {group.duration} phút
                  </div>
                </div>

                {/* Showtimes Grid */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    CÁC SUẤT CHIẾU KHẢ DỤNG:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {group.schedules.map((s) => {
                      const startTimeStr = new Date(s.start_time).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endTimeStr = new Date(s.end_time).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isPast = new Date(s.start_time) < new Date();

                      return (
                        <button
                          key={s.id}
                          disabled={isPast}
                          onClick={() => onSelectSchedule(s.id)}
                          className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            isPast
                              ? 'bg-cinema-950/50 border-cinema-800 text-slate-600 cursor-not-allowed'
                              : 'bg-cinema-900 hover:bg-ruby-600/20 border-cinema-700/70 hover:border-ruby-500 hover:scale-105 group'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base font-black text-white group-hover:text-ruby-400 font-mono">
                              {startTimeStr}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cinema-800 text-amber-400">
                              {s.room_type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {s.room_name}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 pt-1 border-t border-cinema-800 flex justify-between">
                            <span>~{endTimeStr}</span>
                            <span className="font-bold text-slate-300">
                              {parseFloat(s.ticket_price).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
