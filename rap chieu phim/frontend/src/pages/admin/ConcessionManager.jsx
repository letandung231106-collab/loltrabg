import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react';

export function ConcessionManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'menu'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // POS Cart State
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

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
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
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
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="glass-panel rounded-2xl p-3 border border-cinema-700/60 hover:border-ruby-500/80 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between group bg-cinema-900/60"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-cinema-950 mb-2 relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400';
                      }}
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-mono text-gold-400 font-bold">
                      {item.price.toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs line-clamp-2 mb-1">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{item.description}</p>
                  </div>

                  <button className="mt-2.5 w-full py-1.5 rounded-lg bg-cinema-800 group-hover:bg-ruby-600 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3" /> Chọn Món
                  </button>
                </div>
              ))}
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
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
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
                  Chưa có món nào được chọn.<br />Nhấn vào món bên trái để thêm vào đơn.
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
                        className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white font-bold flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-bold text-white w-4 text-center">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(c.id, 1)}
                        className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white font-bold flex items-center justify-center text-xs"
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
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: '💵 Tiền Mặt' },
                  { id: 'qr', label: '📱 Quét QR' },
                  { id: 'card', label: '💳 Thẻ POS' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      paymentMethod === m.id
                        ? 'bg-ruby-600 text-white border-ruby-500 shadow-glow-red'
                        : 'bg-cinema-900 text-slate-400 border-cinema-800 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total & Checkout Button */}
            <div className="pt-3 border-t border-cinema-700 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Tự động trừ kho (BOM):</span>
                <span className="text-emerald-400 font-bold">✓ Bật tự động</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Tổng cộng:</span>
                <span className="text-xl font-black text-ruby-400 font-mono">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <button
                disabled={cart.length === 0 || isProcessingSale}
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-ruby-600 via-ruby-700 to-rose-700 hover:from-ruby-500 hover:to-rose-600 disabled:opacity-50 text-white font-extrabold text-sm shadow-glow-red transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessingSale ? 'Đang xuất hóa đơn...' : `Thanh Toán (${totalAmount.toLocaleString('vi-VN')} đ)`}
              </button>
            </div>

            {/* Last Receipt Notification */}
            {lastReceipt && (
              <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs space-y-1 animate-scale-in">
                <div className="font-bold flex items-center justify-between">
                  <span>✓ Hóa đơn: {lastReceipt.order_id}</span>
                  <span className="font-mono">{lastReceipt.total_amount?.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="text-[10px] text-emerald-300">
                  Đã ghi nhận doanh thu và cập nhật tồn kho nguyên liệu bắp nước.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MENU & BOM MANAGEMENT VIEW ================= */}
      {activeTab === 'menu' && (
        <div className="glass-panel rounded-2xl border border-cinema-700/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cinema-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-cinema-700">
                <tr>
                  <th className="p-4">Hình ảnh & Tên món</th>
                  <th className="p-4">Phân loại</th>
                  <th className="p-4">Giá bán lẻ</th>
                  <th className="p-4">Giá vốn ước tính</th>
                  <th className="p-4">Lợi nhuận gộp</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
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
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover border border-cinema-700 bg-cinema-900"
                            onError={(e) => {
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
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.is_active
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                            : 'bg-cinema-800 text-slate-400'
                        }`}>
                          {item.is_active ? 'Đang bán' : 'Tạm dừng'}
                        </span>
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

      {/* Modal Thêm/Sửa Món F&B */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-cinema-600">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-ruby-500" />
                {editingItem ? `Chỉnh Sửa Món: ${editingItem.name}` : 'Thêm Món F&B Mới'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
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
                  className="px-4 py-2 rounded-xl bg-cinema-800 text-slate-300 hover:bg-cinema-700"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold shadow-glow-red"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
