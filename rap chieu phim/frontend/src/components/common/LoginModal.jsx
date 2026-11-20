import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { X, Lock, User, Mail, Phone, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    name: 'Elon Musk',
    role: 'Admin',
    username: 'admin',
    password: 'password123',
    nameColor: 'text-ruby-400',
    hoverBorder: 'hover:border-ruby-500/60',
  },
  {
    name: 'Mark Zuckerberg',
    role: 'Manager',
    username: 'manager1',
    password: 'password123',
    nameColor: 'text-amber-400',
    hoverBorder: 'hover:border-amber-500/60',
  },
  {
    name: 'Steve Jobs',
    role: 'Staff',
    username: 'staff1',
    password: 'password123',
    nameColor: 'text-blue-400',
    hoverBorder: 'hover:border-blue-500/60',
  },
  {
    name: 'Bill Gate',
    role: 'Technician',
    username: 'tech1',
    password: 'password123',
    nameColor: 'text-emerald-400',
    hoverBorder: 'hover:border-emerald-500/60',
  },
];

export function LoginModal({ isOpen, onClose }) {
  const { login, loginWithGoogle, isGoogleAuthReady, register, loading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    forgotIdentifier: '',
    forgotNewPassword: '',
  });

  // Cơ chế 1: Thoát Modal bằng phím tắt ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Cơ chế 2: Khóa cuộn trang nền khi mở Modal và dọn dẹp sạch khi đóng / unmount
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickFill = (u, p) => {
    setFormData((prev) => ({ ...prev, username: u, password: p }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isForgotMode) {
      try {
        const res = await api.forgotPassword({
          username: formData.forgotIdentifier.includes('@') ? undefined : formData.forgotIdentifier,
          email: formData.forgotIdentifier.includes('@') ? formData.forgotIdentifier : undefined,
          newPassword: formData.forgotNewPassword || 'password123',
        });
        if (res.success) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            setIsForgotMode(false);
            setFormData((prev) => ({ ...prev, password: prev.forgotNewPassword || 'password123' }));
          }, 1500);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Lỗi khôi phục mật khẩu.');
      }
      return;
    }

    if (isRegisterMode) {
      const res = await register(formData);
      if (res.success) {
        setSuccessMsg('Đăng ký thành công!');
        setTimeout(() => onClose(), 800);
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = await login(formData.username, formData.password);
      if (res.success) {
        setSuccessMsg(`Chào mừng ${res.user.name || res.user.username}!`);
        setTimeout(() => onClose(), 800);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => {
        // Cơ chế 3: Click Outside (Bấm ra ngoài vùng nền tối để đóng Modal)
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="relative w-full max-w-[500px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl bg-[#12151f] border border-white/10 shadow-2xl p-6 sm:p-8 animate-scale-up"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          background: '#12151f',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút Đóng (X) cố định ở góc trên bên phải, kích thước 36x36px */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-ruby-600 text-white backdrop-blur-md transition-all flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
          title="Đóng (phím ESC)"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-ruby-600/20 text-ruby-400 mb-3 border border-ruby-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-extrabold text-white">
            {isForgotMode ? 'Khôi Phục Mật Khẩu' : isRegisterMode ? 'Đăng Ký Khách Hàng' : 'Đăng Nhập Hệ Thống'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isForgotMode
              ? 'Nhập username hoặc email của bạn để cấp lại mật khẩu'
              : 'Chào mừng bạn đến với Rạp chiếu phim Night Movie'}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-ruby-950/80 border border-ruby-600/50 text-ruby-200 text-xs flex items-center gap-2">
            <span>⚠️</span> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isForgotMode ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên đăng nhập hoặc Email</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.forgotIdentifier}
                    onChange={(e) => setFormData({ ...formData, forgotIdentifier: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-sm focus:outline-none focus:border-ruby-500"
                    placeholder="customer1 hoặc email@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu mới muốn đặt</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.forgotNewPassword}
                    onChange={(e) => setFormData({ ...formData, forgotNewPassword: e.target.value })}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-sm focus:outline-none focus:border-ruby-500"
                    placeholder="Mật khẩu mới (ví dụ: password123)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên đăng nhập</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-sm focus:outline-none focus:border-ruby-500 focus:ring-1 focus:ring-ruby-500"
                    placeholder="Nhập username"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Mật khẩu</label>
                  {!isRegisterMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(true);
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] text-ruby-400 hover:text-ruby-300 font-semibold"
                    >
                      Quên mật khẩu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-sm focus:outline-none focus:border-ruby-500 focus:ring-1 focus:ring-ruby-500"
                    placeholder="Nhập password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegisterMode && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-sm focus:outline-none focus:border-ruby-500"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-sm focus:outline-none focus:border-ruby-500"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-sm focus:outline-none focus:border-ruby-500"
                        placeholder="0901234567"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-ruby-600 via-ruby-700 to-rose-700 hover:from-ruby-500 hover:to-rose-600 text-white font-bold text-sm shadow-glow-red transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : isForgotMode ? 'Khôi Phục Mật Khẩu' : isRegisterMode ? 'Đăng Ký Ngay' : 'Đăng Nhập'}
          </button>
        </form>

        {/* Google OAuth via Supabase Auth (Hybrid Token Exchange) */}
        {!isForgotMode && (
          <div className="mt-4">
            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-cinema-700/70" />
              <span className="px-3 text-[11px] uppercase tracking-wider text-slate-400 bg-cinema-900/90 whitespace-nowrap">
                Hoặc tiếp tục với
              </span>
              <div className="w-full border-t border-cinema-700/70" />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setErrorMsg('');
                setSuccessMsg('');
                const res = await loginWithGoogle();
                if (!res?.success && res?.message) {
                  setErrorMsg(res.message);
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all border border-slate-200 shadow-sm disabled:opacity-50 cursor-pointer"
              title={isGoogleAuthReady ? 'Đăng nhập nhanh bằng tài khoản Google' : 'Cần cấu hình VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY'}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.51 5.51 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.57-5.15 3.57-8.65z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.77-2.11-6.72-4.95H1.29v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.29A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.29v-3.1H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.39l3.99-3.1z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l3.99 3.1c.95-2.84 3.6-4.94 6.72-4.94z" />
              </svg>
              <span>Đăng nhập bằng Google</span>
            </button>
          </div>
        )}

        {/* Demo Accounts Quick Fill */}
        {!isRegisterMode && !isForgotMode && (
          <div className="mt-6 pt-4 border-t border-cinema-700/60">
            <div className="text-[11px] font-bold text-gold-400 uppercase tracking-wider mb-2">
              Tài khoản mẫu (Bấm để điền nhanh):
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickFill(acc.username, acc.password)}
                  className={`p-2.5 rounded-xl bg-cinema-900 hover:bg-cinema-850 ${acc.hoverBorder} border border-cinema-700/60 text-left transition-all cursor-pointer min-h-[56px] flex flex-col justify-center`}
                >
                  <div className={`font-bold text-xs truncate ${acc.nameColor}`}>{acc.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                    {acc.role} • {acc.username}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toggle Mode */}
        <div className="mt-4 text-center text-xs text-slate-400">
          {isForgotMode ? (
            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-ruby-400 hover:underline font-bold"
            >
              ← Quay lại Đăng nhập
            </button>
          ) : isRegisterMode ? (
            <span>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setIsRegisterMode(false)}
                className="text-ruby-400 hover:underline font-bold"
              >
                Đăng nhập ngay
              </button>
            </span>
          ) : (
            <span>
              Khách hàng mới?{' '}
              <button
                type="button"
                onClick={() => setIsRegisterMode(true)}
                className="text-ruby-400 hover:underline font-bold"
              >
                Tạo tài khoản đặt vé
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
