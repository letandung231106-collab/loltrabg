import React from 'react';
import { X, Play } from 'lucide-react';

export function TrailerModal({ isOpen, onClose, trailerUrl, movieName }) {
  if (!isOpen) return null;

  const isDirectVideo =
    trailerUrl &&
    (trailerUrl.startsWith('data:video') ||
      trailerUrl.startsWith('blob:') ||
      trailerUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i));

  // Extract YouTube ID if valid
  const getEmbedUrl = (url) => {
    if (!url) return 'https://www.youtube.com/embed/Way9Dexny3w';
    if (url.includes('embed/')) return url;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl glass-panel rounded-3xl overflow-hidden shadow-2xl border border-cinema-600">
        <div className="flex items-center justify-between p-4 bg-cinema-900 border-b border-cinema-700">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Play className="w-4 h-4 text-ruby-500 fill-ruby-500" /> Trailer Phim: {movieName}
          </h4>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cinema-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative pt-[56.25%] bg-black">
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
              title={movieName}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
