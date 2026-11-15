import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import {
  Play,
  Calendar,
  Clock,
  Star,
  Film,
  Flame,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Video,
  Sparkles,
  Maximize2,
  Wind,
  Layers,
  CheckCircle2,
  X,
  ArrowRight,
  Tv,
} from 'lucide-react';
import { cinemaSound } from '../../services/cinemaSound';
import { TrailerModal } from '../../components/customer/TrailerModal';
import { MovieDetailModal } from '../../components/customer/MovieDetailModal';

const CINEMATIC_TECHNOLOGIES = [
  {
    id: 'imax',
    title: 'IMAX Laser 4K',
    category: 'Màn Ảnh Cỡ Lớn',
    shortCode: 'IMAX',
    tagline: 'Chuẩn mực hình ảnh điện ảnh thế hệ mới',
    description: 'Màn hình cong khổng lồ 22m x 16m kết hợp hệ thống máy chiếu Dual-Laser kép, mang lại độ tương phản vô cực và hình ảnh sắc nét vượt trội.',
    image: '/images/imax.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200',
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    iconStyle: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    borderHover: 'hover:border-amber-500/80 hover:shadow-[0_15px_35px_rgba(245,158,11,0.22)]',
    glowGradient: 'from-amber-500/20 to-transparent',
    btnGradient: 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold shadow-lg shadow-amber-500/20',
    features: ['IMAX 4K Dual Laser', 'Màn Hình Cong 22m', 'Tỷ Lệ 1.43:1', 'Độ Tương Phản Vô Cực'],
    roomName: 'Cinema Hall 4 (IMAX Laser Theater)',
    specs: [
      { label: 'Hệ thống máy chiếu', value: 'Dual 4K Commercial Laser kép' },
      { label: 'Kích thước màn ảnh', value: '22m (ngang) x 16m (cao) - Cong 70°' },
      { label: 'Độ sáng tiêu chuẩn', value: 'Vượt trội 60% so với bóng Xenon' },
      { label: 'Hệ thống âm thanh', value: 'IMAX 12-Channel Immersive Sound' },
    ],
  },
  {
    id: '4dx',
    title: '4DX Motion World',
    category: 'Điện Ảnh Đa Giác Quan',
    shortCode: '4DX',
    tagline: 'Nhập vai 5 giác quan cùng 21 hiệu ứng thời tiết',
    description: 'Ghế chuyển động đa chiều 3 bậc tự do đồng bộ nhịp phim, hòa cùng hiệu ứng gió bão, sương mù, mưa tuyết và mùi hương môi trường sống động.',
    image: '/images/4dx.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=1200',
    badgeStyle: 'bg-ruby-500/20 text-ruby-300 border-ruby-500/40',
    iconStyle: 'bg-ruby-500/20 text-ruby-400 border-ruby-500/30',
    borderHover: 'hover:border-ruby-500/80 hover:shadow-[0_15px_35px_rgba(225,29,72,0.25)]',
    glowGradient: 'from-ruby-500/20 to-transparent',
    btnGradient: 'bg-gradient-to-r from-ruby-600 via-rose-600 to-ruby-600 hover:from-ruby-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-ruby-500/25',
    features: ['Motion Seats Đa Chiều', 'Gió Bão & Sương Mù', 'Mưa Tuyết & Chớp Sáng', 'Mùi Hương Môi Trường'],
    roomName: 'Cinema Hall 5 (4DX Motion World)',
    specs: [
      { label: 'Cơ cấu chuyển động', value: 'Servo đa trục mô phỏng Heave, Pitch, Roll' },
      { label: 'Số lượng hiệu ứng', value: '21 hiệu ứng vật lý & thời tiết môi trường' },
      { label: 'Công nghệ bảo vệ', value: 'Thuật toán AI cân bằng rung lắc chống say' },
      { label: 'Hiệu ứng mùi hương', value: '7 mùi tự nhiên: biển, rừng thông, thuốc súng...' },
    ],
  },
  {
    id: 'dolby',
    title: 'Dolby Atmos 7.1',
    category: 'Âm Thanh Vòm Không Gian',
    shortCode: 'DOLBY',
    tagline: 'Âm thanh 3 chiều chuyển động chân thực',
    description: 'Hệ thống loa vòm 360 độ bao phủ từ trần nhà đến các vách tường, kiến tạo âm trường đa chiều chân thực đưa khán giả hòa mình trọn vẹn vào không gian điện ảnh.',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200',
    fallbackImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200',
    badgeStyle: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    iconStyle: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    borderHover: 'hover:border-cyan-500/80 hover:shadow-[0_15px_35px_rgba(6,182,212,0.22)]',
    glowGradient: 'from-cyan-500/20 to-transparent',
    btnGradient: 'bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20',
    features: ['Âm Vòm 360° Sphere', 'Loa Trần Overhead', 'Subwoofer Siêu Trầm', 'Chuẩn Dolby Cinema'],
    roomName: 'Cinema Hall 2 (Standard Dolby Atmos)',
    specs: [
      { label: 'Bộ xử lý âm thanh', value: 'Dolby Cinema Audio Processor CP950' },
      { label: 'Cấu hình loa vòm', value: '64 kênh âm thanh độc lập Object-Based Audio' },
      { label: 'Hệ thống loa trần', value: '16 loa trần treo định hướng góc âm học' },
      { label: 'Hệ thống siêu trầm', value: 'Dual Subwoofer 8000W tần số sâu 20Hz' },
    ],
  },
];

export function HomePage({
  onSelectMovie,
  onSelectSchedule,
  onNavigate,
  onOpenInSeatDelivery,
}) {
  const [movies, setMovies] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('now_showing'); // 'now_showing' | 'coming_soon'
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [trailerData, setTrailerData] = useState({ isOpen: false, url: '', name: '' });
  const [detailMovie, setDetailMovie] = useState(null);
  const [selectedTech, setSelectedTech] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moviesRes, schedulesRes] = await Promise.all([
        api.getMovies({ limit: 50 }),
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

  // Cơ chế 1: Thoát Tech Modal bằng phím tắt ESC
  useEffect(() => {
    if (!selectedTech) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        setSelectedTech(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTech]);

  // Cơ chế 2: Khóa cuộn trang nền khi mở Tech Modal và dọn dẹp sạch khi đóng / unmount
  useEffect(() => {
    if (selectedTech) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || 'unset';
      };
    }
  }, [selectedTech]);

  const filteredMovies = movies.filter((m) => {
    const matchTab = activeTab === 'all' || m.status === activeTab;
    const genreStr = Array.isArray(m.genre)
      ? m.genre.join(', ')
      : Array.isArray(m.genres)
      ? m.genres.join(', ')
      : typeof m.genre === 'string'
      ? m.genre
      : '';
    const matchGenre = selectedGenre === 'all' || genreStr.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchTab && matchGenre;
  });

  // Tạo danh sách 3 phim cho banner Hero Spotlight theo đúng thứ tự:
  // 1. Dune, 2. Godzilla x Kong, 3. Conan (tìm theo TÊN, không phân biệt hoa thường / dấu gạch nối)
  const spotlightMovies = React.useMemo(() => {
    if (!movies || movies.length === 0) return [];

    const normalizeStr = (str) =>
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-–—]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const TARGET_KEYS = ['dune', 'godzilla x kong', 'conan'];
    const matchedList = [];

    for (const key of TARGET_KEYS) {
      const found = movies.find((m) => normalizeStr(m.name).includes(key));
      if (found && !matchedList.some((m) => m.id === found.id)) {
        matchedList.push(found);
      }
    }

    if (matchedList.length === 0 && movies.length > 0) {
      return [movies[0]];
    }

    return matchedList;
  }, [movies]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [isTabHidden, setIsTabHidden] = useState(false);

  // Lắng nghe trạng thái tab trình duyệt ẩn/hiện
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Điều kiện tạm dừng tự động chuyển banner:
  // - Đang mở modal Trailer hoặc modal Chi tiết phim
  // - Tab trình duyệt đang ẩn
  // - Danh sách phim chỉ có 1 phim hoặc không có phim
  const isPaused =
    isTabHidden ||
    trailerData.isOpen ||
    Boolean(detailMovie) ||
    spotlightMovies.length <= 1;

  // Tự động chuyển động qua lại giữa các phim mỗi 6 giây liên tục
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % spotlightMovies.length);
      setTimerKey((k) => k + 1);
    }, 6000);

    return () => clearInterval(timer);
  }, [activeIndex, isPaused, spotlightMovies.length]);

  // Preload nhẹ ảnh poster của các phim trong banner để khi chuyển động không bị chớp trắng
  useEffect(() => {
    if (spotlightMovies.length > 1) {
      spotlightMovies.forEach((m) => {
        if (m.poster) {
          const img = new Image();
          img.src = m.poster;
        }
      });
    }
  }, [spotlightMovies]);

  // Chỉ số phim an toàn và phim hiện tại
  const safeIndex = spotlightMovies.length > 0 ? activeIndex % spotlightMovies.length : 0;
  const currentSpotlightMovie = spotlightMovies[safeIndex] || null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + spotlightMovies.length) % spotlightMovies.length);
    setTimerKey((k) => k + 1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % spotlightMovies.length);
    setTimerKey((k) => k + 1);
  };

  const handleSelectIndex = (idx) => {
    setActiveIndex(idx);
    setTimerKey((k) => k + 1);
  };

  const genres = ['all', 'Hành động', 'Khoa học viễn tưởng', 'Hoạt hình', 'Tâm lý', 'Kinh dị', 'Gia đình'];

  return (
    <div className="min-h-screen pb-20 space-y-12">
      {/* Hero Spotlight Banner - Tự chuyển động trượt mượt mà (Animated Sliding Carousel) */}
      {spotlightMovies.length > 0 && (
        <div
          className="relative w-full h-[480px] sm:h-[530px] overflow-hidden rounded-3xl mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 group/banner"
          aria-label="Hero Spotlight Banner"
        >
          <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cinema-700/60 shadow-2xl bg-cinema-950">
            {/* Sliding Carousel Track (Chuyển động trượt mượt mà 700ms giữa các phim) */}
            <div
              className="w-full h-full flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${safeIndex * 100}%)` }}
            >
              {spotlightMovies.map((movie, idx) => (
                <div
                  key={movie.id}
                  className="relative w-full h-full shrink-0 overflow-hidden"
                >
                  {/* Background Backdrop với hiệu ứng chuyển động Ken Burns phóng to nhẹ */}
                  <img
                    src={movie.poster}
                    alt={movie.name}
                    className={`w-full h-full object-cover object-center filter brightness-75 scale-105 ${
                      idx === safeIndex ? 'animate-ken-burns' : ''
                    }`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg';
                    }}
                  />

                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-10" />

                  {/* Hero Content của từng phim */}
                  <div className="absolute bottom-0 left-0 p-6 sm:p-10 lg:p-12 max-w-3xl lg:max-w-4xl space-y-3.5 sm:space-y-4 cinematic-dark-overlay z-20">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-ruby-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-glow-red">
                        <Flame className="w-3.5 h-3.5 fill-white" /> PHIM BOM TẤN NỔI BẬT
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-cinema-800/80 text-amber-400 border border-amber-500/40 text-xs font-bold font-mono">
                        {movie.format}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-cinema-800/80 text-slate-300 text-xs font-semibold">
                        {movie.age_rating}
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-md">
                      {movie.name}
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                      {movie.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-300 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-ruby-400" /> {movie.duration} phút
                      </span>
                      <span>•</span>
                      <span>{Array.isArray(movie.genre) ? movie.genre.join(', ') : Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genre || movie.genres || 'Chưa phân loại'}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => onSelectMovie(movie)}
                        className="px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-glow-red transition-all flex items-center gap-2 hover:scale-105 shrink-0"
                      >
                        <Ticket className="w-4 h-4 shrink-0" />
                        Đặt Vé Ngay
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailMovie(movie)}
                        className="px-4 sm:px-5 py-3 rounded-xl bg-cinema-800/80 hover:bg-cinema-700 text-white font-bold text-xs sm:text-sm border border-cinema-600/60 backdrop-blur-md transition-all flex items-center gap-2 shrink-0"
                      >
                        <Film className="w-4 h-4 text-ruby-400 shrink-0" />
                        Chi Tiết Phim
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTrailerData({
                            isOpen: true,
                            url: movie.trailer,
                            name: movie.name,
                          })
                        }
                        className="px-4 py-3 rounded-xl bg-cinema-800/80 hover:bg-cinema-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm border border-cinema-600/60 backdrop-blur-md transition-all flex items-center gap-2 shrink-0"
                      >
                        <Play className="w-4 h-4 text-ruby-400 fill-ruby-400 shrink-0" />
                        Trailer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Điều khiển thủ công: Mũi tên trái/phải & Hàng chấm tròn có thanh tiến trình tự chuyển */}
            {spotlightMovies.length > 1 && (
              <>
                {/* Nút mũi tên chuyển phim trước */}
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Phim trước"
                  className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-ruby-600 text-white/80 hover:text-white backdrop-blur-md border border-white/10 hover:border-ruby-500/50 transition-all duration-300 shadow-lg hover:scale-110 focus:outline-none"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Nút mũi tên chuyển phim tiếp theo */}
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Phim tiếp theo"
                  className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-ruby-600 text-white/80 hover:text-white backdrop-blur-md border border-white/10 hover:border-ruby-500/50 transition-all duration-300 shadow-lg hover:scale-110 focus:outline-none"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                {/* Hàng chấm tròn điều hướng kèm thanh tiến trình chạy động */}
                <div className="absolute bottom-5 sm:bottom-8 right-6 sm:right-10 z-30 flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-xl">
                  {spotlightMovies.map((m, idx) => {
                    const isActive = idx === safeIndex;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectIndex(idx)}
                        aria-label={`Chuyển tới phim ${idx + 1}: ${m.name}`}
                        className={`h-2.5 rounded-full transition-all duration-300 relative overflow-hidden focus:outline-none ${
                          isActive
                            ? 'w-10 bg-ruby-950/80 border border-ruby-500/50 shadow-glow-red'
                            : 'w-2.5 bg-white/35 hover:bg-white/70'
                        }`}
                      >
                        {isActive && (
                          <div
                            key={`progress-${safeIndex}-${timerKey}`}
                            className="h-full bg-gradient-to-r from-ruby-600 via-rose-500 to-amber-500 rounded-full animate-progress-fill"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quick Services Banner: Bắp Nước F&B */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-cinema-900 to-cinema-900 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
              🍿 Dịch Vụ Ẩm Thực Rạp Chiếu
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">Gọi Món Bắp Nước Tận Ghế & Nhận Tại Quầy</h3>
            <p className="text-xs text-slate-400">Bắp rang bơ phô mai, caramel giòn rụm và Coca-Cola mát lạnh giao tận chỗ ngồi trong phòng chiếu</p>
          </div>
          <button
            onClick={() => (onOpenInSeatDelivery ? onOpenInSeatDelivery() : onNavigate('movies'))}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold text-xs sm:text-sm shadow-glow-amber transition-all whitespace-nowrap shrink-0"
          >
            Đặt Món Ngay →
          </button>
        </div>
      </div>

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
                  <div
                    onClick={() => setDetailMovie(movie)}
                    className="relative aspect-[2/3] overflow-hidden bg-cinema-900 cursor-pointer"
                  >
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
                    <div onClick={() => setDetailMovie(movie)} className="cursor-pointer">
                      <div className="text-[11px] text-ruby-400 font-semibold truncate mb-1">
                        {Array.isArray(movie.genre) ? movie.genre.join(', ') : Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genre || movie.genres || 'Chưa phân loại'}
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

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setDetailMovie(movie)}
                        className="py-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-cinema-700/60"
                        title="Xem chi tiết nội dung, diễn viên & lịch chiếu"
                      >
                        <Film className="w-3.5 h-3.5 text-ruby-400" /> Chi Tiết
                      </button>
                      <button
                        onClick={() => onSelectMovie(movie)}
                        className="py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white text-xs font-bold transition-all shadow-glow-red flex items-center justify-center gap-1"
                        title="Xem các suất chiếu để đặt vé"
                      >
                        <Ticket className="w-3.5 h-3.5" /> Đặt Vé
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cinematic Technology Highlights (IMAX, 4DX, Dolby) */}
        <div className="pt-12 border-t border-cinema-700/60">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Chuẩn Mực Rạp Chiếu Hollywood
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
              Trải Nghiệm <span className="text-transparent bg-clip-text bg-gradient-to-r from-ruby-500 via-rose-400 to-amber-400">Điện Ảnh Đỉnh Cao</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Hệ thống phòng chiếu thế hệ mới tại NIGHT MOVIE tích hợp những công nghệ nghe nhìn tân tiến bậc nhất hành tinh, mang lại cảm xúc đắm chìm trọn vẹn trong từng khuôn hình.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {CINEMATIC_TECHNOLOGIES.map((tech) => (
              <div
                key={tech.id}
                onClick={() => {
                  cinemaSound.playTicketChime();
                  setSelectedTech(tech);
                }}
                className={`group relative rounded-3xl overflow-hidden border border-cinema-700/70 bg-cinema-900/90 shadow-2xl flex flex-col justify-between min-h-[490px] sm:min-h-[520px] transition-all duration-500 hover:-translate-y-2 cursor-pointer ${tech.borderHover}`}
              >
                {/* Background Image with Zoom & Dark Gradients */}
                <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-cinema-900 to-cinema-950">
                  <img
                    src={tech.image}
                    alt={tech.title}
                    onError={(e) => {
                      if (!e.target.dataset.triedFallback && tech.fallbackImage) {
                        e.target.dataset.triedFallback = 'true';
                        e.target.src = tech.fallbackImage;
                      } else {
                        e.target.style.display = 'none';
                      }
                    }}
                    className={`w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-110 filter contrast-[1.12] ${
                      tech.id === 'imax' || tech.id === '4dx' ? 'brightness-[0.88]' : 'brightness-[0.72]'
                    }`}
                  />
                  {/* Multilayer Dark Gradient for High Text Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/25" />
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-25 transition-opacity duration-500 bg-gradient-to-b ${tech.glowGradient}`} />
                </div>

                {/* Top Content: Badges */}
                <div className="relative z-10 p-6 flex items-start justify-between gap-3">
                  <span className={`text-[11px] font-extrabold tracking-wider uppercase px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-sm ${tech.badgeStyle}`}>
                    {tech.category}
                  </span>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm border shadow-lg backdrop-blur-md ${tech.iconStyle}`}>
                    {tech.shortCode}
                  </div>
                </div>

                {/* Bottom Content: Titles, Descriptions, Feature Badges & Action */}
                <div className="relative z-10 p-6 sm:p-7 flex flex-col justify-end cinematic-dark-overlay">
                  <div className="text-[11px] font-semibold text-amber-400/90 uppercase tracking-widest mb-1.5">
                    {tech.tagline}
                  </div>
                  <h4 className="text-2xl font-black text-white mb-2.5 group-hover:text-amber-300 transition-colors flex items-center gap-2">
                    {tech.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-4 line-clamp-3">
                    {tech.description}
                  </p>

                  {/* Feature Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {tech.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-black/40 text-slate-200 border border-white/10 backdrop-blur-md shadow-sm"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <button
                      type="button"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${tech.btnGradient}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Khám phá công nghệ</span>
                    </button>
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-white transition-colors flex items-center gap-1">
                      Chi tiết <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cinematic Technology Detail Modal */}
      {selectedTech && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTech(null);
          }}
        >
          <div
            className="relative w-full max-w-[700px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl bg-[#12151f] border border-white/10 shadow-2xl animate-scale-up"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '16px',
              background: '#12151f',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Banner */}
            <div className="relative h-48 sm:h-56 overflow-hidden shrink-0">
              <img
                src={selectedTech.image}
                alt={selectedTech.title}
                onError={(e) => {
                  e.target.src = selectedTech.fallbackImage;
                }}
                className="w-full h-full object-cover filter brightness-[0.65]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12151f] via-[#12151f]/60 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedTech(null)}
                className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
                title="Đóng (phím ESC)"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-16">
                <span className={`text-[11px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-lg border backdrop-blur-md ${selectedTech.badgeStyle}`}>
                  {selectedTech.category}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                  {selectedTech.title}
                </h3>
                <p className="text-xs text-amber-300 font-medium">
                  {selectedTech.tagline}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div
              className="modal-body flex-1 overflow-y-auto p-6 sm:p-7 space-y-6"
              style={{
                overflowY: 'auto',
                flex: 1,
                padding: '24px',
              }}
            >
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedTech.description}
              </p>

              {/* Technical Specs Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-ruby-400" />
                  Thông Số Kỹ Thuật Đạt Chuẩn Quốc Tế
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTech.specs.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-cinema-800/80 border border-cinema-700/60 flex flex-col justify-center"
                    >
                      <span className="text-[11px] text-slate-400 font-medium">{item.label}</span>
                      <span className="text-xs font-bold text-white mt-0.5">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Room at Night Movie */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cinema-800 via-cinema-850 to-cinema-800 border border-cinema-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Phòng chiếu trang bị tại Night Movie:</span>
                  <div className="text-sm font-extrabold text-white flex items-center gap-2 mt-0.5">
                    <Tv className="w-4 h-4 text-amber-400" />
                    {selectedTech.roomName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTech(null);
                    if (onNavigate) onNavigate('schedules');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white shadow-glow-red flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Xem Lịch Chiếu</span>
                </button>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedTech(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cinema-800 hover:bg-cinema-700 text-slate-200 border border-cinema-700 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerData.isOpen}
        onClose={() => setTrailerData({ isOpen: false, url: '', name: '' })}
        trailerUrl={trailerData.url}
        movieName={trailerData.name}
      />

      {/* Full Movie Detail & Screening Modal */}
      <MovieDetailModal
        isOpen={Boolean(detailMovie)}
        movie={detailMovie}
        onClose={() => setDetailMovie(null)}
        onSelectSchedule={(schedId) => {
          setDetailMovie(null);
          if (onSelectSchedule) onSelectSchedule(schedId);
          else onSelectMovie(detailMovie);
        }}
      />
    </div>
  );
}
