import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider, useBooking } from './context/BookingContext';
import { api } from './services/api';
import confetti from 'canvas-confetti';
import { Header } from './components/common/Header';
import { LoginModal } from './components/common/LoginModal';
import { UserProfileModal } from './components/customer/UserProfileModal';
import { LuckyWheelModal } from './components/customer/LuckyWheelModal';
import { InSeatDeliveryModal } from './components/customer/InSeatDeliveryModal';
import { CinemaBotModal } from './components/customer/CinemaBotModal';
import { HomePage } from './pages/customer/HomePage';
import { MoviesPage } from './pages/customer/MoviesPage';
import { SchedulesPage } from './pages/customer/SchedulesPage';
import { BookingFlowPage } from './pages/customer/BookingFlowPage';
import { MyTicketsPage } from './pages/customer/MyTicketsPage';

// Admin & Operations modules
import { AdminLayout } from './pages/admin/AdminLayout';
import { DashboardView } from './pages/admin/DashboardView';
import { MoviesManager } from './pages/admin/MoviesManager';
import { RoomsManager } from './pages/admin/RoomsManager';
import { SchedulesManager } from './pages/admin/SchedulesManager';
import { TicketsManager } from './pages/admin/TicketsManager';
import { EquipmentManager } from './pages/admin/EquipmentManager';
import { IncidentsManager } from './pages/admin/IncidentsManager';
import { MaintenanceManager } from './pages/admin/MaintenanceManager';
import { InspectionsManager } from './pages/admin/InspectionsManager';
import { ShiftsManager } from './pages/admin/ShiftsManager';
import { EmployeesManager } from './pages/admin/EmployeesManager';
import { CustomersManager } from './pages/admin/CustomersManager';
import { ReportsManager } from './pages/admin/ReportsManager';
import { ConcessionManager } from './pages/admin/ConcessionManager';
import { InventoryManager } from './pages/admin/InventoryManager';
import { ShiftHandoverManager } from './pages/admin/ShiftHandoverManager';
import { KdmProjectorManager } from './pages/admin/KdmProjectorManager';

function MainApp() {
  const { isAuthenticated, isManager, isStaff, isTechnician, user } = useAuth();
  const { resetBookingState } = useBooking();
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'movies' | 'schedules' | 'booking-flow' | 'my-tickets' | 'admin-dashboard'
  const [adminTab, setAdminTab] = useState('dashboard');
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [selectedMovieIdFilter, setSelectedMovieIdFilter] = useState('all');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);
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
          onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
          onOpenInSeatDelivery={() => setIsInSeatDeliveryOpen(true)}
        />

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
            onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
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
          <AdminLayout currentTab={adminTab} onSelectTab={setAdminTab}>
            {adminTab === 'dashboard' && <DashboardView onNavigateTab={setAdminTab} />}
            {adminTab === 'movies' && <MoviesManager />}
            {adminTab === 'concessions' && <ConcessionManager />}
            {adminTab === 'inventory' && <InventoryManager />}
            {adminTab === 'handovers' && <ShiftHandoverManager />}
            {adminTab === 'kdm' && <KdmProjectorManager />}
            {adminTab === 'rooms' && <RoomsManager />}
            {adminTab === 'schedules' && <SchedulesManager />}
            {adminTab === 'tickets' && <TicketsManager />}
            {adminTab === 'equipment' && <EquipmentManager />}
            {adminTab === 'incidents' && <IncidentsManager />}
            {adminTab === 'maintenance' && <MaintenanceManager />}
            {adminTab === 'inspections' && <InspectionsManager />}
            {adminTab === 'shifts' && <ShiftsManager />}
            {adminTab === 'employees' && <EmployeesManager />}
            {adminTab === 'customers' && <CustomersManager />}
            {adminTab === 'reports' && <ReportsManager />}
          </AdminLayout>
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
            <span className="text-slate-300">Hotline CSKH: 1900 6868</span>
            <span>•</span>
            <span className="text-slate-300">Email: contact@nightmovie.vn</span>
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

      {/* Lucky Wheel Modal */}
      <LuckyWheelModal
        isOpen={isLuckyWheelOpen}
        onClose={() => setIsLuckyWheelOpen(false)}
        onVoucherClaimed={() => {}}
        onNavigateBooking={() => handleNavigate('movies')}
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
        onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
        onOpenInSeatDelivery={() => setIsInSeatDeliveryOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <MainApp />
      </BookingProvider>
    </AuthProvider>
  );
}
