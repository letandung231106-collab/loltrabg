import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Play,
  Calendar,
  Clock,
  Film,
  Sparkles,
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
  const [averageRating, setAverageRating] = useState(5.0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    if (isOpen && movie?.id) {
      fetchMovieSchedules(movie.id);
      fetchMovieReviews(movie.id);
      setIsPlayingTrailer(false);
      setReviewMsg('');
      setNewComment('');
      setNewRating(5);
    }
  }, [isOpen, movie]);

  const fetchMovieSchedules = async (movieId) => {
    setLoadingSchedules(true);
    try {
      const res = await api.getSchedules({ movie_id: movieId, status: 'scheduled' });
      if (res.success && res.data) {
        setSchedules(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải lịch chiếu phim:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const fetchMovieReviews = async (movieId) => {
    try {
      const res = await api.getMovieReviews(movieId);
      if (res.success && res.data) {
        setReviews(res.data.reviews || []);
        setAverageRating(res.data.averageRating || 5.0);
        setTotalReviews(res.data.totalReviews || 0);
      }
    } catch (err) {
      console.warn('Lỗi tải đánh giá phim:', err);
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
      if (res.success && res.data) {
        setReviews((prev) => [res.data, ...prev]);
        setTotalReviews((prev) => prev + 1);
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

  // Convert standard YouTube watch link to embed link
  const getEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  const embedUrl = getEmbedUrl(movie.trailer);

  // Group schedules by Date
  const availableDates = Array.from(
    new Set(schedules.map((s) => s.start_time.split('T')[0] || s.start_time.split(' ')[0]))
  );

  const filteredSchedules = schedules.filter((s) => {
    if (selectedDate === 'all') return true;
    const sDate = s.start_time.split('T')[0] || s.start_time.split(' ')[0];
    return sDate === selectedDate;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-cinema-900 border border-cinema-700/80 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header / Backdrop banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden shrink-0 bg-cinema-950">
          {isPlayingTrailer && embedUrl ? (
            <iframe
              src={embedUrl}
              title={`Trailer: ${movie.name}`}
              className="w-full h-full object-cover"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src={movie.poster}
                alt={movie.name}
                className="w-full h-full object-cover filter brightness-[0.65] blur-sm scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 via-cinema-900/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-cinema-900 via-transparent to-cinema-900" />

              {/* Poster thumbnail inside banner */}
              <div className="absolute bottom-4 left-6 flex items-end gap-5">
                <img
                  src={movie.poster}
                  alt={movie.name}
                  className="w-24 sm:w-32 aspect-[2/3] object-cover rounded-2xl border-2 border-ruby-500 shadow-glow-red shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800';
                  }}
                />
                <div className="space-y-1.5 pb-1">
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
                  <h2 className="text-xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                    {movie.name}
                  </h2>
                  <p className="text-xs text-ruby-400 font-semibold">{movie.genre}</p>
                </div>
              </div>

              {/* Play Trailer Floating Button */}
              {movie.trailer && (
                <button
                  onClick={() => setIsPlayingTrailer(true)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-2.5 rounded-full bg-ruby-600/90 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red flex items-center gap-2 backdrop-blur-sm transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-white" /> Xem Trailer Phim
                </button>
              )}
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-black/60 hover:bg-ruby-600 text-white backdrop-blur-sm transition-colors z-10 border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-cinema-850 border border-cinema-700/60 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-ruby-400" /> Thời lượng
              </span>
              <strong className="text-white text-sm">{movie.duration} phút</strong>
            </div>

            <div className="p-3 rounded-2xl bg-cinema-850 border border-cinema-700/60 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-ruby-400" /> Ngày khởi chiếu
              </span>
              <strong className="text-white text-sm">{movie.release_date}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-cinema-850 border border-cinema-700/60 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mb-1">
                <Film className="w-3.5 h-3.5 text-ruby-400" /> Ngôn ngữ
              </span>
              <strong className="text-white text-sm truncate block">{movie.language || 'Tiếng Việt'}</strong>
            </div>

            <div className="p-3 rounded-2xl bg-cinema-850 border border-cinema-700/60 text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1 mb-1">
                <Info className="w-3.5 h-3.5 text-amber-400" /> Giới hạn tuổi
              </span>
              <strong className="text-amber-400 text-sm">
                {movie.age_rating === 'P'
                  ? 'Phổ biến mọi lứa tuổi'
                  : movie.age_rating === 'K'
                  ? 'Dưới 13 tuổi có phụ huynh'
                  : `Cấm khán giả dưới ${movie.age_rating?.replace('T', '')} tuổi`}
              </strong>
            </div>
          </div>

          {/* Synopsis & Filmmakers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-ruby-500" /> Nội Dung Phim (Synopsis)
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
                <p className="font-bold text-white text-sm">{movie.director || 'Đang cập nhật'}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold flex items-center gap-1 mb-1">
                  <Users className="w-3.5 h-3.5 text-gold-400" /> Diễn viên chính
                </span>
                <p className="font-medium text-slate-200 leading-snug">{movie.actors || 'Đang cập nhật'}</p>
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
                    onClick={() => setSelectedDate('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      selectedDate === 'all'
                        ? 'bg-ruby-600 text-white shadow-glow-red'
                        : 'bg-cinema-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Tất cả ({schedules.length})
                  </button>
                  {availableDates.map((d) => (
                    <button
                      key={d}
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
              <div className="p-6 text-center rounded-2xl bg-cinema-850/60 border border-cinema-700/60">
                <Ticket className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-xs">Hiện chưa có suất chiếu được lên lịch cho bộ phim này.</p>
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
                        {s.start_time.split('T')[1]?.slice(0, 5) || s.start_time.split(' ')[1]?.slice(0, 5)}
                        <span className="text-xs text-slate-400 font-normal ml-2">
                          ~ {s.end_time?.split('T')[1]?.slice(0, 5) || s.end_time?.split(' ')[1]?.slice(0, 5)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {s.start_time.split('T')[0] || s.start_time.split(' ')[0]} • {s.format}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectSchedule(s.id);
                      }}
                      className="w-full py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white text-xs font-bold transition-all shadow-glow-red flex items-center justify-center gap-1.5"
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
                <div className="text-2xl font-black text-amber-400 font-mono flex items-center gap-1">
                  <span>{averageRating.toFixed(1)}</span>
                  <span className="text-xs text-slate-400 font-normal">/ 5</span>
                </div>
                <div className="text-left border-l border-cinema-700 pl-3">
                  <div className="flex items-center text-amber-400 text-xs">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{totalReviews} lượt đánh giá</div>
                </div>
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
                  className="px-4 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white text-xs font-bold shadow-glow-red transition-all flex items-center gap-1.5 ml-auto"
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
                              star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-8">{r.comment}</p>
                    <div className="text-[10px] text-slate-500 pl-8">
                      {new Date(r.created_at).toLocaleDateString('vi-VN')} {new Date(r.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
}
