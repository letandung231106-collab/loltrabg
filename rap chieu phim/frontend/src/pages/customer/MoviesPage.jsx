import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Film, Search, Clock, Play, Ticket, Filter } from 'lucide-react';
import { TrailerModal } from '../../components/customer/TrailerModal';

export function MoviesPage({ onSelectMovie }) {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [trailerData, setTrailerData] = useState({ isOpen: false, url: '', name: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, [statusFilter, genreFilter, search]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await api.getMovies({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        genre: genreFilter !== 'all' ? genreFilter : undefined,
        search: search || undefined,
      });
      if (res.success) setMovies(res.data);
    } catch (err) {
      console.error('Lỗi tải danh mục phim:', err);
    } finally {
      setLoading(false);
    }
  };

  const genres = ['all', 'Hành động', 'Khoa học viễn tưởng', 'Hoạt hình', 'Tâm lý', 'Kinh dị', 'Gia đình', 'Hài hước'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Film className="w-8 h-8 text-ruby-500" /> Danh Mục Phim Chiếu Rạp
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Duyệt danh sách các bộ phim bom tấn mới nhất tại hệ thống rạp NIGHT MOVIE
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 glass-panel rounded-2xl border border-cinema-700/60 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên phim, đạo diễn, diễn viên..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="now_showing">Đang chiếu</option>
              <option value="coming_soon">Sắp chiếu</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Thể loại:</span>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none"
            >
              {genres.map((g) => (
                <option key={g} value={g}>{g === 'all' ? 'Tất cả thể loại' : g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-ruby-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs">Đang tải danh mục phim...</p>
        </div>
      ) : movies.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-cinema-700">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Không tìm thấy phim nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="group glass-panel rounded-2xl overflow-hidden border border-cinema-700/60 shadow-xl transition-all duration-300 hover:border-ruby-500/60 hover:-translate-y-1.5 flex flex-col"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-cinema-900">
                <img
                  src={movie.poster}
                  alt={movie.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-transparent to-transparent opacity-90" />
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-ruby-600 text-white text-[10px] font-black uppercase shadow">
                    {movie.age_rating}
                  </span>
                </div>
                <button
                  onClick={() => setTrailerData({ isOpen: true, url: movie.trailer, name: movie.name })}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-ruby-600 text-white flex items-center justify-center transition-colors shadow-lg"
                  title="Xem trailer"
                >
                  <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[10px] text-ruby-400 font-semibold truncate mb-1">
                    {movie.genre}
                  </div>
                  <h3 className="font-extrabold text-sm text-white line-clamp-1 group-hover:text-ruby-400 transition-colors">
                    {movie.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {movie.duration} phút
                  </div>
                </div>

                <button
                  onClick={() => onSelectMovie(movie)}
                  className="w-full py-2.5 rounded-xl bg-cinema-800 hover:bg-ruby-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-cinema-600/50"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Chọn Suất Chiếu
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerData.isOpen}
        onClose={() => setTrailerData({ isOpen: false, url: '', name: '' })}
        trailerUrl={trailerData.url}
        movieName={trailerData.name}
      />
    </div>
  );
}
