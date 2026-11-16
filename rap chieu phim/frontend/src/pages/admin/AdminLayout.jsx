import React, { useMemo } from 'react';
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
  Utensils,
  Boxes,
  DollarSign,
  Key,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'TỔNG QUAN',
    items: [
      { id: 'dashboard', label: 'Dashboard & Tổng quan', icon: LayoutDashboard, roles: ['admin', 'manager'] },
      { id: 'reports', label: 'Báo cáo & Thống kê', icon: BarChart3, roles: ['admin', 'manager'] },
    ],
  },
  {
    title: 'RẠP & SUẤT CHIẾU',
    items: [
      { id: 'movies', label: 'Quản lý Phim', icon: Film, roles: ['admin', 'manager'] },
      { id: 'schedules', label: 'Quản lý Lịch chiếu', icon: Calendar, roles: ['admin', 'manager'] },
      { id: 'rooms', label: 'Phòng chiếu & Ghế', icon: Building, roles: ['admin', 'manager', 'staff'] },
      { id: 'inspections', label: 'Kiểm tra phòng (9 Mục)', icon: ClipboardList, roles: ['admin', 'manager', 'staff'] },
    ],
  },
  {
    title: 'BÁN HÀNG',
    items: [
      {
        id: 'fnb_group',
        label: 'Bán hàng F&B',
        icon: Utensils,
        type: 'merged',
        tabs: [
          { id: 'concessions', label: 'Quầy Bắp Nước & POS', icon: Utensils, roles: ['admin', 'manager', 'staff'] },
          { id: 'inventory', label: 'Kho Nguyên Liệu', icon: Boxes, roles: ['admin', 'manager', 'staff'] },
        ],
      },
      { id: 'tickets', label: 'Quản lý Vé & Soát vé', icon: Ticket, roles: ['admin', 'manager', 'staff'] },
      { id: 'customers', label: 'Khách hàng CRM', icon: UserCheck, roles: ['admin', 'manager'] },
    ],
  },
  {
    title: 'KỸ THUẬT & BẢO TRÌ',
    items: [
      {
        id: 'equipment_group',
        label: 'Thiết bị',
        icon: Wrench,
        type: 'merged',
        tabs: [
          { id: 'equipment', label: 'Trang thiết bị', icon: Wrench, roles: ['admin', 'manager', 'technician'] },
          { id: 'kdm', label: 'Bản Quyền KDM & Máy Chiếu', icon: Key, roles: ['admin', 'manager', 'technician'] },
        ],
      },
      { id: 'maintenance', label: 'Kế hoạch Bảo trì', icon: ClipboardList, roles: ['admin', 'manager', 'technician'] },
      { id: 'incidents', label: 'Quản lý Sự cố', icon: AlertTriangle, roles: ['admin', 'manager', 'staff', 'technician'] },
    ],
  },
  {
    title: 'NHÂN SỰ',
    items: [
      {
        id: 'shifts_group',
        label: 'Ca làm',
        icon: Clock,
        type: 'merged',
        tabs: [
          { id: 'shifts', label: 'Ca làm việc', icon: Clock, roles: ['admin', 'manager', 'staff', 'technician'] },
          { id: 'handovers', label: 'Bàn Giao Ca & Két Tiền', icon: DollarSign, roles: ['admin', 'manager', 'staff'] },
        ],
      },
      { id: 'employees', label: 'Nhân viên & Phân quyền', icon: Users, roles: ['admin', 'manager'] },
    ],
  },
];

export function AdminLayout({ currentTab, onSelectTab, children }) {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();

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

  // Lọc các item và group hợp lệ theo vai trò
  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => {
      const filteredItems = group.items
        .map((item) => {
          if (item.type === 'merged') {
            const allowedTabs = item.tabs.filter((t) => t.roles.includes(userRole));
            if (allowedTabs.length === 0) return null;
            return {
              ...item,
              tabs: allowedTabs,
            };
          }
          if (item.roles.includes(userRole)) {
            return item;
          }
          return null;
        })
        .filter(Boolean);

      return {
        ...group,
        items: filteredItems,
      };
    }).filter((g) => g.items.length > 0);
  }, [userRole]);

  // Lấy danh sách tất cả các tab ID được phép của vai trò hiện tại
  const permittedTabIds = useMemo(() => {
    const ids = [];
    visibleGroups.forEach((g) => {
      g.items.forEach((item) => {
        if (item.type === 'merged') {
          item.tabs.forEach((t) => ids.push(t.id));
        } else {
          ids.push(item.id);
        }
      });
    });
    return ids;
  }, [visibleGroups]);

  // Xác định mục gộp đang được chọn (nếu có)
  const activeMergedItem = useMemo(() => {
    for (const group of visibleGroups) {
      for (const item of group.items) {
        if (item.type === 'merged' && item.tabs.some((t) => t.id === currentTab)) {
          return item;
        }
      }
    }
    return null;
  }, [visibleGroups, currentTab]);

  const isItemActive = (item) => {
    if (item.type === 'merged') {
      return item.tabs.some((t) => t.id === currentTab);
    }
    return currentTab === item.id;
  };

  const handleItemClick = (item) => {
    if (item.type === 'merged') {
      const isAlreadyInGroup = item.tabs.some((t) => t.id === currentTab);
      if (isAlreadyInGroup) return;
      if (item.tabs.length > 0) {
        onSelectTab(item.tabs[0].id);
      }
    } else {
      onSelectTab(item.id);
    }
  };

  const hasAccess = permittedTabIds.includes(currentTab);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cinema-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-cinema-900/90 border-r border-cinema-700/60 flex flex-col shrink-0">
        {/* Sidebar Header (Đã bỏ theme toggle và user card trùng lặp) */}
        <div className="p-5 border-b border-cinema-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-ruby-600/20 text-ruby-400 border border-ruby-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm text-white tracking-wider">HỆ THỐNG VẬN HÀNH</div>
              <div className="text-[10px] text-gold-400 font-bold uppercase">{user?.role} PORTAL</div>
            </div>
          </div>
        </div>

        {/* 5 Group Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {visibleGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between text-left cursor-pointer ${
                        isActive
                          ? 'bg-ruby-600 text-white shadow-glow-red font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-cinema-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.type === 'merged' && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isActive ? 'bg-white/20 text-white' : 'bg-cinema-800 text-slate-400'
                        }`}>
                          {item.tabs.length} tab
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-cinema-700/60 text-[10px] text-slate-500 flex justify-between items-center">
          <span>NIGHT MOVIE v1.0</span>
          <span className="text-emerald-400">● Live MySQL</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-screen">
        {/* Sub-tab Bar cho các mục gộp (Bán hàng F&B, Thiết bị, Ca làm) */}
        {hasAccess && activeMergedItem && activeMergedItem.tabs.length > 1 && (
          <div className="mb-6 p-1.5 rounded-2xl bg-cinema-900 border border-cinema-700/60 inline-flex flex-wrap items-center gap-1.5 shadow-md">
            {activeMergedItem.tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isTabActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isTabActive
                      ? 'bg-ruby-600 text-white shadow-glow-red'
                      : 'text-slate-400 hover:text-white hover:bg-cinema-800'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isTabActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Guard phân quyền theo vai trò */}
        {!hasAccess ? (
          <div className="p-8 text-center bg-cinema-900 border border-cinema-700 rounded-2xl max-w-lg mx-auto my-12 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Bạn không có quyền truy cập chức năng này</h3>
            <p className="text-xs text-slate-400">
              Vai trò <strong className="text-white uppercase">{userRole}</strong> chưa được phân quyền truy cập tab này.
            </p>
            {permittedTabIds.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectTab(permittedTabIds[0])}
                className="px-4 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Về trang quản lý được phép
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
