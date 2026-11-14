import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  Crown,
  Ticket,
  Shield,
  CheckCircle,
  AlertCircle,
  KeyRound,
  LogOut,
  Calendar,
} from 'lucide-react';

export function UserProfileModal({ isOpen, onClose, onNavigateMyTickets }) {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'password'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setMsg({ text: '', type: '' });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      const res = await api.updateProfile(payload);
      if (res.success) {
        if (updateUser) updateUser(res.user);
        if (res.token) localStorage.setItem('token', res.token);
        setMsg({ text: res.message || 'Cập nhật thông tin thành công!', type: 'success' });
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi cập nhật hồ sơ.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setMsg({ text: 'Mật khẩu xác nhận không khớp với mật khẩu mới.', type: 'error' });
      return;
    }
    if (formData.newPassword.length < 6) {
      setMsg({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'error' });
      return;
    }

    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await api.updateProfile({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (res.success) {
        setMsg({ text: 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.', type: 'success' });
        setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      }
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi đổi mật khẩu.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const membership = user.membership_level || (user.role === 'customer' ? 'gold' : 'platinum');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel bg-cinema-900 border border-cinema-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-transparent via-ruby-500 to-transparent shadow-glow-red" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-cinema-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Avatar & Role */}
        <div className="flex items-center gap-4 pb-5 border-b border-cinema-700/60 shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-ruby-600 via-rose-600 to-amber-500 flex items-center justify-center font-black text-2xl text-white shadow-glow-red shrink-0">
            {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white truncate">{user.name || user.username}</h3>
              <span className="px-2 py-0.5 rounded-full bg-cinema-800 text-gold-400 border border-gold-500/30 text-[10px] font-mono font-bold uppercase">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              Tài khoản: <span className="font-mono text-slate-300">@{user.username}</span> • ID: #{user.id}
            </p>
          </div>
        </div>

        {/* Loyalty & Quick Action Card */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-cinema-850 via-cinema-800 to-cinema-850 border border-cinema-700/70 flex items-center justify-between gap-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hạng Thẻ Thành Viên</span>
              <div className="text-sm font-extrabold text-amber-300 uppercase flex items-center gap-1.5">
                VIP CINEMA ({membership})
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              if (onNavigateMyTickets) onNavigateMyTickets();
            }}
            className="px-3.5 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5 shrink-0"
          >
            <Ticket className="w-4 h-4" /> Vé Của Tôi
          </button>
        </div>

        {/* Alert Notifications */}
        {msg.text && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 shrink-0 ${
              msg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-ruby-950/80 border-ruby-500 text-ruby-200'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-ruby-400 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 mb-4 border-b border-cinema-700/60 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'info'
                ? 'bg-ruby-600 text-white shadow-glow-red'
                : 'bg-cinema-850 text-slate-400 hover:text-white'
            }`}
          >
            Thông Tin Cá Nhân
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'password'
                ? 'bg-ruby-600 text-white shadow-glow-red'
                : 'bg-cinema-850 text-slate-400 hover:text-white'
            }`}
          >
            Đổi Mật Khẩu
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'info' ? (
            <form onSubmit={handleSubmitProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Họ và tên</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs sm:text-sm focus:outline-none focus:border-ruby-500"
                    placeholder="Nguyễn Văn An"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs sm:text-sm focus:outline-none focus:border-ruby-500"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số điện thoại</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs sm:text-sm focus:outline-none focus:border-ruby-500 font-mono"
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-ruby-600 to-rose-600 hover:from-ruby-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-glow-red transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang lưu...' : 'Lưu Thay Đổi Thông Tin'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu hiện tại</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs sm:text-sm focus:outline-none focus:border-ruby-500"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs sm:text-sm focus:outline-none focus:border-ruby-500"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs sm:text-sm focus:outline-none focus:border-ruby-500"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-gold-600 hover:from-amber-500 hover:to-gold-500 text-cinema-950 font-extrabold text-xs sm:text-sm shadow-glow-amber transition-all disabled:opacity-50"
                >
                  {loading ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
