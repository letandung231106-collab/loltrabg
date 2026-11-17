import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useBooking } from '../../context/BookingContext';
import { Utensils, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, Check, Coffee, X, Clock } from 'lucide-react';

// Bảng ánh xạ ảnh đại diện phân biệt riêng cho từng món F&B
const ITEM_IMAGE_MAP = {
  1: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400', // Bắp phô mai Cheddar L
  2: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=400', // Bắp caramen ngọt L
  3: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400', // Coca-Cola tươi 32oz mát lạnh
  4: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=400', // Sprite tươi 32oz chanh tươi
  5: '/images/combo-don.jpg', // Combo Đơn (1 bắp L + 1 nước 32oz)
  6: '/images/combo-doi.jpg', // Combo Đôi Night Movie (1 bắp lớn 2 vị + 2 nước lớn + 1 snack khoai tây)
  7: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?q=80&w=400', // Xúc xích nướng phô mai
  8: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=400', // Kem trái cây
  9: '/images/egg-tart.jpg', // Bánh Tart Trứng Nướng
  10: '/images/bim-bim.jpg', // Bim Bim Khoai Tây Giòn Rụm
};

const CATEGORY_DEFAULT_IMAGES = {
  popcorn: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400',
  beverage: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400',
  combo: '/images/combo-doi.jpg',
  hot_food: 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?q=80&w=400',
  snack: '/images/bim-bim.jpg',
  dessert: '/images/egg-tart.jpg',
};

function getItemImage(item) {
  if (!item) return CATEGORY_DEFAULT_IMAGES.popcorn;
  // 1. Ánh xạ trực tiếp theo ID món
  if (ITEM_IMAGE_MAP[item.id]) {
    return ITEM_IMAGE_MAP[item.id];
  }
  // 2. Ảnh từ cơ sở dữ liệu nếu có và không phải ảnh trùng lặp cũ
  const raw = item.image || item.image_url;
  if (raw && typeof raw === 'string' && raw.trim() && !raw.includes('photo-1572177191856-3cde618dee1f') && !raw.includes('photo-1518173946687-a4c8a383392e')) {
    return raw.trim();
  }
  // 3. Nhận diện ngữ nghĩa theo tên món
  const name = (item.name || '').toLowerCase();
  if (name.includes('tart') || name.includes('trứng')) return ITEM_IMAGE_MAP[9];
  if (name.includes('bim bim') || name.includes('khoai tây') || name.includes('chips')) return ITEM_IMAGE_MAP[10];
  if (name.includes('sprite')) return ITEM_IMAGE_MAP[4];
  if (name.includes('coca') || name.includes('pepsi') || name.includes('nước ngọt')) return ITEM_IMAGE_MAP[3];
  if (name.includes('caramen') || name.includes('caramel')) return ITEM_IMAGE_MAP[2];
  if (name.includes('đôi') || name.includes('combo đôi')) return ITEM_IMAGE_MAP[6];
  if (name.includes('combo')) return ITEM_IMAGE_MAP[5];
  if (name.includes('xúc xích') || name.includes('hotdog')) return ITEM_IMAGE_MAP[7];
  if (name.includes('phô mai') || name.includes('bắp')) return ITEM_IMAGE_MAP[1];
  if (name.includes('kem')) return ITEM_IMAGE_MAP[8];

  // 4. Mặc định theo danh mục
  return CATEGORY_DEFAULT_IMAGES[item.category] || CATEGORY_DEFAULT_IMAGES.popcorn;
}

export function ConcessionSelectionModal({
  isOpen,
  onClose,
  onProceed,
  selectedSeatsCount = 0,
}) {
  const { formattedHoldTime, holdRemainingSeconds, isHolding } = useBooking();
  const [items, setItems] = useState([]);
  const [selectedConcessions, setSelectedConcessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  // Tự động đóng modal và hủy khi hết thời gian giữ ghế 10 phút
  useEffect(() => {
    if (isOpen && (!isHolding || (holdRemainingSeconds !== null && holdRemainingSeconds <= 0))) {
      onClose?.();
    }
  }, [isOpen, isHolding, holdRemainingSeconds, onClose]);

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

  useEffect(() => {
    if (isOpen) {
      fetchConcessions();
    }
  }, [isOpen]);

  const fetchConcessions = async () => {
    setLoading(true);
    try {
      const res = await api.getConcessions();
      if (res && res.success && Array.isArray(res.data)) {
        setItems(res.data.filter((item) => item.is_active));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Lỗi tải bắp nước:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleUpdateQuantity = (item, delta) => {
    setSelectedConcessions((prev) => {
      const currentQty = prev[item.id]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: {
          ...item,
          quantity: newQty,
        },
      };
    });
  };

  const selectedList = Object.values(selectedConcessions);
  const totalConcessionAmount = selectedList.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const totalConcessionCount = selectedList.reduce((sum, item) => sum + Number(item.quantity || 1), 0);

  const categories = [
    { id: 'all', label: 'Tất cả' },
    { id: 'combo', label: '🍿 Combo Tiết Kiệm' },
    { id: 'popcorn', label: 'Bắp Rang' },
    { id: 'beverage', label: 'Nước Ngọt' },
    { id: 'hot_food', label: 'Snack & Đồ Ăn' },
  ];

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

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
        {/* Nút Đóng (X) cố định ở góc trên bên phải, kích thước rõ ràng 36x36px */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Đóng (phím ESC)"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 bg-cinema-950/80 border-b border-cinema-800 flex items-center justify-between shrink-0 pr-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Chọn Bắp Nước & Combo
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Ưu đãi rạp
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Thưởng thức trọn vẹn bộ phim cùng bắp rang thơm ngon & nước ngọt mát lạnh
              </p>
            </div>
          </div>
        </div>

        {/* 10-Minute Seat Hold Countdown Bar */}
        <div className="mx-6 mt-3 px-4 py-2 rounded-xl bg-blue-950/50 border border-blue-500/40 text-blue-200 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Thời gian giữ ghế tạm thời còn lại:</span>
          </div>
          <span className="font-mono text-sm font-black text-amber-400 tracking-wider">
            {typeof formattedHoldTime === 'function' ? formattedHoldTime() : '10:00'}
          </span>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-2.5 bg-cinema-900/60 border-b border-cinema-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-cinema-950 shadow-glow-amber'
                  : 'bg-cinema-800 text-slate-300 hover:text-white hover:bg-cinema-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Items List Body */}
        <div
          className="modal-body flex-1 overflow-y-auto p-6 space-y-3"
          style={{
            overflowY: 'auto',
            flex: 1,
            padding: '24px',
          }}
        >
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Đang tải danh sách bắp nước...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">Không tìm thấy món nào thuộc danh mục này.</div>
          ) : (
            filteredItems.map((item) => {
              const qty = selectedConcessions[item.id]?.quantity || 0;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-cinema-850/80 border border-cinema-700/60 hover:border-amber-500/50 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-cinema-950 border border-cinema-800 shrink-0">
                      <img
                        src={getItemImage(item)}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getItemImage({ ...item, image: '', image_url: '' });
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-white text-sm truncate">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                      <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                        {Number(item.price || 0).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {qty > 0 ? (
                      <div className="flex items-center gap-2 bg-cinema-900 border border-cinema-700 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item, -1)}
                          className="w-7 h-7 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-mono font-black text-amber-400 text-sm">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item, 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-cinema-950 flex items-center justify-center font-bold text-sm cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, 1)}
                        className="px-3.5 py-1.5 rounded-xl bg-cinema-800 hover:bg-amber-500 hover:text-cinema-950 text-slate-300 font-bold text-xs border border-cinema-700 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Proceed */}
        <div className="p-4 sm:p-5 bg-cinema-950/90 border-t border-cinema-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-xs text-slate-400">
              Đã chọn: <strong className="text-white">{totalConcessionCount} món</strong>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
              +{totalConcessionAmount.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onProceed([])}
              className="px-4 py-2.5 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-cinema-700"
            >
              Bỏ qua (Không mua bắp nước)
            </button>
            <button
              type="button"
              onClick={() => onProceed(selectedList)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white text-xs font-bold shadow-glow-red transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Tiếp tục thanh toán <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
