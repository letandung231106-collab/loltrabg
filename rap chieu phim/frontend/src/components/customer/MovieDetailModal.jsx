import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Play,
  Calendar,
  Clock,
  Film,
  Ticket,
  Star,
  User,
  Users,
  Info,
  MapPin,
  Flame,
  CheckCircle2,
  MessageSquare,
  Send,
} from 'lucide-react';

export function MovieDetailModal({ isOpen, onClose, movie, onSelectSchedule }) {
  const { isAuthenticated, user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [selectedDate, setSelectedDate] = useState('all');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  // Cơ chế 1: Thoát Modal bằng phím tắt ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cơ chế 2: Khóa cuộn trang nền khi mở Modal và phục hồi sạch khi đóng/unmount
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || 'unset';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && movie?.id) {
      fetchMovieSchedules(movie.id);
      fetchMovieReviews(movie.id);
      setIsPlayingTrailer(false);
      setReviewMsg('');
      setNewComment('');
      setNewRating(5);
      setSelectedDate('all');
    }
  }, [isOpen, movie?.id]);

  const fetchMovieSchedules = async (movieId) => {
    setLoadingSchedules(true);
    try {
      const res = await api.getSchedules({ movie_id: movieId, status: 'scheduled' });
      if (res && res.success && Array.isArray(res.data)) {
        setSchedules(res.data);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error('Lỗi tải lịch chiếu phim:', err);
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchMovieReviews = async (movieId) => {
    try {
      const res = await api.getMovieReviews(movieId);
      if (res && res.success && res.data) {
        setReviews(Array.isArray(res.data.reviews) ? res.data.reviews : []);
        setAverageRating(res.data.averageRating ?? null);
        setTotalReviews(Number(res.data.totalReviews || 0));
      }
    } catch (err) {
      console.warn('Lỗi tải đánh giá phim:', err);
      setReviews([]);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để gửi đánh giá phim.');
      return;
    }
    if (!newComment.trim()) {
      alert('Vui lòng nhập nội dung nhận xét.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.addMovieReview(movie.id, {
        rating: newRating,
        comment: newComment.trim(),
      });
      if (res && res.success && res.data) {
        setReviews((prev) => {
          const updated = [res.data, ...prev];
          const avg = updated.reduce((sum, item) => sum + Number(item.rating || 0), 0) / updated.length;
          setAverageRating(Number(avg.toFixed(1)));
          setTotalReviews(updated.length);
          return updated;
        });
        setNewComment('');
        setReviewMsg('Đã đăng nhận xét thành công!');
        setTimeout(() => setReviewMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isOpen || !movie) return null;

  // Defensive formatting for genres
  const formattedGenre = Array.isArray(movie.genres)
    ? movie.genres.join(', ')
    : Array.isArray(movie.genre)
    ? movie.genre.join(', ')
    : typeof movie.genre === 'string'
    ? movie.genre
    : typeof movie.genres === 'string'
    ? movie.genres
    : 'Chưa phân loại';

  // Defensive formatting for cast & director
  const movieCast = Array.isArray(movie.cast)
    ? movie.cast.join(', ')
    : Array.isArray(movie.actors)
    ? movie.actors.join(', ')
    : typeof movie.actors === 'string'
    ? movie.actors
    : typeof movie.cast === 'string'
    ? movie.cast
    : 'Đang cập nhật';

  const movieDirector = Array.isArray(movie.director)
    ? movie.director.join(', ')
    : typeof movie.director === 'string'
    ? movie.director
    : 'Đang cập nhật';

  // Defensive schedule date/time parsing
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const getDateStr = (sched) => {
    const raw = sched?.start_time;
    if (!raw || typeof raw !== 'string') return '';
    return raw.split('T')[0] || raw.split(' ')[0] || '';
  };
  const getTimeStr = (time) => {
    if (!time || typeof time !== 'string') return '--:--';
    return time.split('T')[1]?.slice(0, 5) || time.split(' ')[1]?.slice(0, 5) || '--:--';
  };

  const availableDates = Array.from(
    new Set(safeSchedules.map(getDateStr).filter(Boolean))
  );

  const filteredSchedules = safeSchedules.filter((s) => {
    if (selectedDate === 'all') return true;
    return getDateStr(s) === selectedDate;
  });

  // Convert standard YouTube watch link to embed link
  const getEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (url.includes('youtube.com/embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  const embedUrl = getEmbedUrl(movie.trailer);

  const displayRating =
    averageRating !== null && !isNaN(Number(averageRating))
      ? Number(averageRating).toFixed(1)
      : movie?.rating !== undefined && !isNaN(Number(movie.rating))
      ? Number(movie.rating).toFixed(1)
      : null;

  const modalContent = (
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
        // Cơ chế 3: Click Outside (Bấm ra ngoài vùng nền tối để đóng Modal)
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="relative w-full max-w-[850px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl bg-[#12151f] border border-white/10 shadow-2xl animate-scale-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '850px',
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
        {/* Nút Đóng (X) cố định ở góc trên bên phải, kích thước rõ ràng 36x36px, màu nền tối viền sáng nổi bật */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Đóng cửa sổ (phím ESC)"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Backdrop banner */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden shrink-0 bg-cinema-950">
          {isPlayingTrailer && embedUrl ? (
            <div className="relative w-full h-full">
              <iframe
                src={embedUrl}
                title={`Trailer: ${movie.name}`}
                className="w-full h-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                onClick={() => setIsPlayingTrailer(false)}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/95 text-white text-xs font-bold border border-white/20 backdrop-blur-md"
              >
                Thu nhỏ Trailer
              </button>
            </div>
          ) : (
            <>
              <img
                src={movie.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800'}
                alt={movie.name || 'Chi tiết phim'}
                className="w-full h-full object-cover filter brightness-[0.55] blur-sm scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12151f] via-[#12151f]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#12151f] via-transparent to-[#12151f]" />

              {/* Poster thumbnail inside banner */}
              <div className="absolute bottom-4 left-6 right-16 flex items-end gap-5">
                <img
                  src={movie.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800'}
                  alt={movie.name || 'Poster'}
                  className="w-24 sm:w-28 aspect-[2/3] object-cover rounded-2xl border-2 border-ruby-500 shadow-glow-red shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800';
                  }}
                />
                <div className="space-y-1.5 pb-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-ruby-600 text-white font-extrabold text-[11px] uppercase tracking-wider">
                      {movie.age_rating || 'P'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-mono font-bold">
                      {movie.format || '2D Digital'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cinema-800 text-slate-300 text-[11px] font-semibold">
                      {movie.status === 'now_showing' ? 'Đang chiếu' : 'Sắp chiếu'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md truncate">
                    {movie.name}
                  </h2>
                  <p className="text-xs text-ruby-400 font-semibold truncate">{formattedGenre}</p>
                </div>
              </div>

              {/* Play Trailer Floating Button */}
              {movie.trailer && (
                <button
                  type="button"
                  onClick={() => setIsPlayingTrailer(true)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-ruby-600/90 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red flex items-center gap-2 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" /> Xem Trailer Phim
                </button>
              )}
            </>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div
          className="modal-body flex-1 overflow-y-auto p-6 space-y-6"
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '24px',
          }}
        >
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-cinema-850/80 border border-cinema-700/60 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-ruby-400" /> Thời lượng
              </span>
              <strong className="text-white text-sm">{movie.duration || 120} phút</strong>
            </div>

            <div className="p-3 rounded-2xl bg-cinema-850/80 border border-cinema-700/60 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-ruby-400" /> Ngày khởi chiếu
              </span>
              <strong className="text-white text-sm">{movie.release_date || 'Đang cập nhật'}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-cinema-850/80 border border-cinema-700/60 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mb-1">
                <Film className="w-3.5 h-3.5 text-ruby-400" /> Ngôn ngữ
              </span>
              <strong className="text-white text-sm truncate block">{movie.language || 'Tiếng Việt'}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-cinema-850/80 border border-cinema-700/60 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mb-1">
                <Info className="w-3.5 h-3.5 text-amber-400" /> Giới hạn tuổi
              </span>
              <strong className="text-amber-400 text-sm">
                {movie.age_rating === 'P'
                  ? 'Phổ biến mọi lứa tuổi'
                  : movie.age_rating === 'K'
                  ? 'Dưới 13 tuổi có phụ huynh'
                  : `Cấm khán giả dưới ${String(movie.age_rating || 'T16').replace('T', '')} tuổi`}
              </strong>
            </div>
          </div>

          {/* Synopsis & Filmmakers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-4 h-4 text-ruby-500" /> Nội Dung Phim (Synopsis)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-cinema-850/60 p-4 rounded-2xl border border-cinema-700/50">
                {movie.description || 'Chưa có tóm tắt chi tiết cho bộ phim này.'}
              </p>
            </div>

            <div className="space-y-4 bg-cinema-850/60 p-4 rounded-2xl border border-cinema-700/50 text-xs">
              <div>
                <span className="text-slate-400 font-semibold flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-gold-400" /> Đạo diễn
                </span>
                <p className="font-bold text-white text-sm">{movieDirector}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold flex items-center gap-1 mb-1">
                  <Users className="w-3.5 h-3.5 text-gold-400" /> Diễn viên chính
                </span>
                <p className="font-medium text-slate-200 leading-snug">{movieCast}</p>
              </div>
            </div>
          </div>

          {/* Screening Schedules Section */}
          <div className="space-y-4 pt-4 border-t border-cinema-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-ruby-500" /> Suất Chiếu Trực Tiếp Của Phim
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chọn suất chiếu phù hợp để chuyển thẳng sang sơ đồ chọn ghế
                </p>
              </div>

              {/* Date Filter Pills */}
              {availableDates.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  <button
                    type="button"
                    onClick={() => setSelectedDate('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      selectedDate === 'all'
                        ? 'bg-ruby-600 text-white shadow-glow-red'
                        : 'bg-cinema-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Tất cả ({safeSchedules.length})
                  </button>
                  {availableDates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedDate === d
                          ? 'bg-ruby-600 text-white shadow-glow-red'
                          : 'bg-cinema-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Schedules List */}
            {loadingSchedules ? (
              <div className="py-8 text-center text-xs text-slate-400">Đang tải lịch chiếu trực tiếp...</div>
            ) : filteredSchedules.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-cinema-850/60 border border-cinema-700/60 space-y-3">
                <Ticket className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-slate-300 text-sm font-semibold">Hiện chưa có suất chiếu cho phim này.</p>
                <p className="text-slate-500 text-xs">Vui lòng quay lại sau hoặc khám phá các bộ phim khác đang có lịch chiếu tại rạp.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-200 text-xs font-bold border border-cinema-600 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <X className="w-4 h-4" /> Đóng / Chọn phim khác
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-cinema-850 hover:bg-cinema-800 border border-cinema-700/70 hover:border-ruby-500/60 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cinema-900 text-gold-400 font-mono border border-gold-500/30">
                          {s.room_name || `Phòng ${s.room_id}`}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400 font-mono">
                          {parseFloat(s.ticket_price || s.price || 90000).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="text-base font-black text-white group-hover:text-ruby-400 transition-colors">
                        {getTimeStr(s.start_time)}
                        <span className="text-xs text-slate-400 font-normal ml-2">
                          ~ {getTimeStr(s.end_time)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {getDateStr(s)} • {s.format || '2D'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose?.();
                        onSelectSchedule?.(s.id);
                      }}
                      className="w-full py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white text-xs font-bold transition-all shadow-glow-red flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" /> Đặt Vé Suất Này
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audience Reviews & Ratings Section */}
          <div className="space-y-4 pt-6 border-t border-cinema-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Đánh Giá & Nhận Xét Từ Khán Giả
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chia sẻ cảm nhận chân thực của bạn sau khi thưởng thức bộ phim
                </p>
              </div>

              {/* Rating summary pill */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-cinema-850 border border-cinema-700/80 self-start sm:self-auto">
                {displayRating ? (
                  <>
                    <div className="text-2xl font-black text-amber-400 font-mono flex items-center gap-1">
                      <span>{displayRating}</span>
                      <span className="text-xs text-slate-400 font-normal">/ 5</span>
                    </div>
                    <div className="text-left border-l border-cinema-700 pl-3">
                      <div className="flex items-center text-amber-400 text-xs">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= Math.round(Number(displayRating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{totalReviews} lượt đánh giá</div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 font-semibold py-1">
                    Chưa có đánh giá
                  </div>
                )}
              </div>
            </div>

            {/* Write a review form */}
            <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-cinema-850/80 border border-cinema-700/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300">Đánh giá của bạn:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-slate-500 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= (hoverRating || newRating)
                            ? 'text-amber-400 fill-amber-400 shadow-glow-amber'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold font-mono text-amber-400 ml-2">
                    {newRating === 5 ? 'Tuyệt vời 🌟' : newRating === 4 ? 'Rất hay 👍' : newRating === 3 ? 'Bình thường' : newRating === 2 ? 'Tạm được' : 'Không thích'}
                  </span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    isAuthenticated
                      ? 'Viết cảm nhận của bạn về diễn xuất, âm thanh, cốt truyện...'
                      : 'Đăng nhập để gửi nhận xét của bạn về bộ phim này...'
                  }
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-ruby-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between">
                {reviewMsg && <span className="text-xs text-emerald-400 font-bold">✓ {reviewMsg}</span>}
                {!reviewMsg && <span className="text-[10px] text-slate-500">Mọi bình luận đều được kiểm duyệt văn minh</span>}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white text-xs font-bold shadow-glow-red transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReview ? 'Đang gửi...' : 'Gửi Nhận Xét'}
                </button>
              </div>
            </form>

            {/* Reviews list */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {reviews.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  Chưa có nhận xét nào. Hãy là người đầu tiên đánh giá bộ phim này!
                </div>
              ) : (
                reviews.map((r, idx) => (
                  <div key={r.id || idx} className="p-3.5 rounded-xl bg-cinema-850/50 border border-cinema-700/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-ruby-600 to-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                          {r.user_name?.[0]?.toUpperCase() || 'K'}
                        </div>
                        <span className="text-xs font-bold text-white">{r.user_name || 'Khán giả'}</span>
                        {Boolean(r.is_verified_buyer) && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cinema-800 text-emerald-400 font-medium">
                            ✓ Đã xem rạp
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= (r.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-8">{r.comment || ''}</p>
                    <div className="text-[10px] text-slate-500 pl-8">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : ''}{' '}
                      {r.created_at ? new Date(r.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
