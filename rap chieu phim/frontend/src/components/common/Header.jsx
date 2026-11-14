import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Film,
  Shield,
  Bell,
  User,
  LogOut,
  Gift,
  CheckCircle,
  AlertTriangle,
  Wrench,
  ClipboardCheck,
  Calendar,
  Menu,
  X,
  Utensils,
  Ticket,
} from 'lucide-react';

export function Header({
  onOpenAuth,
  onNavigate,
  currentView,
  onOpenLuckyWheel,
  onOpenInSeatDelivery,
  onOpenProfile,
}) {
  const { user, isAuthenticated, logout, notifications, unreadNotifCount, isManager, isStaff, isTechnician } = useAuth();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-cinema-950/85 backdrop-blur-md border-b border-cinema-700/50">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ruby-600 via-ruby-700 to-rose-900 flex items-center justify-center shadow-glow-red group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-ruby-400 bg-clip-text text-transparent">
                  NIGHT <span className="text-ruby-500 font-black">MOVIE</span>
                </span>
                <span className="block text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
                  Cinema Operations & Booking
                </span>
              </div>
            </button>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={onOpenLuckyWheel}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-ruby-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 border border-amber-500/40 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm animate-pulse"
                title="Vòng quay may mắn nhận voucher"
              >
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>Vòng Quay Voucher</span>
              </button>
              <button
                onClick={onOpenInSeatDelivery}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                title="Gọi bắp nước giao tận ghế trong phòng chiếu"
              >
                <span>🍿 Gọi Món Tận Ghế</span>
              </button>
              <button
                onClick={() => onNavigate('home')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'home' ? 'text-ruby-400 bg-cinema-850' : 'text-slate-300 hover:text-white hover:bg-cinema-850/60'
                }`}
              >
                Trang Chủ
              </button>
              <button
                onClick={() => onNavigate('movies')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'movies' ? 'text-ruby-400 bg-cinema-850' : 'text-slate-300 hover:text-white hover:bg-cinema-850/60'
                }`}
              >
                Phim Chiếu
              </button>
              <button
                onClick={() => onNavigate('schedules')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'schedules' ? 'text-ruby-400 bg-cinema-850' : 'text-slate-300 hover:text-white hover:bg-cinema-850/60'
                }`}
              >
                Lịch Chiếu
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => onNavigate('my-tickets')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    currentView.startsWith('admin-')
                      ? 'text-gold-400 bg-cinema-800 ring-1 ring-gold-500/30'
                      : 'text-gold-400 hover:bg-cinema-850/80'
                  }`}
                >
                  <Shield className="w-4 h-4 text-gold-400" />
                  Hệ Thống Vận Hành
                </button>
              )}
            </nav>
          </div>

          {/* Right Action Icons & User */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifMenu(!showNotifMenu)}
                  className="p-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 hover:text-white border border-cinema-700/50 relative transition-colors"
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
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl p-4 shadow-2xl z-50 animate-scale-in border border-cinema-600/60">
                    <div className="flex items-center justify-between pb-3 border-b border-cinema-700">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gold-400" /> Thông báo hệ thống ({notifications.length})
                      </h4>
                      <span className="text-xs text-slate-400">Thời gian thực</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Không có thông báo mới.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl text-xs transition-colors ${
                              n.is_read ? 'bg-cinema-900/60 text-slate-400' : 'bg-cinema-800 text-slate-200 border-l-2 border-ruby-500'
                            }`}
                          >
                            <div className="font-semibold text-white mb-0.5">{n.title}</div>
                            <div className="text-slate-300 leading-relaxed">{n.message}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleTimeString('vi-VN')}</div>
                          </div>
                        ))
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
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenLuckyWheel();
              }}
              className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Gift className="w-4 h-4 text-amber-400" /> Vòng Quay
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenInSeatDelivery();
              }}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Utensils className="w-4 h-4 text-emerald-400" /> Gọi Bắp Nước
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
