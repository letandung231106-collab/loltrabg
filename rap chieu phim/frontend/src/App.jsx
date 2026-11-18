import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider, useBooking } from './context/BookingContext';
import { api } from './services/api';
import confetti from 'canvas-confetti';
import { Header } from './components/common/Header';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginModal } from './components/common/LoginModal';
import { UserProfileModal } from './components/customer/UserProfileModal';
import { InSeatDeliveryModal } from './components/customer/InSeatDeliveryModal';
import { CinemaBotModal } from './components/customer/CinemaBotModal';
import { HomePage } from './pages/customer/HomePage';
import { MoviesPage } from './pages/customer/MoviesPage';
import { SchedulesPage } from './pages/customer/SchedulesPage';
import { BookingFlowPage } from './pages/customer/BookingFlowPage';
import { MyTicketsPage } from './pages/customer/MyTicketsPage';

// Admin & Operations modules - Code Splitting (Tải lười theo nhu cầu để tối ưu bundle khách hàng)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const DashboardView = lazy(() => import('./pages/admin/DashboardView').then((m) => ({ default: m.DashboardView })));
const MoviesManager = lazy(() => import('./pages/admin/MoviesManager').then((m) => ({ default: m.MoviesManager })));
const RoomsManager = lazy(() => import('./pages/admin/RoomsManager').then((m) => ({ default: m.RoomsManager })));
const SchedulesManager = lazy(() => import('./pages/admin/SchedulesManager').then((m) => ({ default: m.SchedulesManager })));
const TicketsManager = lazy(() => import('./pages/admin/TicketsManager').then((m) => ({ default: m.TicketsManager })));
const EquipmentManager = lazy(() => import('./pages/admin/EquipmentManager').then((m) => ({ default: m.EquipmentManager })));
const IncidentsManager = lazy(() => import('./pages/admin/IncidentsManager').then((m) => ({ default: m.IncidentsManager })));
const MaintenanceManager = lazy(() => import('./pages/admin/MaintenanceManager').then((m) => ({ default: m.MaintenanceManager })));
const InspectionsManager = lazy(() => import('./pages/admin/InspectionsManager').then((m) => ({ default: m.InspectionsManager })));
const ShiftsManager = lazy(() => import('./pages/admin/ShiftsManager').then((m) => ({ default: m.ShiftsManager })));
const EmployeesManager = lazy(() => import('./pages/admin/EmployeesManager').then((m) => ({ default: m.EmployeesManager })));
const CustomersManager = lazy(() => import('./pages/admin/CustomersManager').then((m) => ({ default: m.CustomersManager })));
const ReportsManager = lazy(() => import('./pages/admin/ReportsManager').then((m) => ({ default: m.ReportsManager })));
const ConcessionManager = lazy(() => import('./pages/admin/ConcessionManager').then((m) => ({ default: m.ConcessionManager })));
const InventoryManager = lazy(() => import('./pages/admin/InventoryManager').then((m) => ({ default: m.InventoryManager })));
const ShiftHandoverManager = lazy(() => import('./pages/admin/ShiftHandoverManager').then((m) => ({ default: m.ShiftHandoverManager })));
const KdmProjectorManager = lazy(() => import('./pages/admin/KdmProjectorManager').then((m) => ({ default: m.KdmProjectorManager })));

const ROLE_ALLOWED_TABS = {
  admin: [
    'dashboard', 'movies', 'concessions', 'inventory', 'handovers', 'kdm',
    'rooms', 'schedules', 'tickets', 'equipment', 'incidents', 'maintenance',
    'inspections', 'shifts', 'employees', 'customers', 'reports',
  ],
  manager: [
    'dashboard', 'movies', 'concessions', 'inventory', 'handovers', 'kdm',
    'rooms', 'schedules', 'tickets', 'equipment', 'incidents', 'maintenance',
    'inspections', 'shifts', 'employees', 'customers', 'reports',
  ],
  staff: [
    'tickets', 'concessions', 'inventory', 'handovers',
    'rooms', 'inspections', 'incidents', 'shifts',
  ],
  technician: [
    'equipment', 'incidents', 'maintenance', 'kdm', 'shifts',
  ],
};

const ROLE_DEFAULT_TAB = {
  admin: 'dashboard',
  manager: 'dashboard',
  staff: 'tickets',
  technician: 'equipment',
};

function MainApp() {
  const { isAuthenticated, isManager, isStaff, isTechnician, user, oauthNotice, clearOauthNotice } = useAuth();
  const { resetBookingState } = useBooking();
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'movies' | 'schedules' | 'booking-flow' | 'my-tickets' | 'admin-dashboard'
  const [adminTab, setAdminTab] = useState('dashboard');

  const userRole = user?.role?.toLowerCase() || 'customer';
  const allowedTabsForRole = ROLE_ALLOWED_TABS[userRole] || [];
  const defaultTabForRole = ROLE_DEFAULT_TAB[userRole] || 'incidents';
  const activeAdminTab = allowedTabsForRole.includes(adminTab) ? adminTab : defaultTabForRole;

  // Đảm bảo khi chuyển đổi Role (ví dụ từ Admin sang Technician/Staff), tab quản trị tự động chuyển về đúng phân hệ được cấp quyền
  useEffect(() => {
    if (allowedTabsForRole.length > 0 && !allowedTabsForRole.includes(adminTab)) {
      setAdminTab(defaultTabForRole);
    }
  }, [userRole, adminTab]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [selectedMovieIdFilter, setSelectedMovieIdFilter] = useState('all');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInSeatDeliveryOpen, setIsInSeatDeliveryOpen] = useState(false);
  const [momoIssuedTickets, setMomoIssuedTickets] = useState(null);
  const [momoReturnBanner, setMomoReturnBanner] = useState(null);

  // Tự động kiểm tra và xác thực Return URL khi chuyển hướng từ Cổng Thanh Toán MoMo Sandbox về
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const partnerCode = params.get('partnerCode');
    const orderId = params.get('orderId');
    const resultCode = params.get('resultCode');

    if (partnerCode && orderId && resultCode !== null) {
      const payload = Object.fromEntries(params.entries());
      // Làm sạch thanh địa chỉ URL
      window.history.replaceState({}, document.title, window.location.pathname);

      api
        .verifyMomoReturn(payload)
        .then((res) => {
          if (res.success && res.data?.paymentStatus === 'success') {
            confetti({
              particleCount: 130,
              spread: 85,
              origin: { y: 0.6 },
            });
            resetBookingState();
            setMomoIssuedTickets(res.data);
            setCurrentView('booking-flow');
            setMomoReturnBanner({
              type: 'success',
              text: `Thanh toán MoMo Sandbox thành công (Mã GD: ${res.data.transactionCode})! Chữ ký HMAC-SHA256 hợp lệ.`,
            });
          } else {
            resetBookingState();
            setMomoReturnBanner({
              type: 'error',
              text: `Giao dịch MoMo Sandbox đã bị hủy hoặc từ chối (ResultCode: ${resultCode}). Ghế giữ tạm thời đã được giải phóng tự động.`,
            });
            setCurrentView('schedules');
          }
        })
        .catch((err) => {
          setMomoReturnBanner({
            type: 'error',
            text: err.message || 'Lỗi xác thực kết quả trả về từ cổng MoMo Sandbox.',
          });
        });
    }
  }, []);

  // Navigate to schedule booking flow
  const handleSelectSchedule = (scheduleId) => {
    setMomoIssuedTickets(null);
    setSelectedScheduleId(scheduleId);
    setCurrentView('booking-flow');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to schedules view for a specific movie
  const handleSelectMovie = (movie) => {
    if (movie && movie.id) {
      setSelectedMovieIdFilter(String(movie.id));
    } else {
      setSelectedMovieIdFilter('all');
    }
    setCurrentView('schedules');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view) => {
    if (view === 'schedules') {
      setSelectedMovieIdFilter('all');
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-cinema-950 text-slate-100 flex flex-col justify-between">
      <div>
        {/* Global Navigation Header */}
        <Header
          onOpenAuth={() => setIsLoginModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onNavigate={handleNavigate}
          currentView={currentView}
          onOpenInSeatDelivery={() => setIsInSeatDeliveryOpen(true)}
        />

        {/* Supabase Google OAuth Notification Banner */}
        {oauthNotice && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold ${
                oauthNotice.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500 text-rose-200'
              }`}
            >
              <span>{oauthNotice.text}</span>
              <button
                onClick={clearOauthNotice}
                className="ml-4 px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-white text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* MoMo Sandbox Return Notification Banner */}
        {momoReturnBanner && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold ${
                momoReturnBanner.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500 text-rose-200'
              }`}
            >
              <span>{momoReturnBanner.text}</span>
              <button
                onClick={() => setMomoReturnBanner(null)}
                className="ml-4 px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-white text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Views */}
        {currentView === 'home' && (
          <HomePage
            onSelectMovie={handleSelectMovie}
            onSelectSchedule={handleSelectSchedule}
            onNavigate={handleNavigate}
            onOpenInSeatDelivery={() => setIsInSeatDeliveryOpen(true)}
          />
        )}

        {currentView === 'movies' && (
          <MoviesPage
            onSelectMovie={handleSelectMovie}
            onSelectSchedule={handleSelectSchedule}
          />
        )}

        {currentView === 'schedules' && (
          <SchedulesPage
            onSelectSchedule={handleSelectSchedule}
            initialMovieId={selectedMovieIdFilter}
          />
        )}

        {currentView === 'booking-flow' && (
          <BookingFlowPage
            scheduleId={selectedScheduleId}
            initialIssuedTickets={momoIssuedTickets}
            onBack={() => {
              setMomoIssuedTickets(null);
              setCurrentView('schedules');
            }}
            onNavigateMyTickets={() => {
              setMomoIssuedTickets(null);
              setCurrentView('my-tickets');
            }}
            onOpenAuth={() => setIsLoginModalOpen(true)}
          />
        )}

        {currentView === 'my-tickets' && (
          <MyTicketsPage onNavigateBooking={() => setCurrentView('movies')} />
        )}

        {/* Operations Internal Portal (Admin / Manager / Staff / Technician) */}
        {currentView === 'admin-dashboard' && (
          <Suspense
            fallback={
              <div className="py-24 text-center">
                <div className="w-10 h-10 border-4 border-ruby-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-xs">Đang tải phân hệ quản trị rạp chiếu...</p>
              </div>
            }
          >
            <AdminLayout currentTab={activeAdminTab} onSelectTab={setAdminTab}>
              {activeAdminTab === 'dashboard' && isManager && <DashboardView onNavigateTab={setAdminTab} />}
              {activeAdminTab === 'movies' && isManager && <MoviesManager />}
              {activeAdminTab === 'concessions' && <ConcessionManager />}
              {activeAdminTab === 'inventory' && <InventoryManager />}
              {activeAdminTab === 'handovers' && <ShiftHandoverManager />}
              {activeAdminTab === 'kdm' && <KdmProjectorManager />}
              {activeAdminTab === 'rooms' && <RoomsManager />}
              {activeAdminTab === 'schedules' && isManager && <SchedulesManager />}
              {activeAdminTab === 'tickets' && <TicketsManager />}
              {activeAdminTab === 'equipment' && <EquipmentManager />}
              {activeAdminTab === 'incidents' && <IncidentsManager />}
              {activeAdminTab === 'maintenance' && <MaintenanceManager />}
              {activeAdminTab === 'inspections' && <InspectionsManager />}
              {activeAdminTab === 'shifts' && <ShiftsManager />}
              {activeAdminTab === 'employees' && isManager && <EmployeesManager />}
              {activeAdminTab === 'customers' && isManager && <CustomersManager />}
              {activeAdminTab === 'reports' && isManager && <ReportsManager />}
            </AdminLayout>
          </Suspense>
        )}
      </div>

      {/* Global Cinema Footer */}
      <footer className="bg-cinema-900 border-t border-cinema-800 py-10 px-4 sm:px-6 lg:px-8 mt-16 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-base font-extrabold text-white mb-1">
              NIGHT <span className="text-ruby-500">MOVIE</span> CINEMA MANAGEMENT SYSTEM
            </div>
            <p className="max-w-md text-slate-400">
              Hệ thống rạp chiếu phim kỹ thuật số tiêu chuẩn quốc tế – Trải nghiệm điện ảnh đỉnh cao với âm thanh Dolby Atmos và màn hình IMAX Laser sắc nét.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>© 2026 Night Movie Cinema. All rights reserved.</span>
            <span>•</span>
            <span className="text-slate-300">Hotline CSKH: 0375358344</span>
            <span>•</span>
            <span className="text-slate-300">Email: letandung231106@gmail.com</span>
          </div>
        </div>
      </footer>

      {/* Login / Register Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* User Profile & Password Change Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onNavigateMyTickets={() => {
          setIsProfileModalOpen(false);
          setCurrentView('my-tickets');
        }}
      />

      {/* In-Seat Delivery Modal */}
      <InSeatDeliveryModal
        isOpen={isInSeatDeliveryOpen}
        onClose={() => setIsInSeatDeliveryOpen(false)}
      />

      {/* Customer Support & Voice Assistant */}
      <CinemaBotModal
        onSelectMovie={handleSelectMovie}
        onSelectSchedule={handleSelectSchedule}
        onNavigate={handleNavigate}
        onOpenInSeatDelivery={() => setIsInSeatDeliveryOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BookingProvider>
            <MainApp />
          </BookingProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
