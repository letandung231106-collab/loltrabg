import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

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

  const logout = () => {
    setUser(null);
    setToken('');
    setNotifications([]);
    setUnreadNotifCount(0);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
