import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null); // { bookingId, bookingCode, holdExpire, totalAmount, seats }
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState(null);
  const [isHolding, setIsHolding] = useState(false);

  // Countdown timer for 10-minute seat hold
  useEffect(() => {
    let timer = null;

    if (activeBooking && activeBooking.holdExpire) {
      const updateTimer = () => {
        const expireTime = new Date(activeBooking.holdExpire).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((expireTime - now) / 1000));

        setHoldRemainingSeconds(diffSeconds);

        if (diffSeconds <= 0) {
          // Time expired -> clear holding state
          setIsHolding(false);
          setActiveBooking(null);
          setSelectedSeats([]);
          clearInterval(timer);
          alert('Thời gian giữ ghế 10 phút đã hết hạn. Các ghế đã được tự động mở lại cho khách khác!');
        }
      };

      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setHoldRemainingSeconds(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeBooking]);

  // Format MM:SS
  const formattedHoldTime = () => {
    if (holdRemainingSeconds === null || holdRemainingSeconds <= 0) return '00:00';
    const minutes = Math.floor(holdRemainingSeconds / 60);
    const seconds = holdRemainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleSeatSelection = (seat) => {
    if (seat.state !== 'available' && !selectedSeats.some((s) => s.id === seat.id)) {
      return; // Can't select holding or booked seats
    }

    if (selectedSeats.some((s) => s.id === seat.id)) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 8) {
        alert('Bạn chỉ có thể chọn tối đa 8 ghế trong một lần đặt vé.');
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
    }
  };

  // Bắt đầu giữ ghế (Hold Seats with Backend Lock)
  const proceedToHoldSeats = async () => {
    if (!selectedSchedule || selectedSeats.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một ghế.');
    }

    const seatIds = selectedSeats.map((s) => s.id);
    const res = await api.holdSeats(selectedSchedule.id, seatIds);

    if (res.success && res.data) {
      setActiveBooking(res.data);
      setIsHolding(true);
      return res.data;
    }
    throw new Error(res.message || 'Không thể giữ ghế.');
  };

  // Hủy giữ ghế chủ động
  const cancelHold = async () => {
    if (activeBooking?.bookingId) {
      try {
        await api.releaseSeatHold(activeBooking.bookingId);
      } catch (err) {
        console.warn('Lỗi khi giải phóng ghế:', err.message);
      }
    }
    setActiveBooking(null);
    setIsHolding(false);
    setSelectedSeats([]);
  };

  const resetBookingState = () => {
    setSelectedSchedule(null);
    setSelectedSeats([]);
    setActiveBooking(null);
    setIsHolding(false);
    setHoldRemainingSeconds(null);
  };

  return (
    <BookingContext.Provider
      value={{
        selectedSchedule,
        setSelectedSchedule,
        selectedSeats,
        setSelectedSeats,
        toggleSeatSelection,
        activeBooking,
        setActiveBooking,
        isHolding,
        holdRemainingSeconds,
        formattedHoldTime,
        proceedToHoldSeats,
        cancelHold,
        resetBookingState,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
