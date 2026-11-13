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
  Flame,
  Award,
  Trophy,
} from 'lucide-react';

export function DashboardView({ onNavigateTab }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Seat Heatmap State (Bản đồ nhiệt chỗ ngồi)
  const [selectedHeatmapRoom, setSelectedHeatmapRoom] = useState('hall1');

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

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 border-ruby-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Đang tải dữ liệu vận hành & phân tích KPI...</p>
      </div>
    );
  }

  const { sales, rooms, equipment, incidents, maintenance } = summary || {};

  // Mock Seat Heatmap Matrix theo dãy ghế (Tỉ lệ lấp đầy & Doanh số theo vị trí)
  const heatmapRows = [
    { row: 'A', fillRate: 35, avgRevenue: '1.2M', desc: 'Tiền sảnh (Gần màn hình)' },
    { row: 'B', fillRate: 55, avgRevenue: '2.1M', desc: 'Standard Dolby' },
    { row: 'C', fillRate: 70, avgRevenue: '3.4M', desc: 'Standard Dolby' },
    { row: 'D', fillRate: 95, avgRevenue: '6.8M', desc: '👑 VIP Hàng Giữa (Hot nhất)' },
    { row: 'E', fillRate: 98, avgRevenue: '7.2M', desc: '👑 VIP Góc Nhìn Chuẩn Hollywood' },
    { row: 'F', fillRate: 85, avgRevenue: '5.9M', desc: '💖 Ghế Đôi Sweetbox Cuối Phòng' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-ruby-500" /> Trung Tâm Chỉ Huy Vận Hành Rạp
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chỉ số KPI Doanh Thu, Tình Trạng Thiết Bị, An Toàn Phòng Chiếu & Heatmap Suất Chiếu
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 text-xs font-semibold border border-cinema-700/60 flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới dữ liệu
        </button>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Doanh thu */}
        <div className="p-5 rounded-3xl glass-panel border border-cinema-700/70 shadow-xl relative overflow-hidden group hover:border-ruby-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DOANH THU THỰC TẾ</span>
            <div className="w-10 h-10 rounded-2xl bg-ruby-500/10 border border-ruby-500/30 flex items-center justify-center text-ruby-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {sales?.total_revenue_all_time ? parseFloat(sales.total_revenue_all_time).toLocaleString('vi-VN') : '0'}{' '}
            <span className="text-xs font-normal text-slate-400">VNĐ</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
            <span>↑ Tăng trưởng tích cực</span>
            <span className="text-slate-400 font-normal">• Hôm nay: {sales?.revenue_today ? parseFloat(sales.revenue_today).toLocaleString('vi-VN') : '0'}đ</span>
          </div>
        </div>

        {/* Vé đã bán */}
        <div className="p-5 rounded-3xl glass-panel border border-cinema-700/70 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">VÉ ĐÃ PHÁT HÀNH</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {sales?.total_tickets_all_time || 0}{' '}
            <span className="text-xs font-normal text-slate-400">vé</span>
          </div>
          <div className="text-[11px] text-amber-400 font-semibold mt-2 flex items-center gap-1">
            <span>Hôm nay: {sales?.tickets_sold_today || 0} vé</span>
            <span className="text-slate-400 font-normal">• {sales?.screenings_today || 0} suất chiếu</span>
          </div>
        </div>

        {/* Phòng chiếu */}
        <div className="p-5 rounded-3xl glass-panel border border-cinema-700/70 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PHÒNG HOẠT ĐỘNG</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {rooms?.active_rooms || 0} / {rooms?.total_rooms || 0}
          </div>
          <div className="text-[11px] text-slate-300 font-medium mt-2 flex items-center gap-2">
            <span className="text-rose-400">⚠️ {rooms?.incident_rooms || 0} có sự cố</span>
            <span>•</span>
            <span className="text-amber-400">🔧 {rooms?.maintenance_rooms || 0} bảo trì</span>
          </div>
        </div>

        {/* Sự cố vận hành */}
        <div className="p-5 rounded-3xl glass-panel border border-cinema-700/70 shadow-xl relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">SỰ CỐ VẬN HÀNH</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
            {incidents?.unresolved_incidents || 0}
          </div>
          <div className="text-[11px] text-slate-300 font-medium mt-2 flex items-center gap-2">
            <span className="text-emerald-400">✓ Đã phân công KTV</span>
            <span>•</span>
            <span>Tổng cộng: {incidents?.total_incidents || 0}</span>
          </div>
        </div>
      </div>

      {/* --- SEAT HEATMAP ANALYTICS (Ý TƯỞNG 4: BẢN ĐỒ NHIỆT CHỖ NGỒI RẠP CHIẾU) --- */}
      <div className="p-6 glass-panel rounded-3xl border border-cinema-700/80 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cinema-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-glow-amber">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Bản Đồ Nhiệt Chỗ Ngồi (Seat Heatmap Analytics)
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  Tối ưu hóa giá vé
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Thống kê tần suất chọn ghế thực tế và doanh số tích lũy theo từng hàng ghế
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Phòng chiếu:</span>
            <select
              value={selectedHeatmapRoom}
              onChange={(e) => setSelectedHeatmapRoom(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white text-xs focus:outline-none"
            >
              <option value="hall1">Cinema Hall 4 (IMAX Laser)</option>
              <option value="hall2">Cinema Hall 1 (Dolby Atmos)</option>
              <option value="hall3">Cinema Hall 5 (4DX Motion)</option>
            </select>
          </div>
        </div>

        {/* Heatmap Bar List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {heatmapRows.map((item) => {
            const isHot = item.fillRate >= 80;
            const isMedium = item.fillRate >= 50 && item.fillRate < 80;
            return (
              <div
                key={item.row}
                className={`p-4 rounded-2xl border transition-all ${
                  isHot
                    ? 'bg-rose-950/30 border-rose-500/50 shadow-glow-red'
                    : isMedium
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-cinema-850/40 border-cinema-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-cinema-800 font-mono font-black text-sm flex items-center justify-center text-white border border-cinema-600">
                      {item.row}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{item.desc}</span>
                  </div>
                  <span
                    className={`text-xs font-black font-mono ${
                      isHot ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    {item.fillRate}% Lấp đầy
                  </span>
                </div>

                {/* Progress Visual Bar */}
                <div className="w-full h-2.5 rounded-full bg-cinema-900 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      isHot
                        ? 'bg-gradient-to-r from-amber-500 to-rose-600 shadow-glow-red'
                        : isMedium
                        ? 'bg-gradient-to-r from-blue-500 to-amber-500'
                        : 'bg-cinema-600'
                    }`}
                    style={{ width: `${item.fillRate}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Doanh số ước tính:</span>
                  <span className="font-mono font-bold text-white">~{item.avgRevenue} VNĐ</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 7-DAY REVENUE & TICKET SALES TREND (AREA CHART) --- */}
      <div className="p-6 glass-panel rounded-3xl border border-cinema-700/80 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cinema-700/60">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ruby-500" /> Xu Hướng Doanh Thu & Lượng Vé (7 Ngày Gần Nhất)
            </h3>
            <p className="text-xs text-slate-400">
              Biểu đồ trực quan tốc độ phát hành vé và tăng trưởng doanh thu toàn cụm rạp
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-ruby-400">
              <span className="w-3 h-3 rounded bg-ruby-500 inline-block" /> Doanh Thu (VNĐ)
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Số Vé Phát Hành
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {analytics?.dailyRevenue && analytics.dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.dailyRevenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#263145" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#ef4444" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    borderColor: '#384661',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val, name) => [
                    name === 'total_revenue' ? `${parseFloat(val).toLocaleString('vi-VN')} VNĐ` : `${val} vé`,
                    name === 'total_revenue' ? 'Doanh Thu' : 'Số Vé',
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="tickets_count"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTickets)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <TrendingUp className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
              Chưa có dữ liệu giao dịch trong 7 ngày qua.
            </div>
          )}
        </div>
      </div>

      {/* --- TOP SELLING MOVIES BOX OFFICE LEADERBOARD --- */}
      <div className="p-6 glass-panel rounded-3xl border border-cinema-700/80 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cinema-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-glow-amber">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Bảng Xếp Hạng Phim Bán Chạy Nhất (Box Office Top Movies)
              </h3>
              <p className="text-xs text-slate-400">
                Thống kê số lượng vé đã xuất rạp và tổng doanh thu tích lũy từng phim
              </p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-cinema-850 text-gold-400 border border-cinema-700 font-bold">
            Realtime Analytics
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-cinema-800 uppercase tracking-wider font-bold">
                <th className="py-3 px-3">Hạng</th>
                <th className="py-3 px-4">Tên Phim</th>
                <th className="py-3 px-3 text-center">Số Vé Đã Bán</th>
                <th className="py-3 px-4 text-right">Tổng Doanh Thu</th>
                <th className="py-3 px-3 text-center">Tỷ Trọng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-800/60 font-medium">
              {(analytics?.topMovies || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    Chưa có dữ liệu bán vé phim.
                  </td>
                </tr>
              ) : (
                (() => {
                  const totalTicketsAll = (analytics?.topMovies || []).reduce(
                    (sum, m) => sum + (Number(m.total_tickets || m.tickets_sold) || 0),
                    0
                  );
                  return (analytics?.topMovies || []).map((m, idx) => {
                    const tickets = Number(m.total_tickets || m.tickets_sold) || 0;
                    const pct = totalTicketsAll > 0 ? Math.round((tickets / totalTicketsAll) * 100) : 0;
                    return (
                      <tr key={m.id || idx} className="hover:bg-cinema-850/50 transition-colors">
                        <td className="py-3.5 px-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black font-mono text-xs ${
                              idx === 0
                                ? 'bg-amber-500 text-black shadow-glow-amber'
                                : idx === 1
                                ? 'bg-slate-300 text-black'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-cinema-800 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {m.poster && (
                              <img
                                src={m.poster}
                                alt={m.name}
                                className="w-8 h-11 object-cover rounded-lg shadow-sm border border-cinema-700"
                              />
                            )}
                            <div>
                              <div className="font-extrabold text-white text-sm">{m.name}</div>
                              <div className="text-[10px] text-slate-400">ID Phim: #{m.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-cinema-800 text-amber-300 font-mono font-bold">
                            {tickets} vé
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-white text-sm">
                          {parseFloat(m.total_revenue || 0).toLocaleString('vi-VN')}{' '}
                          <span className="text-[10px] font-normal text-slate-400">VNĐ</span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px]">
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Phim Doanh Thu Cao Nhất */}
        <div className="p-5 sm:p-6 glass-panel rounded-3xl border border-cinema-700/70 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-ruby-400" /> Top Phim Doanh Thu Cao Nhất
            </h3>
            <span className="text-[11px] text-slate-400">Thống kê theo lượt vé</span>
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
            <span className="text-[11px] text-slate-400">
              Tổng chi: {maintenance?.total_maintenance_cost ? parseFloat(maintenance.total_maintenance_cost).toLocaleString('vi-VN') : '0'}đ
            </span>
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
        <div className="lg:col-span-2 p-5 sm:p-6 glass-panel rounded-3xl border border-cinema-700/70 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-white mb-2">Thao Tác Nghiệp Vụ Nhanh (Role Routing)</h3>
            <p className="text-xs text-slate-400">
              Truy cập nhanh các nghiệp vụ vận hành rạp hàng ngày
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
