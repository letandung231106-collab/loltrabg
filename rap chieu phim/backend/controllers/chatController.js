const db = require('../config/database');

/**
 * Controller xử lý hội thoại Chatbot CinemaBot AI
 */
async function handleChat(req, res) {
  const { message } = req.body;

  console.log(`[Chatbot] 📥 Nhận request chat: "${message}"`);

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Nội dung tin nhắn không được để trống.',
    });
  }

  const query = message.trim();
  const lowerQuery = query.toLowerCase();

  try {
    // 1. Lấy dữ liệu phim và suất chiếu đang mở từ cơ sở dữ liệu
    let movies = [];
    let schedules = [];
    try {
      movies = await db.query(
        "SELECT id, name, genre, duration, format, rating, release_date FROM movies WHERE status = 'now_showing' LIMIT 8"
      );
      schedules = await db.query(
        `SELECT s.id, s.start_time, s.price, s.format, m.name AS movie_name, r.name AS room_name 
         FROM schedules s 
         JOIN movies m ON s.movie_id = m.id 
         JOIN rooms r ON s.room_id = r.id 
         WHERE s.status = 'scheduled' 
         ORDER BY s.start_time ASC LIMIT 6`
      );
    } catch (dbErr) {
      console.warn('[Chatbot] ⚠️ Không thể truy vấn DB đầy đủ, dùng bộ nhớ đệm:', dbErr.message);
    }

    // 2. Kiểm tra nếu có cấu hình Google Gemini API Key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    if (geminiApiKey && geminiApiKey.trim()) {
      try {
        console.log(`[Chatbot] 🤖 Đang gọi Google Gemini API (${geminiModel})...`);
        const moviesContext = movies.map(m => `- ${m.name} (${m.genre}, ${m.duration} phút, ${m.format})`).join('\n');
        const schedulesContext = schedules.map(s => `- ${s.movie_name} lúc ${s.start_time} tại ${s.room_name} (${Number(s.price).toLocaleString('vi-VN')}đ)`).join('\n');

        const systemInstruction = `Bạn là CinemaBot - trợ lý ảo thông minh và thân thiện của Rạp chiếu phim Night Movie.
Nhiệm vụ: tư vấn phim hot, lịch chiếu, giá vé, bắp nước, ghế ngồi đẹp và voucher cho khách hàng.
Dữ liệu phim đang chiếu tại rạp:
${moviesContext || 'Dune: Hành Tinh Cát 2, Oppenheimer, Mai, Godzilla x Kong'}
Suất chiếu gần nhất:
${schedulesContext || 'Các suất chiếu mở từ 09:00 đến 23:00 hàng ngày'}
Voucher: Giảm 20.000đ khi quay Vòng Quay May Mắn.
Ghế đẹp: Hàng D, E, F (ghế 5, 6, 7) là vị trí Sweet Spot âm thanh Dolby Atmos tốt nhất.
Thông tin liên hệ CSKH: Hotline 0375358344, Email letandung231106@gmail.com.
Yêu cầu: Trả lời ngắn gọn (dưới 120 từ), nhiệt tình, hoàn toàn bằng tiếng Việt có emoji rạp phim sinh động.`;

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey.trim()}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const aiResponse = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemInstruction}\n\nKhách hàng hỏi: "${query}"\nTrả lời:` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            }
          })
        });

        clearTimeout(timeoutId);

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const replyText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText && replyText.trim()) {
            console.log('[Chatbot] ✅ Gemini API phản hồi thành công');
            return res.status(200).json({
              success: true,
              reply: replyText.trim(),
              provider: 'gemini',
              quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay', '🎡 Quay voucher', '💡 Ghế Sweet Spot']
            });
          }
        } else {
          const errBody = await aiResponse.text();
          console.warn(`[Chatbot] ⚠️ Lỗi từ Gemini API (Status ${aiResponse.status}):`, errBody.slice(0, 200));
        }
      } catch (aiErr) {
        console.warn('[Chatbot] ⚠️ Lỗi kết nối AI API (sẽ dùng bộ máy NLP rạp phim nội bộ):', aiErr.message);
      }
    }

    // 3. Bộ máy tri thức NLP Rạp phim thông minh (Cinema Knowledge Engine)
    console.log('[Chatbot] 💡 Xử lý bằng Cinema Knowledge Engine nội bộ');
    const localReply = generateCinemaResponse(lowerQuery, movies, schedules);

    return res.status(200).json({
      success: true,
      reply: localReply.text,
      quickReplies: localReply.quickReplies || ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay', '🎡 Quay voucher', '🍿 Menu bắp nước'],
      actionType: localReply.actionType,
      actionLabel: localReply.actionLabel,
      provider: 'cinema-engine'
    });
  } catch (error) {
    console.error('[Chatbot] ❌ Lỗi xử lý chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Xin lỗi, trợ lý rạp đang gặp sự cố kết nối, bạn vui lòng thử lại sau nhé!',
    });
  }
}

/**
 * Hàm phân tích câu hỏi và sinh phản hồi chuẩn rạp phim tiếng Việt
 */
function generateCinemaResponse(q, movies = [], schedules = []) {
  // 1. Chào hỏi (hello, hi, xin chào) - dùng word boundary để tránh khớp nhầm "phim", "chiếu" (chứa 'hi')
  const isGreeting = /\b(hello|hi|hey|alo)\b/i.test(q) || q.includes('chào');
  if (isGreeting) {
    return {
      text: 'Xin chào! Tôi là **CinemaBot** - Trợ lý đặt vé và chăm sóc khách hàng của Rạp Night Movie 🍿🎬.\n\nTôi có thể giúp bạn:\n- 🎬 Tra cứu danh sách **phim hot đang chiếu**\n- 📅 Xem **lịch chiếu & giá vé** hôm nay\n- 💡 Hướng dẫn chọn **vị trí ghế vàng Sweet Spot**\n- 🎡 Tham gia **Vòng quay may mắn** nhận voucher giảm 20.000đ\n\nBạn cần hỗ trợ phim gì ạ?',
      quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay', '🎡 Quay voucher', '🍿 Menu bắp nước']
    };
  }

  // 2. Suất chiếu & Lịch chiếu
  if (q.includes('lịch') || q.includes('suất') || q.includes('hôm nay') || q.includes('tối nay') || q.includes('giờ')) {
    let schedText = '';
    if (schedules && schedules.length > 0) {
      schedText = schedules.slice(0, 4).map(s => `• **${s.movie_name}**: ${s.start_time?.slice(11, 16) || '19:30'} - ${s.room_name} (${Number(s.price).toLocaleString('vi-VN')}đ)`).join('\n');
    } else {
      schedText = '• **Dune 2**: 18:30 (Phòng IMAX Laser)\n• **Oppenheimer**: 19:45 (Phòng Dolby Atmos)\n• **Mai**: 20:15 (Phòng Gold Class)';
    }

    return {
      text: `📅 Lịch chiếu hôm nay tại Night Movie:\n\n${schedText}\n\nBạn có thể vào mục **"Lịch Chiếu"** để chọn ghế và đặt vé ngay!`,
      actionType: 'schedules',
      actionLabel: '📅 Xem Bảng Lịch Chiếu Chi Tiết',
      quickReplies: ['🔥 Phim hot đang chiếu', '💡 Ghế Sweet Spot', '🍿 Menu bắp nước']
    };
  }

  // 3. Phim hot đang chiếu
  if (q.includes('phim') || q.includes('hot') || q.includes('chiếu') || q.includes('bom tấn')) {
    let listText = '';
    if (movies && movies.length > 0) {
      listText = movies.slice(0, 4).map((m, idx) => `${idx + 1}. **${m.name}** (${m.genre || 'Hành động'} - ${m.duration || 120}p)`).join('\n');
    } else {
      listText = '1. **Dune: Hành Tinh Cát 2** (Sci-Fi - 166p)\n2. **Oppenheimer** (Kịch tính - 180p)\n3. **Mai** (Tâm lý - 131p)\n4. **Godzilla x Kong** (Hành động - 115p)';
    }

    return {
      text: `🔥 Danh sách **phim hot đang chiếu** tại Night Movie:\n\n${listText}\n\nBạn muốn xem trailer hay đặt vé phim nào để tôi hướng dẫn nhé!`,
      actionType: 'movies',
      actionLabel: '🎬 Khám Phá Toàn Bộ Phim',
      quickReplies: ['🎫 Suất chiếu tối nay', '🎡 Quay voucher', '💡 Ghế Sweet Spot']
    };
  }

  // 4. Voucher & Khuyến mãi
  if (q.includes('voucher') || q.includes('quay') || q.includes('khuyến mãi') || q.includes('giảm') || q.includes('ưu đãi')) {
    return {
      text: '🎁 **Vòng Quay May Mắn Night Movie** đang diễn ra!\nBạn có thể trúng:\n- Voucher giảm **20.000đ** cho vé xem phim\n- Giảm **15%** tổng hóa đơn\n- Combo bắp rang ngọt miễn phí!\n\nHãy bấm nút bên dưới để quay ngay nhé!',
      actionType: 'lucky_wheel',
      actionLabel: '🎡 Mở Vòng Quay May Mắn',
      quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Đặt vé phim']
    };
  }

  // 5. Vị trí ghế ngồi (Sweet Spot)
  if (q.includes('ghế') || q.includes('vị trí') || q.includes('sweet spot') || q.includes('chỗ ngồi') || q.includes('đẹp')) {
    return {
      text: '💡 **Mẹo chọn vị trí ghế vàng (Sweet Spot)**:\n- **Hàng D, E, F (Ghế 5, 6, 7)** là vị trí trực diện góc nhìn chuẩn Hollywood, không mỏi mắt mỏi cổ.\n- Đây là tâm điểm hội tụ âm trường vòm **Dolby Atmos 7.1** sống động nhất!\n- Khi chọn ghế bạn có thể bấm **"Xem Góc Nhìn 3D"** để ngắm trước phòng chiếu.',
      quickReplies: ['🎫 Suất chiếu tối nay', '🔥 Phim hot đang chiếu']
    };
  }

  // 6. Bắp nước F&B
  if (q.includes('bắp') || q.includes('nước') || q.includes('ăn') || q.includes('combo') || q.includes('popcorn')) {
    return {
      text: '🍿 **Menu Bắp & Nước Night Movie**:\n- **Combo Solo**: 1 Bắp Rang Bơ + 1 Nước ngọt lớn (75.000đ)\n- **Combo Couple**: 1 Bắp Rang Bơ lớn + 2 Nước ngọt (105.000đ)\n- Đặc biệt: Có dịch vụ **Gọi Món Tận Ghế** mang thức ăn vào tận phòng chiếu cho bạn!',
      actionType: 'in_seat_delivery',
      actionLabel: '🍿 Mở Gọi Món Tận Ghế',
      quickReplies: ['🔥 Phim hot đang chiếu', '🎡 Quay voucher']
    };
  }

  // 7. Giá vé
  if (q.includes('giá') || q.includes('tiền') || q.includes('bao nhiêu')) {
    return {
      text: '🎟️ **Bảng giá vé rạp Night Movie**:\n- Vé 2D Tiêu Chuẩn: **75.000đ - 90.000đ**\n- Vé 2D VIP: **85.000đ - 100.000đ**\n- Vé 3D / IMAX Laser: **120.000đ - 145.000đ**\n- Học sinh/Sinh viên & Thành viên: Giảm thêm **15%** kèm voucher may mắn!',
      actionType: 'schedules',
      actionLabel: '📅 Xem Lịch Chiếu & Đặt Vé',
      quickReplies: ['🔥 Phim hot đang chiếu', '🎡 Quay voucher']
    };
  }

  // Mặc định
  return {
    text: `CinemaBot đã ghi nhận câu hỏi của bạn: "${q}".\nTôi có thể hỗ trợ bạn:\n1. 🎬 Tra cứu danh sách **phim hot đang chiếu**\n2. 📅 Xem **lịch chiếu hôm nay**\n3. 💡 Hướng dẫn chọn **ghế ngồi đẹp nhất**\n4. 🎁 Nhận **voucher giảm giá**\n\nBạn vui lòng chọn một trong các gợi ý bên dưới hoặc hỏi chi tiết hơn nhé!`,
    quickReplies: ['🔥 Phim hot đang chiếu', '🎫 Suất chiếu tối nay', '🎡 Quay voucher', '🍿 Menu bắp nước']
  };
}

module.exports = {
  handleChat,
};
