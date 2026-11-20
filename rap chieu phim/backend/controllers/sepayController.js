const db = require('../config/database');
const { sepayConfig, getSepayQrUrl } = require('../config/sepay');
const { finalizeBookingTransaction, saveBookingConcessions } = require('./paymentController');
const { executeConcessionSaleTransaction } = require('./concessionController');
const sessionStore = require('../services/paymentGatewaySessionStore');
const { resolveAuthenticatedCustomerId, isOwnedByCustomer } = require('../utils/ownershipHelper');

/**
 * Chuẩn hóa mã đơn / mã chuyển khoản để tìm kiếm không phụ thuộc khoảng trắng và viết hoa
 */
function normalizeCode(code) {
  if (!code) return '';
  return String(code).replace(/[\s\-_.]/g, '').toUpperCase();
}

/**
 * 1. Đăng ký phiên thanh toán SePay cho POS Quầy Bắp Nước
 * POST /api/sepay/register-pos-session
 */
async function registerPosSession(req, res) {
  try {
    const { orderCode, items, totalAmount, staffId } = req.body;

    if (!orderCode) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn thanh toán orderCode.' });
    }

    const normKey = normalizeCode(orderCode);
    const sessionData = {
      type: 'pos',
      orderCode,
      normalizedCode: normKey,
      items: items || [],
      totalAmount: parseFloat(totalAmount) || 0,
      staffId: staffId || req.user?.id || 1,
      status: 'pending', // 'pending' | 'paid'
      createdAt: new Date().toISOString(),
      paidAt: null,
      transaction: null,
      orderResult: null,
    };

    await sessionStore.saveSession({
      provider: 'sepay',
      key: normKey,
      sessionType: sessionData.type,
      status: 'pending',
      payload: sessionData,
    });

    return res.status(200).json({
      success: true,
      message: 'Đã đăng ký phiên thanh toán SePay POS thành công.',
      data: {
        orderCode,
        accountNumber: sepayConfig.accountNumber,
        bank: sepayConfig.bank,
        accountHolder: sepayConfig.accountHolder,
        amount: sessionData.totalAmount,
        qrUrl: getSepayQrUrl({ amount: sessionData.totalAmount, des: orderCode }),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 2. Đăng ký phiên thanh toán SePay cho Đặt Vé Xem Phim
 * POST /api/sepay/register-booking-session
 */
async function registerBookingSession(req, res) {
  try {
    const { bookingId, bookingCode, totalAmount, concessions } = req.body;

    if (!bookingId || !bookingCode) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bookingId hoặc bookingCode.' });
    }

    if (req.user?.role === 'customer') {
      const bookingRows = await db.query(`SELECT id, customer_id FROM bookings WHERE id = ?`, [parseInt(bookingId, 10)]);
      const bk = Array.isArray(bookingRows) ? bookingRows[0] : null;
      const resolvedCustomerId = await resolveAuthenticatedCustomerId(req.user);
      if (!bk || !isOwnedByCustomer(bk.customer_id, resolvedCustomerId)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền đăng ký phiên thanh toán cho đơn đặt vé này.',
        });
      }
    }

    if (concessions !== undefined && typeof saveBookingConcessions === 'function') {
      await saveBookingConcessions(db, parseInt(bookingId, 10), concessions);
    }

    const normKey = normalizeCode(bookingCode);
    const sessionData = {
      type: 'booking',
      bookingId: parseInt(bookingId, 10),
      bookingCode,
      normalizedCode: normKey,
      totalAmount: parseFloat(totalAmount) || 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paidAt: null,
      transaction: null,
      bookingResult: null,
    };

    await sessionStore.saveSession({
      provider: 'sepay',
      key: normKey,
      sessionType: sessionData.type,
      status: 'pending',
      payload: sessionData,
    });

    return res.status(200).json({
      success: true,
      message: 'Đã đăng ký phiên SePay cho vé xem phim thành công.',
      data: {
        bookingCode,
        accountNumber: sepayConfig.accountNumber,
        bank: sepayConfig.bank,
        accountHolder: sepayConfig.accountHolder,
        amount: sessionData.totalAmount,
        qrUrl: getSepayQrUrl({ amount: sessionData.totalAmount, des: bookingCode }),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 3. Webhook chính thức nhận dữ liệu biến động số dư từ SePay
 * POST /api/sepay/webhook
 */
async function handleWebhook(req, res) {
  try {
    const apiKey = req.headers['authorization'] || req.headers['x-api-key'] || req.query?.api_key;
    if (sepayConfig.apiKey) {
      const token = String(apiKey || '').replace(/^Apikey\s+/i, '').trim();
      if (!token || token !== sepayConfig.apiKey) {
        return res.status(401).json({ success: false, message: 'Thiếu hoặc sai mã API Key SePay.' });
      }
    }

    const payload = req.body || {};
    const {
      id,
      gateway,
      transactionDate,
      accountNumber,
      code,
      content,
      transferType,
      transferAmount,
      referenceCode,
      description,
    } = payload;

    // Chỉ xử lý giao dịch tiền vào (in)
    if (transferType && transferType !== 'in') {
      return res.status(200).json({
        success: true,
        message: 'Bỏ qua giao dịch tiền ra (transferType != in)',
      });
    }

    // Ghi log giao dịch SePay
    const txLog = {
      id: id || Date.now(),
      gateway: gateway || 'BIDV',
      transactionDate: transactionDate || new Date().toISOString(),
      accountNumber: accountNumber || sepayConfig.accountNumber,
      content: content || description || '',
      transferAmount: parseFloat(transferAmount) || 0,
      referenceCode: referenceCode || `SEPAY-${Date.now()}`,
      receivedAt: new Date().toISOString(),
      processed: false,
    };
    const fullText = `${content || ''} ${description || ''} ${code || ''}`;
    const normText = normalizeCode(fullText);

    // Tra cứu phiên đang chờ từ bảng payment_gateway_sessions dùng chung (không phụ thuộc RAM instance)
    const foundPending = await sessionStore.findPendingSessionInText('sepay', normText);
    const matchedKey = foundPending?.key || null;
    const matchedSession = foundPending?.session || null;

    let processingResult = null;

    // Xử lý đơn hàng POS Quầy Bắp Nước
    if (matchedSession && matchedSession.type === 'pos') {
      if (matchedSession.items && matchedSession.items.length > 0) {
        processingResult = await executeConcessionSaleTransaction({
          items: matchedSession.items,
          payment_method: 'sepay',
          staff_id: matchedSession.staffId || 1,
          notes: `Thanh toán tự động qua SePay BIDV (${txLog.referenceCode})`,
          idempotencyKey: `SEPAY-POS-${matchedSession.orderCode}`,
        });
      }

      matchedSession.status = 'paid';
      matchedSession.paidAt = new Date().toISOString();
      matchedSession.transaction = txLog;
      matchedSession.orderResult = processingResult;
      txLog.processed = true;
      txLog.matchedType = 'pos';
      txLog.matchedCode = matchedSession.orderCode;

      await sessionStore.saveSession({
        provider: 'sepay',
        key: matchedKey || normalizeCode(matchedSession.orderCode),
        sessionType: 'pos',
        status: 'paid',
        payload: matchedSession,
      });
    }

    // Xử lý đơn đặt vé xem phim
    else if (matchedSession && matchedSession.type === 'booking') {
      processingResult = await finalizeBookingTransaction({
        bookingId: matchedSession.bookingId,
        paymentMethod: 'sepay',
        transactionCode: txLog.referenceCode,
        user: { role: 'admin' },
      });

      matchedSession.status = 'paid';
      matchedSession.paidAt = new Date().toISOString();
      matchedSession.transaction = txLog;
      matchedSession.bookingResult = processingResult;
      txLog.processed = true;
      txLog.matchedType = 'booking';
      txLog.matchedCode = matchedSession.bookingCode;

      await sessionStore.saveSession({
        provider: 'sepay',
        key: matchedKey || normalizeCode(matchedSession.bookingCode),
        sessionType: 'booking',
        status: 'paid',
        payload: matchedSession,
      });
    }

    // Không phụ thuộc Map RAM (hỗ trợ Vercel Serverless cold instance): tra cứu trực tiếp bảng bookings trong DB
    else {
      let targetBooking = null;
      const bkMatch = fullText.match(/BK-[A-Za-z0-9\-]+/i);
      if (bkMatch) {
        const foundBkCode = bkMatch[0];
        const bookings = await db.query(
          `SELECT id, booking_code, total_amount, concession_amount, discount_amount, status FROM bookings WHERE booking_code = ?`,
          [foundBkCode]
        );
        if (bookings && bookings.length > 0) {
          targetBooking = bookings[0];
        }
      }

      // Fallback khi ngân hàng loại bỏ dấu gạch ngang trong nội dung chuyển khoản (ví dụ: BK35308066861)
      if (!targetBooking && normText.includes('BK')) {
        const pendingBookings = await db.query(
          `SELECT id, booking_code, total_amount, concession_amount, discount_amount, status FROM bookings WHERE status = 'pending'`
        );
        if (Array.isArray(pendingBookings)) {
          targetBooking = pendingBookings.find((b) => normText.includes(normalizeCode(b.booking_code))) || null;
        }
      }

      if (targetBooking) {
        const expectedPayable = Math.max(
          0,
          Math.round(
            Number(targetBooking.total_amount || 0) +
              Number(targetBooking.concession_amount || 0) -
              Number(targetBooking.discount_amount || 0)
          )
        );
        if (expectedPayable > 0 && txLog.transferAmount < expectedPayable) {
          return res.status(200).json({
            success: true,
            message: `Số tiền chuyển khoản (${txLog.transferAmount}) chưa đủ số tiền phải thu (${expectedPayable}).`,
            data: {
              matched: false,
              reason: 'insufficient_amount',
              expectedPayable,
              receivedAmount: txLog.transferAmount,
            },
          });
        }

        processingResult = await finalizeBookingTransaction({
          bookingId: targetBooking.id,
          paymentMethod: 'sepay',
          transactionCode: txLog.referenceCode,
          user: { role: 'admin' },
        });

        txLog.processed = true;
        txLog.matchedType = 'booking';
        txLog.matchedCode = targetBooking.booking_code;

        await sessionStore.saveSession({
          provider: 'sepay',
          key: normalizeCode(targetBooking.booking_code),
          sessionType: 'booking',
          status: 'paid',
          payload: {
            type: 'booking',
            bookingId: targetBooking.id,
            bookingCode: targetBooking.booking_code,
            status: 'paid',
            paidAt: new Date().toISOString(),
            transaction: txLog,
            bookingResult: processingResult,
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'SePay Webhook đã được ghi nhận và xử lý thành công!',
      data: {
        matched: !!matchedSession || txLog.processed,
        referenceCode: txLog.referenceCode,
        result: processingResult,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi xử lý SePay webhook',
    });
  }
}

/**
 * 4. Kiểm tra trạng thái thanh toán theo mã đơn (Polling từ Frontend)
 * GET /api/sepay/status/:orderCode
 */
async function checkPaymentStatus(req, res) {
  try {
    const { orderCode } = req.params;
    if (!orderCode) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn.' });
    }

    const normKey = normalizeCode(orderCode);
    const session = await sessionStore.getSession('sepay', normKey);

    if (session) {
      if (session.status === 'paid') {
        return res.status(200).json({
          success: true,
          isPaid: true,
          orderCode: session.orderCode || session.bookingCode,
          paidAt: session.paidAt,
          type: session.type,
          data: session.orderResult || session.bookingResult,
          transaction: session.transaction,
        });
      }
      return res.status(200).json({
        success: true,
        isPaid: false,
        orderCode: session.orderCode || session.bookingCode,
        message: 'Đang chờ khách quét mã VietQR và hệ thống SePay xác nhận chuyển khoản...',
      });
    }

    // Kiểm tra trực tiếp trong DB nếu là đơn đặt vé
    const bookings = await db.query(
      `SELECT id, booking_code, status, total_amount FROM bookings WHERE booking_code = ?`,
      [orderCode]
    );
    if (bookings && bookings.length > 0 && bookings[0].status === 'paid') {
      return res.status(200).json({
        success: true,
        isPaid: true,
        orderCode,
        type: 'booking',
        data: bookings[0],
      });
    }

    // Kiểm tra trực tiếp trong DB nếu là đơn bắp nước POS
    const concessions = await db.query(
      `SELECT * FROM concession_orders WHERE order_code = ? OR idempotency_key = ?`,
      [orderCode, `SEPAY-POS-${orderCode}`]
    );
    if (concessions && concessions.length > 0) {
      return res.status(200).json({
        success: true,
        isPaid: true,
        orderCode,
        type: 'pos',
        data: concessions[0],
      });
    }

    return res.status(200).json({
      success: true,
      isPaid: false,
      orderCode,
      message: 'Đang chờ khách quét mã VietQR và hệ thống SePay xác nhận chuyển khoản...',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 5. Giả lập thanh toán SePay thành công (Dành cho Test / Demo môi trường phát triển)
 * POST /api/sepay/simulate-payment
 */
async function simulatePayment(req, res) {
  try {
    // Tuyệt đối chặn giả lập thanh toán trong môi trường Production hoặc khi tắt demo tools
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEMO_TOOLS === 'false') {
      return res.status(403).json({
        success: false,
        message: 'Chức năng giả lập thanh toán SePay đã bị khóa vĩnh viễn trong môi trường Production.',
      });
    }

    const { orderCode, amount = 100000 } = req.body;
    if (!orderCode) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn orderCode để giả lập thanh toán.' });
    }

    const fakePayload = {
      id: Math.floor(100000 + Math.random() * 900000),
      gateway: 'BIDV',
      transactionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      accountNumber: sepayConfig.accountNumber,
      code: null,
      content: `${orderCode}`,
      transferType: 'in',
      transferAmount: parseFloat(amount) || 100000,
      referenceCode: `SIM-SEPAY-${Date.now()}`,
      description: `LE TAN DUNG chuyen khoan ${orderCode}`,
    };

    req.body = fakePayload;
    return await handleWebhook(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 6. Lấy thông tin tài khoản thụ hưởng SePay
 * GET /api/sepay/info
 */
function getSepayInfo(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      accountNumber: sepayConfig.accountNumber,
      bank: sepayConfig.bank,
      accountHolder: sepayConfig.accountHolder,
      webhookUrl: sepayConfig.webhookUrl,
      gateway: 'SePay VietQR',
    },
  });
}

module.exports = {
  registerPosSession,
  registerBookingSession,
  handleWebhook,
  checkPaymentStatus,
  simulatePayment,
  getSepayInfo,
};
