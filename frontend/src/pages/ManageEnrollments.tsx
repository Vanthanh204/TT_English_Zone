import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

interface Course {
  MaKhoaHoc: string;
  TenKhoaHoc: string;
}

interface EnrollmentSession {
  MaDotTuyenSinh: string;
  TenDotTuyenSinh: string;
  MaKhoaHoc: string;
  TenKhoaHoc?: string;
  TrangThai: number; // 1: Active, 0: Inactive
  NgayBatDau: string;
  NgayKetThuc: string;
  NgayKhaiGiang: string;
  ChiTieu: number;
  DaDat?: number;
}

const ManageEnrollments: React.FC = () => {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<EnrollmentSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<EnrollmentSession | null>(null);
  const [formTenDot, setFormTenDot] = useState('');
  const [formMaKhoaHoc, setFormMaKhoaHoc] = useState('');
  const [formTrangThai, setFormTrangThai] = useState(1);
  const [formNgayBatDau, setFormNgayBatDau] = useState('');
  const [formNgayKetThuc, setFormNgayKetThuc] = useState('');
  const [formNgayKhaiGiang, setFormNgayKhaiGiang] = useState('');
  const [formChiTieu, setFormChiTieu] = useState(50);
  const [activeEnrollMenuId, setActiveEnrollMenuId] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/courses`);
      if (response.data && response.data.success) {
        setCourses(response.data.data);
        if (response.data.data.length > 0) {
          setFormMaKhoaHoc(response.data.data[0].MaKhoaHoc);
        }
      }
    } catch (err) {
      console.error('Không thể tải danh sách khóa học:', err);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/enrollment-sessions`);
      if (response.data && response.data.success) {
        setSessions(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải danh sách đợt tuyển sinh: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await fetchCourses();
      await fetchSessions();
    };
    initData();
  }, []);

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const resetForm = () => {
    setFormTenDot('');
    if (courses.length > 0) {
      setFormMaKhoaHoc(courses[0].MaKhoaHoc);
    } else {
      setFormMaKhoaHoc('');
    }
    setFormTrangThai(1);
    setFormNgayBatDau('');
    setFormNgayKetThuc('');
    setFormNgayKhaiGiang('');
    setFormChiTieu(50);
    setEditingSession(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (session: EnrollmentSession) => {
    setEditingSession(session);
    setFormTenDot(session.TenDotTuyenSinh);
    setFormMaKhoaHoc(session.MaKhoaHoc);
    setFormTrangThai(session.TrangThai);
    setFormNgayBatDau(formatDateForInput(session.NgayBatDau));
    setFormNgayKetThuc(formatDateForInput(session.NgayKetThuc));
    setFormNgayKhaiGiang(formatDateForInput(session.NgayKhaiGiang));
    setFormChiTieu(session.ChiTieu);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      TenDotTuyenSinh: formTenDot,
      MaKhoaHoc: formMaKhoaHoc,
      TrangThai: formTrangThai,
      NgayBatDau: formNgayBatDau,
      NgayKetThuc: formNgayKetThuc,
      NgayKhaiGiang: formNgayKhaiGiang,
      ChiTieu: formChiTieu
    };

    try {
      if (editingSession) {
        // Update
        const response = await axios.put(
          `${API_BASE_URL}/api/enrollment-sessions/${editingSession.MaDotTuyenSinh}`,
          payload,
          { headers }
        );
        if (response.data.success) {
          setSuccess('Cập nhật đợt tuyển sinh thành công!');
        }
      } else {
        // Create
        const response = await axios.post(
          `${API_BASE_URL}/api/enrollment-sessions`,
          payload,
          { headers }
        );
        if (response.data.success) {
          setSuccess('Tạo đợt tuyển sinh mới thành công!');
        }
      }
      setIsModalOpen(false);
      resetForm();
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đợt tuyển sinh ${id}?`)) return;
    setError('');
    setSuccess('');

    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/enrollment-sessions/${id}`, { headers });
      if (response.data.success) {
        setSuccess('Xóa đợt tuyển sinh thành công!');
        fetchSessions();
      }
    } catch (err: any) {
      setError('Lỗi khi xóa đợt tuyển sinh: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đợt tuyển sinh</h1>
        <button 
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
          disabled={courses.length === 0}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Đăng tuyển sinh mới
        </button>
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase">Tổng đợt tuyển sinh</span>
          <p className="text-2xl font-black text-gray-800 mt-0.5">{sessions.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-150">
          <span className="text-xs font-bold text-green-600 uppercase">Đang mở hồ sơ</span>
          <p className="text-2xl font-black text-green-800 mt-0.5">{sessions.filter(s => s.TrangThai === 1).length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-150">
          <span className="text-xs font-bold text-red-600 uppercase">Đã đóng tuyển sinh</span>
          <p className="text-2xl font-black text-red-800 mt-0.5">{sessions.filter(s => s.TrangThai === 0).length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-150">
          <span className="text-xs font-bold text-blue-600 uppercase">Tiến độ tuyển sinh (Đạt/Chỉ tiêu)</span>
          <p className="text-2xl font-black text-blue-800 mt-0.5">
            {sessions.reduce((acc, s) => acc + Number(s.DaDat || 0), 0)} / {sessions.reduce((acc, s) => acc + Number(s.ChiTieu || 0), 0)} <span className="text-xs font-normal text-gray-500">học viên</span>
          </p>
        </div>
      </div>

      {/* Visual Progress Bar Chart */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex justify-between text-xs text-gray-500 font-bold mb-2">
          <span>Tỷ lệ trạng thái đợt tuyển sinh</span>
          <div className="flex gap-3">
            <span className="text-green-600">Đang mở: {sessions.length > 0 ? ((sessions.filter(s => s.TrangThai === 1).length / sessions.length) * 100).toFixed(0) : 0}%</span>
            <span className="text-red-500">Đã đóng: {sessions.length > 0 ? ((sessions.filter(s => s.TrangThai === 0).length / sessions.length) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden flex">
          {sessions.length > 0 && (
            <>
              <div 
                style={{ width: `${(sessions.filter(s => s.TrangThai === 1).length / sessions.length) * 100}%` }} 
                className="bg-green-500 h-full"
                title="Đang mở"
              ></div>
              <div 
                style={{ width: `${(sessions.filter(s => s.TrangThai === 0).length / sessions.length) * 100}%` }} 
                className="bg-red-500 h-full"
                title="Đã đóng"
              ></div>
            </>
          )}
        </div>
      </div>

      {courses.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Cảnh báo: Hiện chưa có khóa học nào được cấu hình trong hệ thống. Hãy tạo khóa học trước khi đăng đợt tuyển sinh.
        </div>
      )}

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
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã đợt</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên đợt tuyển sinh</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Khóa học liên kết</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bắt đầu</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kết thúc</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Khai giảng</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Chỉ tiêu</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.MaDotTuyenSinh} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{session.MaDotTuyenSinh}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{session.TenDotTuyenSinh}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{session.TenKhoaHoc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateDisplay(session.NgayBatDau)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateDisplay(session.NgayKetThuc)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">{formatDateDisplay(session.NgayKhaiGiang)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">
                    <span className="text-green-600">{session.DaDat || 0}</span> / {session.ChiTieu} học viên
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {session.TrangThai === 1 ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Đã kết thúc</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 transition z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] overflow-visible">
                    <div className="relative flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEnrollMenuId(activeEnrollMenuId === session.MaDotTuyenSinh ? null : session.MaDotTuyenSinh);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition cursor-pointer"
                        title="Tùy chọn"
                      >
                        <span className="material-symbols-outlined text-lg">settings</span>
                      </button>

                      {activeEnrollMenuId === session.MaDotTuyenSinh && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveEnrollMenuId(null)}></div>
                          <div className="absolute right-full mr-2 -top-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 animate-fade-in text-left">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenEditModal(session);
                                setActiveEnrollMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              Sửa tuyển sinh
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleDelete(session.MaDotTuyenSinh);
                                setActiveEnrollMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Xóa tuyển sinh
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enrollment Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editingSession ? `Chỉnh sửa đợt tuyển sinh: ${editingSession.MaDotTuyenSinh}` : 'Đăng đợt tuyển sinh mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên đợt tuyển sinh *</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formTenDot} 
                    onChange={(e) => setFormTenDot(e.target.value)} 
                    placeholder="Ví dụ: Tuyển sinh khóa giao tiếp tháng 08/2026"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Khóa học liên kết *</label>
                    <select 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formMaKhoaHoc}
                      onChange={(e) => setFormMaKhoaHoc(e.target.value)}
                      required
                    >
                      {courses.map(course => (
                        <option key={course.MaKhoaHoc} value={course.MaKhoaHoc}>
                          {course.TenKhoaHoc} ({course.MaKhoaHoc})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Chỉ tiêu (học viên) *</label>
                    <input 
                      type="number" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formChiTieu} 
                      onChange={(e) => setFormChiTieu(Number(e.target.value))} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ngày bắt đầu *</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={formNgayBatDau} 
                      onChange={(e) => setFormNgayBatDau(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ngày kết thúc *</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={formNgayKetThuc} 
                      onChange={(e) => setFormNgayKetThuc(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ngày khai giảng *</label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={formNgayKhaiGiang} 
                      onChange={(e) => setFormNgayKhaiGiang(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái tuyển sinh</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formTrangThai}
                    onChange={(e) => setFormTrangThai(Number(e.target.value))}
                  >
                    <option value={1}>Hoạt động (Hiển thị đăng ký)</option>
                    <option value={0}>Kết thúc / Khóa</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEnrollments;