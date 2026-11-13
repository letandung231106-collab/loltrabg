import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Search,
  Phone,
  Mail,
  Shield,
  UserCheck,
  Plus,
  Edit2,
  X,
  CheckCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';

export function EmployeesManager() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    username: '',
    password: 'password123',
    name: '',
    phone: '',
    email: '',
    position: 'Nhân viên phục vụ rạp',
    department: 'Vận Hành Rạp',
    role: 'staff',
    status: 'active',
  });

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
      setMsg({ text: err.message || 'Lỗi tải danh sách nhân viên.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      username: `staff_${Date.now().toString().slice(-4)}`,
      password: 'password123',
      name: '',
      phone: '',
      email: '',
      position: 'Nhân viên vận hành',
      department: 'Vận Hành Rạp',
      role: 'staff',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      username: emp.username,
      password: '',
      name: emp.name,
      phone: emp.phone || '',
      email: emp.email || '',
      position: emp.position || '',
      department: emp.department || 'Vận Hành Rạp',
      role: emp.role_name || 'staff',
      status: emp.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const res = await api.updateEmployee(editingEmployee.id, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          position: formData.position,
          department: formData.department,
          status: formData.status,
          role: formData.role,
        });
        setMsg({ text: res.message || 'Cập nhật nhân viên & phân quyền thành công!', type: 'success' });
      } else {
        const res = await api.createEmployee(formData);
        setMsg({ text: res.message || 'Thêm nhân viên mới thành công!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      setMsg({ text: err.message || 'Lỗi khi lưu nhân viên.', type: 'error' });
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

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Nhân Viên Mới
        </button>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
              : 'bg-ruby-950 border border-ruby-500 text-ruby-200'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: '', type: '' })} className="font-bold">
            Đóng
          </button>
        </div>
      )}

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
              <option key={d} value={d}>
                {d === 'all' ? 'Tất cả phòng ban' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="p-5 rounded-3xl glass-panel border border-cinema-700/70 shadow-xl space-y-4 hover:border-ruby-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-ruby-600 to-amber-500 flex items-center justify-center font-black text-white text-sm shadow">
                    {emp.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{emp.name}</h3>
                    <span className="text-[11px] font-bold text-gold-400 uppercase tracking-wider">
                      {emp.role_name}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 hover:text-white border border-cinema-700/60 transition-colors"
                  title="Chỉnh sửa thông tin & đổi vai trò"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gold-400" />
                </button>
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
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Nhiệm vụ đang giao:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  emp.active_assignments_count > 0
                    ? 'bg-amber-950 text-amber-400 border border-amber-600'
                    : 'bg-cinema-800 text-slate-400'
                }`}
              >
                {emp.active_assignments_count || 0} việc
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm / Chỉnh Sửa Nhân Sự */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-cinema-600/70 overflow-hidden">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-ruby-500" />
              {editingEmployee ? 'Chỉnh Sửa & Phân Quyền Nhân Sự' : 'Thêm Mới Nhân Viên'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              {editingEmployee
                ? `Cập nhật thông tin và vai trò truy cập hệ thống của @${editingEmployee.username}`
                : 'Khởi tạo hồ sơ nhân viên và tài khoản đăng nhập vào hệ thống'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {!editingEmployee && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-cinema-900 border border-cinema-700/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="staff_nguyen"
                      className="w-full px-3 py-2 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Mật khẩu *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="password123"
                      className="w-full px-3 py-2 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Họ và tên nhân viên *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Trần Văn Bình"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none focus:border-ruby-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="binh.tran@cinema.vn"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Chức vụ hiển thị</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Giám sát ca / Nhân viên soát vé"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phòng ban</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none"
                  >
                    <option value="Vận Hành Rạp">Vận Hành Rạp</option>
                    <option value="Kỹ Thuật & Bảo Trì">Kỹ Thuật & Bảo Trì</option>
                    <option value="Ban Giám Đốc">Ban Giám Đốc</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-cinema-900 border border-gold-500/40 space-y-2">
                <label className="block font-bold text-gold-400 uppercase tracking-wider">
                  👑 Phân quyền hệ thống (System Role):
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cinema-850 border border-cinema-700 text-white focus:outline-none font-bold"
                >
                  <option value="staff">Staff - Nhân viên vận hành (Checklist, Bán vé, Soát vé)</option>
                  <option value="technician">Technician - Kỹ thuật viên (Bảo trì máy chiếu, sự cố thiết bị)</option>
                  <option value="manager">Manager - Quản lý rạp (Lịch chiếu, vận hành, kiểm tra rạp)</option>
                  <option value="admin">Admin - Toàn quyền quản trị hệ thống</option>
                </select>
                <div className="text-[10px] text-slate-400">
                  Vai trò quyết định các module mà nhân sự có quyền xem và thao tác trên thanh menu.
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-ruby-600 hover:bg-ruby-500 text-white font-bold text-xs shadow-glow-red transition-all"
                >
                  {editingEmployee ? 'Lưu Thông Tin & Phân Quyền' : 'Tạo Nhân Viên Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
