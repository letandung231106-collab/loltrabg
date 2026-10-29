import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Ticket,
  Wrench,
  AlertTriangle,
  Download,
  Utensils,
  Boxes,
  FileSpreadsheet,
  CheckCircle2,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export function ReportsManager() {
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [anaRes, sumRes] = await Promise.all([
        api.getRevenueAnalytics(),
        api.getDashboardSummary(),
      ]);
      if (anaRes.success) setAnalytics(anaRes.data);
      if (sumRes.success) setSummary(sumRes.data);
    } catch (err) {
      console.error('Lỗi tải báo cáo:', err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export Utility
  const exportRevenueCSV = () => {
    const movies = analytics?.topMovies || [];
    let csv = 'Mã Phim,Tên Phim,Tổng Doanh Thu (VNĐ),Số Suất Chiếu\n';
    movies.forEach((m, idx) => {
      csv += `${idx + 1},"${m.name}",${m.total_revenue || 0},${m.total_screenings || 1}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Doanh_Thu_Night_Movie_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setMsg('Đã xuất file báo cáo doanh thu Excel (CSV) thành công!');
    setTimeout(() => setMsg(''), 4000);
  };

  const exportInventoryCSV = async () => {
    try {
      const res = await api.getIngredients();
      if (!res.success) return;
      let csv = 'Mã Nguyên Liệu,Tên Nguyên Vật Liệu,Đơn Vị,Tồn Kho Hiện Tại,Ngưỡng Tối Thiểu,Đơn Giá Vốn (VNĐ),Nhà Cung Cấp\n';
      res.data.forEach((i) => {
        csv += `"${i.code}","${i.name}","${i.unit}",${i.stock_quantity},${i.min_threshold},${i.cost_per_unit || 0},"${i.supplier || ''}"\n`;
      });

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_Cao_Ton_Kho_FB_Night_Movie_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setMsg('Đã xuất file báo cáo tồn kho F&B Excel (CSV) thành công!');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const revenueSplitData = [
    { name: 'Vé Xem Phim (Box Office)', value: 165800000, color: '#e50914' },
    { name: 'Bắp Nước F&B (Concession)', value: 78500000, color: '#f59e0b' },
    { name: 'Quảng Cáo & Sự Kiện Thuê Rạp', value: 24000000, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-ruby-500" /> Báo Cáo & Thống Kê Tổng Hợp
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Báo cáo doanh thu Box Office & F&B, chi phí bảo trì thiết bị và xuất báo cáo kế toán Excel
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportRevenueCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-emerald transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Xuất Báo Cáo Doanh Thu (Excel)
          </button>
          <button
            onClick={exportInventoryCSV}
            className="px-3.5 py-2 rounded-xl bg-cinema-800 hover:bg-cinema-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Xuất Kho F&B (CSV)
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {msg}
        </div>
      )}

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="p-5 rounded-3xl glass-panel border border-cinema-700 space-y-2">
          <div className="text-xs font-bold text-slate-400">Doanh thu vé xem phim</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {summary?.sales?.total_revenue_all_time ? parseFloat(summary.sales.total_revenue_all_time).toLocaleString('vi-VN') : '165.800.000'} <span className="text-xs text-slate-400">VNĐ</span>
          </div>
          <div className="text-[11px] text-slate-400">Tổng số vé đã bán: {summary?.sales?.total_tickets_all_time || 1420} vé</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-cinema-700 space-y-2">
          <div className="text-xs font-bold text-slate-400">Doanh thu bắp nước (F&B)</div>
          <div className="text-2xl font-black text-gold-400 font-mono">
            78.500.000 <span className="text-xs text-slate-400">VNĐ</span>
          </div>
          <div className="text-[11px] text-slate-400">Tỷ trọng: 32% tổng doanh thu rạp</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-cinema-700 space-y-2">
          <div className="text-xs font-bold text-slate-400">Tổng chi phí bảo trì rạp</div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {summary?.maintenance?.total_maintenance_cost ? parseFloat(summary.maintenance.total_maintenance_cost).toLocaleString('vi-VN') : '12.500.000'} <span className="text-xs text-slate-400">VNĐ</span>
          </div>
          <div className="text-[11px] text-slate-400">Tổng số đợt bảo dưỡng: {summary?.maintenance?.total_maintenances || 8} lượt</div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-cinema-700 space-y-2">
          <div className="text-xs font-bold text-slate-400">Tỷ lệ phòng chiếu sẵn sàng</div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {summary?.rooms?.total_rooms > 0 ? ((summary?.rooms?.active_rooms / summary?.rooms?.total_rooms) * 100).toFixed(0) : '100'}%
          </div>
          <div className="text-[11px] text-slate-400">{summary?.rooms?.active_rooms || 8} / {summary?.rooms?.total_rooms || 8} phòng hoạt động</div>
        </div>
      </div>

      {/* Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doanh thu theo phim */}
        <div className="p-6 glass-panel rounded-3xl border border-cinema-700 space-y-4">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-ruby-400" /> Doanh Thu Chi Tiết Theo Phim
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topMovies || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263145" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#384661', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val) => [`${parseFloat(val).toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                />
                <Bar dataKey="total_revenue" fill="#e50914" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cơ Cấu Doanh Thu (Box Office vs F&B) */}
        <div className="p-6 glass-panel rounded-3xl border border-cinema-700 space-y-4">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-gold-400" /> Cơ Cấu Nguồn Doanh Thu Rạp Phim
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueSplitData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#384661', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val) => [`${val.toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
