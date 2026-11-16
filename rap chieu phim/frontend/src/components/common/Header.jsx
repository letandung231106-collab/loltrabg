import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Film,
  Shield,
  Bell,
  User,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  Calendar,
  Menu,
  X,
  Utensils,
  Ticket,
  Sun,
  Moon,
  CheckCheck,
} from 'lucide-react';

function formatNotifTime(dateStr) {
  if (!dateStr) return '';
  const isoStr = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  if (isToday) {
    return `Hôm nay ${timeStr}`;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year} ${timeStr}`;
}

export function Header({
  onOpenAuth,
  onNavigate,
  currentView,
  onOpenInSeatDelivery,
  onOpenProfile,
}) {
  const { user, isAuthenticated, logout, notifications, unreadNotifCount, markAsRead, isManager, isStaff, isTechnician } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);

  const userRole = (user?.role || '').toLowerCase();
  const isInternalUser = ['admin', 'manager', 'staff', 'technician'].includes(userRole);

  // Đóng bảng thông báo khi bấm ra ngoài
  useEffect(() => {
    if (!showNotifMenu) return;
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifMenu]);

  return (
    <header className="sticky top-0 z-40 bg-cinema-950/85 backdrop-blur-md border-b border-cinema-700/50">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 xl:gap-6 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 group text-left focus:outline-none shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ruby-600 via-ruby-700 to-rose-900 flex items-center justify-center shadow-glow-red group-hover:scale-105 transition-transform shrink-0">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div className="shrink-0">
                <span className="text-xl font-extrabold tracking-wider dark:bg-gradient-to-r dark:from-white dark:via-slate-100 dark:to-ruby-400 dark:bg-clip-text dark:text-transparent text-slate-900 whitespace-nowrap">
                  NIGHT <span className="text-ruby-500 font-black">MOVIE</span>
                </span>
                <span className="block text-[10px] tracking-widest text-slate-400 uppercase font-semibold whitespace-nowrap">
                  Cinema Operations & Booking
                </span>
              </div>
            </button>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
              <button
                onClick={() => onNavigate('home')}
                className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'home' ? 'text-ruby-400 bg-cinema-850' : 'text-slate-300 hover:text-white hover:bg-cinema-850/60'
                }`}
              >
                Trang Chủ
              </button>
              <button
                onClick={() => onNavigate('movies')}
                className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'movies' ? 'text-ruby-400 bg-cinema-850' : 'text-slate-300 hover:text-white hover:bg-cinema-850/60'
                }`}
              >
                Phim Chiếu
              </button>
              <button
                onClick={() => onNavigate('schedules')}
                className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'schedules' ? 'text-ruby-400 bg-cinema-850' : 'text-slate-300 hover:text-white hover:bg-cinema-850/60'
                }`}
              >
                Lịch Chiếu
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => onNavigate('my-tickets')}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'my-tickets' ? 'text-ruby-400 bg-cinema-850' : 'text-slate-300 hover:text-white hover:bg-cinema-850/60'
                  }`}
                >
                  Vé Của Tôi
                </button>
              )}
              {/* Internal Portals Quick Link */}
              {(isManager || isStaff || isTechnician) && (
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    currentView.startsWith('admin-')
                      ? 'text-gold-400 bg-cinema-800 ring-1 ring-gold-500/30'
                      : 'text-gold-400 hover:bg-cinema-850/80'
                  }`}
                >
                  <Shield className="w-4 h-4 text-gold-400 shrink-0" />
                  <span className="whitespace-nowrap">Hệ Thống Vận Hành</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Action Icons & User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action Badges */}
            {!isInternalUser && (
              <div className="hidden xl:flex items-center gap-2">
                <button
                  onClick={onOpenInSeatDelivery}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
                  title="Gọi bắp nước giao tận ghế trong phòng chiếu"
                >
                  <span className="whitespace-nowrap">🍿 Gọi Món Tận Ghế</span>
                </button>
              </div>
            )}
            {/* Theme Toggle Button (Light / Dark Mode) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 hover:text-white border border-cinema-700/50 relative transition-all duration-300 group shadow-sm flex items-center justify-center shrink-0"
              title={isDark ? 'Chuyển sang giao diện Sáng (Light Mode)' : 'Chuyển sang giao diện Tối (Dark Mode)'}
              aria-label="Chuyển đổi giao diện Sáng / Tối"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="p-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 hover:text-white border border-cinema-700/50 relative transition-colors cursor-pointer"
                  title="Thông báo"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-ruby-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Notifications Panel */}
                {showNotifMenu && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl p-4 shadow-2xl z-50 animate-scale-in border bg-white/95 dark:bg-[#12151f]/95 border-slate-200 dark:border-white/10 backdrop-blur-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-cinema-700/60">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gold-400 shrink-0" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          Thông báo ({unreadNotifCount} chưa đọc)
                        </h4>
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAsRead?.('all')}
                          className="text-xs font-semibold text-ruby-600 dark:text-ruby-400 hover:text-ruby-700 dark:hover:text-ruby-300 transition-colors cursor-pointer flex items-center gap-1"
                          title="Đánh dấu tất cả là đã đọc"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Đánh dấu đã đọc tất cả</span>
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                          Không có thông báo mới.
                        </p>
                      ) : (
                        notifications.map((n) => {
                          const isRead = Boolean(n.is_read);
                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (!isRead) {
                                  markAsRead?.(n.id);
                                }
                              }}
                              className={`p-2.5 rounded-xl text-xs transition-all ${
                                isRead
                                  ? 'bg-slate-100/80 dark:bg-cinema-900/60 text-slate-500 dark:text-slate-400'
                                  : 'bg-ruby-50/90 dark:bg-cinema-800 text-slate-800 dark:text-slate-200 border-l-2 border-ruby-500 hover:bg-ruby-100/70 dark:hover:bg-cinema-750 cursor-pointer shadow-sm'
                              }`}
                              title={isRead ? 'Đã đọc' : 'Bấm để đánh dấu đã đọc'}
                            >
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className={`font-semibold truncate ${isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                  {n.title}
                                </span>
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-ruby-500 shrink-0" title="Chưa đọc" />
                                )}
                              </div>
                              <div className={`${isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} leading-relaxed`}>
                                {n.message}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-between">
                                <span>{formatNotifTime(n.created_at)}</span>
                                {isRead && (
                                  <span className="text-[9px] text-slate-400">Đã đọc</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth / User Badge */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-cinema-850/80 border border-cinema-700/60 rounded-xl px-2.5 py-1.5">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity"
                  title="Hồ sơ tài khoản & Đổi mật khẩu"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-ruby-600 to-amber-500 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left text-xs">
                    <div className="font-semibold text-white max-w-[120px] truncate">{user?.name || user?.username}</div>
                    <div className="text-gold-400 text-[10px] uppercase font-bold tracking-wider">{user?.role}</div>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="p-1 text-slate-400 hover:text-ruby-400 transition-colors ml-1"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-700 text-white text-sm font-semibold hover:from-ruby-500 hover:to-rose-600 shadow-glow-red transition-all flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                Đăng Nhập
              </button>
            )}
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 hover:text-white border border-cinema-700/60 lg:hidden transition-colors"
              title="Menu điều hướng"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-ruby-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-cinema-950/95 border-b border-cinema-700/80 px-4 py-4 space-y-3 animate-fade-in backdrop-blur-xl">
          <div className={!isInternalUser ? "grid grid-cols-2 gap-2" : "flex justify-center"}>
            {!isInternalUser && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenInSeatDelivery();
                }}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Utensils className="w-4 h-4 text-emerald-400" /> Gọi Bắp Nước
              </button>
            )}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl bg-cinema-850 hover:bg-cinema-800 border border-cinema-700/60 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                isInternalUser ? 'w-full' : ''
              }`}
              title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Tối</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1 pt-1 border-t border-cinema-800">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('home');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
                currentView === 'home' ? 'bg-ruby-600 text-white' : 'text-slate-300 hover:bg-cinema-850'
              }`}
            >
              <Film className="w-4 h-4" /> Trang Chủ
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('movies');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
                currentView === 'movies' ? 'bg-ruby-600 text-white' : 'text-slate-300 hover:bg-cinema-850'
              }`}
            >
              <Film className="w-4 h-4" /> Danh Sách Phim Chiếu
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('schedules');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
                currentView === 'schedules' ? 'bg-ruby-600 text-white' : 'text-slate-300 hover:bg-cinema-850'
              }`}
            >
              <Calendar className="w-4 h-4" /> Lịch Chiếu & Đặt Vé
            </button>
            {isAuthenticated && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('my-tickets');
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
                  currentView === 'my-tickets' ? 'bg-ruby-600 text-white' : 'text-slate-300 hover:bg-cinema-850'
                }`}
              >
                <Ticket className="w-4 h-4" /> Vé Của Tôi & QR Code
              </button>
            )}
            {(isManager || isStaff || isTechnician) && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('admin-dashboard');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left text-gold-400 bg-cinema-850/80 hover:bg-cinema-800 border border-gold-500/30 flex items-center gap-2.5"
              >
                <Shield className="w-4 h-4 text-gold-400" /> Hệ Thống Vận Hành Rạp (Admin)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
