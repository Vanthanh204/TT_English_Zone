import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

interface ClassItem {
  MaLopHoc: string;
  TenLopHoc: string;
  MaNhanVien: string | null;
  TenGiaoVien: string | null;
  MaDotTuyenSinh: string;
  TenDotTuyenSinh: string;
  TenKhoaHoc: string;
  NgayKhaiGiang: string;
  TrangThai: number; // 1: Sắp mở, 2: Đang dạy, 3: Đã kết thúc, 0: Đã hủy
  NgayBatDau: string; // TIME format (HH:MM:SS or HH:MM)
  NgayKetThuc: string; // TIME format
  SiSoToiDa: number;
  SiSoHienTai: number;
  PhongHoc: string | null;
}

interface Teacher {
  MaNhanVien: string;
  HoTen: string;
}

interface EnrollmentSession {
  MaDotTuyenSinh: string;
  TenDotTuyenSinh: string;
  TenKhoaHoc: string;
}

interface StudentRoster {
  MaDangKy: string;
  NgayDangKy: string;
  MaHocVien: string;
  HoTen: string;
  SoDienThoai: string;
  Email: string;
}

const ManageClasses: React.FC = () => {
  const { token, user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sessions, setSessions] = useState<EnrollmentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formSession, setFormSession] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('18:00');
  const [formEndTime, setFormEndTime] = useState('19:30');
  const [formMaxStudents, setFormMaxStudents] = useState(25);
  const [formRoom, setFormRoom] = useState('');
  const [formStatus, setFormStatus] = useState(1);

  // Roster State
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [rosterClass, setRosterClass] = useState<ClassItem | null>(null);
  const [rosterList, setRosterList] = useState<StudentRoster[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [activeClassMenuId, setActiveClassMenuId] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classes`, { headers });
      if (response.data && response.data.success) {
        setClasses(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải danh sách lớp học: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/teachers`, { headers });
      if (response.data && response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (err) {
      console.error('Không thể tải giáo viên:', err);
    }
  };

  const fetchSessions = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/enrollment-sessions`, { headers });
      if (response.data && response.data.success) {
        setSessions(response.data.data);
      }
    } catch (err) {
      console.error('Không thể tải đợt tuyển sinh:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClasses();
      fetchTeachers();
      fetchSessions();
    }
  }, [token]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormTeacher(teachers.length > 0 ? teachers[0].MaNhanVien : '');
    setFormSession(sessions.length > 0 ? sessions[0].MaDotTuyenSinh : '');
    const today = new Date().toISOString().split('T')[0];
    setFormStartDate(today);
    setFormStartTime('18:00');
    setFormEndTime('19:30');
    setFormMaxStudents(25);
    setFormRoom('');
    setFormStatus(1);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingId(cls.MaLopHoc);
    setFormName(cls.TenLopHoc);
    setFormTeacher(cls.MaNhanVien || '');
    setFormSession(cls.MaDotTuyenSinh);
    setFormStartDate(cls.NgayKhaiGiang ? cls.NgayKhaiGiang.split('T')[0] : '');
    
    // Strip seconds from TIME format (e.g. 18:00:00 -> 18:00)
    const stripSeconds = (timeStr: string) => {
      if (!timeStr) return '';
      const parts = timeStr.split(':');
      if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
      return timeStr;
    };
    setFormStartTime(stripSeconds(cls.NgayBatDau));
    setFormEndTime(stripSeconds(cls.NgayKetThuc));
    setFormMaxStudents(cls.SiSoToiDa);
    setFormRoom(cls.PhongHoc || '');
    setFormStatus(cls.TrangThai);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formName || !formSession || !formStartDate || !formStartTime || !formEndTime) {
      setError('Vui lòng nhập đầy đủ các thông tin bắt buộc.');
      return;
    }

    const payload = {
      TenLopHoc: formName,
      MaNhanVien: formTeacher || null,
      MaDotTuyenSinh: formSession,
      NgayKhaiGiang: formStartDate,
      NgayBatDau: formStartTime,
      NgayKetThuc: formEndTime,
      SiSoToiDa: formMaxStudents,
      PhongHoc: formRoom || null,
      TrangThai: formStatus
    };

    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editingId) {
        // Edit class
        const response = await axios.put(`${API_BASE_URL}/api/classes/${editingId}`, payload, { headers });
        if (response.data.success) {
          setSuccess('Cập nhật lớp học thành công!');
          setIsFormOpen(false);
          fetchClasses();
        }
      } else {
        // Create class
        const response = await axios.post(`${API_BASE_URL}/api/classes`, payload, { headers });
        if (response.data.success) {
          setSuccess('Tạo lớp học thành công!');
          setIsFormOpen(false);
          fetchClasses();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin lớp học.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lớp học ${id}?`)) return;
    setError('');
    setSuccess('');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/classes/${id}`, { headers });
      if (response.data.success) {
        setSuccess('Xóa lớp học thành công!');
        fetchClasses();
      }
    } catch (err: any) {
      setError('Lỗi khi xóa lớp: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenRoster = async (cls: ClassItem) => {
    setRosterClass(cls);
    setRosterList([]);
    setIsRosterOpen(true);
    setLoadingRoster(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classes/${cls.MaLopHoc}/roster`, { headers });
      if (response.data && response.data.success) {
        setRosterList(response.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách học viên lớp:', err);
    } finally {
      setLoadingRoster(false);
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

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">Sắp mở</span>;
      case 2: return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">Đang dạy</span>;
      case 3: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full">Đã kết thúc</span>;
      case 0: return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">Đã hủy</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full">Chưa rõ</span>;
    }
  };

  const formatTimeDisplay = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return timeStr;
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Lớp học</h1>
        {user?.role === 'Quản lý' && (
          <button
            onClick={handleOpenCreate}
            className="bg-[#0040a1] hover:bg-[#0056d2] text-white font-bold py-2 px-4 rounded-lg transition shadow-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add_box</span>
            Tạo Lớp học
          </button>
        )}
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase">Tổng số lớp</span>
          <p className="text-2xl font-black text-gray-800 mt-0.5">{classes.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-150">
          <span className="text-xs font-bold text-green-600 uppercase">Đang giảng dạy</span>
          <p className="text-2xl font-black text-green-800 mt-0.5">{classes.filter(c => c.TrangThai === 2).length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-150">
          <span className="text-xs font-bold text-yellow-600 uppercase">Sắp khai giảng</span>
          <p className="text-2xl font-black text-yellow-800 mt-0.5">{classes.filter(c => c.TrangThai === 1).length}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-xl border border-gray-250">
          <span className="text-xs font-bold text-gray-500 uppercase">Đã kết thúc</span>
          <p className="text-2xl font-black text-gray-700 mt-0.5">{classes.filter(c => c.TrangThai === 3).length}</p>
        </div>
      </div>

      {/* Visual Progress Bar Chart */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex justify-between text-xs text-gray-500 font-bold mb-2">
          <span>Tỷ lệ trạng thái lớp học</span>
          <div className="flex gap-3">
            <span className="text-green-600">Đang dạy: {classes.length > 0 ? ((classes.filter(c => c.TrangThai === 2).length / classes.length) * 100).toFixed(0) : 0}%</span>
            <span className="text-yellow-600">Sắp mở: {classes.length > 0 ? ((classes.filter(c => c.TrangThai === 1).length / classes.length) * 100).toFixed(0) : 0}%</span>
            <span className="text-gray-500">Đã kết thúc: {classes.length > 0 ? ((classes.filter(c => c.TrangThai === 3).length / classes.length) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden flex">
          {classes.length > 0 && (
            <>
              <div 
                style={{ width: `${(classes.filter(c => c.TrangThai === 2).length / classes.length) * 100}%` }} 
                className="bg-green-500 h-full"
                title="Đang giảng dạy"
              ></div>
              <div 
                style={{ width: `${(classes.filter(c => c.TrangThai === 1).length / classes.length) * 100}%` }} 
                className="bg-yellow-400 h-full"
                title="Sắp mở"
              ></div>
              <div 
                style={{ width: `${(classes.filter(c => c.TrangThai === 3).length / classes.length) * 100}%` }} 
                className="bg-gray-400 h-full"
                title="Đã kết thúc"
              ></div>
              <div 
                style={{ width: `${(classes.filter(c => c.TrangThai === 0).length / classes.length) * 100}%` }} 
                className="bg-red-500 h-full"
                title="Đã hủy"
              ></div>
            </>
          )}
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã lớp</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên lớp học</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Khóa học</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Đợt tuyển sinh</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giảng viên</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ca học</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Khai giảng</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sĩ số (Hiện tại)</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phòng học</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map((cls) => (
                <tr key={cls.MaLopHoc} className="hover:bg-gray-50 group">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{cls.MaLopHoc}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{cls.TenLopHoc}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold text-blue-600">{cls.TenKhoaHoc}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{cls.TenDotTuyenSinh}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{cls.TenGiaoVien || <span className="text-gray-400 italic">Chưa gán</span>}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">{formatTimeDisplay(cls.NgayBatDau)} - {formatTimeDisplay(cls.NgayKetThuc)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateDisplay(cls.NgayKhaiGiang)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="font-bold">{cls.SiSoHienTai}</span> / {cls.SiSoToiDa}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{cls.PhongHoc || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{getStatusBadge(cls.TrangThai)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 transition z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] overflow-visible">
                    <div className="relative flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveClassMenuId(activeClassMenuId === cls.MaLopHoc ? null : cls.MaLopHoc);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition cursor-pointer"
                        title="Tùy chọn"
                      >
                        <span className="material-symbols-outlined text-lg">settings</span>
                      </button>

                      {activeClassMenuId === cls.MaLopHoc && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveClassMenuId(null)}></div>
                          <div className="absolute right-full mr-2 -top-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 animate-fade-in text-left">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenRoster(cls);
                                setActiveClassMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">groups</span>
                              Sĩ số học viên
                            </button>

                            {user?.role === 'Quản lý' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenEdit(cls);
                                    setActiveClassMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                  Sửa lớp học
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDelete(cls.MaLopHoc);
                                    setActiveClassMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                  Xóa lớp học
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">Chưa có lớp học nào được tạo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Class Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editingId ? `Sửa lớp học: ${editingId}` : 'Tạo lớp học mới'}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên lớp học *</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="Ví dụ: BASIC-01, TOEIC-650-A"
                    required 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Đợt tuyển sinh (Khóa học) *</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    value={formSession}
                    onChange={(e) => setFormSession(e.target.value)}
                    required
                  >
                    {sessions.length === 0 ? (
                      <option value="">Chưa có đợt tuyển sinh đang mở</option>
                    ) : (
                      sessions.map(s => (
                        <option key={s.MaDotTuyenSinh} value={s.MaDotTuyenSinh}>
                          {s.TenDotTuyenSinh} ({s.TenKhoaHoc})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giảng viên phụ trách</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                  >
                    <option value="">-- Chưa gán giáo viên --</option>
                    {teachers.map(t => (
                      <option key={t.MaNhanVien} value={t.MaNhanVien}>
                        {t.HoTen} ({t.MaNhanVien})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ngày khai giảng *</label>
                    <input 
                      type="date" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={formStartDate} 
                      onChange={(e) => setFormStartDate(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Sĩ số tối đa *</label>
                    <input 
                      type="number" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formMaxStudents} 
                      onChange={(e) => setFormMaxStudents(Number(e.target.value))} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Giờ bắt đầu *</label>
                    <input 
                      type="time" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={formStartTime} 
                      onChange={(e) => setFormStartTime(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Giờ kết thúc *</label>
                    <input 
                      type="time" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={formEndTime} 
                      onChange={(e) => setFormEndTime(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phòng học</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formRoom} 
                      onChange={(e) => setFormRoom(e.target.value)} 
                      placeholder="Ví dụ: Phòng 201" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái lớp *</label>
                    <select
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formStatus}
                      onChange={(e) => setFormStatus(Number(e.target.value))}
                    >
                      <option value={1}>Sắp mở</option>
                      <option value={2}>Đang dạy</option>
                      <option value={3}>Đã kết thúc</option>
                      <option value={0}>Đã hủy</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition"
                  disabled={sessions.length === 0}
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Modal */}
      {isRosterOpen && rosterClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Danh sách học viên: {rosterClass.TenLopHoc}</h2>
                <p className="text-xs text-gray-500">Khóa: {rosterClass.TenKhoaHoc} | Giảng viên: {rosterClass.TenGiaoVien || 'Chưa gán'}</p>
              </div>
              <button onClick={() => setIsRosterOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {loadingRoster ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[50vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Mã HV</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Họ và tên</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Số điện thoại</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Ngày xếp lớp</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rosterList.map(st => (
                      <tr key={st.MaHocVien}>
                        <td className="px-4 py-2.5 whitespace-nowrap text-sm font-bold text-gray-900">{st.MaHocVien}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-sm font-semibold text-gray-800">{st.HoTen}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-600">{st.SoDienThoai}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-500">{st.Email}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-sm text-gray-500">{formatDateDisplay(st.NgayDangKy)}</td>
                      </tr>
                    ))}
                    {rosterList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">Chưa có học viên nào trong lớp này.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end border-t border-gray-100 pt-4 mt-4">
              <button 
                type="button"
                onClick={() => setIsRosterOpen(false)}
                className="px-5 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;