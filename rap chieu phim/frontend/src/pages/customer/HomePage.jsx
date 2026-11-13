import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Play, Calendar, Clock, Star, Film, Sparkles, Flame, ChevronRight, Ticket, Video } from 'lucide-react';
import { TrailerModal } from '../../components/customer/TrailerModal';

export function HomePage({ onSelectMovie, onSelectSchedule, onNavigate }) {
  const [movies, setMovies] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('now_showing'); // 'now_showing' | 'coming_soon'
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [trailerData, setTrailerData] = useState({ isOpen: false, url: '', name: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moviesRes, schedulesRes] = await Promise.all([
        api.getMovies({ limit: 16 }),
        api.getSchedules({ status: 'scheduled' }),
      ]);
      if (moviesRes.success) setMovies(moviesRes.data);
      if (schedulesRes.success) setSchedules(schedulesRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu trang chủ:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = movies.filter((m) => {
    const matchTab = activeTab === 'all' || m.status === activeTab;
    const matchGenre = selectedGenre === 'all' || m.genre.includes(selectedGenre);
    return matchTab && matchGenre;
  });

  const spotlightMovie = movies.find((m) => m.id === 1) || movies[0];

  const genres = ['all', 'Hành động', 'Khoa học viễn tưởng', 'Hoạt hình', 'Tâm lý', 'Kinh dị', 'Gia đình'];

  return (
    <div className="min-h-screen pb-20 space-y-12">
      {/* Hero Spotlight Banner */}
      {spotlightMovie && (
        <div className="relative w-full h-[480px] sm:h-[540px] overflow-hidden rounded-3xl mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cinema-700/60 shadow-2xl">
            {/* Background Backdrop */}
            <img
              src={spotlightMovie.poster}
              alt={spotlightMovie.name}
              className="w-full h-full object-cover object-center scale-105 filter brightness-75 transition-transform duration-1000 hover:scale-100"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg';
              }}
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-950 via-cinema-950/80 to-transparent" />

            {/* Hero Content */}
            <div className="absolute bottom-0 left-0 p-6 sm:p-12 max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-ruby-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-glow-red">
                  <Flame className="w-3.5 h-3.5 fill-white" /> PHIM BOM TẤN NỔI BẬT
                </span>
                <span className="px-2.5 py-1 rounded-full bg-cinema-800/80 text-amber-400 border border-amber-500/40 text-xs font-bold font-mono">
                  {spotlightMovie.format}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-cinema-800/80 text-slate-300 text-xs font-semibold">
                  {spotlightMovie.age_rating}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-md">
                {spotlightMovie.name}
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                {spotlightMovie.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-ruby-400" /> {spotlightMovie.duration} phút
                </span>
                <span>•</span>
                <span>{spotlightMovie.genre}</span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => onSelectMovie(spotlightMovie)}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-glow-red transition-all flex items-center gap-2 hover:scale-105"
                >
                  <Ticket className="w-4 h-4" />
                  Đặt Vé Ngay
                </button>
                <button
                  onClick={() =>
                    setTrailerData({
                      isOpen: true,
                      url: spotlightMovie.trailer,
                      name: spotlightMovie.name,
                    })
                  }
                  className="px-5 py-3.5 rounded-xl bg-cinema-800/80 hover:bg-cinema-700 text-white font-bold text-sm border border-cinema-600/60 backdrop-blur-md transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4 text-ruby-400 fill-ruby-400" />
                  Xem Trailer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation Tabs & Genre Filter */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-cinema-900 border border-cinema-700/60">
            <button
              onClick={() => setActiveTab('now_showing')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'now_showing'
                  ? 'bg-ruby-600 text-white shadow-glow-red'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" /> Phim Đang Chiếu
            </button>
            <button
              onClick={() => setActiveTab('coming_soon')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'coming_soon'
                  ? 'bg-ruby-600 text-white shadow-glow-red'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" /> Phim Sắp Chiếu
            </button>
          </div>

          {/* Genre Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedGenre === g
                    ? 'bg-cinema-700 text-gold-400 border border-gold-500/40'
                    : 'bg-cinema-900 text-slate-400 hover:text-white border border-cinema-700/50'
                }`}
              >
                {g === 'all' ? 'Tất cả thể loại' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Movie Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Film className="w-6 h-6 text-ruby-500" />
              {activeTab === 'now_showing' ? 'Phim Đang Khởi Chiếu' : 'Phim Sắp Ra Mắt'}
              <span className="text-xs font-normal text-slate-400 ml-2">({filteredMovies.length} phim)</span>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 rounded-2xl bg-cinema-900 animate-pulse border border-cinema-800" />
              ))}
            </div>
          ) : filteredMovies.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-3xl border border-cinema-700">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Không tìm thấy phim phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-6">
              {filteredMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="group relative glass-panel rounded-2xl overflow-hidden border border-cinema-700/60 shadow-xl transition-all duration-300 hover:border-ruby-500/60 hover:shadow-glow-red hover:-translate-y-1.5 flex flex-col"
                >
                  {/* Poster Thumbnail */}
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

                    {/* Age Rating & Format Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded-md bg-ruby-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        {movie.age_rating}
                      </span>
                      {movie.format.includes('IMAX') && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-cinema-950 text-[9px] font-extrabold uppercase tracking-wider shadow">
                          IMAX
                        </span>
                      )}
                    </div>

                    {/* Quick Trailer Button Overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTrailerData({ isOpen: true, url: movie.trailer, name: movie.name });
                      }}
                      className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-ruby-600 text-white flex items-center justify-center backdrop-blur-sm transition-colors border border-white/20 shadow-lg"
                      title="Xem trailer"
                    >
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </button>
                  </div>

                  {/* Movie Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[11px] text-ruby-400 font-semibold truncate mb-1">
                        {movie.genre}
                      </div>
                      <h3 className="font-extrabold text-sm text-white line-clamp-1 group-hover:text-ruby-400 transition-colors">
                        {movie.name}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {movie.duration}p
                        </span>
                        <span>•</span>
                        <span>{movie.language.split(' - ')[0]}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => onSelectMovie(movie)}
                      className="w-full py-2.5 rounded-xl bg-cinema-800 hover:bg-ruby-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-cinema-600/50 group-hover:border-ruby-500"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Xem Suất Chiếu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cinematic Technology Highlights (IMAX, 4DX, Dolby) */}
        <div className="pt-8 border-t border-cinema-700/60">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl font-black text-white mb-2">Trải Nghiệm Điện Ảnh Đỉnh Cao</h3>
            <p className="text-xs text-slate-400">
              Hệ thống phòng chiếu chuẩn Hollywood với trang thiết bị Laser 4K, Dolby Atmos và 4DX Dynamic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-cinema-700/60 text-center hover:border-amber-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30 font-black text-lg">
                IMAX
              </div>
              <h4 className="font-extrabold text-white text-base mb-1">IMAX Laser 4K</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Màn hình cong khổng lồ 22m x 16m cùng máy chiếu Laser kép cho độ tương phản và hình ảnh sắc nét vượt trội.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-cinema-700/60 text-center hover:border-ruby-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-ruby-500/20 text-ruby-400 flex items-center justify-center mx-auto mb-4 border border-ruby-500/30 font-black text-lg">
                4DX
              </div>
              <h4 className="font-extrabold text-white text-base mb-1">4DX Motion World</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ghế chuyển động đa chiều kết hợp hiệu ứng gió bão, sương mù, mưa tuyết và mùi hương chân thực.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-cinema-700/60 text-center hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/30 font-black text-lg">
                DOLBY
              </div>
              <h4 className="font-extrabold text-white text-base mb-1">Dolby Atmos 7.1</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hệ thống âm thanh vòm 360 độ chân thực từng chi tiết, đưa khán giả hòa mình vào không gian điện ảnh.
              </p>
            </div>
          </div>
        </div>
      </div>

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
