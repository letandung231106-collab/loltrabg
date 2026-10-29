import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DollarSign,
  Ticket,
  Film,
  Building,
  Wrench,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export function DashboardView({ onNavigateTab }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, anaRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getRevenueAnalytics(),
      ]);
      if (sumRes.success) setSummary(sumRes.data);
      if (anaRes.success) setAnalytics(anaRes.data);
    } catch (err) {
      console.error('Lỗi tải Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#e50914', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-ruby-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-xs">Đang tổng hợp dữ liệu Dashboard vận hành...</p>
      </div>
    );
  }

  const { movies, rooms, equipment, incidents, sales, maintenance } = summary || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-gold-400" />
            Dashboard Vận Hành & Doanh Thu
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tổng quan thời gian thực về suất chiếu, doanh thu, phòng chiếu, thiết bị và sự cố kỹ thuật
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 text-xs font-bold border border-cinema-700/60 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới số liệu
        </button>
      </div>

      {/* KPI Cards Grid (Mục 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Doanh thu hôm nay */}
        <div className="p-5 rounded-2xl glass-panel border border-cinema-700/70 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Doanh thu hôm nay</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {sales?.revenue_today ? parseFloat(sales.revenue_today).toLocaleString('vi-VN') : '0'} <span className="text-xs font-normal text-slate-400">VNĐ</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> Tổng DT: {sales?.total_revenue_all_time ? (parseFloat(sales.total_revenue_all_time) / 1000000).toFixed(1) : '0'}M VNĐ
          </div>
        </div>

        {/* Vé bán hôm nay */}
        <div className="p-5 rounded-2xl glass-panel border border-cinema-700/70 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Vé bán hôm nay</span>
            <div className="p-2 rounded-xl bg-ruby-500/20 text-ruby-400">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {sales?.tickets_sold_today || 0} <span className="text-xs font-normal text-slate-400">vé</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {sales?.screenings_today || 0} suất chiếu đang chạy
          </div>
        </div>

        {/* Tình trạng Phòng chiếu */}
        <div className="p-5 rounded-2xl glass-panel border border-cinema-700/70 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Phòng chiếu</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {rooms?.active_rooms || 0} <span className="text-xs font-normal text-slate-400">/ {rooms?.total_rooms || 0} hoạt động</span>
          </div>
          <div className="text-[11px] flex items-center gap-2 font-semibold">
            <span className="text-amber-400">⚠️ {rooms?.maintenance_rooms || 0} bảo trì</span>
            <span className="text-rose-400">🚨 {rooms?.incident_rooms || 0} sự cố</span>
          </div>
        </div>

        {/* Sự cố chưa xử lý */}
        <div className="p-5 rounded-2xl glass-panel border border-cinema-700/70 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Sự cố kỹ thuật</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {incidents?.unresolved_incidents || 0} <span className="text-xs font-normal text-slate-400">chưa xử lý</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {equipment?.faulty_equipment || 0} thiết bị hỏng • {equipment?.upcoming_maintenance || 0} sắp bảo trì
          </div>
        </div>
      </div>

      {/* Analytics Charts (Mục 9 & 30) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ doanh thu 7 ngày gần nhất */}
        <div className="p-5 sm:p-6 glass-panel rounded-3xl border border-cinema-700/70 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Biểu Đồ Doanh Thu Giao Dịch
            </h3>
            <span className="text-[11px] text-slate-400">7 ngày gần nhất</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.dailyRevenue || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e50914" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#e50914" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#263145" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#384661', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val) => [`${parseFloat(val).toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                />
                <Area type="monotone" dataKey="total_revenue" stroke="#e50914" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Phim Doanh Thu Cao Nhất */}
        <div className="p-5 sm:p-6 glass-panel rounded-3xl border border-cinema-700/70 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-ruby-400" /> Top Phim Doanh Thu & Vé Bán
            </h3>
            <span className="text-[11px] text-slate-400">Doanh thu tích lũy</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topMovies || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#263145" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={110} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#384661', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val) => [`${parseFloat(val).toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                />
                <Bar dataKey="total_revenue" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chi Phí Bảo Trì Theo Loại Thiết Bị */}
        <div className="p-5 sm:p-6 glass-panel rounded-3xl border border-cinema-700/70 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-gold-400" /> Chi Phí Bảo Trì Theo Thiết Bị
            </h3>
            <span className="text-[11px] text-slate-400">Tổng chi: {maintenance?.total_maintenance_cost ? parseFloat(maintenance.total_maintenance_cost).toLocaleString('vi-VN') : '0'}đ</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.maintenanceCostByType || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263145" />
                <XAxis dataKey="type_name" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#384661', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val) => [`${parseFloat(val).toLocaleString('vi-VN')} VNĐ`, 'Chi phí']}
                />
                <Bar dataKey="total_cost" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations Shortcuts */}
        <div className="p-5 sm:p-6 glass-panel rounded-3xl border border-cinema-700/70 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-white mb-2">Thao Tác Nghiệp Vụ Nhanh</h3>
            <p className="text-xs text-slate-400">
              Truy cập nhanh các nghiệp vụ vận hành rạp hàng ngày
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigateTab('schedules')}
              className="p-3.5 rounded-2xl bg-cinema-850 hover:bg-cinema-800 border border-cinema-700/60 text-left transition-all hover:border-ruby-500"
            >
              <div className="font-bold text-xs text-white mb-1">📅 Lập Lịch Chiếu</div>
              <div className="text-[10px] text-slate-400">Kiểm tra phòng & xung đột</div>
            </button>
            <button
              onClick={() => onNavigateTab('incidents')}
              className="p-3.5 rounded-2xl bg-cinema-850 hover:bg-cinema-800 border border-cinema-700/60 text-left transition-all hover:border-amber-500"
            >
              <div className="font-bold text-xs text-amber-400 mb-1">🚨 Phân Công Sự Cố</div>
              <div className="text-[10px] text-slate-400">Giao nhiệm vụ cho KTV</div>
            </button>
            <button
              onClick={() => onNavigateTab('inspections')}
              className="p-3.5 rounded-2xl bg-cinema-850 hover:bg-cinema-800 border border-cinema-700/60 text-left transition-all hover:border-blue-500"
            >
              <div className="font-bold text-xs text-blue-400 mb-1">📋 Checklist 9 Tiêu Chí</div>
              <div className="text-[10px] text-slate-400">Kiểm tra phòng trước ca</div>
            </button>
            <button
              onClick={() => onNavigateTab('tickets')}
              className="p-3.5 rounded-2xl bg-cinema-850 hover:bg-cinema-800 border border-cinema-700/60 text-left transition-all hover:border-emerald-500"
            >
              <div className="font-bold text-xs text-emerald-400 mb-1">🎟️ Soát Vé QR Code</div>
              <div className="text-[10px] text-slate-400">Quét mã kiểm tra vé</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
