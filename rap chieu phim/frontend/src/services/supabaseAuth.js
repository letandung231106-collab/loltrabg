import { createClient } from '@supabase/supabase-js';

/**
 * Module quản lý Supabase Auth phía Frontend (CHỈ sử dụng khóa công khai VITE_SUPABASE_ANON_KEY).
 * TUYỆT ĐỐI không lưu SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET hay DATABASE_URL ở Frontend.
 */
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let supabaseClient = null;

export function isSupabaseAuthConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseClient() {
  if (!isSupabaseAuthConfigured()) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        flowType: 'pkce', // PKCE tự động sinh state + code_verifier chống OAuth CSRF
        autoRefreshToken: true,
        persistSession: true,
        // Tắt auto-detect để resolveOAuthCallbackSession() kiểm soát duy nhất 1 lần trao đổi PKCE code
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Khởi tạo luồng đăng nhập Google thông qua Supabase Auth -> Google OAuth -> Callback /auth/callback
 */
export async function startGoogleOAuthLogin() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Chưa cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY cho đăng nhập Google. Vui lòng kiểm tra biến môi trường.'
    );
  }

  const redirectTo = `${window.location.origin}/auth/callback`;
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw new Error(error.message || 'Không thể khởi tạo phiên đăng nhập Google.');
  }
  return data;
}

/**
 * Xử lý callback tại /auth/callback sau khi Google -> Supabase chuyển hướng về NIGHT MOVIE
 * Trả về Supabase access_token đã được PKCE xác thực để gửi lên Backend /api/auth/supabase-exchange
 */
export async function resolveOAuthCallbackSession() {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

  const rawErrorCode = searchParams.get('error') || hashParams.get('error') || '';
  const rawErrorDesc = searchParams.get('error_description') || hashParams.get('error_description') || '';

  if (rawErrorCode || rawErrorDesc) {
    if (rawErrorCode === 'access_denied') {
      throw new Error('Bạn đã hủy đăng nhập Google.');
    }
    const decoded = decodeURIComponent((rawErrorDesc || rawErrorCode).replace(/\+/g, ' '));
    throw new Error(decoded || 'Đăng nhập Google không thành công.');
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase Auth chưa được cấu hình ở Frontend.');
  }

  const authCode = searchParams.get('code');
  if (authCode) {
    try {
      const { data, error } = await client.auth.exchangeCodeForSession(authCode);
      if (error) {
        if (error.name === 'AuthRetryableFetchError' || Number(error.status) >= 500) {
          throw new Error('Dịch vụ xác thực Supabase tạm thời không phản hồi. Vui lòng thử lại sau.');
        }
        throw new Error(error.message || 'Xác thực mã OAuth callback thất bại.');
      }
      if (data?.session?.access_token) {
        return data.session;
      }
    } catch (err) {
      if (err instanceof TypeError || /failed to fetch|network/i.test(String(err?.message || ''))) {
        throw new Error('Không thể kết nối tới dịch vụ xác thực Supabase. Vui lòng thử lại sau.');
      }
      throw err;
    }
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new Error(error.message || 'Không thể đọc phiên Supabase Auth.');
  }
  if (!data?.session?.access_token) {
    throw new Error('Không tìm thấy phiên đăng nhập Google hợp lệ từ callback.');
  }
  return data.session;
}

/**
 * Đăng xuất sạch phiên Supabase Auth trên trình duyệt
 */
export async function signOutSupabase() {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.auth.signOut({ scope: 'local' });
  } catch {
    // Không chặn quá trình đăng xuất cục bộ nếu mất mạng
  }
}
