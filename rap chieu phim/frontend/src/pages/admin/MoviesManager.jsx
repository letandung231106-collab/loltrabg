import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import {
  Film,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Check,
  Clock,
  Calendar,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Play,
  FileVideo,
  Sparkles,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';

export function MoviesManager() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Upload/Input Modes
  const [posterMode, setPosterMode] = useState('upload'); // 'upload' | 'url'
  const [trailerMode, setTrailerMode] = useState('url'); // 'url' | 'upload'
  const [posterFileName, setPosterFileName] = useState('');
  const [trailerFileName, setTrailerFileName] = useState('');
  const [isPreviewTrailerOpen, setIsPreviewTrailerOpen] = useState(false);

  const releaseDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);
  const posterFileInputRef = useRef(null);
  const trailerFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    genre: 'Hành động',
    director: '',
    actors: '',
    duration: 120,
    release_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    age_rating: 'T16',
    language: 'Tiếng Việt - Phụ đề',
    format: '2D Digital',
    description: '',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800',
    trailer: '',
    status: 'now_showing',
  });

  useEffect(() => {
    fetchMovies();
  }, [statusFilter, search]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await api.getMovies({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
      });
      if (res.success) setMovies(res.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải phim.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingMovie(null);
    setPosterMode('upload');
    setTrailerMode('url');
    setPosterFileName('');
    setTrailerFileName('');
    setFormData({
      name: '',
      genre: 'Hành động, Phiêu lưu',
      director: '',
      actors: '',
      duration: 120,
      release_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      age_rating: 'T16',
      language: 'Tiếng Việt - Phụ đề',
      format: '2D Digital, IMAX 2D',
      description: '',
      poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800',
      trailer: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      status: 'now_showing',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    // Determine poster mode based on current value
    const isBase64Poster = movie.poster && movie.poster.startsWith('data:image');
    setPosterMode(isBase64Poster ? 'upload' : 'upload');
    setPosterFileName(isBase64Poster ? 'Ảnh poster hiện tại (Base64)' : '');

    // Determine trailer mode
    const isDirectVideo = movie.trailer && (movie.trailer.startsWith('data:video') || movie.trailer.startsWith('blob:') || movie.trailer.match(/\.(mp4|webm|ogg|mov)/i));
    setTrailerMode(isDirectVideo ? 'upload' : 'url');
    setTrailerFileName(isDirectVideo ? 'Video trailer đã tải lên' : '');

    setFormData({
      name: movie.name,
      genre: movie.genre,
      director: movie.director,
      actors: movie.actors,
      duration: movie.duration,
      release_date: movie.release_date ? movie.release_date.slice(0, 10) : '',
      end_date: movie.end_date ? movie.end_date.slice(0, 10) : '',
      age_rating: movie.age_rating,
      language: movie.language,
      format: movie.format,
      description: movie.description,
      poster: movie.poster,
      trailer: movie.trailer || '',
      status: movie.status,
    });
    setModalOpen(true);
  };

  // Handle Poster File Upload (Convert to Base64)
  const handlePosterFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP, AVIF).');
      return;
    }

    // Limit 8MB for image
    if (file.size > 8 * 1024 * 1024) {
      alert('Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 8MB.');
      return;
    }

    setPosterFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, poster: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Trailer Video File Upload (Convert to Base64/Blob)
  const handleTrailerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Vui lòng chọn một tệp video hợp lệ (MP4, WebM, QuickTime, MKV).');
      return;
    }

    // Limit 45MB for video
    if (file.size > 45 * 1024 * 1024) {
      alert('Kích thước video vượt quá 45MB! Vui lòng chọn video ngắn gọn hoặc dán Link YouTube.');
      return;
    }

    setTrailerFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, trailer: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Quick Date Helpers
  const addDaysToDate = (baseDateStr, days) => {
    const base = baseDateStr ? new Date(baseDateStr) : new Date();
    const target = new Date(base.getTime() + days * 86400000);
    return target.toISOString().slice(0, 10);
  };

  const formatVietnameseDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.poster) {
      setMsg({ text: 'Vui lòng tải lên ảnh poster cho phim.', type: 'error' });
      return;
    }

    try {
      if (editingMovie) {
        await api.updateMovie(editingMovie.id, formData);
        setMsg({ text: 'Cập nhật phim thành công!', type: 'success' });
      } else {
        await api.createMovie(formData);
        setMsg({ text: 'Thêm phim mới thành công!', type: 'success' });
      }
      setModalOpen(false);
      fetchMovies();
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi lưu phim.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ phim này?')) return;
    try {
      const res = await api.deleteMovie(id);
      if (res.success) {
        setMsg({ text: res.message || 'Đã xóa phim thành công.', type: 'success' });
        fetchMovies();
      }
    } catch (err) {
      setMsg({ text: err.message || 'Không thể xóa phim.', type: 'error' });
    }
  };

  const isDirectVideoTrailer =
    formData.trailer &&
    (formData.trailer.startsWith('data:video') ||
      formData.trailer.startsWith('blob:') ||
      formData.trailer.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Film className="w-7 h-7 text-ruby-500" /> Quản Lý Danh Mục Phim
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thêm mới, chỉnh sửa thông tin phim, ngày khởi chiếu lịch trực quan, tải ảnh poster và video trailer
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Thêm Phim Mới
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

      {/* Filter Row */}
      <div className="p-4 glass-panel rounded-2xl border border-cinema-700/60 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên phim, đạo diễn..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none"
          >
            <option value="all">Tất cả ({movies.length})</option>
            <option value="now_showing">Đang chiếu</option>
            <option value="coming_soon">Sắp chiếu</option>
            <option value="ended">Ngừng chiếu</option>
            <option value="archived">Lưu trữ</option>
          </select>
        </div>
      </div>

      {/* Movies Table */}
      <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
              <tr>
                <th className="p-4">Poster & Phim</th>
                <th className="p-4">Thể loại</th>
                <th className="p-4">Thời lượng</th>
                <th className="p-4">Khởi chiếu</th>
                <th className="p-4">Định dạng</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800">
              {movies.map((m) => (
                <tr key={m.id} className="hover:bg-cinema-850/60 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.poster}
                        alt={m.name}
                        className="w-11 h-16 object-cover rounded-lg border border-cinema-700 shadow-sm shrink-0 bg-cinema-900"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800';
                        }}
                      />
                      <div>
                        <div className="font-bold text-white text-sm">{m.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {m.director} • <span className="text-ruby-400 font-bold">{m.age_rating}</span>
                        </div>
                        {m.trailer && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                            <Play className="w-3 h-3 fill-emerald-400" /> Có Video Trailer
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">{m.genre}</td>
                  <td className="p-4 text-slate-300">{m.duration} phút</td>
                  <td className="p-4 text-slate-300">
                    <div className="font-medium text-white">{formatVietnameseDate(m.release_date?.slice(0, 10))}</div>
                    <div className="text-[10px] text-slate-500">Đến: {m.end_date?.slice(0, 10)}</div>
                  </td>
                  <td className="p-4 text-amber-400 font-mono font-semibold">{m.format}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      m.status === 'now_showing' ? 'bg-emerald-950 text-emerald-400 border border-emerald-600' :
                      m.status === 'coming_soon' ? 'bg-blue-950 text-blue-400 border border-blue-600' : 'bg-cinema-800 text-slate-400'
                    }`}>
                      {m.status === 'now_showing' ? 'Đang chiếu' : m.status === 'coming_soon' ? 'Sắp chiếu' : 'Lưu trữ'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300 hover:text-white transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg bg-cinema-800 hover:bg-rose-900 text-rose-400 hover:text-rose-200 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa Phim */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600 overflow-y-auto max-h-[92vh]">
            <div className="flex items-center justify-between pb-4 border-b border-cinema-700">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-ruby-500" />
                  {editingMovie ? `Chỉnh Sửa Phim: ${editingMovie.name}` : 'Thêm Phim Mới Vào Rạp'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cập nhật ngày chiếu qua lịch, tải ảnh poster trực tiếp từ máy tính và chèn video/link trailer
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl bg-cinema-800 text-slate-400 hover:text-white hover:bg-cinema-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4 text-xs">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-200 mb-1">Tên phim *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên phim chính xác (ví dụ: Dune: Hành Tinh Cát 2)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white font-medium focus:outline-none focus:border-ruby-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Thể loại *</label>
                  <input
                    type="text"
                    required
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="Hành động, Viễn tưởng, Phiêu lưu..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Thời lượng (Phút) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Đạo diễn</label>
                  <input
                    type="text"
                    value={formData.director}
                    onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                    placeholder="Tên đạo diễn..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Diễn viên</label>
                  <input
                    type="text"
                    value={formData.actors}
                    onChange={(e) => setFormData({ ...formData, actors: e.target.value })}
                    placeholder="Danh sách diễn viên chính..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                  />
                </div>

                {/* --- NGÀY KHỞI CHIẾU (CHỌN LỊCH) --- */}
                <div className="p-3 rounded-2xl bg-cinema-900/80 border border-cinema-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-ruby-400" /> Ngày khởi chiếu *
                    </label>
                    <span className="text-[10px] text-ruby-400 font-mono font-bold">
                      {formatVietnameseDate(formData.release_date)}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      ref={releaseDateInputRef}
                      type="date"
                      required
                      value={formData.release_date}
                      onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-950 border border-cinema-700 text-white font-mono text-xs focus:outline-none focus:border-ruby-500 cursor-pointer [color-scheme:dark]"
                    />
                    <button
                      type="button"
                      onClick={() => releaseDateInputRef.current?.showPicker?.()}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-ruby-400 transition-colors"
                      title="Mở bảng lịch"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Shortcut Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Chọn nhanh:</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, release_date: new Date().toISOString().slice(0, 10) })}
                      className="px-2 py-0.5 rounded-md bg-cinema-800 hover:bg-cinema-700 text-[10px] text-slate-300 transition-colors"
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, release_date: addDaysToDate(new Date().toISOString(), 7) })}
                      className="px-2 py-0.5 rounded-md bg-cinema-800 hover:bg-cinema-700 text-[10px] text-slate-300 transition-colors"
                    >
                      Tuần sau
                    </button>
                  </div>
                </div>

                {/* --- NGÀY KẾT THÚC (CHỌN LỊCH) --- */}
                <div className="p-3 rounded-2xl bg-cinema-900/80 border border-cinema-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gold-400" /> Ngày kết thúc chiếu *
                    </label>
                    <span className="text-[10px] text-gold-400 font-mono font-bold">
                      {formatVietnameseDate(formData.end_date)}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      ref={endDateInputRef}
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-950 border border-cinema-700 text-white font-mono text-xs focus:outline-none focus:border-ruby-500 cursor-pointer [color-scheme:dark]"
                    />
                    <button
                      type="button"
                      onClick={() => endDateInputRef.current?.showPicker?.()}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-gold-400 transition-colors"
                      title="Mở bảng lịch"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Shortcut Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Thời hạn:</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, end_date: addDaysToDate(formData.release_date, 30) })}
                      className="px-2 py-0.5 rounded-md bg-cinema-800 hover:bg-cinema-700 text-[10px] text-slate-300 transition-colors"
                    >
                      +1 Tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, end_date: addDaysToDate(formData.release_date, 60) })}
                      className="px-2 py-0.5 rounded-md bg-cinema-800 hover:bg-cinema-700 text-[10px] text-slate-300 transition-colors"
                    >
                      +2 Tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, end_date: addDaysToDate(formData.release_date, 90) })}
                      className="px-2 py-0.5 rounded-md bg-cinema-800 hover:bg-cinema-700 text-[10px] text-slate-300 transition-colors"
                    >
                      +3 Tháng
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Độ tuổi khán giả</label>
                  <select
                    value={formData.age_rating}
                    onChange={(e) => setFormData({ ...formData, age_rating: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="P">P - Phổ biến mọi lứa tuổi</option>
                    <option value="K">K - Dưới 13 tuổi có người kèm</option>
                    <option value="T13">T13 - Khán giả từ 13 tuổi trở lên</option>
                    <option value="T16">T16 - Khán giả từ 16 tuổi trở lên</option>
                    <option value="T18">T18 - Khán giả từ 18 tuổi trở lên</option>
                    <option value="C">C - Cấm phổ biến</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Trạng thái phát hành</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="now_showing">Đang chiếu (Now Showing)</option>
                    <option value="coming_soon">Sắp chiếu (Coming Soon)</option>
                    <option value="ended">Ngừng chiếu (Ended)</option>
                    <option value="archived">Lưu trữ (Archived)</option>
                  </select>
                </div>
              </div>

              {/* --- POSTER (TẢI ẢNH TỪ MÁY TÍNH / URL) --- */}
              <div className="p-4 rounded-2xl bg-cinema-900/90 border border-cinema-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-extrabold text-white text-xs flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-ruby-400" /> Poster Phim *
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Chọn tải ảnh trực tiếp từ máy tính (PNG, JPG, WEBP) hoặc chèn Link URL
                    </p>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex items-center p-1 rounded-xl bg-cinema-950 border border-cinema-800">
                    <button
                      type="button"
                      onClick={() => setPosterMode('upload')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                        posterMode === 'upload'
                          ? 'bg-ruby-600 text-white shadow-glow-red'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Tải Ảnh Lên
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosterMode('url')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                        posterMode === 'url'
                          ? 'bg-ruby-600 text-white shadow-glow-red'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> Nhập Link URL
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-start">
                  {/* Left: Upload / URL Input */}
                  <div className="flex-1 w-full space-y-2">
                    {posterMode === 'upload' ? (
                      <div>
                        <input
                          ref={posterFileInputRef}
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp, image/avif"
                          onChange={handlePosterFileChange}
                          onClick={(e) => { e.target.value = null; }}
                          className="hidden"
                        />
                        <div
                          onClick={() => posterFileInputRef.current?.click()}
                          className="border-2 border-dashed border-cinema-700 hover:border-ruby-500/80 bg-cinema-950/60 hover:bg-cinema-850/50 rounded-2xl p-5 text-center cursor-pointer transition-all group"
                        >
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-ruby-600/20 text-ruby-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div className="font-bold text-white text-xs mb-1">
                            Nhấn để chọn ảnh từ máy tính
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Hỗ trợ PNG, JPG, JPEG, WEBP (Tối đa 8MB)
                          </div>
                          {posterFileName && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold">
                              <Check className="w-3 h-3" /> {posterFileName}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <input
                          type="url"
                          value={formData.poster}
                          onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-950 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                        />
                        <div className="text-[10px] text-slate-500">
                          Dán đường dẫn ảnh trực tiếp từ internet (Unsplash, TMDB, CDN...)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Poster Preview Box */}
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden border-2 border-cinema-700 bg-cinema-950 shadow-md relative group">
                      {formData.poster ? (
                        <img
                          src={formData.poster}
                          alt="Poster Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px]">
                          <ImageIcon className="w-6 h-6 mb-1" /> Chưa có ảnh
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] space-y-1">
                      <div className="font-bold text-white">Xem trước Poster</div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Chuẩn tỷ lệ 2:3
                      </div>
                      {posterMode === 'upload' && formData.poster && (
                        <button
                          type="button"
                          onClick={() => posterFileInputRef.current?.click()}
                          className="text-[10px] text-ruby-400 hover:text-ruby-300 font-bold underline block pt-1"
                        >
                          Đổi ảnh khác
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- TRAILER (LINK YOUTUBE HOẶC TẢI VIDEO) --- */}
              <div className="p-4 rounded-2xl bg-cinema-900/90 border border-cinema-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <label className="font-extrabold text-white text-xs flex items-center gap-2">
                      <Video className="w-4 h-4 text-ruby-400" /> Trailer Phim (Link hoặc Video)
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Hỗ trợ dán Link YouTube hoặc tải trực tiếp tệp Video (.mp4, .webm) từ máy tính
                    </p>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex items-center p-1 rounded-xl bg-cinema-950 border border-cinema-800">
                    <button
                      type="button"
                      onClick={() => setTrailerMode('url')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                        trailerMode === 'url'
                          ? 'bg-ruby-600 text-white shadow-glow-red'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> Link YouTube / URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrailerMode('upload')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                        trailerMode === 'upload'
                          ? 'bg-ruby-600 text-white shadow-glow-red'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileVideo className="w-3.5 h-3.5" /> Tải Video Tệp
                    </button>
                  </div>
                </div>

                {trailerMode === 'url' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="url"
                        value={formData.trailer}
                        onChange={(e) => setFormData({ ...formData, trailer: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                        className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-cinema-950 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500 font-mono text-xs"
                      />
                      <Play className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ruby-500" />
                      {formData.trailer && (
                        <button
                          type="button"
                          onClick={() => setIsPreviewTrailerOpen(!isPreviewTrailerOpen)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-ruby-600/80 hover:bg-ruby-600 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Xem thử
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={trailerFileInputRef}
                      type="file"
                      accept="video/mp4, video/webm, video/ogg, video/quicktime"
                      onChange={handleTrailerFileChange}
                      onClick={(e) => { e.target.value = null; }}
                      className="hidden"
                    />
                    <div
                      onClick={() => trailerFileInputRef.current?.click()}
                      className="border-2 border-dashed border-cinema-700 hover:border-ruby-500/80 bg-cinema-950/60 hover:bg-cinema-850/50 rounded-2xl p-4 text-center cursor-pointer transition-all group"
                    >
                      <div className="w-10 h-10 mx-auto rounded-xl bg-ruby-600/20 text-ruby-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                        <FileVideo className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-white text-xs">
                        Nhấn để chọn tệp Video Trailer từ máy tính
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Định dạng: MP4, WebM, MOV (Tối đa 45MB)
                      </div>
                      {trailerFileName && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold">
                          <Check className="w-3 h-3" /> {trailerFileName}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Video / Trailer Live Mini Player */}
                {formData.trailer && (
                  <div className="p-3 rounded-xl bg-cinema-950 border border-cinema-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5 text-ruby-400" /> Trình phát Trailer xem trước
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, trailer: '' });
                          setTrailerFileName('');
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        Xóa Trailer
                      </button>
                    </div>

                    {isDirectVideoTrailer ? (
                      <div className="rounded-xl overflow-hidden aspect-video bg-black max-h-48">
                        <video
                          src={formData.trailer}
                          controls
                          className="w-full h-full object-contain"
                        >
                          Trình duyệt không hỗ trợ thẻ video.
                        </video>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 bg-cinema-900/80 p-2 rounded-lg flex items-center justify-between">
                        <span className="truncate max-w-md font-mono text-[10px]">{formData.trailer}</span>
                        <span className="text-emerald-400 font-bold shrink-0">✓ Link hợp lệ</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-200 mb-1">Tóm tắt nội dung phim</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nội dung tóm tắt cốt truyện phim..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700 hover:text-white font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-700 hover:from-ruby-500 hover:to-rose-600 text-white font-bold shadow-glow-red transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Lưu Thông Tin Phim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
