const crypto = require('crypto');
const db = require('../config/database');

// Bộ nhớ tạm lưu phiên giao dịch MoMo Sandbox để đối chiếu IPN & Return URL
const pendingMomoOrders = new Map();

/**
 * Cấu hình MoMo Sandbox v2 (từ biến môi trường hoặc thông số Sandbox tiêu chuẩn của MoMo)
 */
function getMomoConfig() {
  return {
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
    accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
    redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:5173',
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:5050/api/payments/momo/ipn',
  };
}

/**
 * Tạo chữ ký HMAC-SHA256 chuẩn MoMo Payment v2
 */
function signHmacSha256(rawSignature, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
}

/**
 * Helper: Hoàn tất thanh toán đơn đặt vé & phát hành vé điện tử (Idempotent)
 */
async function finalizeBookingTransaction({
  bookingId,
  paymentMethod = 'momo',
  transactionCode,
  simulateFailure = false,
  user = {},
}) {
  const customerId = user.customerId || user.id || 1;

  return await db.withTransaction(async (conn) => {
    // 1. Kiểm tra thông tin đơn đặt vé
    const [bookings] = await conn.query(
      `SELECT b.*, s.movie_id, s.room_id, s.start_time, m.name AS movie_name, r.name AS room_name
       FROM bookings b
       JOIN screening_schedules s ON b.screening_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE b.id = ?
       FOR UPDATE`,
      [bookingId]
    );

    if (!bookings || bookings.length === 0) {
      throw new Error('Đơn đặt vé không tồn tại hoặc đã hết hạn.');
    }

    const booking = bookings[0];

    // Kiểm tra quyền sở hữu nếu có thông tin user customer
    if (
      user.role === 'customer' &&
      booking.customer_id &&
      booking.customer_id !== customerId &&
      booking.customer_id !== user.id
    ) {
      throw new Error('Bạn không có quyền thanh toán đơn đặt vé này.');
    }

    // Idempotent: Nếu đơn đã được thanh toán (ví dụ do IPN đã xử lý trước khi Return URL gọi về)
    if (booking.status === 'paid') {
      const [existingTickets] = await conn.query(
        `SELECT * FROM tickets WHERE booking_id = ?`,
        [bookingId]
      );
      const formattedTickets = (existingTickets || []).map((t) => ({
        id: t.id,
        ticketCode: t.ticket_code,
        seat: `${t.row_number || ''}${t.seat_number || ''}`,
        row_number: t.row_number,
        seat_number: t.seat_number,
        price: Math.round(booking.total_amount / Math.max(1, existingTickets.length)),
      }));

      return {
        paymentStatus: 'success',
        alreadyPaid: true,
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        transactionCode: transactionCode || `MOMO-${booking.booking_code}`,
        totalAmount: booking.total_amount,
        movieName: booking.movie_name,
        roomName: booking.room_name,
        screeningTime: booking.start_time,
        tickets: formattedTickets,
      };
    }

    if (booking.status === 'cancelled' || booking.status === 'expired') {
      throw new Error('Đơn đặt vé này đã bị hủy hoặc hết hạn thời gian giữ 10 phút. Vui lòng chọn ghế lại.');
    }

    // 2. Kiểm tra các ghế đang giữ của đơn đặt này
    const [heldSeats] = await conn.query(
      `SELECT bs.*, s.row_number, s.seat_number 
       FROM booking_seats bs
       JOIN seats s ON bs.seat_id = s.id
       WHERE bs.booking_id = ? AND bs.status = 'holding'
       FOR UPDATE`,
      [bookingId]
    );

    if (!heldSeats || heldSeats.length === 0) {
      await conn.query(`UPDATE booking_seats SET status = 'released' WHERE booking_id = ?`, [bookingId]);
      await conn.query(`UPDATE bookings SET status = 'expired' WHERE id = ?`, [bookingId]);
      throw new Error('Thời gian giữ ghế 10 phút đã hết hạn hoặc không tìm thấy ghế. Ghế đã được tự động giải phóng.');
    }

    // 3. Nếu giao dịch thất bại hoặc người dùng hủy thanh toán (BR09)
    if (simulateFailure) {
      await conn.query(
        `INSERT INTO payments (booking_id, payment_method, amount, transaction_code, status)
         VALUES (?, ?, ?, ?, 'failed')`,
        [bookingId, paymentMethod, booking.total_amount, transactionCode]
      );
      await conn.query(`UPDATE booking_seats SET status = 'released' WHERE booking_id = ?`, [bookingId]);
      await conn.query(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`, [bookingId]);

      return {
        paymentStatus: 'failed',
        message: 'Giao dịch thanh toán bị từ chối hoặc bị hủy. Ghế đã được tự động giải phóng.',
      };
    }

    // 4. Thanh toán THÀNH CÔNG:
    await conn.query(
      `INSERT INTO payments (booking_id, payment_method, amount, transaction_code, status)
       VALUES (?, ?, ?, ?, 'success')`,
      [bookingId, paymentMethod, booking.total_amount, transactionCode]
    );

    await conn.query(`UPDATE bookings SET status = 'paid' WHERE id = ?`, [bookingId]);
    await conn.query(`UPDATE booking_seats SET status = 'booked' WHERE booking_id = ?`, [bookingId]);

    // Sinh Vé Điện Tử (tickets) cho từng ghế
    const generatedTickets = [];
    for (const seat of heldSeats) {
      const ticketCode = `TCK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${booking.screening_id}-${seat.row_number}${seat.seat_number}`;
      const qrCodePayload = JSON.stringify({
        ticketCode,
        movie: booking.movie_name,
        room: booking.room_name,
        seat: `${seat.row_number}${seat.seat_number}`,
        time: booking.start_time,
        customer: user.name || booking.customer_name || 'Khách hàng',
        paymentMethod: paymentMethod.toUpperCase(),
        transactionCode,
      });

      const [tckRes] = await conn.query(
        `INSERT INTO tickets (booking_id, customer_id, screening_id, seat_id, ticket_code, qr_code, status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [bookingId, customerId, booking.screening_id, seat.seat_id, ticketCode, qrCodePayload]
      );

      generatedTickets.push({
        id: tckRes.insertId,
        ticketCode,
        seat: `${seat.row_number}${seat.seat_number}`,
        row_number: seat.row_number,
        seat_number: seat.seat_number,
        price: seat.price,
      });
    }

    // Tạo thông báo cho khách hàng
    await conn.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, 'booking')`,
      [
        user.id || booking.customer_id || 1,
        'Đặt vé thành công!',
        `Bạn đã thanh toán thành công ${booking.total_amount.toLocaleString('vi-VN')} VNĐ qua ${paymentMethod.toUpperCase()} cho ${generatedTickets.length} vé xem phim "${booking.movie_name}" lúc ${booking.start_time}.`,
      ]
    );

    return {
      paymentStatus: 'success',
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      transactionCode,
      paymentMethod,
      totalAmount: booking.total_amount,
      movieName: booking.movie_name,
      roomName: booking.room_name,
      screeningTime: booking.start_time,
      tickets: generatedTickets,
    };
  });
}

/**
 * 1. XỬ LÝ THANH TOÁN TRỰC TIẾP / MÔ PHỎNG (MỤC 17, 18, 21 - BR08, BR09)
 */
async function processPayment(req, res, next) {
  try {
    const { booking_id, payment_method = 'banking', simulate_failure = false } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã đơn đặt vé (booking_id).',
      });
    }

    const transactionCode = `TXN-${payment_method.toUpperCase()}-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await finalizeBookingTransaction({
      bookingId: booking_id,
      paymentMethod: payment_method,
      transactionCode,
      simulateFailure: simulate_failure,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message:
        result.paymentStatus === 'success'
          ? 'Thanh toán thành công! Vé điện tử đã được phát hành.'
          : result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. KHỞI TẠO GIAO DỊCH MOMO SANDBOX V2 (POST /api/payments/momo/create)
 * Tạo chữ ký điện tử HMAC-SHA256 chuẩn MoMo v2, gọi endpoint test-payment.momo.vn
 * và cung cấp kèm Cổng MoMo Sandbox tương tác trực tiếp.
 */
async function createMomoPayment(req, res, next) {
  try {
    const { booking_id, request_type = 'captureWallet' } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp booking_id để khởi tạo giao dịch MoMo Sandbox.',
      });
    }

    // Kiểm tra đơn đặt vé
    const bookings = await db.query(`SELECT * FROM bookings WHERE id = ?`, [booking_id]);
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn đặt vé.',
      });
    }

    const booking = bookings[0];
    if (booking.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Đơn đặt vé này đã được thanh toán.',
      });
    }
    if (booking.status === 'cancelled' || booking.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'Đơn đặt vé đã hết hạn hoặc bị hủy. Vui lòng chọn ghế lại.',
      });
    }

    const config = getMomoConfig();
    const partnerCode = config.partnerCode;
    const accessKey = config.accessKey;
    const secretKey = config.secretKey;

    const timestamp = Date.now();
    const orderId = `${partnerCode}_${booking.booking_code}_${timestamp}`;
    const requestId = `REQ_${timestamp}`;
    const amount = String(Math.round(Number(booking.total_amount) || 90000));
    const orderInfo = `Thanh toan ve xem phim Night Movie - Ma don ${booking.booking_code}`;
    const redirectUrl = config.redirectUrl;
    const ipnUrl = config.ipnUrl;
    const requestType = ['captureWallet', 'payWithATM', 'payWithCC', 'payWithMethod'].includes(request_type)
      ? request_type
      : 'captureWallet';

    const extraDataPayload = {
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      customerId: req.user.customerId || req.user.id,
      userId: req.user.id,
      userName: req.user.name,
    };
    const extraData = Buffer.from(JSON.stringify(extraDataPayload)).toString('base64');

    // Chuỗi rawHash theo đúng thứ tự alphabet quy định của MoMo v2
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = signHmacSha256(rawSignature, secretKey);

    const momoRequestBody = {
      partnerCode,
      partnerName: 'Night Movie Cinema',
      storeId: 'NightMovieStore',
      requestId,
      amount: Number(amount),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      signature,
    };

    // Lưu phiên giao dịch vào bộ nhớ để đối chiếu khi callback
    const sessionData = {
      orderId,
      requestId,
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      movieName: booking.movie_name || 'Phim Night Movie',
      roomName: booking.room_name || 'Cinema Hall',
      amount: Number(amount),
      orderInfo,
      requestType,
      extraData,
      rawSignature,
      signature,
      redirectUrl,
      ipnUrl,
      partnerCode,
      user: req.user,
      createdAt: new Date().toISOString(),
    };
    pendingMomoOrders.set(orderId, sessionData);

    // Đường dẫn Cổng MoMo Sandbox nội bộ (phục vụ môi trường dev/test hoặc khi key demo công cộng bị giới hạn)
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5050';
    const localSandboxUrl = `${protocol}://${host}/api/payments/momo/sandbox-checkout?orderId=${encodeURIComponent(orderId)}`;

    let momoApiResponse = null;
    let payUrl = localSandboxUrl;
    let qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(localSandboxUrl)}`;
    let deeplink = `momo://app?action=payWithApp&isScanQR=true&orderId=${orderId}&amount=${amount}`;
    let mode = 'sandbox_simulator';

    // Gọi thử tới máy chủ MoMo Sandbox (https://test-payment.momo.vn/v2/gateway/api/create)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(momoRequestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      momoApiResponse = await response.json();
      if (momoApiResponse && momoApiResponse.resultCode === 0 && momoApiResponse.payUrl) {
        payUrl = momoApiResponse.payUrl;
        qrCodeUrl =
          momoApiResponse.qrCodeUrl ||
          `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(momoApiResponse.payUrl)}`;
        deeplink = momoApiResponse.deeplink || deeplink;
        mode = 'momo_cloud_sandbox';
      }
    } catch (fetchErr) {
      console.warn(`[MoMo Sandbox] Sử dụng cổng Local MoMo Sandbox Gateway (${fetchErr.message})`);
    }

    return res.status(200).json({
      success: true,
      message: 'Đã khởi tạo phiên giao dịch MoMo Sandbox v2 thành công!',
      data: {
        mode,
        partnerCode,
        orderId,
        requestId,
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        amount: Number(amount),
        orderInfo,
        requestType,
        signature,
        rawSignature,
        payUrl,
        localSandboxUrl,
        qrCodeUrl,
        deeplink,
        momoCloudResponse: momoApiResponse,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. TRANG CỔNG THANH TOÁN MOMO SANDBOX V2 (GET /api/payments/momo/sandbox-checkout)
 * Mô phỏng chân thực giao diện test-payment.momo.vn với đầy đủ QR Code, Thẻ Test MoMo,
 * tính toán chữ ký HMAC-SHA256 trả về trên Return URL & bắn IPN Webhook.
 */
async function renderMomoSandboxGateway(req, res) {
  const { orderId } = req.query;
  const session = pendingMomoOrders.get(orderId);

  if (!session) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head><meta charset="UTF-8"><title>MoMo Sandbox - Không tìm thấy đơn hàng</title></head>
      <body style="font-family:sans-serif;background:#fdf2f8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="background:white;padding:32px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.1);text-align:center;max-width:420px;">
          <h2 style="color:#a50064;margin-top:0;">Phiên giao dịch MoMo đã hết hạn</h2>
          <p style="color:#475569;font-size:14px;">Không tìm thấy mã đơn hàng <b>${orderId || ''}</b> trên cổng MoMo Sandbox.</p>
          <a href="http://localhost:5173" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#a50064;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Quay về Rạp Night Movie</a>
        </div>
      </body>
      </html>
    `);
  }

  const config = getMomoConfig();
  const transId = Math.floor(2000000000 + Math.random() * 900000000);
  const responseTime = Date.now();
  const orderType = 'momo_wallet';
  const payType = session.requestType === 'payWithATM' ? 'napas' : session.requestType === 'payWithCC' ? 'credit' : 'qr';

  // Tạo chữ ký HMAC-SHA256 cho kịch bản THÀNH CÔNG (resultCode = 0)
  const successMessage = 'Successful.';
  const rawSuccessReturnSig =
    `accessKey=${config.accessKey}` +
    `&amount=${session.amount}` +
    `&extraData=${session.extraData}` +
    `&message=${successMessage}` +
    `&orderId=${session.orderId}` +
    `&orderInfo=${session.orderInfo}` +
    `&orderType=${orderType}` +
    `&partnerCode=${session.partnerCode}` +
    `&payType=${payType}` +
    `&requestId=${session.requestId}` +
    `&responseTime=${responseTime}` +
    `&resultCode=0` +
    `&transId=${transId}`;
  const successSignature = signHmacSha256(rawSuccessReturnSig, config.secretKey);

  const successParams = new URLSearchParams({
    partnerCode: session.partnerCode,
    orderId: session.orderId,
    requestId: session.requestId,
    amount: String(session.amount),
    orderInfo: session.orderInfo,
    orderType,
    transId: String(transId),
    resultCode: '0',
    message: successMessage,
    payType,
    responseTime: String(responseTime),
    extraData: session.extraData,
    signature: successSignature,
  });

  // Tạo chữ ký HMAC-SHA256 cho kịch bản HỦY / THẤT BẠI (resultCode = 1006)
  const cancelMessage = 'Transaction denied by user.';
  const rawCancelReturnSig =
    `accessKey=${config.accessKey}` +
    `&amount=${session.amount}` +
    `&extraData=${session.extraData}` +
    `&message=${cancelMessage}` +
    `&orderId=${session.orderId}` +
    `&orderInfo=${session.orderInfo}` +
    `&orderType=${orderType}` +
    `&partnerCode=${session.partnerCode}` +
    `&payType=${payType}` +
    `&requestId=${session.requestId}` +
    `&responseTime=${responseTime}` +
    `&resultCode=1006` +
    `&transId=${transId}`;
  const cancelSignature = signHmacSha256(rawCancelReturnSig, config.secretKey);

  const cancelParams = new URLSearchParams({
    partnerCode: session.partnerCode,
    orderId: session.orderId,
    requestId: session.requestId,
    amount: String(session.amount),
    orderInfo: session.orderInfo,
    orderType,
    transId: String(transId),
    resultCode: '1006',
    message: cancelMessage,
    payType,
    responseTime: String(responseTime),
    extraData: session.extraData,
    signature: cancelSignature,
  });

  const successRedirectUrl = `${session.redirectUrl}?${successParams.toString()}`;
  const cancelRedirectUrl = `${session.redirectUrl}?${cancelParams.toString()}`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(successRedirectUrl)}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cổng Thanh Toán MoMo Sandbox (Test Environment)</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { margin: 0; background: #f8f0f5; color: #1e293b; min-height: 100vh; display: flex; flex-direction: column; }
    .topbar { background: linear-gradient(90deg, #a50064 0%, #d82d8b 100%); color: white; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 10px rgba(165,0,100,0.25); }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 18px; }
    .momo-logo { width: 38px; height: 38px; border-radius: 10px; background: white; color: #a50064; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; line-height: 1; text-align: center; }
    .badge-sandbox { background: #fef08a; color: #854d0e; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; }
    .container { max-width: 920px; margin: 32px auto; padding: 0 16px; display: grid; grid-template-columns: 340px 1fr; gap: 24px; width: 100%; }
    @media (max-width: 768px) { .container { grid-template-columns: 1fr; } }
    .card { background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(165,0,100,0.08); padding: 24px; border: 1px solid #f3e8ee; }
    .order-title { font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 16px; letter-spacing: 0.5px; }
    .info-row { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px dashed #e2e8f0; }
    .info-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .info-val { font-size: 14px; font-weight: 700; color: #0f172a; word-break: break-all; }
    .amount-val { font-size: 26px; font-weight: 900; color: #a50064; }
    .sig-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; font-family: monospace; font-size: 11px; color: #475569; word-break: break-all; margin-top: 8px; }
    .qr-section { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .qr-frame { padding: 16px; border: 3px solid #a50064; border-radius: 20px; background: white; position: relative; margin: 12px 0 18px; box-shadow: 0 8px 24px rgba(165,0,100,0.15); }
    .btn-group { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 16px; }
    .btn { padding: 14px 20px; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; border: none; transition: all 0.2s; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-success { background: linear-gradient(90deg, #a50064 0%, #d82d8b 100%); color: white; box-shadow: 0 6px 18px rgba(165,0,100,0.3); }
    .btn-success:hover { opacity: 0.94; transform: translateY(-1px); }
    .btn-cancel { background: #f1f5f9; color: #be123c; border: 1px solid #fecdd3; }
    .btn-cancel:hover { background: #ffe4e6; }
    .test-box { width: 100%; background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 14px; text-align: left; font-size: 12px; color: #831843; margin-top: 12px; }
    .timer { display: inline-block; background: #fce7f3; color: #a50064; font-weight: 800; padding: 6px 14px; border-radius: 999px; font-size: 13px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="brand">
      <div class="momo-logo">mo<br/>mo</div>
      <div>Cổng Thanh Toán MoMo <span style="font-weight:400;opacity:0.9;">| Payment Gateway v2</span></div>
    </div>
    <span class="badge-sandbox">SANDBOX TEST ENVIRONMENT</span>
  </div>

  <div class="container">
    <!-- Left Column: Order Details -->
    <div class="card">
      <div class="order-title">Thông tin đơn hàng</div>
      <div class="info-row">
        <div class="info-label">Nhà cung cấp (Merchant)</div>
        <div class="info-val">NIGHT MOVIE CINEMA (${session.partnerCode})</div>
      </div>
      <div class="info-row">
        <div class="info-label">Mã đơn hàng (orderId)</div>
        <div class="info-val" style="font-family:monospace;">${session.orderId}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Mã yêu cầu (requestId)</div>
        <div class="info-val" style="font-family:monospace;">${session.requestId}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Nội dung thanh toán</div>
        <div class="info-val">${session.orderInfo}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Phương thức (requestType)</div>
        <div class="info-val">${session.requestType}</div>
      </div>
      <div class="info-row" style="border-bottom:none;margin-bottom:0;padding-bottom:0;">
        <div class="info-label">Số tiền thanh toán</div>
        <div class="amount-val">${session.amount.toLocaleString('vi-VN')} đ</div>
      </div>

      <div style="margin-top:16px;">
        <div class="info-label">Chữ ký HMAC-SHA256 (signature):</div>
        <div class="sig-box">${session.signature}</div>
      </div>
    </div>

    <!-- Right Column: QR & Sandbox Actions -->
    <div class="card qr-section">
      <div class="timer">Đơn hàng hết hạn sau: <span id="countdown">10:00</span></div>
      <h2 style="margin:6px 0 4px;color:#a50064;font-size:20px;">Quét mã QR hoặc Xác nhận Thanh toán Sandbox</h2>
      <p style="margin:0;color:#64748b;font-size:13px;">Sử dụng App MoMo Developer / Camera hoặc bấm nút mô phỏng kết quả giao dịch bên dưới</p>

      <div class="qr-frame">
        <img src="${qrImgUrl}" width="210" height="210" alt="MoMo Sandbox QR" style="display:block;border-radius:10px;" />
      </div>

      <div class="test-box">
        <strong>Thông tin Ví / Thẻ Test MoMo Sandbox:</strong>
        <div style="margin-top:4px;">• Số điện thoại Ví Test: <code>0909123456</code> | Mật khẩu: <code>123456</code> | OTP: <code>000000</code></div>
        <div>• Thẻ ATM Nội địa Test: <code>97040000000018</code> | Chủ thẻ: <code>NGUYEN VAN A</code> | Ngày phát hành: <code>03/07</code></div>
      </div>

      <div class="btn-group">
        <a href="${successRedirectUrl}" class="btn btn-success" id="btnApprove">
          ✓ Xác Nhận Thanh Toán Thành Công (ResultCode = 0)
        </a>
        <a href="${cancelRedirectUrl}" class="btn btn-cancel">
          ✕ Hủy Giao Dịch / Mô Phỏng Thất Bại (ResultCode = 1006)
        </a>
      </div>
    </div>
  </div>

  <script>
    let sec = 600;
    setInterval(() => {
      sec = Math.max(0, sec - 1);
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      document.getElementById('countdown').textContent = m + ':' + s;
    }, 1000);
  </script>
</body>
</html>
  `);
}

/**
 * 4. XỬ LÝ WEBHOOK IPN TỪ MOMO (POST /api/payments/momo/ipn)
 * Nhận callback server-to-server từ MoMo, kiểm tra chữ ký HMAC-SHA256 và xuất vé.
 */
async function handleMomoIpn(req, res) {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData = '',
      signature,
    } = req.body;

    const config = getMomoConfig();
    const rawSignature =
      `accessKey=${config.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const expectedSignature = signHmacSha256(rawSignature, config.secretKey);
    if (signature && signature !== expectedSignature) {
      console.warn('[MoMo IPN] Chữ ký HMAC-SHA256 không khớp!');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const session = pendingMomoOrders.get(orderId);
    let bookingId = session?.bookingId;
    let user = session?.user || {};

    if (!bookingId && extraData) {
      try {
        const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));
        bookingId = decoded.bookingId;
        user = { id: decoded.userId, customerId: decoded.customerId, name: decoded.userName };
      } catch (e) {
        // ignore decode error
      }
    }

    if (bookingId) {
      const isFailed = Number(resultCode) !== 0;
      await finalizeBookingTransaction({
        bookingId,
        paymentMethod: 'momo',
        transactionCode: `MOMO-${transId || Date.now()}`,
        simulateFailure: isFailed,
        user,
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('[MoMo IPN Error]:', error.message);
    return res.status(500).json({ message: error.message });
  }
}

/**
 * 5. XÁC THỰC KẾT QUẢ TRẢ VỀ TỪ MOMO RETURN URL / CALLBACK (POST /api/payments/momo/momo-return)
 * Kiểm tra chữ ký điện tử MoMo Return URL và hoàn tất xuất vé điện tử.
 */
async function verifyMomoReturn(req, res, next) {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType = 'momo_wallet',
      transId,
      resultCode,
      message = 'Successful.',
      payType = 'qr',
      responseTime,
      extraData = '',
      signature,
      booking_id,
    } = req.body;

    const config = getMomoConfig();
    let signatureVerified = false;

    // Kiểm tra chữ ký HMAC-SHA256 nếu đầy đủ tham số Return URL từ MoMo
    if (signature && orderId && requestId && transId !== undefined && responseTime !== undefined) {
      const rawSignature =
        `accessKey=${config.accessKey}` +
        `&amount=${amount}` +
        `&extraData=${extraData}` +
        `&message=${message}` +
        `&orderId=${orderId}` +
        `&orderInfo=${orderInfo}` +
        `&orderType=${orderType}` +
        `&partnerCode=${partnerCode || config.partnerCode}` +
        `&payType=${payType}` +
        `&requestId=${requestId}` +
        `&responseTime=${responseTime}` +
        `&resultCode=${resultCode}` +
        `&transId=${transId}`;

      const expectedSignature = signHmacSha256(rawSignature, config.secretKey);
      signatureVerified = expectedSignature === signature;
    }

    const session = pendingMomoOrders.get(orderId);
    let targetBookingId = booking_id || session?.bookingId;
    let user = req.user || session?.user || {};

    if (!targetBookingId && extraData) {
      try {
        const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));
        targetBookingId = decoded.bookingId;
        if (!user.id) {
          user = { id: decoded.userId, customerId: decoded.customerId, name: decoded.userName };
        }
      } catch (e) {
        // ignore
      }
    }

    if (!targetBookingId && orderId) {
      // Trích xuất bookingCode từ orderId dạng MOMO_BK-..._timestamp
      const parts = orderId.split('_');
      if (parts.length >= 2) {
        const bkCode = parts[1];
        const found = await db.query(`SELECT * FROM bookings WHERE booking_code = ?`, [bkCode]);
        if (found && found.length > 0) {
          targetBookingId = found[0].id;
        }
      }
    }

    if (!targetBookingId) {
      return res.status(400).json({
        success: false,
        message: 'Không xác định được đơn đặt vé từ giao dịch MoMo.',
      });
    }

    const isFailure = Number(resultCode) !== 0;
    const transactionCode = `MOMO-${transId || Date.now().toString().slice(-8)}`;

    const result = await finalizeBookingTransaction({
      bookingId: targetBookingId,
      paymentMethod: 'momo',
      transactionCode,
      simulateFailure: isFailure,
      user,
    });

    if (orderId) {
      pendingMomoOrders.delete(orderId);
    }

    return res.status(200).json({
      success: true,
      signatureVerified,
      momoResultCode: Number(resultCode),
      message:
        result.paymentStatus === 'success'
          ? 'Thanh toán MoMo Sandbox thành công! Vé điện tử đã được phát hành.'
          : result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  processPayment,
  createMomoPayment,
  renderMomoSandboxGateway,
  handleMomoIpn,
  verifyMomoReturn,
};
