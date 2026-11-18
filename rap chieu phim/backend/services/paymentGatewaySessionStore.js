const db = require('../config/database');

// Local memory cache chỉ dùng cho chế độ unit test In-Memory (khi !db.getIsConnected())
const localFallbackCache = new Map();
let tableEnsured = false;
let ensureTablePromise = null;

/**
 * Đảm bảo bảng lưu phiên thanh toán dùng chung tồn tại trên DB (PostgreSQL / MySQL)
 * giúp trạng thái SePay (Booking + POS) và MoMo không bị phụ thuộc RAM của từng Vercel Serverless instance.
 */
async function ensureSessionTable() {
  if (!db.getIsConnected() || tableEnsured) return;
  if (!ensureTablePromise) {
    ensureTablePromise = db
      .query(
        `CREATE TABLE IF NOT EXISTS payment_gateway_sessions (
          session_key VARCHAR(160) PRIMARY KEY,
          provider VARCHAR(30) NOT NULL,
          session_type VARCHAR(30) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'pending',
          payload_json TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      )
      .then(() => {
        tableEnsured = true;
      })
      .catch((err) => {
        ensureTablePromise = null;
        console.error('[PaymentSessionStore] Không thể khởi tạo bảng payment_gateway_sessions:', err.message);
        throw err;
      });
  }
  return ensureTablePromise;
}

function buildKey(provider, rawKey) {
  return `${String(provider || 'gw').toLowerCase()}:${String(rawKey || '').trim()}`;
}

/**
 * Lưu hoặc cập nhật phiên thanh toán vào DB dùng chung (cross-instance safe)
 */
async function saveSession({ provider, key, sessionType = 'booking', status = 'pending', payload = {} }) {
  const sessionKey = buildKey(provider, key);
  const record = { ...payload, status };
  localFallbackCache.set(sessionKey, record);

  if (!db.getIsConnected()) {
    return record;
  }

  await ensureSessionTable();
  const payloadJson = JSON.stringify(record);

  const updated = await db.query(
    `UPDATE payment_gateway_sessions
     SET session_type = ?, status = ?, payload_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE session_key = ?`,
    [sessionType, status, payloadJson, sessionKey]
  );

  if (!updated || Number(updated.affectedRows || 0) === 0) {
    try {
      await db.query(
        `INSERT INTO payment_gateway_sessions (session_key, provider, session_type, status, payload_json)
         VALUES (?, ?, ?, ?, ?)`,
        [sessionKey, provider, sessionType, status, payloadJson]
      );
    } catch (insertErr) {
      // Nếu có race-condition insert song song từ 2 instance -> update lại
      await db.query(
        `UPDATE payment_gateway_sessions
         SET session_type = ?, status = ?, payload_json = ?, updated_at = CURRENT_TIMESTAMP
         WHERE session_key = ?`,
        [sessionType, status, payloadJson, sessionKey]
      );
    }
  }

  return record;
}

/**
 * Đọc phiên thanh toán trực tiếp từ DB dùng chung (fallback RAM khi chạy unit test không có DB)
 */
async function getSession(provider, key) {
  const sessionKey = buildKey(provider, key);

  if (!db.getIsConnected()) {
    return localFallbackCache.get(sessionKey) || null;
  }

  await ensureSessionTable();
  const rows = await db.query(
    `SELECT session_key, status, payload_json FROM payment_gateway_sessions WHERE session_key = ?`,
    [sessionKey]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(rows[0].payload_json || '{}');
    return { ...parsed, status: rows[0].status || parsed.status };
  } catch {
    return null;
  }
}

/**
 * Tìm phiên đang chờ (status = 'pending') có khóa nằm trong nội dung chuyển khoản (dùng cho Webhook SePay)
 */
async function findPendingSessionInText(provider, normalizedText) {
  const target = String(normalizedText || '');
  if (!target) return null;

  if (!db.getIsConnected()) {
    const prefix = `${String(provider).toLowerCase()}:`;
    for (const [fullKey, session] of localFallbackCache.entries()) {
      if (!fullKey.startsWith(prefix)) continue;
      if (session.status !== 'pending') continue;
      const rawKey = fullKey.slice(prefix.length);
      if (rawKey && target.includes(rawKey)) {
        return { key: rawKey, session };
      }
    }
    return null;
  }

  await ensureSessionTable();
  const rows = await db.query(
    `SELECT session_key, status, payload_json
     FROM payment_gateway_sessions
     WHERE provider = ? AND status = 'pending'
     ORDER BY created_at DESC
     LIMIT 100`,
    [provider]
  );

  const prefix = `${String(provider).toLowerCase()}:`;
  for (const row of rows || []) {
    const rawKey = row.session_key.startsWith(prefix) ? row.session_key.slice(prefix.length) : row.session_key;
    if (rawKey && target.includes(rawKey)) {
      try {
        const parsed = JSON.parse(row.payload_json || '{}');
        return { key: rawKey, session: { ...parsed, status: row.status } };
      } catch {
        continue;
      }
    }
  }

  return null;
}

module.exports = {
  ensureSessionTable,
  saveSession,
  getSession,
  findPendingSessionInText,
};
