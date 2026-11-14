import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Utensils, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, Check, Coffee } from 'lucide-react';

export function ConcessionSelectionModal({
  isOpen,
  onClose,
  onProceed,
  selectedSeatsCount = 0,
}) {
  const [items, setItems] = useState([]);
  const [selectedConcessions, setSelectedConcessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchConcessions();
    }
  }, [isOpen]);

  const fetchConcessions = async () => {
    setLoading(true);
    try {
      const res = await api.getConcessions();
      if (res.success && res.data) {
        setItems(res.data.filter((item) => item.is_active));
      }
    } catch (err) {
      console.error('Lỗi tải bắp nước:', err);
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
  const totalConcessionAmount = selectedList.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalConcessionCount = selectedList.reduce((sum, item) => sum + item.quantity, 0);

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-cinema-900 border border-cinema-700/80 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-cinema-950/80 border-b border-cinema-800 flex items-center justify-between shrink-0">
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
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-cinema-800 text-xs font-semibold"
          >
            Bỏ qua
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-2.5 bg-cinema-900/60 border-b border-cinema-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-cinema-800/60 text-slate-400 hover:text-white hover:bg-cinema-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              Đang tải danh mục bắp nước...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có món nào trong danh mục này.
            </div>
          ) : (
            filteredItems.map((item) => {
              const currentQty = selectedConcessions[item.id]?.quantity || 0;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    currentQty > 0
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                      : 'bg-cinema-850/60 border-cinema-700/50 hover:border-cinema-600'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400'}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-cinema-700 bg-cinema-950"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                        {item.category === 'combo' && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                            HOT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description || 'Món ăn kèm thơm ngon'}</p>
                      <div className="text-amber-400 font-extrabold text-sm mt-1">
                        {Number(item.price).toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-2 shrink-0">
                    {currentQty > 0 ? (
                      <div className="flex items-center gap-2 bg-cinema-950 border border-cinema-700 rounded-xl p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item, -1)}
                          className="w-7 h-7 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-bold text-white text-sm font-mono">
                          {currentQty}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item, 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center transition-colors shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpdateQuantity(item, 1)}
                        className="px-3.5 py-2 rounded-xl bg-cinema-800 hover:bg-amber-600 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-cinema-700 hover:border-amber-500 shadow-sm"
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
            <div className="text-base sm:text-lg font-black text-amber-400">
              +{totalConcessionAmount.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onProceed([])}
              className="px-4 py-2.5 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-300 text-xs font-bold transition-all"
            >
              Không mua bắp nước
            </button>
            <button
              onClick={() => onProceed(selectedList)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white text-xs font-bold shadow-glow-red transition-all flex items-center gap-1.5"
            >
              Tiếp tục thanh toán <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
