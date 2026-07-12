import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

interface Course {
  MaKhoaHoc: string;
  TenKhoaHoc: string;
  HocPhi: number;
  SoBuoiHoc: number;
  ThoiLuong: number;
  TrinhDo: string;
  TrangThai: number; // 1: Hoạt động, 0: Khóa
}

const ManageCourses: React.FC = () => {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formTenKhoaHoc, setFormTenKhoaHoc] = useState('');
  const [formHocPhi, setFormHocPhi] = useState(0);
  const [formSoBuoiHoc, setFormSoBuoiHoc] = useState(24);
  const [formThoiLuong, setFormThoiLuong] = useState(90);
  const [formTrinhDo, setFormTrinhDo] = useState('A1');
  const [formTrangThai, setFormTrangThai] = useState(1);
  const [activeCourseMenuId, setActiveCourseMenuId] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/courses');
      if (response.data && response.data.success) {
        setCourses(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải danh sách khóa học: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const resetForm = () => {
    setFormTenKhoaHoc('');
    setFormHocPhi(0);
    setFormSoBuoiHoc(24);
    setFormThoiLuong(90);
    setFormTrinhDo('A1');
    setFormTrangThai(1);
    setEditingCourse(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormTenKhoaHoc(course.TenKhoaHoc);
    setFormHocPhi(course.HocPhi);
    setFormSoBuoiHoc(course.SoBuoiHoc);
    setFormThoiLuong(course.ThoiLuong);
    setFormTrinhDo(course.TrinhDo);
    setFormTrangThai(course.TrangThai);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      TenKhoaHoc: formTenKhoaHoc,
      HocPhi: formHocPhi,
      SoBuoiHoc: formSoBuoiHoc,
      ThoiLuong: formThoiLuong,
      TrinhDo: formTrinhDo,
      TrangThai: formTrangThai
    };

    try {
      if (editingCourse) {
        // Update
        const response = await axios.put(
          `http://localhost:5000/api/courses/${editingCourse.MaKhoaHoc}`,
          payload,
          { headers }
        );
        if (response.data.success) {
          setSuccess('Cập nhật khóa học thành công!');
        }
      } else {
        // Create
        const response = await axios.post(
          'http://localhost:5000/api/courses',
          payload,
          { headers }
        );
        if (response.data.success) {
          setSuccess('Tạo khóa học mới thành công!');
        }
      }
      setIsModalOpen(false);
      resetForm();
      fetchCourses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khóa học ${id}?`)) return;
    setError('');
    setSuccess('');

    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.delete(`http://localhost:5000/api/courses/${id}`, { headers });
      if (response.data.success) {
        setSuccess('Xóa khóa học thành công!');
        fetchCourses();
      }
    } catch (err: any) {
      setError('Lỗi khi xóa khóa học: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Khóa học</h1>
        <button 
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Thêm khóa học mới
        </button>
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase">Tổng khóa học</span>
          <p className="text-2xl font-black text-gray-800 mt-0.5">{courses.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-150">
          <span className="text-xs font-bold text-green-600 uppercase">Đang mở đào tạo</span>
          <p className="text-2xl font-black text-green-800 mt-0.5">{courses.filter(c => c.TrangThai === 1).length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-150">
          <span className="text-xs font-bold text-red-600 uppercase">Tạm ngưng tuyển</span>
          <p className="text-2xl font-black text-red-800 mt-0.5">{courses.filter(c => c.TrangThai === 0).length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-150">
          <span className="text-xs font-bold text-blue-600 uppercase">Học phí trung bình</span>
          <p className="text-xl font-black text-blue-800 mt-1">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
              courses.length > 0 ? courses.reduce((acc, c) => acc + c.HocPhi, 0) / courses.length : 0
            )}
          </p>
        </div>
      </div>

      {/* Visual Progress Bar Chart */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex justify-between text-xs text-gray-500 font-bold mb-2">
          <span>Tỷ lệ trạng thái khóa học</span>
          <div className="flex gap-3">
            <span className="text-green-600">Đang dạy: {courses.length > 0 ? ((courses.filter(c => c.TrangThai === 1).length / courses.length) * 100).toFixed(0) : 0}%</span>
            <span className="text-red-500">Tạm ngưng: {courses.length > 0 ? ((courses.filter(c => c.TrangThai === 0).length / courses.length) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden flex">
          {courses.length > 0 && (
            <>
              <div 
                style={{ width: `${(courses.filter(c => c.TrangThai === 1).length / courses.length) * 100}%` }} 
                className="bg-green-500 h-full"
                title="Đang hoạt động"
              ></div>
              <div 
                style={{ width: `${(courses.filter(c => c.TrangThai === 0).length / courses.length) * 100}%` }} 
                className="bg-red-500 h-full"
                title="Tạm ngưng"
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
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã khóa</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên khóa học</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Học phí</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Số buổi</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời lượng</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cấp độ</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.MaKhoaHoc} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{course.MaKhoaHoc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{course.TenKhoaHoc}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">{formatCurrency(course.HocPhi)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.SoBuoiHoc} buổi</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.ThoiLuong} phút</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="bg-blue-50 text-[#0040a1] px-2 py-0.5 rounded text-xs font-bold">{course.TrinhDo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {course.TrangThai === 1 ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Đã khóa</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 transition z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] overflow-visible">
                    <div className="relative flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCourseMenuId(activeCourseMenuId === course.MaKhoaHoc ? null : course.MaKhoaHoc);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition cursor-pointer"
                        title="Tùy chọn"
                      >
                        <span className="material-symbols-outlined text-lg">settings</span>
                      </button>

                      {activeCourseMenuId === course.MaKhoaHoc && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveCourseMenuId(null)}></div>
                          <div className="absolute right-full mr-2 -top-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 animate-fade-in text-left">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenEditModal(course);
                                setActiveCourseMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              Sửa khóa học
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleDelete(course.MaKhoaHoc);
                                setActiveCourseMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              Xóa khóa học
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

      {/* Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editingCourse ? `Chỉnh sửa khóa học: ${editingCourse.MaKhoaHoc}` : 'Thêm khóa học mới'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tên khóa học *</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formTenKhoaHoc} 
                    onChange={(e) => setFormTenKhoaHoc(e.target.value)} 
                    placeholder="Ví dụ: Luyện thi IELTS 6.5+"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Học phí (VND) *</label>
                    <input 
                      type="number" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formHocPhi} 
                      onChange={(e) => setFormHocPhi(Number(e.target.value))} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Trình độ / Cấp độ *</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formTrinhDo} 
                      onChange={(e) => setFormTrinhDo(e.target.value)} 
                      placeholder="Ví dụ: B2, IELTS 5.0"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Số buổi học *</label>
                    <input 
                      type="number" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formSoBuoiHoc} 
                      onChange={(e) => setFormSoBuoiHoc(Number(e.target.value))} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Thời lượng (phút/buổi) *</label>
                    <input 
                      type="number" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formThoiLuong} 
                      onChange={(e) => setFormThoiLuong(Number(e.target.value))} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái khóa học</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formTrangThai}
                    onChange={(e) => setFormTrangThai(Number(e.target.value))}
                  >
                    <option value={1}>Hoạt động (Cho phép mở tuyển sinh)</option>
                    <option value={0}>Khóa / Ẩn (Không sử dụng)</option>
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

export default ManageCourses;
