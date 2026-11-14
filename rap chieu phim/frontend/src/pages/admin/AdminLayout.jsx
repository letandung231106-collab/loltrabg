import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Film,
  Building,
  Calendar,
  Ticket,
  Wrench,
  AlertTriangle,
  ClipboardList,
  Clock,
  Users,
  UserCheck,
  BarChart3,
  Shield,
  LogOut,
  Utensils,
  Boxes,
  DollarSign,
  Key
} from 'lucide-react';

export function AdminLayout({ currentTab, onSelectTab, children }) {
  const { user, logout, isAdmin, isManager, isStaff, isTechnician } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Tổng quan', icon: LayoutDashboard, roles: ['admin', 'manager'] },
    { id: 'movies', label: 'Quản lý Phim', icon: Film, roles: ['admin', 'manager'] },
    { id: 'concessions', label: 'Quầy Bắp Nước & POS', icon: Utensils, roles: ['admin', 'manager', 'staff'] },
    { id: 'inventory', label: 'Kho Nguyên Liệu F&B', icon: Boxes, roles: ['admin', 'manager', 'staff'] },
    { id: 'handovers', label: 'Bàn Giao Ca & Két Tiền', icon: DollarSign, roles: ['admin', 'manager', 'staff'] },
    { id: 'kdm', label: 'Bản Quyền KDM & Máy Chiếu', icon: Key, roles: ['admin', 'manager', 'technician'] },
    { id: 'rooms', label: 'Phòng chiếu & Ghế', icon: Building, roles: ['admin', 'manager', 'staff'] },
    { id: 'schedules', label: 'Lịch chiếu', icon: Calendar, roles: ['admin', 'manager'] },
    { id: 'tickets', label: 'Vé & Soát vé QR', icon: Ticket, roles: ['admin', 'manager', 'staff'] },
    { id: 'equipment', label: 'Trang thiết bị', icon: Wrench, roles: ['admin', 'manager', 'technician'] },
    { id: 'incidents', label: 'Quản lý Sự cố', icon: AlertTriangle, roles: ['admin', 'manager', 'staff', 'technician'] },
    { id: 'maintenance', label: 'Kế hoạch Bảo trì', icon: ClipboardList, roles: ['admin', 'manager', 'technician'] },
    { id: 'inspections', label: 'Kiểm tra phòng (9 Mục)', icon: ClipboardList, roles: ['admin', 'manager', 'staff'] },
    { id: 'shifts', label: 'Ca làm việc', icon: Clock, roles: ['admin', 'manager', 'staff', 'technician'] },
    { id: 'employees', label: 'Nhân viên & Phân quyền', icon: Users, roles: ['admin', 'manager'] },
    { id: 'customers', label: 'Khách hàng CRM', icon: UserCheck, roles: ['admin', 'manager'] },
    { id: 'reports', label: 'Báo cáo & Thống kê', icon: BarChart3, roles: ['admin', 'manager'] },
  ];

  const userRole = user?.role?.toLowerCase() || 'customer';
  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole));

  // Kiểm soát phân quyền: Chặn khách hàng thường vào trang nội bộ
  if (userRole === 'customer' || !user) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-ruby-600/20 text-ruby-400 border border-ruby-500/40 flex items-center justify-center mx-auto shadow-glow-red">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Truy Cập Quản Trị Bị Từ Chối (403 Forbidden)</h2>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
          Tài khoản hiện tại của bạn là <strong>Khách Hàng (Customer)</strong>. Phân hệ Quản trị & Vận hành chỉ dành riêng cho Admin, Quản lý rạp, Nhân sự và Kỹ thuật viên (RBAC).
        </p>
        <div className="p-4 rounded-2xl bg-cinema-900 border border-cinema-700 max-w-md mx-auto text-xs text-left space-y-2">
          <div className="font-bold text-ruby-400">🔒 Yêu cầu quyền truy cập:</div>
          <p className="text-slate-300">
            Vui lòng đăng nhập với tài khoản nhân viên hoặc quản trị viên (Admin, Manager, Staff hoặc Technician) để truy cập hệ thống quản lý rạp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cinema-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-cinema-900/90 border-r border-cinema-700/60 flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-cinema-700/60 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-ruby-600/20 text-ruby-400 border border-ruby-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-sm text-white tracking-wider">HỆ THỐNG VẬN HÀNH</div>
            <div className="text-[10px] text-gold-400 font-bold uppercase">{user?.role} PORTAL</div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-cinema-850 border border-cinema-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ruby-600 to-amber-500 flex items-center justify-center font-bold text-xs text-white">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-xs">
              <div className="font-bold text-white max-w-[110px] truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400">{user?.position || user?.department || user?.role}</div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 text-left ${
                  isActive
                    ? 'bg-ruby-600 text-white shadow-glow-red'
                    : 'text-slate-400 hover:text-white hover:bg-cinema-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-cinema-700/60 text-[10px] text-slate-500 flex justify-between items-center">
          <span>NIGHT MOVIE v1.0</span>
          <span className="text-emerald-400">● Live MySQL</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
