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
} from 'lucide-react';

/**
 * Phân tích ngày giờ an toàn tuyệt đối cho Safari macOS (hỗ trợ cả dấu cách và chữ 'T')
 */
const parseSafeDate = (dStr) => {
  if (!dStr) return null;
  if (dStr instanceof Date) return isNaN(dStr.getTime()) ? null : dStr;
  const s = String(dStr).trim().replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * So sánh 2 ngày có cùng ngày/tháng/năm hay không (theo giờ địa phương)
 */
const isSameDate = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export function InSeatDeliveryModal({ isOpen, onClose }) {
  const { user, isStaff } = useAuth();

  // Thông tin phòng, ghế và ghi chú
  const [room, setRoom] = useState('');
  const [seatCode, setSeatCode] = useState('');
  const [note, setNote] = useState('');

  // Giỏ hàng món bắp nước
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Trạng thái xử lý và gửi đơn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Dành cho Customer (Khách hàng): Danh sách vé hôm nay
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState('');

  // Dành cho Staff / Admin / Manager: Danh sách phòng và ghế
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomSeats, setRoomSeats] = useState([]);

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
        // Fallback: Dựng danh sách ghế 6 hàng (A-F), mỗi hàng 12 ghế. Hàng F là ghế đôi
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
      // Quy tắc dựng fallback 6x12 khi API lỗi
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

  // Khởi tạo dữ liệu phù hợp theo vai trò (Customer hoặc Staff/Admin/Manager)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingData(true);
    setSubmitError('');

    const initModalData = async () => {
      try {
        if (isStaff) {
          // 1. Phân quyền Staff / Admin / Manager: Chọn phòng từ API và danh sách ghế của phòng
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
          // 2. Phân quyền Customer: Lấy vé từ api.getMyTickets(), lọc vé hợp lệ hôm nay
          const resTickets = await api.getMyTickets();
          const allTickets = resTickets?.data || resTickets || [];

          const now = new Date();
          const valid = allTickets.filter((t) => {
            // Chỉ giữ vé trạng thái 'active'
            if (String(t.status || '').toLowerCase() !== 'active') return false;

            // Suất chiếu phải có ngày giờ hợp lệ
            const start = parseSafeDate(t.start_time);
            let end = parseSafeDate(t.end_time);
            if (!end && start) {
              const dur = Number(t.duration) || 120;
              end = new Date(start.getTime() + dur * 60 * 1000);
            }
            if (!start || !end) return false;

            // Suất chiếu hôm nay
            const isToday = isSameDate(start, now);
            if (!isToday) return false;

            // Chưa kết thúc: end >= now hoặc trong cùng ngày chiếu trong vòng 4 tiếng sau suất chiếu
            const notEnded =
              end.getTime() >= now.getTime() ||
              (isToday && now.getTime() - end.getTime() <= 4 * 60 * 60 * 1000);
            return notEnded;
          });

          if (!isMounted) return;

          // Chuẩn hóa nhãn hiển thị cho mỗi vé: "Ghế · Phòng · Tên phim giờ chiếu"
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

          // Nếu có vé, tự động chọn sẵn vé đầu tiên và điền thông tin phòng
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

        // 3. Tải danh sách món bắp nước F&B từ API
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

  const getItemQty = (itemId) => {
    const found = cart.find((c) => c.id === itemId);
    return found ? found.quantity : 0;
  };

  const handleItemQtyChange = (item, delta) => {
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

  // Staff đổi phòng chiếu
  const handleStaffRoomChange = async (e) => {
    const newRoomId = Number(e.target.value);
    setSelectedRoomId(newRoomId);
    const matched = rooms.find((r) => Number(r.id) === newRoomId);
    if (matched) {
      setRoom(matched.name);
    }
    await loadStaffSeats(newRoomId, true);
  };

  // Customer đổi vé xem phim
  const handleCustomerTicketChange = (e) => {
    const ticketId = e.target.value;
    setSelectedTicketId(ticketId);
    const selected = tickets.find((t) => String(t.id) === String(ticketId));
    if (selected) {
      setRoom(selected.room_name || '');
      setSeatCode(selected.seatCode || '');
    }
  };

  // Xử lý gửi đơn hàng giao tận ghế
  const handleOrder = async () => {
    if (cart.length === 0 || !seatCode || totalAmount === 0) return;
    setIsSubmitting(true);
    setSubmitError('');

    const clientNote = note?.trim() || '';
    const formattedNotes = `Giao tận ghế | Phòng: ${room} | Ghế: ${seatCode} | Ghi chú: ${clientNote}`;

    try {
      // Gửi đơn bắp nước kèm ghi chú vị trí phòng, ghế và ghi chú khách
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
    } catch (err) {
      console.warn('Lỗi gọi bắp nước tận ghế:', err);
      // Khi API lỗi: Giữ nguyên giỏ hàng, KHÔNG hiện thành công giả
      setSubmitError(err?.message || 'Có lỗi xảy ra khi gửi đơn đặt bắp nước. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gom nhóm ghế theo hàng A-F cho Staff
  const groupedStaffSeats = roomSeats.reduce((acc, s) => {
    const row = s.row || 'Khác';
    if (!acc[row]) acc[row] = [];
    acc[row].push(s);
    return acc;
  }, {});

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
        className="relative w-full max-w-[600px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl bg-[#12151f] border border-white/10 shadow-2xl animate-scale-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
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
        {/* Nút Đóng (X) cố định ở góc trên bên phải */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Đóng (phím ESC)"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 py-4 bg-cinema-950/90 border-b border-cinema-800 flex items-center justify-between shrink-0 pr-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-glow-amber">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Gọi Bắp Nước Tận Ghế Ngồi
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  In-Seat Delivery
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Nhân viên sẽ mang bắp nước nóng hổi vào tận phòng chiếu cho bạn!
              </p>
            </div>
          </div>
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
          {isSuccess ? (
            <div className="p-8 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
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
            <div className="space-y-5">
              {/* Lỗi submit đơn hàng */}
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitError('')}
                    className="text-slate-400 hover:text-white p-1"
                    title="Ẩn thông báo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Delivery Location inputs */}
              <div className="p-4 rounded-2xl bg-cinema-950 border border-cinema-800 space-y-3 text-xs">
                <div className="flex items-center justify-between font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> Vị Trí Của Bạn Trong Rạp
                  </span>
                  {room && seatCode && (
                    <span className="text-[11px] font-mono text-slate-300 font-bold normal-case bg-cinema-900 px-2.5 py-0.5 rounded-lg border border-cinema-700/60">
                      {room} - Ghế {seatCode}
                    </span>
                  )}
                </div>

                {isLoadingData ? (
                  <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Đang tải thông tin phòng và ghế...</span>
                  </div>
                ) : isStaff ? (
                  /* ================= GIAO DIỆN DÀNH CHO ADMIN / MANAGER / STAFF ================= */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          Phòng chiếu (API):
                        </label>
                        <select
                          value={selectedRoomId}
                          onChange={handleStaffRoomChange}
                          className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                        >
                          {rooms.map((r) => (
                            <option key={r.id} value={r.id} className="bg-cinema-900 text-white">
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          Số ghế ngồi (Nhóm theo hàng A-F):
                        </label>
                        <select
                          value={seatCode}
                          onChange={(e) => setSeatCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500 max-h-60 overflow-y-auto"
                        >
                          {Object.keys(groupedStaffSeats).length === 0 ? (
                            <option value="">Không có ghế</option>
                          ) : (
                            Object.entries(groupedStaffSeats).map(([rowLetter, seatsInRow]) => (
                              <optgroup
                                key={rowLetter}
                                label={`Hàng ${rowLetter}${rowLetter === 'F' ? ' (Ghế Đôi - 2 chỗ)' : ''}`}
                                className="bg-cinema-950 text-amber-400 font-sans font-bold"
                              >
                                {seatsInRow.map((s) => (
                                  <option
                                    key={s.seatCode}
                                    value={s.seatCode}
                                    className="bg-cinema-900 text-white font-mono"
                                  >
                                    {s.label}
                                  </option>
                                ))}
                              </optgroup>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= GIAO DIỆN DÀNH CHO CUSTOMER (KHÁCH HÀNG) ================= */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          Phòng chiếu (Tự điền theo vé):
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={room || 'Chưa có phòng'}
                          className="w-full px-3 py-2 rounded-xl bg-cinema-900/60 border border-cinema-800 text-slate-300 text-xs font-semibold focus:outline-none cursor-not-allowed select-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          Số ghế ngồi của bạn:
                        </label>
                        <select
                          value={selectedTicketId}
                          onChange={handleCustomerTicketChange}
                          disabled={tickets.length === 0}
                          className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed max-h-60 overflow-y-auto"
                        >
                          {tickets.length === 0 ? (
                            <option value="">Không có vé phù hợp</option>
                          ) : (
                            tickets.map((t) => (
                              <option
                                key={t.id}
                                value={t.id}
                                className="bg-cinema-900 text-white font-sans text-xs"
                              >
                                {t.displayLabel}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {tickets.length === 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>Bạn chưa có vé cho suất đang chiếu hôm nay</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Ghi chú cho nhân viên (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Vd: Xin thêm đá, ít phô mai, mang khăn giấy..."
                    className="w-full px-3 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Menu bắp nước F&B (Lưới 2 cột) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Coffee className="w-4 h-4" /> Thực Đơn Bắp Nước Rạp Chiếu
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal normal-case">
                    {menuItems.length} món sẵn sàng phục vụ
                  </span>
                </div>

                {isLoadingMenu ? (
                  <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Đang tải thực đơn bắp nước...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
                    {menuItems.map((item) => {
                      const qty = getItemQty(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                            qty > 0
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                              : 'bg-cinema-900/80 border-cinema-800 hover:border-cinema-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-cinema-700"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-cinema-800 border border-cinema-700 flex items-center justify-center text-amber-400 shrink-0">
                                <Utensils className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate" title={item.name}>
                                {item.name}
                              </div>
                              <div className="text-amber-400 font-mono font-bold text-xs">
                                {(Number(item.price) || 0).toLocaleString('vi-VN')} đ
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {qty > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleItemQtyChange(item, -1)}
                                  className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                                  title="Giảm 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-4 text-center font-mono font-bold text-amber-400 text-xs">
                                  {qty}
                                </span>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleItemQtyChange(item, 1)}
                              className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-cinema-950 flex items-center justify-center font-bold text-xs transition-colors shadow cursor-pointer"
                              title="Thêm món"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cart Items (Món Đang Chọn) */}
              <div className="space-y-2 pt-2 border-t border-cinema-800/80">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <span>Món Đang Chọn:</span>
                  {cart.length > 0 && (
                    <span className="text-[11px] font-mono text-amber-400 normal-case">
                      {cart.reduce((s, c) => s + c.quantity, 0)} phần
                    </span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="p-3 rounded-xl bg-cinema-900/60 border border-dashed border-cinema-800 text-center text-xs text-slate-400">
                    Chưa chọn món nào. Hãy bấm dấu <strong className="text-amber-400 font-bold">+</strong> ở thực đơn phía trên để thêm món.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-cinema-850/80 border border-cinema-700/60 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-white truncate">{item.name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">
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
                            className="w-6 h-6 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white flex items-center justify-center font-bold cursor-pointer"
                            title="Giảm 1 món"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-amber-400">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleItemQtyChange(item, 1)}
                            className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-cinema-950 flex items-center justify-center font-bold cursor-pointer"
                            title="Thêm 1 món"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total & Submit */}
              <div className="pt-3 border-t border-cinema-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Tổng tiền gọi món:</div>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {totalAmount.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting || totalAmount === 0 || !seatCode}
                  onClick={handleOrder}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-ruby-600 via-rose-600 to-ruby-700 hover:from-ruby-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-glow-red transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {!seatCode
                      ? 'Vui lòng chọn ghế'
                      : totalAmount === 0
                      ? 'Chưa chọn món'
                      : isSubmitting
                      ? 'Đang gửi...'
                      : 'Gửi Đơn Phục Vụ Tận Ghế'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
