import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, User, Mail, Phone, KeyRound, Sparkles, CheckCircle } from 'lucide-react';

export function LoginModal({ isOpen, onClose }) {
  const { login, register, switchRole, loading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    username: 'admin',
    password: 'password123',
    name: '',
    email: '',
    phone: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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

  const handleQuickFill = (u, p) => {
    setFormData((prev) => ({ ...prev, username: u, password: p }));
    setIsRegisterMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-cinema-600/60 overflow-hidden">
        {/* Glowing Ambient Top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-transparent via-ruby-500 to-transparent shadow-glow-red" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-cinema-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-ruby-600/20 text-ruby-400 mb-3 border border-ruby-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-extrabold text-white">
            {isRegisterMode ? 'Đăng Ký Khách Hàng' : 'Đăng Nhập Hệ Thống'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Hệ Thống Quản Lý Vận Hành & Đặt Vé Rạp Phim (OOAD)
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-sm focus:outline-none focus:border-ruby-500 focus:ring-1 focus:ring-ruby-500"
                placeholder="Nhập password"
              />
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-ruby-600 via-ruby-700 to-rose-700 hover:from-ruby-500 hover:to-rose-600 text-white font-bold text-sm shadow-glow-red transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : isRegisterMode ? 'Đăng Ký Ngay' : 'Đăng Nhập'}
          </button>
        </form>

        {/* Demo Accounts Cheat-sheet */}
        {!isRegisterMode && (
          <div className="mt-6 pt-4 border-t border-cinema-700/60">
            <div className="text-[11px] font-bold text-gold-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Tài khoản mẫu (Bấm để điền nhanh):
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'password123')}
                className="p-2 rounded-lg bg-cinema-900 hover:bg-cinema-800 border border-cinema-700/60 text-left transition-colors"
              >
                <div className="font-bold text-ruby-400">👑 Admin</div>
                <div className="text-[10px] text-slate-400">admin / password123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager1', 'password123')}
                className="p-2 rounded-lg bg-cinema-900 hover:bg-cinema-800 border border-cinema-700/60 text-left transition-colors"
              >
                <div className="font-bold text-amber-400">👔 Manager</div>
                <div className="text-[10px] text-slate-400">manager1 / password123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff1', 'password123')}
                className="p-2 rounded-lg bg-cinema-900 hover:bg-cinema-800 border border-cinema-700/60 text-left transition-colors"
              >
                <div className="font-bold text-blue-400">📋 Staff</div>
                <div className="text-[10px] text-slate-400">staff1 / password123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('tech1', 'password123')}
                className="p-2 rounded-lg bg-cinema-900 hover:bg-cinema-800 border border-cinema-700/60 text-left transition-colors"
              >
                <div className="font-bold text-emerald-400">🔧 Technician</div>
                <div className="text-[10px] text-slate-400">tech1 / password123</div>
              </button>
            </div>
          </div>
        )}

        {/* Toggle Mode */}
        <div className="mt-4 text-center text-xs text-slate-400">
          {isRegisterMode ? (
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
}
