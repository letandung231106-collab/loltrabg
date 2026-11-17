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

  // Dữ liệu sơ đồ cột theo dãy ghế cho từng phòng chiếu (Tỉ lệ lấp đầy % & Doanh số ước tính triệu VNĐ)
  const heatmapByRoom = {
    hall1: [
      { row: 'Hàng A', shortRow: 'A', fillRate: 35, revenueM: 1.2, avgRevenue: '1.2M', desc: 'Tiền sảnh (Gần màn hình)' },
      { row: 'Hàng B', shortRow: 'B', fillRate: 55, revenueM: 2.1, avgRevenue: '2.1M', desc: 'Standard Dolby' },
      { row: 'Hàng C', shortRow: 'C', fillRate: 70, revenueM: 3.4, avgRevenue: '3.4M', desc: 'Standard Dolby' },
      { row: 'Hàng D (VIP)', shortRow: 'D', fillRate: 95, revenueM: 6.8, avgRevenue: '6.8M', desc: 'VIP Hàng Giữa (Hot nhất)' },
      { row: 'Hàng E (VIP)', shortRow: 'E', fillRate: 98, revenueM: 7.2, avgRevenue: '7.2M', desc: 'VIP Góc Nhìn Chuẩn' },
      { row: 'Hàng F (Đôi)', shortRow: 'F', fillRate: 85, revenueM: 5.9, avgRevenue: '5.9M', desc: 'Ghế Đôi Sweetbox' },
    ],
    hall2: [
      { row: 'Hàng A', shortRow: 'A', fillRate: 40, revenueM: 1.5, avgRevenue: '1.5M', desc: 'Tiền sảnh (Gần màn hình)' },
      { row: 'Hàng B', shortRow: 'B', fillRate: 62, revenueM: 2.6, avgRevenue: '2.6M', desc: 'Standard Dolby' },
      { row: 'Hàng C', shortRow: 'C', fillRate: 78, revenueM: 3.9, avgRevenue: '3.9M', desc: 'Standard Dolby' },
      { row: 'Hàng D (VIP)', shortRow: 'D', fillRate: 92, revenueM: 6.4, avgRevenue: '6.4M', desc: 'VIP Hàng Giữa (Hot nhất)' },
      { row: 'Hàng E (VIP)', shortRow: 'E', fillRate: 96, revenueM: 6.9, avgRevenue: '6.9M', desc: 'VIP Góc Nhìn Chuẩn' },
      { row: 'Hàng F (Đôi)', shortRow: 'F', fillRate: 88, revenueM: 6.1, avgRevenue: '6.1M', desc: 'Ghế Đôi Sweetbox' },
    ],
    hall3: [
      { row: 'Hàng A', shortRow: 'A', fillRate: 45, revenueM: 1.9, avgRevenue: '1.9M', desc: 'Hàng Đầu 4DX Motion' },
      { row: 'Hàng B', shortRow: 'B', fillRate: 68, revenueM: 3.1, avgRevenue: '3.1M', desc: '4DX Tiêu Chuẩn' },
      { row: 'Hàng C', shortRow: 'C', fillRate: 82, revenueM: 4.5, avgRevenue: '4.5M', desc: '4DX Trung Tâm' },
      { row: 'Hàng D (VIP)', shortRow: 'D', fillRate: 97, revenueM: 7.5, avgRevenue: '7.5M', desc: 'VIP 4DX (Hot nhất)' },
      { row: 'Hàng E (VIP)', shortRow: 'E', fillRate: 94, revenueM: 7.1, avgRevenue: '7.1M', desc: 'VIP 4DX Toàn Cảnh' },
      { row: 'Hàng F (Đôi)', shortRow: 'F', fillRate: 80, revenueM: 5.4, avgRevenue: '5.4M', desc: 'Ghế Đôi Cuối Phòng' },
    ],
  };
  const heatmapRows = heatmapByRoom[selectedHeatmapRoom] || heatmapByRoom.hall1;

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

        {/* Sơ Đồ Cột (Vertical Column Chart) thống kê tỷ lệ lấp đầy & doanh số theo hàng ghế */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 font-semibold">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Hàng ghế Hot (≥ 80% lấp đầy)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Trung bình khá (50% - 79%)
              </span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-3 h-3 rounded bg-sky-500 inline-block" /> Hàng gần màn hình (&lt; 50%)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Đơn vị: % Tỷ lệ lấp đầy & Doanh số ước tính (Triệu VNĐ)
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapRows} margin={{ top: 12, right: 20, left: 0, bottom: 8 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263145" vertical={false} />
                <XAxis dataKey="row" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis
                  yAxisId="fill"
                  domain={[0, 100]}
                  stroke="#f43f5e"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  yAxisId="rev"
                  orientation="right"
                  stroke="#f59e0b"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `${v}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1117',
                    borderColor: '#384661',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val, name, props) => {
                    if (name === 'Tỷ lệ lấp đầy') {
                      return [`${val}% (${props?.payload?.desc || ''})`, 'Tỷ lệ lấp đầy'];
                    }
                    return [`~${val} Triệu VNĐ`, 'Doanh số ước tính'];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar yAxisId="fill" dataKey="fillRate" name="Tỷ lệ lấp đầy" radius={[8, 8, 0, 0]} maxBarSize={44}>
                  {heatmapRows.map((entry, idx) => (
                    <Cell
                      key={`cell-fill-${idx}`}
                      fill={entry.fillRate >= 80 ? '#f43f5e' : entry.fillRate >= 50 ? '#f59e0b' : '#38bdf8'}
                    />
                  ))}
                </Bar>
                <Bar
                  yAxisId="rev"
                  dataKey="revenueM"
                  name="Doanh số (Triệu VNĐ)"
                  fill="#a855f7"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tóm tắt nhanh dưới biểu đồ cột */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
            {heatmapRows.map((item) => {
              const isHot = item.fillRate >= 80;
              const isMedium = item.fillRate >= 50 && item.fillRate < 80;
              return (
                <div
                  key={item.shortRow}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                    isHot
                      ? 'bg-rose-950/25 border-rose-500/40'
                      : isMedium
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-cinema-850/40 border-cinema-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-black text-white">{item.row}</span>
                    <span
                      className={`font-mono font-bold text-[11px] ${
                        isHot ? 'text-rose-400' : isMedium ? 'text-amber-400' : 'text-sky-400'
                      }`}
                    >
                      {item.fillRate}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate" title={item.desc}>
                    {item.desc}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-amber-300 mt-1">
                    ~{item.avgRevenue} VNĐ
                  </div>
                </div>
              );
            })}
          </div>
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
                <th className="py-3 px-3 whitespace-nowrap">Hạng</th>
                <th className="py-3 px-4">Tên Phim</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Số Vé Đã Bán</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Tổng Doanh Thu</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Tỷ Trọng</th>
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
