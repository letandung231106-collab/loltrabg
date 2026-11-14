import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Headphones,
  Mic,
  MicOff,
  Send,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Film,
  Calendar,
  Clock,
  Ticket,
  ChevronRight,
  Gift,
  Compass,
  Coffee,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { cinemaSound } from '../../services/cinemaSound';

export function CinemaBotModal({
  onSelectMovie,
  onSelectSchedule,
  onNavigate,
  onOpenLuckyWheel,
  onOpenInSeatDelivery
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [moviesList, setMoviesList] = useState([]);
  const [schedulesList, setSchedulesList] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! Tôi là trợ lý rạp Night Movie 🍿🎬. Tôi có thể hỗ trợ bạn tra cứu lịch chiếu, vị trí ghế ngồi hoặc giải đáp thắc mắc về dịch vụ!',
      quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay', '🎡 Quay voucher', '💡 Ghế Sweet Spot']
    }
  ]);

  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Load movies & schedules for local natural language matching
  useEffect(() => {
    loadCinemaData();
    initSpeechRecognition();
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const loadCinemaData = async () => {
    try {
      const [resMovies, resSchedules] = await Promise.all([
        api.getMovies({ status: 'now_showing' }).catch(() => ({ data: [] })),
        api.getSchedules().catch(() => ({ data: [] }))
      ]);
      if (resMovies?.data) setMoviesList(resMovies.data);
      if (resSchedules?.data) setSchedulesList(resSchedules.data);
    } catch (e) {
      console.warn('CinemaBot: Could not preload movies/schedules', e);
    }
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = 'vi-VN';

      recog.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join('');
        setInput(transcript);
      };

      recog.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói qua Web Speech API. Bạn hãy gõ câu hỏi vào khung chat nhé!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Error starting voice recognition:', err);
      }
    }
  };

  const speakText = (text) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Remove markdown bold marks before speaking
      const cleanText = text.replace(/[*#_`]/g, '').slice(0, 150);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      cinemaSound.playTicketChime();
    } catch (e) {}

    // Tạo timeout 10 giây cho request để tránh treo giao diện
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);

    try {
      // 1. Gửi request đến backend REST API (/api/chat)
      const res = await api.sendChatMessage(query, { signal: abortController.signal });
      clearTimeout(timeoutId);

      if (res && res.success && res.reply) {
        const botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: res.reply,
          quickReplies: res.quickReplies || ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay', '🎡 Quay voucher'],
          actionType: res.actionType,
          actionLabel: res.actionLabel,
        };
        setMessages((prev) => [...prev, botMsg]);
        speakText(botMsg.text);
      } else {
        throw new Error(res?.message || 'Phản hồi từ máy chủ không hợp lệ');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[CinemaBot] API chat error, attempting local fallback:', err.message);

      // 2. Nếu API lỗi hoặc timeout, sử dụng local fallback an toàn và hiển thị thông báo
      try {
        const fallbackRes = generateBotResponse(query);
        setMessages((prev) => [...prev, fallbackRes]);
        speakText(fallbackRes.text);
      } catch (fallbackErr) {
        console.error('[CinemaBot] Fatal fallback error:', fallbackErr);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: 'Xin lỗi, trợ lý rạp đang gặp sự cố kết nối, bạn vui lòng thử lại sau nhé! ⚠️',
            quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay']
          }
        ]);
      }
    } finally {
      // 3. Luôn tắt trạng thái "đang gõ" (3 chấm)
      setIsTyping(false);
    }
  };

  // Natural Language Understanding Engine
  const generateBotResponse = (query) => {
    const q = query.toLowerCase();

    // 0. Chào hỏi thân thiện (hello, hi, chào) - dùng word boundary để tránh khớp nhầm "phim", "chiếu" (chứa 'hi')
    const isGreeting = /\b(hello|hi|hey|alo)\b/i.test(q) || q.includes('chào');
    if (isGreeting) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Xin chào! Tôi là **CinemaBot** - Trợ lý đặt vé và chăm sóc khách hàng của Rạp Night Movie 🍿🎬.\n\nTôi có thể giúp bạn:\n- 🎬 Tra cứu danh sách **phim hot đang chiếu**\n- 📅 Xem **lịch chiếu & giá vé** hôm nay\n- 💡 Hướng dẫn chọn **vị trí ghế vàng Sweet Spot**\n- 🎡 Tham gia **Vòng quay may mắn** nhận voucher giảm 20.000đ\n\nBạn cần hỗ trợ gì ạ?',
        quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay', '🎡 Quay voucher', '🍿 Menu bắp nước']
      };
    }

    // 1. Voucher / Lucky Wheel
    if (q.includes('voucher') || q.includes('quay') || q.includes('khuyến mãi') || q.includes('mã giảm') || q.includes('giảm giá')) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: '🎁 **Vòng Quay May Mắn Night Movie** đang diễn ra! Bạn có thể nhận ngay voucher giảm 20.000đ, giảm 15% tổng đơn, hoặc bắp rang miễn phí 55k!',
        actionType: 'lucky_wheel',
        actionLabel: '🎡 Mở Vòng Quay May Mắn Ngay',
        quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Đặt vé phim']
      };
    }

    // 2. Sweet spot seats / advice
    if (q.includes('ghế') || q.includes('vị trí') || q.includes('sweet spot') || q.includes('chỗ ngồi') || q.includes('đẹp nhất')) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: '💡 **Mẹo chọn vị trí ghế vàng (Sweet Spot)**:\n- **Hàng D, E, F (Ghế 5, 6, 7)** là góc nhìn trực diện 100% màn hình, không bị mỏi cổ.\n- Đây cũng là tâm điểm đón trọn âm trường hệ thống loa vòm **Dolby Atmos 7.1** rực rỡ nhất!\n- Khi chọn ghế bạn có thể bấm **"Xem Góc Nhìn 3D"** để ngắm phòng chiếu thực tế.',
        quickReplies: ['🎫 Suất chiếu tối nay', '🔥 Phim hot đang chiếu']
      };
    }

    // 3. In-Theater Seat Navigator / Dark Mode flashlight
    if (q.includes('dẫn đường') || q.includes('tìm ghế') || q.includes('tối') || q.includes('đèn pin') || q.includes('bóng tối')) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: '🔦 **Tính năng Dẫn Đường Vào Ghế trong bóng tối**:\nKhi vào phòng chiếu tối, bạn hãy mở trang **"Vé Của Tôi"** và bấm nút **"Dẫn Đường Vào Ghế"** trên vé. Hệ thống sẽ đếm số bậc thang cần leo lên, chỉ dẫn lối đi bên trái/phải và cung cấp **đèn pin dịu mắt** không làm phiền người xung quanh!',
        actionType: 'my_tickets',
        actionLabel: '🎟️ Đến Vé Của Tôi',
        quickReplies: ['🍿 Menu bắp nước', '🔥 Phim hot']
      };
    }

    // 4. Concessions & Food
    if (q.includes('bắp') || q.includes('nước') || q.includes('popcorn') || q.includes('combo') || q.includes('đồ ăn') || q.includes('ăn vặt')) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: '🍿 **Thực đơn Bắp & Nước Night Movie**:\n- **Combo Solo**: 1 Bắp Rang Bơ + 1 Nước ngọt lớn (75.000đ)\n- **Combo Couple**: 1 Bắp Rang Bơ lớn + 2 Nước ngọt (105.000đ)\n- Bắp vị Phô Mai, Caramel thơm béo nóng giòn giã!\n\nĐặc biệt: Bạn có thể chọn bắp nước kèm vé hoặc dùng dịch vụ **Gọi Món Tận Ghế** nhân viên sẽ mang đến tận vị trí ngồi!',
        actionType: 'in_seat_delivery',
        actionLabel: '🍿 Mở Gọi Món Tận Ghế',
        quickReplies: ['🔥 Phim hot đang chiếu', '🎡 Quay voucher']
      };
    }

    // 5. Price / Policies
    if (q.includes('giá vé') || q.includes('bao nhiêu tiền') || q.includes('bảng giá')) {
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: '🎟️ **Bảng giá vé rạp Night Movie**:\n- Vé 2D Tiêu Chuẩn: **75.000đ - 90.000đ**\n- Vé 2D VIP: **85.000đ - 100.000đ**\n- Vé 3D / IMAX Laser: **120.000đ - 145.000đ**\n- Thành viên & Học sinh sinh viên: Giảm thêm **15%** kèm quay voucher may mắn!',
        actionType: 'schedules',
        actionLabel: '📅 Xem Toàn Bộ Lịch Chiếu',
        quickReplies: ['🔥 Phim hot đang chiếu', '🎡 Quay voucher']
      };
    }

    // 6. Specific Movie Search
    const matchedMovie = moviesList.find((m) => {
      const name = (m.name || m.title || '').toLowerCase();
      if (!name) return false;
      return q.includes(name) || (name.includes('lật mặt') && q.includes('lật mặt')) || (name.includes('dune') && q.includes('dune')) || (name.includes('conan') && q.includes('conan'));
    });

    if (matchedMovie) {
      const movieSchedules = schedulesList.filter((s) => s.movie_id === matchedMovie.id);
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: `🎬 Tôi đã tìm thấy phim **${matchedMovie.name || matchedMovie.title}** (${matchedMovie.format || matchedMovie.screening_format || '2D/IMAX'} - ${matchedMovie.duration || 120} phút).\nĐiểm đánh giá: ⭐ **${matchedMovie.rating || '9.5'}/10**. Bạn có muốn chọn suất chiếu để giữ ghế ngay không?`,
        movieData: matchedMovie,
        schedulesData: movieSchedules.slice(0, 3),
        quickReplies: ['🎫 Xem tất cả suất chiếu', '🎡 Quay voucher']
      };
    }

    // 7. Schedule search (hôm nay, tối nay, mấy giờ)
    if (q.includes('hôm nay') || q.includes('tối nay') || q.includes('suất') || q.includes('lịch')) {
      const topSchedules = schedulesList.slice(0, 4);
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: `📅 Dưới đây là các **suất chiếu đang mở bán vé** hôm nay tại Night Movie:`,
        schedulesData: topSchedules,
        actionType: 'schedules',
        actionLabel: '🔍 Xem Bảng Lịch Chiếu Chi Tiết',
        quickReplies: ['🔥 Phim hot đang chiếu', '💡 Ghế Sweet Spot']
      };
    }

    // 8. Hot movies list (phim hot, phim hay, phim kinh dị, phim hành động)
    if (q.includes('phim') || q.includes('hot') || q.includes('chiếu rạp') || q.includes('kinh dị') || q.includes('hài') || q.includes('hành động')) {
      const sampleMovies = moviesList.slice(0, 3);
      return {
        id: Date.now() + 1,
        sender: 'bot',
        text: `🔥 Danh sách **phim bom tấn đang gây sốt** tại Night Movie:\nBạn có thể chạm vào phim bên dưới để xem trailer và chọn suất chiếu ngay:`,
        moviesListData: sampleMovies,
        actionType: 'movies',
        actionLabel: '🎬 Khám Phá Toàn Bộ Phim',
        quickReplies: ['🎫 Suất chiếu tối nay', '🎡 Quay voucher', '💡 Ghế Sweet Spot']
      };
    }

    // Default conversational fallback
    return {
      id: Date.now() + 1,
      sender: 'bot',
      text: 'Trợ lý Night Movie đã nhận được yêu cầu của bạn! Tôi có thể hỗ trợ bạn:\n1. 🎙️ Tra cứu bằng giọng nói hoặc tìm tên phim bom tấn\n2. 🎫 Xem danh sách suất chiếu hôm nay\n3. 💡 Hướng dẫn chọn vị trí ghế ngồi\n4. 🎁 Khám phá ưu đãi vé rạp',
      quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay', '🎡 Quay voucher', '🍿 Menu bắp nước']
    };
  };

  const handleAction = (type, data) => {
    if (type === 'lucky_wheel' && onOpenLuckyWheel) {
      setIsOpen(false);
      onOpenLuckyWheel();
    } else if (type === 'in_seat_delivery' && onOpenInSeatDelivery) {
      setIsOpen(false);
      onOpenInSeatDelivery();
    } else if (type === 'my_tickets' && onNavigate) {
      setIsOpen(false);
      onNavigate('my-tickets');
    } else if (type === 'movies' && onNavigate) {
      setIsOpen(false);
      onNavigate('movies');
    } else if (type === 'schedules' && onNavigate) {
      setIsOpen(false);
      onNavigate('schedules');
    } else if (type === 'select_movie' && onSelectMovie) {
      setIsOpen(false);
      onSelectMovie(data);
    } else if (type === 'select_schedule' && onSelectSchedule) {
      setIsOpen(false);
      onSelectSchedule(data);
    }
  };

  return (
    <>
      {/* Floating Support Launch Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 transition-transform duration-300 hover:scale-105">
          <div className="hidden sm:flex px-3.5 py-1.5 rounded-2xl bg-cinema-900/90 border border-ruby-500/50 text-white text-xs font-semibold shadow-xl backdrop-blur-md items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>Hỗ trợ trực tuyến & Giọng nói</span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-ruby-600 via-rose-600 to-amber-500 text-white shadow-glow-red flex items-center justify-center relative group hover:scale-110 active:scale-95 transition-all"
            title="Mở Hỗ Trợ Khách Hàng"
          >
            <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-cinema-950 animate-pulse" />
          </button>
        </div>
      )}

      {/* Support Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[130] w-[94vw] sm:w-[420px] max-h-[88vh] h-[640px] flex flex-col rounded-3xl bg-cinema-950/95 border-2 border-ruby-500/60 shadow-[0_0_50px_rgba(225,29,72,0.35)] backdrop-blur-xl overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-cinema-900 via-cinema-850 to-cinema-900 border-b border-cinema-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ruby-600 to-rose-600 flex items-center justify-center text-white shadow-glow-red relative">
                <Headphones className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-cinema-900" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  Hỗ Trợ Khách Hàng
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-ruby-500/20 text-ruby-300 font-bold border border-ruby-500/30">
                    Trực Tuyến
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Trợ lý Night Movie 24/7</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={`p-1.5 rounded-xl transition-colors ${
                  ttsEnabled ? 'text-amber-400 hover:bg-cinema-800' : 'text-slate-500 hover:bg-cinema-800'
                }`}
                title={ttsEnabled ? 'Tắt đọc âm thanh' : 'Bật đọc câu trả lời'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: Date.now(),
                      sender: 'bot',
                      text: 'Cuộc trò chuyện đã được làm mới! Bạn muốn tìm phim nào hôm nay?',
                      quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay', '🎡 Quay voucher']
                    }
                  ])
                }
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-cinema-800 transition-colors"
                title="Làm mới đoạn chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-cinema-800 transition-colors"
                title="Thu nhỏ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice Listening Active Banner */}
          {isListening && (
            <div className="bg-gradient-to-r from-ruby-950 via-rose-900 to-ruby-950 border-b border-ruby-500/50 p-2.5 px-4 flex items-center justify-between text-xs text-rose-200 animate-pulse">
              <div className="flex items-center gap-2 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>Đang lắng nghe giọng nói của bạn... Hãy nói!</span>
              </div>
              <button
                onClick={toggleListening}
                className="px-2.5 py-0.5 rounded-lg bg-ruby-600 text-white font-bold text-[11px]"
              >
                Dừng
              </button>
            </div>
          )}

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-cinema-700">
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div key={m.id} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line shadow-md ${
                      isBot
                        ? 'bg-cinema-900 border border-cinema-700/70 text-slate-200 rounded-tl-sm'
                        : 'bg-gradient-to-r from-ruby-600 to-rose-600 text-white font-medium rounded-tr-sm'
                    }`}
                  >
                    {m.text}

                    {/* Single Movie Card in message */}
                    {m.movieData && (
                      <div className="mt-3 p-2.5 rounded-xl bg-cinema-950/80 border border-cinema-750 flex items-center gap-3">
                        <img
                          src={m.movieData.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400'}
                          alt={m.movieData.title}
                          className="w-12 h-16 object-cover rounded-lg shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-white truncate">{m.movieData.title}</div>
                          <div className="text-[10px] text-amber-400 font-bold mt-0.5">
                            ⭐ {m.movieData.rating || '9.5'} • {m.movieData.age_rating || 'T16'}
                          </div>
                          <button
                            onClick={() => handleAction('select_movie', m.movieData)}
                            className="mt-1.5 px-2.5 py-1 rounded-lg bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-[10px] flex items-center gap-1"
                          >
                            <span>Xem Lịch Chiếu</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Schedules Chips in message */}
                    {m.schedulesData && m.schedulesData.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Suất chiếu gợi ý:</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {m.schedulesData.map((sch) => (
                            <button
                              key={sch.id}
                              onClick={() => handleAction('select_schedule', sch.id)}
                              className="p-2 rounded-xl bg-cinema-850 hover:bg-ruby-600/30 border border-cinema-700 hover:border-ruby-500 text-left transition-all group"
                            >
                              <div className="font-bold text-amber-300 group-hover:text-white flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {sch.start_time
                                  ? new Date(sch.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                  : '18:30'}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {sch.room_name || 'Hall 1'} • {sch.screening_format || '2D'}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Multiple Movies Mini List in message */}
                    {m.moviesListData && m.moviesListData.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {m.moviesListData.map((mov) => (
                          <div
                            key={mov.id}
                            onClick={() => handleAction('select_movie', mov)}
                            className="p-2 rounded-xl bg-cinema-950/80 border border-cinema-750 hover:border-ruby-500 flex items-center justify-between cursor-pointer group transition-all"
                          >
                            <div className="truncate">
                              <span className="font-bold text-white group-hover:text-ruby-400">{mov.title}</span>
                              <span className="text-[10px] text-slate-400 ml-2">({mov.genre || 'Hành động'})</span>
                            </div>
                            <span className="text-[10px] font-bold text-ruby-400 shrink-0">Đặt vé →</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactive Action Button */}
                    {m.actionType && m.actionLabel && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleAction(m.actionType)}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white font-bold text-xs shadow-glow-red flex items-center justify-center gap-1.5 transition-all"
                        >
                          <span>{m.actionLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Replies below bot message */}
                  {isBot && m.quickReplies && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(reply)}
                          className="px-2.5 py-1 rounded-full bg-cinema-850 hover:bg-ruby-600/30 text-slate-300 hover:text-white border border-cinema-750 hover:border-ruby-500 text-[11px] font-medium transition-all"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 p-3 bg-cinema-900 border border-cinema-700/60 rounded-2xl w-24">
                <div className="w-2 h-2 rounded-full bg-ruby-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-ruby-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 bg-cinema-900 border-t border-cinema-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Mic Voice Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-2xl transition-all relative ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-glow-red animate-pulse'
                    : 'bg-cinema-800 hover:bg-cinema-700 text-slate-300 hover:text-white'
                }`}
                title="Bấm để nói bằng giọng nói (Web Speech API)"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-ruby-400" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Đang lắng nghe bạn nói...' : 'Nhập tin nhắn hoặc đặt vé...'}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-cinema-950 border border-cinema-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-ruby-500 transition-colors"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim()}
                className={`p-2.5 rounded-2xl transition-all ${
                  input.trim()
                    ? 'bg-ruby-600 hover:bg-ruby-500 text-white shadow-glow-red'
                    : 'bg-cinema-800 text-slate-600 cursor-not-allowed'
                }`}
                title="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
