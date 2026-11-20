import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  isSupabaseAuthConfigured,
  startGoogleOAuthLogin,
  resolveOAuthCallbackSession,
  signOutSupabase,
} from '../services/supabaseAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(false);
  const [oauthNotice, setOauthNotice] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const callbackHandledRef = useRef(false);

  // Xử lý tự động Google OAuth Callback tại /auth/callback (Hybrid Token Exchange -> Backend JWT)
  useEffect(() => {
    if (typeof window === 'undefined' || callbackHandledRef.current) return;
    const isCallbackPath = window.location.pathname === '/auth/callback';
    const params = new URLSearchParams(window.location.search);
    const hasOAuthParams = params.has('code') || params.has('error') || window.location.hash.includes('access_token=');

    if (!isCallbackPath && !hasOAuthParams) return;
    callbackHandledRef.current = true;

    (async () => {
      setLoading(true);
      try {
        const sbSession = await resolveOAuthCallbackSession();
        const res = await api.exchangeSupabaseToken(sbSession.access_token);
        if (res.success && res.token && res.user) {
          setToken(res.token);
          setUser(res.user);
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          setOauthNotice({
            type: 'success',
            text: res.message || 'Đăng nhập Google thành công!',
          });
        } else {
          throw new Error(res.message || 'Không thể trao đổi phiên đăng nhập với máy chủ NIGHT MOVIE.');
        }
      } catch (err) {
        await signOutSupabase();
        setOauthNotice({
          type: 'error',
          text: err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.',
        });
      } finally {
        // Làm sạch đường dẫn /auth/callback về '/' để tránh redirect vòng lặp khi F5
        window.history.replaceState({}, document.title, '/');
        setLoading(false);
      }
    })();
  }, []);

  // Load user profile and poll notifications periodically
  useEffect(() => {
    if (!token) return;
    fetchMe();
    fetchNotifications();

    // Tự động tải lại thông báo mỗi 30 giây khi tab đang hoạt động
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchNotifications();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchNotifications();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [token]);

  const fetchMe = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Phiên đăng nhập đã hết hạn:', err.message);
      logout();
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadNotifCount(res.unreadCount);
      }
    } catch (err) {
      // ignore
    }
  };

  const markAsRead = async (id = 'all') => {
    if (!token) return;
    try {
      const res = await api.markNotificationAsRead(id);
      if (res.success) {
        if (id === 'all') {
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
          setUnreadNotifCount(0);
        } else {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
          );
          setUnreadNotifCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', err);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.register(userData);
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await startGoogleOAuthLogin();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    setNotifications([]);
    setUnreadNotifCount(0);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    signOutSupabase();
  };

  /**
   * Chuyển đổi vai trò tài khoản trong môi trường kiểm thử
   */
  const switchRole = async (targetRole) => {
    setLoading(true);
    try {
      const res = await api.switchRole(targetRole);
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        return { success: true, user: res.user, message: res.message };
      }
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        notifications,
        unreadNotifCount,
        markAsRead,
        login,
        loginWithGoogle,
        isGoogleAuthReady: isSupabaseAuthConfigured(),
        oauthNotice,
        clearOauthNotice: () => setOauthNotice(null),
        register,
        logout,
        switchRole,
        fetchNotifications,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isManager: user?.role === 'manager' || user?.role === 'admin',
        isStaff: user?.role === 'staff' || user?.role === 'manager' || user?.role === 'admin',
        isTechnician: user?.role === 'technician' || user?.role === 'manager' || user?.role === 'admin',
        isCustomer: user?.role === 'customer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
