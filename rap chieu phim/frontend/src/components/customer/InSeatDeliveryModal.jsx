import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  X,
  Utensils,
  Plus,
  Minus,
  CheckCircle,
  MapPin,
  Send,
  AlertTriangle,
  Loader2,
  Coffee,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

/**
 * Phân tích ngày giờ an toàn cho Safari macOS
 */
const parseSafeDate = (dStr) => {
  if (!dStr) return null;
  if (dStr instanceof Date) return isNaN(dStr.getTime()) ? null : dStr;
  const s = String(dStr).trim().replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * So sánh 2 ngày có cùng ngày/tháng/năm
 */
const isSameDate = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'combo', label: 'Combo' },
  { id: 'popcorn', label: 'Bắp rang' },
  { id: 'beverage', label: 'Nước uống' },
  { id: 'snack', label: 'Đồ ăn nhẹ' },
];

const ITEM_IMAGE_MAP = {
  1: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400', // Bắp phô mai Cheddar L
  2: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=400', // Bắp caramen ngọt L
  3: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400', // Coca-Cola tươi 32oz
  4: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=400', // Sprite tươi 32oz
  5: '/images/combo-don.jpg', // Combo Đơn (1 bắp + 1 nước)
  6: '/images/combo-doi.jpg', // Combo Đôi Night Movie (1 bắp + 2 nước + 1 snack)
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
  if (ITEM_IMAGE_MAP[item.id]) return ITEM_IMAGE_MAP[item.id];
  const raw = item.image || item.image_url;
  if (raw && typeof raw === 'string' && raw.trim() && !raw.includes('photo-1572177191856-3cde618dee1f') && !raw.includes('photo-1518173946687-a4c8a383392e')) {
    return raw.trim();
  }
  const name = (item.name || '').toLowerCase();
  if (name.includes('tart') || name.includes('trứng')) return ITEM_IMAGE_MAP[9];
  if (name.includes('bim bim') || name.includes('khoai tây') || name.includes('chips')) return ITEM_IMAGE_MAP[10];
  if (name.includes('sprite')) return ITEM_IMAGE_MAP[4];
  if (name.includes('coca') || name.includes('pepsi') || name.includes('nước')) return ITEM_IMAGE_MAP[3];
  if (name.includes('caramen') || name.includes('caramel')) return ITEM_IMAGE_MAP[2];
  if (name.includes('đôi') || name.includes('combo đôi')) return ITEM_IMAGE_MAP[6];
  if (name.includes('combo')) return ITEM_IMAGE_MAP[5];
  if (name.includes('xúc xích') || name.includes('hotdog')) return ITEM_IMAGE_MAP[7];
  if (name.includes('phô mai') || name.includes('bắp')) return ITEM_IMAGE_MAP[1];
  if (name.includes('kem')) return ITEM_IMAGE_MAP[8];
  return CATEGORY_DEFAULT_IMAGES[item.category] || CATEGORY_DEFAULT_IMAGES.popcorn;
}

export function InSeatDeliveryModal({ isOpen, onClose }) {
  const { user, isStaff } = useAuth();

  // Thông tin phòng, ghế và ghi chú
  const [room, setRoom] = useState('');
  const [seatCode, setSeatCode] = useState('');
  const [note, setNote] = useState('');

  // Giỏ hàng và thực đơn
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [justAddedId, setJustAddedId] = useState(null);

  // Trạng thái xử lý và gửi đơn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Mobile Bottom Sheet
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Customer: Danh sách vé hôm nay
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState('');

  // Staff / Admin / Manager: Danh sách phòng và ghế
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomSeats, setRoomSeats] = useState([]);

  // ESC key
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

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || 'unset';
      };
    }
  }, [isOpen]);

  // Tải danh sách ghế cho phòng khi Staff chọn phòng
  const loadStaffSeats = async (roomId, isMounted = true) => {
    try {
      const res = await api.getRoomById(roomId);
      const rawSeats = res?.data?.seats || res?.seats || [];
      let seatList = [];

      if (Array.isArray(rawSeats) && rawSeats.length > 0) {
        seatList = rawSeats.map((s) => {
          const code = s.seat_code || `${s.row_number || ''}${s.seat_number || ''}`;
          const isCouple = s.seat_type === 'couple' || s.row_number === 'F';
          return {
            id: s.id,
            seatCode: code,
            row: s.row_number || 'Khác',
            number: s.seat_number,
            isCouple,
            label: isCouple ? `${code} (2 chỗ)` : code,
          };
        });
      } else {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
        rows.forEach((r) => {
          for (let i = 1; i <= 12; i++) {
            const code = `${r}${i}`;
            const isCouple = r === 'F';
            seatList.push({
              id: `${r}-${i}`,
              seatCode: code,
              row: r,
              number: i,
              isCouple,
              label: isCouple ? `${code} (2 chỗ)` : code,
            });
          }
        });
      }

      if (isMounted) {
        setRoomSeats(seatList);
        if (seatList.length > 0) {
          setSeatCode(seatList[0].seatCode);
        } else {
          setSeatCode('');
        }
      }
    } catch (err) {
      console.warn('Lỗi lấy danh sách ghế phòng:', err);
      const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
      const fallbackList = [];
      rows.forEach((r) => {
        for (let i = 1; i <= 12; i++) {
          const code = `${r}${i}`;
          const isCouple = r === 'F';
          fallbackList.push({
            id: `${r}-${i}`,
            seatCode: code,
            row: r,
            number: i,
            isCouple,
            label: isCouple ? `${code} (2 chỗ)` : code,
          });
        }
      });
      if (isMounted) {
        setRoomSeats(fallbackList);
        setSeatCode(fallbackList[0]?.seatCode || '');
      }
    }
  };

  // Khởi tạo dữ liệu theo vai trò
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingData(true);
    setSubmitError('');

    const initModalData = async () => {
      try {
        if (isStaff) {
          const resRooms = await api.getRooms();
          const roomList = (resRooms?.data || resRooms || []).filter(
            (r) => r.status !== 'maintenance' && r.status !== 'inactive'
          );

          if (!isMounted) return;
          setRooms(roomList);

          if (roomList.length > 0) {
            const defaultRoom = roomList[0];
            setSelectedRoomId(defaultRoom.id);
            setRoom(defaultRoom.name);
            await loadStaffSeats(defaultRoom.id, isMounted);
          } else {
            setSelectedRoomId('');
            setRoom('');
            setSeatCode('');
            setRoomSeats([]);
          }
        } else {
          const resTickets = await api.getMyTickets();
          const allTickets = resTickets?.data || resTickets || [];

          const now = new Date();
          const valid = allTickets.filter((t) => {
            if (String(t.status || '').toLowerCase() !== 'active') return false;

            const start = parseSafeDate(t.start_time);
            let end = parseSafeDate(t.end_time);
            if (!end && start) {
              const dur = Number(t.duration) || 120;
              end = new Date(start.getTime() + dur * 60 * 1000);
            }
            if (!start || !end) return false;

            const isToday = isSameDate(start, now);
            if (!isToday) return false;

            return (
              end.getTime() >= now.getTime() ||
              (isToday && now.getTime() - end.getTime() <= 4 * 60 * 60 * 1000)
            );
          });

          if (!isMounted) return;

          const formatted = valid.map((t) => {
            const code =
              t.seat_code ||
              (t.row_number && t.seat_number ? `${t.row_number}${t.seat_number}` : '') ||
              String(t.seat_id || '');
            const roomName = t.room_name || 'Phòng chiếu';
            const movieName = t.movie_name || 'Phim';
            const start = parseSafeDate(t.start_time);
            const timeStr = start
              ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
              : '';
            const label = `${code} · ${roomName} · ${movieName} ${timeStr}`.trim();
            return {
              ...t,
              seatCode: code,
              displayLabel: label,
            };
          });

          setTickets(formatted);

          if (formatted.length > 0) {
            const first = formatted[0];
            setSelectedTicketId(first.id);
            setRoom(first.room_name || '');
            setSeatCode(first.seatCode || '');
          } else {
            setSelectedTicketId('');
            setRoom('');
            setSeatCode('');
          }
        }

        setIsLoadingMenu(true);
        try {
          const resMenu = await api.getConcessions();
          const rawList = Array.isArray(resMenu) ? resMenu : (resMenu?.data || resMenu?.concessions || resMenu?.items || []);
          const available = rawList.filter((item) => {
            if (!item) return false;
            if (item.is_active === false || item.is_active === 0 || item.is_active === '0') return false;
            if (item.status === 'unavailable' || item.status === 'Tạm ngưng') return false;
            if (item.is_available === 0 || item.is_available === false) return false;
            if (typeof item.name === 'string' && item.name.includes('Tạm ngưng')) return false;
            return true;
          });
          if (isMounted) {
            setMenuItems(available);
          }
        } catch (menuErr) {
          console.warn('Lỗi tải menu bắp nước InSeatDelivery:', menuErr);
        } finally {
          if (isMounted) {
            setIsLoadingMenu(false);
          }
        }
      } catch (err) {
        console.warn('Lỗi tải dữ liệu phòng/vé InSeatDelivery:', err);
        if (isMounted) {
          setSubmitError('Không thể tải thông tin vé hoặc phòng chiếu. Vui lòng thử lại.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    initModalData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isStaff]);

  if (!isOpen) return null;

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const totalItemsCount = cart.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0
  );

  const getItemQty = (itemId) => {
    const found = cart.find((c) => c.id === itemId);
    return found ? found.quantity : 0;
  };

  const handleItemQtyChange = (item, delta) => {
    if (delta > 0) {
      setJustAddedId(item.id);
      setTimeout(() => setJustAddedId(null), 350);
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      const currentQty = existing ? existing.quantity : 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        return prev.filter((c) => c.id !== item.id);
      }
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: newQty } : c));
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price) || 0,
          quantity: newQty,
          image: item.image,
        },
      ];
    });
  };

  const handleRemoveItem = (itemId) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };

  const handleStaffRoomChange = async (e) => {
    const newRoomId = Number(e.target.value);
    setSelectedRoomId(newRoomId);
    const matched = rooms.find((r) => Number(r.id) === newRoomId);
    if (matched) {
      setRoom(matched.name);
    }
    await loadStaffSeats(newRoomId, true);
  };

  const handleCustomerTicketChange = (e) => {
    const ticketId = e.target.value;
    setSelectedTicketId(ticketId);
    const selected = tickets.find((t) => String(t.id) === String(ticketId));
    if (selected) {
      setRoom(selected.room_name || '');
      setSeatCode(selected.seatCode || '');
    }
  };

  const handleOrder = async () => {
    if (cart.length === 0 || !seatCode || totalAmount === 0) return;
    setIsSubmitting(true);
    setSubmitError('');

    const clientNote = note?.trim() || '';
    const formattedNotes = `Giao tận ghế | Phòng: ${room} | Ghế: ${seatCode} | Ghi chú: ${clientNote}`;

    try {
      await api.sellConcessions({
        items: cart,
        payment_method: 'in_seat_delivery',
        notes: formattedNotes,
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      setIsSuccess(true);
      setIsMobileCartOpen(false);
    } catch (err) {
      console.warn('Lỗi gọi bắp nước tận ghế:', err);
      setSubmitError(err?.message || 'Có lỗi xảy ra khi gửi đơn đặt bắp nước. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedStaffSeats = roomSeats.reduce((acc, s) => {
    const row = s.row || 'Khác';
    if (!acc[row]) acc[row] = [];
    acc[row].push(s);
    return acc;
  }, {});

  // Lọc theo danh mục
  const filteredMenuItems = menuItems.filter((item) => {
    if (selectedCategory === 'all') return true;
    const cat = String(item.category || '').toLowerCase();
    const name = String(item.name || '').toLowerCase();
    if (selectedCategory === 'combo') return cat === 'combo' || name.includes('combo');
    if (selectedCategory === 'popcorn') return cat === 'popcorn' || name.includes('bắp');
    if (selectedCategory === 'beverage') return cat === 'beverage' || cat === 'drink' || name.includes('nước') || name.includes('coca') || name.includes('sprite');
    if (selectedCategory === 'snack') return cat === 'snack' || cat === 'hot_food' || cat === 'dessert' || name.includes('xúc xích') || name.includes('snack') || name.includes('tart') || name.includes('bim bim') || name.includes('khoai tây');
    return cat === selectedCategory;
  });

  // Khối thông tin vị trí dùng chung cho Desktop và Mobile Bottom Sheet
  const renderLocationSection = () => (
    <div className="p-3.5 rounded-2xl bg-cinema-900/90 border border-cinema-700/60 space-y-2.5 text-xs">
      <div className="flex items-center justify-between font-bold text-amber-400 uppercase tracking-wide text-[11px]">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Vị Trí Của Bạn
        </span>
        {room && seatCode && (
          <span className="text-[10px] font-mono text-white bg-cinema-800 px-2 py-0.5 rounded border border-cinema-700">
            {room} • Ghế {seatCode}
          </span>
        )}
      </div>

      {isLoadingData ? (
        <div className="py-2 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>Đang tải thông tin vị trí...</span>
        </div>
      ) : isStaff ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Phòng chiếu:</label>
            <select
              value={selectedRoomId}
              onChange={handleStaffRoomChange}
              className="w-full px-2.5 py-1.5 rounded-xl bg-cinema-950 border border-cinema-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id} className="bg-cinema-950 text-white">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Số ghế:</label>
            <select
              value={seatCode}
              onChange={(e) => setSeatCode(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-cinema-950 border border-cinema-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500 max-h-48"
            >
              {Object.keys(groupedStaffSeats).length === 0 ? (
                <option value="">Không có ghế</option>
              ) : (
                Object.entries(groupedStaffSeats).map(([rowLetter, seatsInRow]) => (
                  <optgroup
                    key={rowLetter}
                    label={`Hàng ${rowLetter}${rowLetter === 'F' ? ' (Đôi)' : ''}`}
                    className="bg-cinema-950 text-amber-400 font-sans font-bold"
                  >
                    {seatsInRow.map((s) => (
                      <option key={s.seatCode} value={s.seatCode} className="bg-cinema-950 text-white font-mono">
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              )}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Vé đang xem hôm nay:</label>
            <select
              value={selectedTicketId}
              onChange={handleCustomerTicketChange}
              disabled={tickets.length === 0}
              className="w-full px-2.5 py-1.5 rounded-xl bg-cinema-950 border border-cinema-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500 disabled:opacity-50"
            >
              {tickets.length === 0 ? (
                <option value="">Không có vé phù hợp hôm nay</option>
              ) : (
                tickets.map((t) => (
                  <option key={t.id} value={t.id} className="bg-cinema-950 text-white text-xs">
                    {t.displayLabel}
                  </option>
                ))
              )}
            </select>
          </div>

          {tickets.length === 0 && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Chưa có vé cho suất đang chiếu hôm nay</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="text-[10px] text-slate-400 block mb-0.5">Ghi chú cho nhân viên (1 dòng):</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Vd: Ít đá, xin thêm khăn giấy, tương ớt..."
          className="w-full px-2.5 py-1.5 rounded-xl bg-cinema-950 border border-cinema-700 text-white text-xs focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>
  );

  // Khối danh sách món trong giỏ hàng
  const renderCartItemsList = () => (
    <div className="flex-1 flex flex-col min-h-0 space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wide">
        <span>Món Đang Chọn:</span>
        {cart.length > 0 && (
          <span className="text-[11px] font-mono text-amber-400 normal-case">
            {totalItemsCount} phần
          </span>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="p-4 rounded-2xl bg-cinema-900/40 border border-dashed border-cinema-800 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5 py-6">
          <Utensils className="w-6 h-6 text-slate-500" />
          <span>Giỏ hàng đang trống.</span>
          <span className="text-[11px] text-slate-500">Bấm <strong className="text-amber-400">+</strong> ở thực đơn để thêm món.</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
          {cart.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-cinema-900 border border-cinema-800 flex items-center justify-between text-xs gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {(Number(item.price) || 0).toLocaleString('vi-VN')} đ × {item.quantity} ={' '}
                  <span className="text-amber-400 font-bold">
                    {(Number(item.price || 0) * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleItemQtyChange(item, -1)}
                  className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
                  title="Giảm 1"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-4 text-center font-mono font-bold text-amber-400">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleItemQtyChange(item, 1)}
                  className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-cinema-950 flex items-center justify-center font-bold transition-colors cursor-pointer"
                  title="Thêm 1"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="w-6 h-6 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer ml-0.5"
                  title="Xóa món"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="relative w-full max-w-5xl h-[92vh] max-h-[760px] flex flex-col overflow-hidden rounded-2xl bg-[#0f121d] border border-white/15 shadow-2xl text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút Đóng (X) cố định ở góc trên bên phải */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-50 w-8 h-8 rounded-full bg-black/70 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Đóng (phím ESC)"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="px-5 py-3.5 bg-cinema-950/95 border-b border-cinema-800 flex items-center justify-between shrink-0 pr-14">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-glow-amber shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Gọi Bắp Nước Tận Ghế Ngồi
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  In-Seat Delivery
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Nhân viên mang bắp nước nóng hổi phục vụ tận chỗ ngồi của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Body Area */}
        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 overflow-y-auto">
            <CheckCircle className="w-16 h-16 text-emerald-400 animate-bounce" />
            <h4 className="text-xl font-black text-white">ĐÃ TIẾP NHẬN ĐƠN HÀNG TẬN GHẾ!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Đơn hàng của bạn đang được chuẩn bị tại quầy F&B. Nhân viên rạp sẽ mang đến tận vị trí{' '}
              <strong className="text-amber-400 font-mono font-black">
                {room} - Ghế {seatCode}
              </strong>{' '}
              trong vòng 5-7 phút.
            </p>
            <div className="p-3 rounded-2xl bg-cinema-950 border border-cinema-800 text-xs font-mono text-slate-400">
              Tổng thanh toán:{' '}
              <span className="text-white font-bold">{totalAmount.toLocaleString('vi-VN')} VNĐ</span>{' '}
              (Thu tiền mặt hoặc chuyển khoản tại ghế)
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSuccess(false);
                onClose?.();
              }}
              className="px-6 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all cursor-pointer"
            >
              Hoàn Tất & Xem Phim
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* CỘT TRÁI: Thực đơn bắp nước (Categories + Scrollable Food Grid) */}
            <div className="flex-1 flex flex-col min-w-0 md:border-r border-cinema-800/80">
              {/* Category Tabs dính trên đầu */}
              <div className="shrink-0 px-4 py-2.5 bg-cinema-950/70 border-b border-cinema-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-amber-500 text-cinema-950 shadow-md font-extrabold'
                          : 'bg-cinema-900 text-slate-300 hover:text-white hover:bg-cinema-850'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Thông báo lỗi nếu có */}
              {submitError && (
                <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitError('')}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Scrollable Food Grid */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {isLoadingMenu ? (
                  <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    <span>Đang tải thực đơn bắp nước...</span>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Không có món nào trong danh mục này.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredMenuItems.map((item) => {
                      const qty = getItemQty(item.id);
                      const isBouncing = justAddedId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col justify-between rounded-2xl border p-2.5 transition-all duration-200 ${
                            isBouncing
                              ? 'scale-105 border-amber-400 bg-amber-500/20 shadow-lg'
                              : qty > 0
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                              : 'bg-cinema-900/80 border-cinema-800 hover:border-cinema-700'
                          }`}
                        >
                          <div>
                            <div className="w-full h-24 rounded-xl overflow-hidden mb-2 bg-cinema-950 border border-cinema-800">
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

                            <div
                              className="font-bold text-white text-xs line-clamp-2 min-h-[2rem] leading-snug"
                              title={item.name}
                            >
                              {item.name}
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-cinema-800/60 flex items-center justify-between gap-1.5">
                            <span className="text-amber-400 font-mono font-bold text-xs">
                              {(Number(item.price) || 0).toLocaleString('vi-VN')} đ
                            </span>

                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => handleItemQtyChange(item, 1)}
                                className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 text-cinema-950 flex items-center justify-center font-bold transition-all shadow cursor-pointer active:scale-90"
                                title="Thêm vào giỏ"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 shrink-0 bg-cinema-950/80 rounded-xl p-0.5 border border-cinema-700">
                                <button
                                  type="button"
                                  onClick={() => handleItemQtyChange(item, -1)}
                                  className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white flex items-center justify-center font-bold transition-colors cursor-pointer"
                                  title="Giảm 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-4 text-center font-mono font-bold text-amber-400 text-xs">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleItemQtyChange(item, 1)}
                                  className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-cinema-950 flex items-center justify-center font-bold transition-colors cursor-pointer"
                                  title="Thêm 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Fixed Bottom Bar */}
              <div className="md:hidden shrink-0 p-3 bg-cinema-950 border-t border-cinema-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">
                    <strong className="text-amber-400 font-bold">{totalItemsCount}</strong> phần đã chọn
                  </div>
                  <div className="text-sm font-black text-amber-400 font-mono">
                    {totalAmount.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-cinema-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Xem Giỏ ({totalItemsCount})</span>
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: Desktop Fixed Sidebar (Vị trí + Món đã chọn + Footer) */}
            <div className="hidden md:flex md:w-[360px] lg:w-[380px] shrink-0 flex-col bg-cinema-950/60 min-h-0">
              {/* Vị trí của bạn */}
              <div className="p-4 shrink-0 border-b border-cinema-800">
                {renderLocationSection()}
              </div>

              {/* Món đang chọn */}
              <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                {renderCartItemsList()}
              </div>

              {/* Fixed Footer: Tổng tiền + Nút Đặt */}
              <div className="p-4 shrink-0 border-t border-cinema-800 bg-cinema-950 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">Tổng tiền gọi món:</div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {totalAmount.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting || totalAmount === 0 || !seatCode}
                  onClick={handleOrder}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-ruby-600 via-rose-600 to-ruby-700 hover:from-ruby-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-glow-red transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {!seatCode
                      ? 'Vui lòng chọn ghế ngồi'
                      : totalAmount === 0
                      ? 'Chưa chọn món nào'
                      : isSubmitting
                      ? 'Đang gửi đơn...'
                      : 'Gửi Đơn Phục Vụ Tận Ghế'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Slide-up Bottom Sheet khi bấm 'Xem giỏ' */}
        {isMobileCartOpen && !isSuccess && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
            onClick={() => setIsMobileCartOpen(false)}
          >
            <div
              className="w-full max-h-[82vh] bg-cinema-900 border-t border-cinema-700 rounded-t-3xl p-4 flex flex-col shadow-2xl animate-slide-up space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-cinema-800">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <h4 className="font-extrabold text-white text-sm">Giỏ Hàng & Vị Trí Giao</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {totalItemsCount} món
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="w-7 h-7 rounded-full bg-cinema-800 text-slate-300 flex items-center justify-center hover:bg-cinema-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1 max-h-[50vh]">
                {renderLocationSection()}
                {renderCartItemsList()}
              </div>

              <div className="pt-3 border-t border-cinema-800 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-slate-400">Tổng thanh toán:</div>
                  <div className="text-base font-black text-amber-400 font-mono">
                    {totalAmount.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting || totalAmount === 0 || !seatCode}
                  onClick={handleOrder}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 text-white font-extrabold text-xs shadow-glow-red flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đơn'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
