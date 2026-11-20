import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Play } from 'lucide-react';

export function TrailerModal({ isOpen, onClose, trailerUrl, movieName }) {
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

  // Cơ chế 2: Khóa cuộn trang nền khi mở Modal và dọn dẹp sạch khi đóng / unmount
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDirectVideo =
    trailerUrl &&
    typeof trailerUrl === 'string' &&
    (trailerUrl.startsWith('data:video') ||
      trailerUrl.startsWith('blob:') ||
      trailerUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i));

  // Extract YouTube ID if valid
  const getEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return 'https://www.youtube.com/embed/Way9Dexny3w';
    if (url.includes('youtube.com/embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

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
        {/* Nút Đóng (X) cố định ở góc trên bên phải, kích thước 36x36px, viền sáng dễ nhìn */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Đóng (phím ESC)"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-cinema-900 border-b border-cinema-700/80 pr-14 shrink-0">
          <h4 className="font-bold text-white text-sm flex items-center gap-2 truncate">
            <Play className="w-4 h-4 text-ruby-500 fill-ruby-500 shrink-0" />
            <span>Trailer Phim: {movieName || 'Chiếu Rạp'}</span>
          </h4>
        </div>

        {/* Video Player */}
        <div className="relative pt-[56.25%] bg-black w-full flex-1">
          {isDirectVideo ? (
            <video
              src={trailerUrl}
              controls
              autoPlay
              className="absolute inset-0 w-full h-full object-contain bg-black"
            >
              Trình duyệt của bạn không hỗ trợ phát video HTML5.
            </video>
          ) : (
            <iframe
              src={getEmbedUrl(trailerUrl)}
              title={movieName || 'Trailer Phim'}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
