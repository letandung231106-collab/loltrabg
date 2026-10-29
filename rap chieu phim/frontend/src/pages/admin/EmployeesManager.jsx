import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Users, Search, Phone, Mail, Shield, UserCheck } from 'lucide-react';

export function EmployeesManager() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    fetchEmployees();
  }, [deptFilter, search]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.getEmployees({
        department: deptFilter !== 'all' ? deptFilter : undefined,
        search: search || undefined,
      });
      if (res.success) setEmployees(res.data);
    } catch (err) {
      console.error('Lỗi tải danh sách nhân viên:', err);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['all', 'Ban Giám Đốc', 'Vận Hành Rạp', 'Kỹ Thuật & Bảo Trì'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-cinema-700/60">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-ruby-500" /> Quản Lý Nhân Sự & Phân Quyền
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Danh sách nhân viên, phòng ban, vai trò và số lượng nhiệm vụ đang xử lý (Mục 27)
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 glass-panel rounded-2xl border border-cinema-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, chức vụ, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-cinema-900 border border-cinema-700 text-white text-xs focus:outline-none focus:border-ruby-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Phòng ban:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-cinema-900 border border-cinema-700 text-white focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === 'all' ? 'Tất cả phòng ban' : d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="p-5 rounded-3xl glass-panel border border-cinema-700/70 shadow-xl space-y-4 hover:border-ruby-500/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-ruby-600 to-amber-500 flex items-center justify-center font-black text-white text-sm shadow">
                {emp.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-white text-sm">{emp.name}</h3>
                <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wider">{emp.role_name}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 py-3 border-y border-cinema-700/60">
              <div className="flex justify-between">
                <span className="text-slate-400">Chức vụ:</span>
                <span className="font-bold text-white">{emp.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bộ phận:</span>
                <span className="text-slate-200">{emp.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Điện thoại:</span>
                <span className="font-mono text-slate-300">{emp.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tài khoản:</span>
                <span className="font-mono text-amber-400">@{emp.username}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Nhiệm vụ đang giao:</span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                emp.active_assignments_count > 0 ? 'bg-amber-950 text-amber-400 border border-amber-600' : 'bg-cinema-800 text-slate-400'
              }`}>
                {emp.active_assignments_count || 0} việc
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
