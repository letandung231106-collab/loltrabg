const { GoTrueClient } = require('@supabase/supabase-js');

let cachedSupabaseAdmin = null;
let cachedConfigKey = null;
let testVerifierOverride = null;

/**
 * Khởi tạo Supabase Auth Client phía Backend (dùng trực tiếp GoTrueClient, KHÔNG khởi tạo Realtime/WebSocket).
 * Tương thích đầy đủ với Node.js 20 (không đòi native WebSocket) và Vercel Serverless.
 * Chỉ dùng phía Backend với SUPABASE_SERVICE_ROLE_KEY; tuyệt đối không lộ ra Frontend.
 */
function getSupabaseServerClient() {
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !serviceKey) {
    cachedSupabaseAdmin = null;
    cachedConfigKey = null;
    return null;
  }

  const configKey = `${supabaseUrl}|${serviceKey}`;
  if (!cachedSupabaseAdmin || cachedConfigKey !== configKey) {
    const authClient = new GoTrueClient({
      url: `${supabaseUrl}/auth/v1`,
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    });
    cachedSupabaseAdmin = { auth: authClient };
    cachedConfigKey = configKey;
  }
  return cachedSupabaseAdmin;
}

/**
 * Chỉ dùng cho unit test cô lập (không bao giờ được kích hoạt ở Production)
 */
function setTokenVerifierForTest(fn) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Không được phép override Supabase token verifier trong Production.');
  }
  testVerifierOverride = typeof fn === 'function' ? fn : null;
}

/**
 * Xác minh Supabase access token trực tiếp bằng Supabase Auth getUser(accessToken).
 * Không bao giờ giải mã JWT rồi tin payload mà không xác minh chữ ký và trạng thái phiên.
 */
async function verifySupabaseAccessToken(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    const err = new Error('Thiếu Supabase access token để xác thực.');
    err.statusCode = 401;
    err.code = 'MISSING_SUPABASE_TOKEN';
    throw err;
  }

  const token = accessToken.trim();

  let sbUser = null;
  if (testVerifierOverride && process.env.NODE_ENV !== 'production') {
    sbUser = await testVerifierOverride(token);
  } else {
    const client = getSupabaseServerClient();
    if (!client) {
      const err = new Error('Máy chủ chưa cấu hình SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
      err.statusCode = 503;
      err.code = 'SUPABASE_AUTH_NOT_CONFIGURED';
      throw err;
    }

    let data;
    let error;
    try {
      const response = await client.auth.getUser(token);
      data = response?.data;
      error = response?.error;
    } catch {
      const err = new Error('Dịch vụ xác thực Supabase tạm thời không phản hồi. Vui lòng thử lại sau.');
      err.statusCode = 503;
      err.code = 'SUPABASE_AUTH_UNAVAILABLE';
      throw err;
    }

    if (error && (error.name === 'AuthRetryableFetchError' || Number(error.status) >= 500 || Number(error.status) === 0)) {
      const err = new Error('Dịch vụ xác thực Supabase tạm thời không phản hồi. Vui lòng thử lại sau.');
      err.statusCode = 503;
      err.code = 'SUPABASE_AUTH_UNAVAILABLE';
      throw err;
    }

    if (error || !data || !data.user) {
      const err = new Error('Supabase access token không hợp lệ hoặc đã hết hạn.');
      err.statusCode = 401;
      err.code = 'INVALID_SUPABASE_TOKEN';
      throw err;
    }
    sbUser = data.user;
  }

  if (!sbUser || !sbUser.id || typeof sbUser.id !== 'string') {
    const err = new Error('Không xác định được UUID hợp lệ từ Supabase Auth.');
    err.statusCode = 401;
    err.code = 'INVALID_SUPABASE_USER';
    throw err;
  }

  // Kiểm tra tài khoản Supabase có bị ban không
  if (sbUser.banned_until && new Date(sbUser.banned_until).getTime() > Date.now()) {
    const err = new Error('Tài khoản xác thực đã bị vô hiệu hóa.');
    err.statusCode = 403;
    err.code = 'SUPABASE_USER_BANNED';
    throw err;
  }

  const email = typeof sbUser.email === 'string' ? sbUser.email.trim().toLowerCase() : '';
  if (!email) {
    const err = new Error('Tài khoản Google không cung cấp địa chỉ email hợp lệ.');
    err.statusCode = 400;
    err.code = 'MISSING_EMAIL';
    throw err;
  }

  // Kiểm tra email đã được xác minh bởi Google/Supabase (chống chiếm tài khoản bằng email chưa xác minh)
  const hasConfirmedTimestamp = Boolean(sbUser.email_confirmed_at || sbUser.confirmed_at);
  const metadataEmailVerified = sbUser.user_metadata?.email_verified;
  const isEmailVerified = hasConfirmedTimestamp && metadataEmailVerified !== false;

  if (!isEmailVerified) {
    const err = new Error('Email chưa được xác minh. Không thể đăng nhập hoặc liên kết tài khoản.');
    err.statusCode = 403;
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }

  const provider = sbUser.app_metadata?.provider || 'google';
  const fullName =
    (typeof sbUser.user_metadata?.full_name === 'string' && sbUser.user_metadata.full_name.trim()) ||
    (typeof sbUser.user_metadata?.name === 'string' && sbUser.user_metadata.name.trim()) ||
    email.split('@')[0];
  const avatarUrl =
    (typeof sbUser.user_metadata?.avatar_url === 'string' && sbUser.user_metadata.avatar_url.trim()) ||
    (typeof sbUser.user_metadata?.picture === 'string' && sbUser.user_metadata.picture.trim()) ||
    null;

  return {
    authUserId: sbUser.id,
    email,
    emailVerified: true,
    fullName,
    avatarUrl,
    provider,
  };
}

module.exports = {
  getSupabaseServerClient,
  verifySupabaseAccessToken,
  setTokenVerifierForTest,
};
