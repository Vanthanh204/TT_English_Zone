import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../config/api';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

interface Teacher {
  MaNhanVien: string;
  HoTen: string;
  ChucVu: string;
  SoDienThoai: string;
  Email: string;
  DiaChi: string | null;
  TrangThai: number; // 1: Đang làm việc, 0: Nghỉ việc
  NgayVaoLam: string;
  NgaySinh: string;
  GioiTinh: number; // 1: Nam, 0: Nữ
  AnhDaiDien: string | null;
  LyLich: string | null;
  ChungChi: string | null;
}

const ManageTeachers: React.FC = () => {
  const { token, user } = useAuth();
  const [staffList, setStaffList] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown options
  const [activeStaffMenuId, setActiveStaffMenuId] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchName, setSearchName] = useState<string>('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formHoTen, setFormHoTen] = useState('');
  const [formChucVu, setFormChucVu] = useState('Giáo viên');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState(1);
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState(1);
  // Account properties for creation
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');

  // File Upload State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/staff`, { headers });
      if (response.data && response.data.success) {
        setStaffList(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải danh sách nhân sự: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStaff();
    }
  }, [token]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormHoTen('');
    setFormChucVu('Giáo viên');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormStatus(1);
    setFormDob('');
    setFormGender(1);
    setFormUsername('');
    setFormPassword('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setCvFile(null);
    setCertFile(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingId(t.MaNhanVien);
    setFormHoTen(t.HoTen);
    setFormChucVu(t.ChucVu || 'Giáo viên');
    setFormPhone(t.SoDienThoai || '');
    setFormEmail(t.Email || '');
    setFormAddress(t.DiaChi || '');
    setFormStatus(t.TrangThai);
    setFormDob(t.NgaySinh ? t.NgaySinh.split('T')[0] : '');
    setFormGender(t.GioiTinh);
    setAvatarFile(null);
    setAvatarPreview(t.AnhDaiDien);
    setCvFile(null);
    setCertFile(null);
    setIsFormOpen(true);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản nhân sự ${id}?`)) return;
    setError('');
    setSuccess('');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/staff/${id}`, { headers });
      if (response.data.success) {
        setSuccess('Xóa nhân sự thành công!');
        fetchStaff();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa nhân sự.');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formHoTen || !formPhone || !formEmail || !formDob || !formChucVu) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    };

    const formData = new FormData();
    formData.append('HoTen', formHoTen);
    formData.append('ChucVu', formChucVu);
    formData.append('SoDienThoai', formPhone);
    formData.append('Email', formEmail);
    formData.append('DiaChi', formAddress || '');
    formData.append('TrangThai', String(formStatus));
    formData.append('NgaySinh', formDob);
    formData.append('GioiTinh', String(formGender));

    if (avatarFile) formData.append('AnhDaiDien', avatarFile);
    if (cvFile) formData.append('LyLich', cvFile);
    if (certFile) formData.append('ChungChi', certFile);

    try {
      if (editingId) {
        const response = await axios.put(`${API_BASE_URL}/api/staff/${editingId}`, formData, { headers });
        if (response.data.success) {
          setSuccess('Cập nhật hồ sơ nhân sự thành công!');
          setIsFormOpen(false);
          fetchStaff();
        }
      } else {
        if (!formUsername || !formPassword) {
          setError('Vui lòng điền Tên tài khoản và Mật khẩu khi tạo mới.');
          return;
        }
        formData.append('TenTaiKhoan', formUsername);
        formData.append('MatKhau', formPassword);
        formData.append('NgayVaoLam', new Date().toISOString().split('T')[0]);

        const response = await axios.post(`${API_BASE_URL}/api/staff`, formData, { headers });
        if (response.data.success) {
          setSuccess('Tạo hồ sơ nhân sự mới thành công!');
          setIsFormOpen(false);
          fetchStaff();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin nhân sự.');
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Filter list
  const filteredStaff = staffList.filter(s => {
    const matchesRole = roleFilter === 'all' || s.ChucVu === roleFilter;
    const matchesSearch = !searchName || s.HoTen.toLowerCase().includes(searchName.toLowerCase()) || s.MaNhanVien.toLowerCase().includes(searchName.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Nhân sự & Giáo viên</h1>
          <p className="text-xs text-gray-400 mt-1">Hồ sơ thông tin nhân viên, lý lịch, ảnh đại diện và bằng cấp chứng chỉ lưu trữ trực tuyến Cloudinary</p>
        </div>
        {user?.role === 'Quản lý' && (
          <button
            onClick={handleOpenCreate}
            className="bg-[#0040a1] hover:bg-[#0056d2] text-white font-bold py-2 px-4 rounded-lg transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Thêm Nhân sự Mới
          </button>
        )}
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase">Tổng nhân viên</span>
          <p className="text-2xl font-black text-gray-800 mt-0.5">{staffList.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-150">
          <span className="text-xs font-bold text-green-600 uppercase">Đang làm việc</span>
          <p className="text-2xl font-black text-green-800 mt-0.5">{staffList.filter(t => t.TrangThai === 1).length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-150">
          <span className="text-xs font-bold text-blue-600 uppercase">Số giáo viên</span>
          <p className="text-2xl font-black text-blue-800 mt-0.5">{staffList.filter(t => t.ChucVu === 'Giáo viên').length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-150">
          <span className="text-xs font-bold text-purple-600 uppercase">Nhân sự văn phòng</span>
          <p className="text-2xl font-black text-purple-800 mt-0.5">{staffList.filter(t => t.ChucVu !== 'Giáo viên').length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Tìm theo mã nhân sự, họ và tên..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700 cursor-pointer bg-white"
          >
            <option value="all">-- Tất cả chức vụ --</option>
            <option value="Giáo viên">Giáo viên</option>
            <option value="Tư vấn">Tư vấn viên</option>
            <option value="Học vụ">Học vụ / Trợ giảng</option>
            <option value="Kế toán">Kế toán viên</option>
            <option value="Quản lý">Quản lý trung tâm</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto relative">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã NV</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân sự</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Chức vụ</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hồ sơ đính kèm</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                {user?.role === 'Quản lý' && (
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">Hành động</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((t) => (
                <tr key={t.MaNhanVien} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{t.MaNhanVien}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                    <div className="flex items-center gap-3">
                      {t.AnhDaiDien ? (
                        <img 
                          src={t.AnhDaiDien} 
                          alt={t.HoTen} 
                          className="w-10 h-10 rounded-full object-cover border border-indigo-100 shadow-xs" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold uppercase shadow-xs">
                          {t.HoTen.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p>{t.HoTen}</p>
                        <p className="text-[10px] text-gray-400 font-normal">NS: {formatDateDisplay(t.NgaySinh)} ({t.GioiTinh === 1 ? 'Nam' : 'Nữ'})</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      t.ChucVu === 'Giáo viên' ? 'bg-indigo-50 text-indigo-700' :
                      t.ChucVu === 'Tư vấn' ? 'bg-emerald-50 text-emerald-700' :
                      t.ChucVu === 'Học vụ' ? 'bg-amber-50 text-amber-700' :
                      t.ChucVu === 'Kế toán' ? 'bg-rose-50 text-rose-700' :
                      'bg-purple-50 text-purple-700'
                    }`}>
                      {t.ChucVu}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{t.SoDienThoai}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.Email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col gap-1 text-xs">
                      {t.LyLich ? (
                        <a 
                          href={t.LyLich} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span className="material-symbols-outlined text-sm">description</span>
                          Lý lịch (CV)
                        </a>
                      ) : (
                        <span className="text-gray-400 italic text-[10px]">Chưa nộp CV</span>
                      )}

                      {t.ChungChi ? (
                        <a 
                          href={t.ChungChi} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span className="material-symbols-outlined text-sm">workspace_premium</span>
                          Bằng cấp / C.Chỉ
                        </a>
                      ) : (
                        <span className="text-gray-400 italic text-[10px]">Chưa nộp bằng cấp</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {t.TrangThai === 1 ? (
                      <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full bg-green-100 text-green-800 uppercase">Đang làm việc</span>
                    ) : (
                      <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-full bg-red-100 text-red-800 uppercase">Đã nghỉ việc</span>
                    )}
                  </td>
                  {user?.role === 'Quản lý' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 transition z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] overflow-visible">
                      <div className="relative flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveStaffMenuId(activeStaffMenuId === t.MaNhanVien ? null : t.MaNhanVien);
                          }}
                          className="w-8 h-8 rounded-full border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition cursor-pointer"
                          title="Tùy chọn"
                        >
                          <span className="material-symbols-outlined text-lg">settings</span>
                        </button>

                        {activeStaffMenuId === t.MaNhanVien && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setActiveStaffMenuId(null)}></div>
                            <div className="absolute right-full mr-2 -top-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 animate-fade-in text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenEdit(t);
                                  setActiveStaffMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                Sửa hồ sơ nhân sự
                              </button>

                              {t.MaNhanVien !== user.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteStaff(t.MaNhanVien);
                                    setActiveStaffMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                  Xóa tài khoản
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={user?.role === 'Quản lý' ? 8 : 7} className="px-6 py-8 text-center text-gray-500">Không tìm thấy thông tin nhân sự nào phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? `Sửa hồ sơ nhân sự: ${editingId}` : 'Tạo hồ sơ nhân sự mới'}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4 mb-6">
                
                {/* Profile Avatar Uploader Box */}
                <div className="flex flex-col items-center gap-2 bg-indigo-50/20 p-4 rounded-xl border border-dashed border-indigo-200">
                  <span className="text-xs font-bold text-gray-500">Ảnh Đại Diện (Avatar)</span>
                  <div className="relative w-20 h-20 rounded-full border-2 border-indigo-500/30 overflow-hidden flex items-center justify-center bg-white shadow-xs">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-gray-300">account_circle</span>
                    )}
                  </div>
                  <label className="bg-white hover:bg-indigo-50 text-indigo-600 font-bold border border-indigo-200 py-1.5 px-3 rounded-lg text-xs transition cursor-pointer shadow-2xs">
                    Tải ảnh lên
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      className="hidden" 
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên nhân viên *</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" 
                      value={formHoTen} 
                      onChange={(e) => setFormHoTen(e.target.value)} 
                      placeholder="Ví dụ: Nguyễn Thị Lan"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Chức vụ trung tâm *</label>
                    <select
                      value={formChucVu}
                      onChange={(e) => setFormChucVu(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-700 cursor-pointer bg-white"
                      required
                    >
                      <option value="Giáo viên">Giáo viên</option>
                      <option value="Tư vấn">Tư vấn viên</option>
                      <option value="Học vụ">Học vụ / Trợ giảng</option>
                      <option value="Kế toán">Kế toán viên</option>
                      <option value="Quản lý">Quản lý trung tâm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại *</label>
                    <input 
                      type="tel" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" 
                      value={formPhone} 
                      onChange={(e) => setFormPhone(e.target.value)} 
                      placeholder="Ví dụ: 0901234567"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email *</label>
                    <input 
                      type="email" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold" 
                      value={formEmail} 
                      onChange={(e) => setFormEmail(e.target.value)} 
                      placeholder="email@example.com"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Ngày sinh *</label>
                    <input 
                      type="date" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={formDob} 
                      onChange={(e) => setFormDob(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Giới tính *</label>
                    <div className="flex gap-4 pt-2.5">
                      <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                        <input 
                          type="radio" 
                          name="staff-gender" 
                          checked={formGender === 1} 
                          onChange={() => setFormGender(1)} 
                        />
                        Nam
                      </label>
                      <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                        <input 
                          type="radio" 
                          name="staff-gender" 
                          checked={formGender === 0} 
                          onChange={() => setFormGender(0)} 
                        />
                        Nữ
                      </label>
                    </div>
                  </div>
                </div>

                {!editingId && (
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Tên tài khoản đăng nhập *</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-xs" 
                        value={formUsername} 
                        onChange={(e) => setFormUsername(e.target.value)} 
                        placeholder="Ví dụ: gvlan"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1">Mật khẩu khởi tạo *</label>
                      <input 
                        type="password" 
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-xs" 
                        value={formPassword} 
                        onChange={(e) => setFormPassword(e.target.value)} 
                        placeholder="Mật khẩu"
                        required 
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ cư trú</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" 
                      value={formAddress} 
                      onChange={(e) => setFormAddress(e.target.value)} 
                      placeholder="Số nhà, Tên đường, Tỉnh/TP" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Trạng thái nhân sự *</label>
                    <select
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                      value={formStatus}
                      onChange={(e) => setFormStatus(Number(e.target.value))}
                    >
                      <option value={1}>Đang làm việc</option>
                      <option value={0}>Nghỉ việc</option>
                    </select>
                  </div>
                </div>

                {/* Cloudinary CV and Certificate Uploaders */}
                <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Lý lịch cơ bản (CV - PDF/Word)</label>
                    <div className="flex flex-col gap-1.5">
                      <label className="w-full bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 py-2 px-3 rounded-lg text-xs transition cursor-pointer flex items-center justify-between text-gray-500 font-semibold shadow-3xs">
                        <span>{cvFile ? cvFile.name : 'Chọn file CV...'}</span>
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files && setCvFile(e.target.files[0])}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Chứng chỉ chuyên môn (Bằng cấp - PDF/Ảnh)</label>
                    <div className="flex flex-col gap-1.5">
                      <label className="w-full bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 py-2 px-3 rounded-lg text-xs transition cursor-pointer flex items-center justify-between text-gray-500 font-semibold shadow-3xs">
                        <span>{certFile ? certFile.name : 'Chọn file chứng chỉ...'}</span>
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        <input 
                          type="file" 
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => e.target.files && setCertFile(e.target.files[0])}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition text-sm cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition text-sm cursor-pointer"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTeachers;