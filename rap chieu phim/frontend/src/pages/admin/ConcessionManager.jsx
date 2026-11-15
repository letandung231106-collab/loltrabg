import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import {
  Utensils,
  Plus,
  Edit2,
  Trash2,
  Search,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
  DollarSign,
  Package,
  Layers,
  UploadCloud,
  Image as ImageIcon,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Zap
} from 'lucide-react';
import { ModalPortal } from '../../components/common/ModalPortal';

export function ConcessionManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'menu'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // POS Cart State
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'qr'
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  // Product Quick-Select Modal State
  const [selectedProductModal, setSelectedProductModal] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // VietQR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedStk, setCopiedStk] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [qrOrderCode, setQrOrderCode] = useState(() => `NIGHTMOVIE POS ${Math.floor(100000 + Math.random() * 900000)}`);

  useEffect(() => {
    if (paymentMethod !== 'cash' && paymentMethod !== 'qr') {
      setPaymentMethod('cash');
    }
  }, [paymentMethod]);

  // ESC key listener to close active modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        setSelectedProductModal(null);
        setShowQrModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Menu Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'popcorn',
    price: 69000,
    cost_price: 20000,
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400',
    is_active: true,
    description: '',
  });

  const imageInputRef = useRef(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.getConcessions();
      if (res.success) setItems(res.data);
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi tải menu bắp nước.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cart Functions
  const addToCart = (item, quantity = 1) => {
    const q = Math.max(1, parseInt(quantity, 10) || 1);
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + q } : c));
      }
      return [...prev, { ...item, quantity: q }];
    });
  };

  const handleOpenProductModal = (item) => {
    if (!item.is_active || item.is_active === 0 || item.is_active === '0') return;
    setSelectedProductModal(item);
    setModalQuantity(1);
  };

  const handleConfirmAddToCart = () => {
    if (!selectedProductModal || modalQuantity <= 0) return;
    addToCart(selectedProductModal, modalQuantity);
    setSelectedProductModal(null);
    setModalQuantity(1);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === id) {
            const newQ = c.quantity + delta;
            return newQ > 0 ? { ...c, quantity: newQ } : null;
          }
          return c;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // SePay Real-Time Auto-Recognition State
  const [sepayStatus, setSepayStatus] = useState('waiting'); // 'waiting' | 'paid'
  const [isSimulatingSepay, setIsSimulatingSepay] = useState(false);

  // Tự động kết nối SePay Webhook và Polling trạng thái chuyển khoản khi mở VietQR Modal
  useEffect(() => {
    if (!showQrModal || cart.length === 0) return;

    let isMounted = true;
    setSepayStatus('waiting');

    // 1. Đăng ký session POS với SePay backend
    api.registerSepayPosSession({
      orderCode: qrOrderCode,
      items: cart,
      totalAmount,
      staffId: 1,
    }).catch((err) => {
      console.warn('[SePay Register POS]:', err.message);
    });

    // 2. Polling kiểm tra trạng thái thanh toán từ SePay mỗi 2 giây
    const interval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const res = await api.checkSepayStatus(qrOrderCode);
        if (res && res.isPaid && isMounted) {
          clearInterval(interval);
          setSepayStatus('paid');
          setLastReceipt({
            ...(res.data || {}),
            items: [...cart],
          });
          setCart([]);
          setTimeout(() => {
            if (isMounted) {
              setShowQrModal(false);
              setMsg({
                text: `✓ [SePay Tự Động] Đã nhận ${Number(res.transaction?.transferAmount || totalAmount).toLocaleString('vi-VN')} đ từ BIDV (Mã GD: ${res.transaction?.referenceCode || 'SePay'})! Đơn hàng đã tự động hoàn tất và trừ kho.`,
                type: 'success',
              });
            }
          }, 1500);
        }
      } catch (e) {
        // Polling error silently handled
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showQrModal, qrOrderCode, cart, totalAmount]);

  const handleSimulateSepay = async () => {
    setIsSimulatingSepay(true);
    try {
      await api.simulateSepayPayment({
        orderCode: qrOrderCode,
        amount: totalAmount > 0 ? totalAmount : 69000,
      });
    } catch (err) {
      setMsg({ text: `Lỗi giả lập SePay: ${err.message}`, type: 'error' });
    } finally {
      setIsSimulatingSepay(false);
    }
  };

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
    if (method === 'qr') {
      setQrOrderCode(`NIGHTMOVIE POS ${Math.floor(100000 + Math.random() * 900000)}`);
      setShowQrModal(true);
    }
  };

  const handleInitiateCheckout = () => {
    if (paymentMethod === 'qr') {
      setQrOrderCode(`NIGHTMOVIE POS ${Math.floor(100000 + Math.random() * 900000)}`);
      setShowQrModal(true);
      return;
    }
    if (cart.length === 0) return;
    handleCheckout();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessingSale(true);
    try {
      const res = await api.sellConcessionOrder({
        items: cart,
        payment_method: paymentMethod,
        staff_id: 1,
      });

      if (res.success) {
        setLastReceipt({
          ...res.data,
          items: [...cart],
        });
        setCart([]);
        setShowQrModal(false);
        setMsg({ text: 'Thanh toán bắp nước thành công! Đã trừ định lượng kho nguyên vật liệu.', type: 'success' });
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi thanh toán đơn hàng.', type: 'error' });
    } finally {
      setIsProcessingSale(false);
    }
  };

  // Menu Item CRUD
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'popcorn',
      price: 69000,
      cost_price: 20000,
      image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400',
      is_active: true,
      description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      cost_price: item.cost_price || 0,
      image: item.image || '',
      is_active: item.is_active,
      description: item.description || '',
    });
    setModalOpen(true);
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, image: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateConcession(editingItem.id, formData);
        setMsg({ text: 'Cập nhật món thành công!', type: 'success' });
      } else {
        await api.createConcession(formData);
        setMsg({ text: 'Thêm món bắp nước mới thành công!', type: 'success' });
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi lưu thông tin món.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa món này khỏi menu?')) return;
    try {
      await api.deleteConcession(id);
      setMsg({ text: 'Đã xóa món khỏi menu.', type: 'success' });
      fetchItems();
    } catch (err) {
      setMsg({ text: err.message || 'Không thể xóa món.', type: 'error' });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchSearch = search === '' || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Utensils className="w-7 h-7 text-ruby-500" /> Quản Lý F&B & Quầy Bắp Nước
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bán hàng tại quầy POS, trừ kho nguyên vật liệu tự động (BOM) & quản lý thực đơn combo
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Toggle */}
          <div className="p-1 rounded-xl bg-cinema-900 border border-cinema-700/60 flex items-center">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'pos'
                  ? 'bg-ruby-600 text-white shadow-glow-red'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Bán Hàng Tại Quầy (POS)
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'menu'
                  ? 'bg-ruby-600 text-white shadow-glow-red'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Quản Lý Menu & BOM
            </button>
          </div>

          {activeTab === 'menu' && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Thêm Món Mới
            </button>
          )}
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
          msg.type === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-200' : 'bg-ruby-950 border border-ruby-500 text-ruby-200'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold">Đóng</button>
        </div>
      )}

      {/* ================= POS SELLING VIEW ================= */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Product Catalog (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Tất Cả' },
                { id: 'combo', label: '🍿🥤 Combo Tiết Kiệm' },
                { id: 'popcorn', label: '🍿 Bắp Rang Bơ' },
                { id: 'beverage', label: '🥤 Nước Ngọt' },
                { id: 'hot_food', label: '🌭 Đồ Ăn Nóng' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    categoryFilter === c.id
                      ? 'bg-ruby-600 text-white shadow-glow-red'
                      : 'bg-cinema-900 hover:bg-cinema-800 text-slate-300 border border-cinema-700/60'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {filteredItems.map((item) => {
                const isInactive = !item.is_active || item.is_active === 0 || item.is_active === '0';
                const fallbackImg = item.category === 'dessert'
                  ? 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=400'
                  : 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400';
                const imgSrc = item.image && item.image.trim() !== '' ? item.image : fallbackImg;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isInactive && handleOpenProductModal(item)}
                    className={`glass-panel rounded-2xl p-3 border border-cinema-700/60 flex flex-col justify-between group bg-cinema-900/60 transition-all ${
                      isInactive
                        ? 'opacity-65 cursor-not-allowed'
                        : 'hover:border-ruby-500/80 cursor-pointer hover:scale-[1.02]'
                    }`}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-cinema-950 mb-2 relative">
                      <img
                        src={imgSrc}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform ${isInactive ? 'opacity-70 grayscale' : 'group-hover:scale-105'}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackImg;
                        }}
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-mono text-gold-400 font-bold">
                        {item.price.toLocaleString('vi-VN')} đ
                      </div>
                      {isInactive && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-950/90 border border-rose-600/60 text-[10px] font-bold text-rose-300 backdrop-blur-sm">
                          Tạm ngưng
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-xs line-clamp-2 mb-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{item.description}</p>
                    </div>

                    {isInactive ? (
                      <button
                        type="button"
                        disabled
                        className="mt-2.5 w-full py-1.5 rounded-lg bg-cinema-800 text-slate-500 text-[11px] font-bold cursor-not-allowed opacity-60 border border-cinema-700/50 flex items-center justify-center gap-1"
                      >
                        Tạm ngưng
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProductModal(item);
                        }}
                        className="mt-2.5 w-full py-1.5 rounded-lg bg-ruby-600 hover:bg-ruby-500 text-white text-[11px] font-bold transition-all shadow-glow-red flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3 h-3" /> Chọn Món
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Cart & Checkout (5 cols) */}
          <div className="lg:col-span-5 glass-panel rounded-3xl p-5 border border-cinema-700/80 shadow-2xl space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-black text-white text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-ruby-400" /> Đơn Hàng Bắp Nước ({cart.reduce((a, b) => a + b.quantity, 0)})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                  Chưa có món nào được chọn.<br />Nhấn nút + Chọn Món để thêm vào đơn.
                </div>
              ) : (
                cart.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-cinema-900/90 border border-cinema-800 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-xs truncate">{c.name}</div>
                      <div className="text-[10px] text-ruby-400 font-mono font-semibold">
                        {(c.price * c.quantity).toLocaleString('vi-VN')} đ
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(c.id, -1)}
                        className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold text-white w-4 text-center">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(c.id, 1)}
                        className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-cinema-700/60 space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">Phương thức thanh toán:</label>
              <div className="grid grid-cols-2 gap-2.5" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { id: 'cash', label: 'Tiền Mặt' },
                  { id: 'qr', label: 'Quét QR' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectPaymentMethod(m.id)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-ruby-600 text-white border-ruby-500 shadow-glow-red'
                        : 'bg-cinema-900 text-slate-400 border-cinema-800 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* VietQR Preview Box when in QR mode */}
              {paymentMethod === 'qr' && (
                <div
                  onClick={() => setShowQrModal(true)}
                  className="p-3 rounded-2xl bg-cinema-950/90 border border-ruby-500/40 hover:border-ruby-500 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                      <img
                        src="/images/bidv-qr.jpg"
                        alt="QR Mini"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://img.vietqr.io/image/BIDV-8813341949-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(qrOrderCode)}`;
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white group-hover:text-ruby-400 transition-colors flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        BIDV • LE TAN DUNG
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        STK: 8813341949
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-ruby-400 group-hover:underline flex items-center gap-0.5">
                    Mở mã QR →
                  </span>
                </div>
              )}
            </div>

            {/* Total & Checkout Button */}
            <div className="pt-3 border-t border-cinema-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Tổng cộng:</span>
                <span className="text-xl font-black text-ruby-400 font-mono">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <button
                disabled={isProcessingSale || (paymentMethod === 'cash' && cart.length === 0)}
                onClick={handleInitiateCheckout}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-ruby-600 via-ruby-700 to-rose-700 hover:from-ruby-500 hover:to-rose-600 disabled:opacity-50 text-white font-extrabold text-sm shadow-glow-red transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessingSale
                  ? 'Đang xử lý...'
                  : paymentMethod === 'qr'
                  ? `Quét Mã QR BIDV (${totalAmount.toLocaleString('vi-VN')} đ)`
                  : `Thanh Toán (${totalAmount.toLocaleString('vi-VN')} đ)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRODUCT QUICK-SELECT MODAL ================= */}
      {selectedProductModal &&
        createPortal(
          <div
            className="animate-fade-in"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedProductModal(null);
              }
            }}
          >
            <div
              className="animate-scale-in"
              style={{
                maxWidth: '520px',
                width: '100%',
                background: '#141722',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Large Image on top */}
              <div className="relative w-full" style={{ height: '240px' }}>
                <img
                  src={
                    selectedProductModal.image && selectedProductModal.image.trim() !== ''
                      ? selectedProductModal.image
                      : selectedProductModal.category === 'dessert'
                      ? 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=400'
                      : 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400'
                  }
                  alt={selectedProductModal.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400';
                  }}
                />
                {/* Price badge */}
                <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-gold-400 font-mono font-bold text-xs shadow-lg">
                  {selectedProductModal.price.toLocaleString('vi-VN')} đ
                </div>

                {/* Circular close button (X) */}
                <button
                  type="button"
                  onClick={() => setSelectedProductModal(null)}
                  className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/70 hover:bg-ruby-600 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/10 cursor-pointer shadow-lg"
                  title="Đóng (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Info Section */}
              <div className="p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-cinema-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      {selectedProductModal.category === 'popcorn'
                        ? 'Bắp Rang Bơ'
                        : selectedProductModal.category === 'beverage'
                        ? 'Nước Ngọt'
                        : selectedProductModal.category === 'combo'
                        ? 'Combo Tiết Kiệm'
                        : selectedProductModal.category === 'hot_food'
                        ? 'Đồ Ăn Nóng'
                        : 'Món Bắp Nước'}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white leading-snug">
                    {selectedProductModal.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {selectedProductModal.description || 'Sản phẩm phục vụ tươi ngon tại quầy bắp nước Night Movie.'}
                  </p>
                  <div className="mt-2 text-sm font-bold text-gold-400 font-mono">
                    Đơn giá: {selectedProductModal.price.toLocaleString('vi-VN')} đ
                  </div>
                </div>

                {/* Large Quantity Stepper */}
                <div className="p-4 rounded-2xl bg-cinema-950/80 border border-cinema-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Số lượng chọn:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={modalQuantity <= 1}
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl bg-cinema-800 hover:bg-cinema-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-lg flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-mono text-lg font-black text-white w-10 text-center select-none">
                      {modalQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => q + 1)}
                      className="w-10 h-10 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-white font-extrabold text-lg flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-cinema-800">
                  <button
                    type="button"
                    onClick={() => setSelectedProductModal(null)}
                    className="col-span-1 py-3.5 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAddToCart}
                    style={{ background: '#E50914' }}
                    className="col-span-2 py-3.5 rounded-xl hover:brightness-110 text-white font-extrabold text-xs transition-all shadow-glow-red cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4" />
                    + Thêm Vào Đơn • {(selectedProductModal.price * modalQuantity).toLocaleString('vi-VN')} đ
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ================= VIETQR PAYMENT MODAL ================= */}
      {showQrModal &&
        createPortal(
          <div
            className="animate-fade-in"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowQrModal(false);
              }
            }}
          >
            <div
              className="animate-scale-in"
              style={{
                maxWidth: '460px',
                width: '100%',
                background: '#141722',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-cinema-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-400" /> Thanh Toán VietQR & SePay Tự Động
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sepayStatus === 'paid' ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${sepayStatus === 'paid' ? 'bg-emerald-500' : 'bg-emerald-400'}`}></span>
                    </span>
                    <p className="text-[11px] text-emerald-400 font-medium">
                      {sepayStatus === 'paid'
                        ? 'Đã xác nhận giao dịch thành công qua SePay!'
                        : 'Cổng SePay tự động phát hiện biến động số dư BIDV'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="w-8 h-8 rounded-full bg-cinema-800 hover:bg-ruby-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Đóng (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                {/* VietQR Image Container - SePay Dynamic QR Code */}
                <div
                  style={{
                    maxWidth: '280px',
                    width: '100%',
                    margin: '0 auto',
                    borderRadius: '16px',
                    padding: '10px',
                    background: '#ffffff',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  }}
                  className="flex flex-col items-center justify-center overflow-hidden transition-all"
                >
                  <img
                    src={
                      totalAmount > 0
                        ? `https://qr.sepay.vn/img?acc=8813341949&bank=BIDV&amount=${totalAmount}&des=${encodeURIComponent(qrOrderCode)}`
                        : `https://qr.sepay.vn/img?acc=8813341949&bank=BIDV&des=${encodeURIComponent(qrOrderCode)}`
                    }
                    alt="Mã QR SePay BIDV - LE TAN DUNG 8813341949"
                    className="w-full h-auto object-contain rounded-xl"
                  />
                </div>

                {/* SePay Real-Time Status Notification */}
                {sepayStatus === 'paid' ? (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold text-center animate-bounce flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>✓ ĐÃ NHẬN TIỀN QUA BIDV! Đang tự động hoàn tất đơn & xuất hóa đơn...</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-cinema-950/90 border border-emerald-500/30 text-emerald-400 text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      Đang lắng nghe Webhook SePay...
                    </span>
                    <button
                      type="button"
                      disabled={isSimulatingSepay}
                      onClick={handleSimulateSepay}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Bấm để kích hoạt Webhook SePay giả lập thanh toán"
                    >
                      <Zap className="w-3 h-3 text-gold-400" />
                      {isSimulatingSepay ? 'Đang gửi...' : '⚡ Test SePay Webhook'}
                    </button>
                  </div>
                )}

                {/* Transfer Info Details */}
                <div className="rounded-xl bg-cinema-950/90 border border-cinema-800 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Chủ tài khoản:</span>
                    <span className="font-bold text-white uppercase tracking-wide">LE TAN DUNG</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Ngân hàng:</span>
                    <span className="font-bold text-white">BIDV (Đầu tư & Phát triển VN)</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">8813341949</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText('8813341949');
                          setCopiedStk(true);
                          setTimeout(() => setCopiedStk(false), 2000);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300 hover:text-white text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedStk ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedStk ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Số tiền thanh toán:</span>
                    <span className="font-mono font-black text-gold-400 text-base">
                      {totalAmount > 0 ? `${totalAmount.toLocaleString('vi-VN')} đ` : 'Nhập theo hóa đơn (0 đ)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Nội dung chuyển khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-300 text-xs">{qrOrderCode}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(qrOrderCode);
                          setCopiedContent(true);
                          setTimeout(() => setCopiedContent(false), 2000);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300 hover:text-white text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedContent ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedContent ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="w-full py-3 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Đóng / Đổi phương thức
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ================= MENU & BOM MANAGEMENT VIEW ================= */}
      {activeTab === 'menu' && (
        <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
                <tr>
                  <th className="p-4">Hình ảnh & Tên món</th>
                  <th className="p-4 whitespace-nowrap">Phân loại</th>
                  <th className="p-4 whitespace-nowrap">Giá bán lẻ</th>
                  <th className="p-4 whitespace-nowrap">Giá vốn ước tính</th>
                  <th className="p-4 whitespace-nowrap">Lợi nhuận gộp</th>
                  <th className="p-4 whitespace-nowrap">Trạng thái</th>
                  <th className="p-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-800">
                {items.map((item) => {
                  const profit = item.price - (item.cost_price || 0);
                  const marginPercent = item.price > 0 ? ((profit / item.price) * 100).toFixed(0) : 0;
                  return (
                    <tr key={item.id} className="hover:bg-cinema-850/60 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image && item.image.trim() !== '' ? item.image : (item.category === 'dessert' ? 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?q=80&w=400' : 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400')}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-cinema-700 bg-cinema-900"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400';
                            }}
                          />
                          <div>
                            <div className="font-bold text-white text-sm">{item.name}</div>
                            <div className="text-[10px] text-slate-400">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-cinema-800 text-slate-300 text-[10px] font-bold uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-ruby-400">
                        {item.price.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {(item.cost_price || 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-400 font-bold font-mono">
                          +{profit.toLocaleString('vi-VN')} đ ({marginPercent}%)
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {item.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            Đang kinh doanh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                            Tạm dừng
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300 hover:text-white"
                            title="Sửa món"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg bg-cinema-800 hover:bg-rose-900 text-rose-400 hover:text-rose-200"
                            title="Xóa món"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa Món F&B - Đưa ra document.body qua ModalPortal */}
      <ModalPortal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Chỉnh Sửa Món: ${editingItem.name}` : 'Thêm Món F&B Mới'}
        subtitle="Cập nhật danh mục bắp nước, giá bán, giá vốn và hình ảnh sản phẩm"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Tên món bắp nước / combo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Bắp ngọt size L, Combo 2 người..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Phân loại *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="popcorn">Bắp rang bơ (Popcorn)</option>
                    <option value="beverage">Nước ngọt (Beverage)</option>
                    <option value="combo">Combo tiết kiệm</option>
                    <option value="hot_food">Đồ ăn nóng (Hot Food)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Giá bán lẻ (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    step={1000}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">Giá vốn nguyên liệu (VNĐ)</label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">Trạng thái bán</label>
                  <select
                    value={formData.is_active ? '1' : '0'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === '1' })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="1">Đang kinh doanh</option>
                    <option value="0">Tạm ngưng bán</option>
                  </select>
                </div>
              </div>

              {/* Image upload / preview */}
              <div>
                <label className="block font-bold text-slate-200 mb-1">Hình ảnh món</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-cinema-950 border border-cinema-700 shrink-0">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    onClick={(e) => { e.target.value = null; }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4" /> Tải ảnh từ máy
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Mô tả món</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú thành phần, size..."
                  className="w-full px-3.5 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-cinema-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold shadow-glow-red cursor-pointer"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
      </ModalPortal>
    </div>
  );
}
