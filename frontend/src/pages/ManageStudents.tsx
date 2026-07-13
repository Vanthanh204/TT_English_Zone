import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

interface Student {
  MaHocVien: string;
  MaLead: string | null;
  HoTen: string;
  SoDienThoai: string;
  Email: string;
  DiaChi: string | null;
  TrangThai: number; // 1: Đang học, 0: Đã nghỉ, 2: Bảo lưu
  SDTPhuHuynh: string | null;
  NgaySinh: string;
  GioiTinh: number; // 1: Nam, 0: Nữ
  NgayDangKy: string;
  CurrentClasses?: string;
  TotalDebt?: number;
}

interface EnrollmentHistoryItem {
  MaDangKy: string;
  MaLopHoc: string;
  TrangThai: number; // 1: Active, 2: Completed, 0: Dropped
  NgayDangKy: string;
  DiemKetThuc: number | null;
  TenLopHoc: string;
  TenKhoaHoc: string;
  TrinhDo: string;
  HocPhi: number;
}

interface AttendanceHistoryItem {
  MaLichHoc: string;
  AttendanceStatus: number | null;
  BuoiSo: number;
  NgayHoc: string;
  GioBatDau: string;
  GioKetThuc: string;
  TenLopHoc: string;
  MaLopHoc: string;
}

interface StudentProfileData {
  student: Student;
  history: EnrollmentHistoryItem[];
  attendance: AttendanceHistoryItem[];
  placementTest: {
    Diem: number;
    TrinhDo: string;
    NgayKiemTra: string;
    TenGiaoVien: string;
  } | null;
}

interface ClassItem {
  MaLopHoc: string;
  TenLopHoc: string;
  TenKhoaHoc: string;
  TrinhDo: string;
  SiSoHienTai: number;
  SiSoToiDa: number;
  NgayKhaiGiang: string;
  NgayBatDau: string | null;
  NgayKetThuc: string | null;
  ScheduleDays: string | null;
}

const ManageStudents: React.FC = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Student State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formHoTen, setFormHoTen] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStatus, setFormStatus] = useState(1);
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState(1);

  // Enroll Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [enrollClassId, setEnrollClassId] = useState('');

  // Enroll Modal Filter State
  const [enrollFilterDays, setEnrollFilterDays] = useState('all');
  const [enrollFilterTime, setEnrollFilterTime] = useState('all');
  const [enrollFilterLevel, setEnrollFilterLevel] = useState('all');

  // Student Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'history' | 'attendance' | 'placement'>('history');

  // Grade Editing State inside Profile
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [formFinalGrade, setFormFinalGrade] = useState('');
  const [formEnrollStatus, setFormEnrollStatus] = useState(1);
  const [activeStudentMenuId, setActiveStudentMenuId] = useState<string | null>(null);

  // Main List Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [debtFilter, setDebtFilter] = useState('all');

  const getRecommendation = (item: any) => {
    if (item.TrangThai === 2) {
      const nextLevels: { [key: string]: string } = {
        'A1': 'A2',
        'A2': 'B1',
        'B1': 'B2',
        'B2': 'IELTS 5.0 - 6.0',
        'IELTS 5.0 - 6.0': 'IELTS 6.5 - 7.5'
      };
      const nextLevel = nextLevels[item.TrinhDo] || 'Trình độ nâng cao tiếp theo';
      return (
        <div className="mt-1.5 p-1.5 bg-green-50 border border-green-100 rounded-lg text-green-800 text-[10px] font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">stars</span>
          <span><strong>Đạt!</strong> Lên lớp <strong>{nextLevel}</strong>.</span>
        </div>
      );
    } else if (item.TrangThai === 3) {
      return (
        <div className="mt-1.5 p-1.5 bg-red-50 border border-red-100 rounded-lg text-red-800 text-[10px] font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">warning</span>
          <span><strong>Chưa đạt!</strong> Đề xuất học lại.</span>
        </div>
      );
    }
    return null;
  };

  const fetchStudentProfile = async (studentId: string) => {
    setProfileLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students/${studentId}/profile`, { headers });
      if (response.data && response.data.success) {
        setProfileData(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải hồ sơ chi tiết: ' + (err.response?.data?.message || err.message));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOpenProfile = (studentId: string) => {
    setActiveProfileTab('history');
    setEditingHistoryId(null);
    setIsProfileOpen(true);
    fetchStudentProfile(studentId);
  };

  const handleGradeSubmit = async (e: React.FormEvent, maDangKy: string) => {
    e.preventDefault();
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const payload = {
        DiemKetThuc: formFinalGrade === '' ? null : Number(formFinalGrade),
        TrangThai: Number(formEnrollStatus)
      };
      const response = await axios.put(`${API_BASE_URL}/api/enrollments/${maDangKy}/grade`, payload, { headers });
      if (response.data.success) {
        setSuccess('Cập nhật kết quả học tập thành công!');
        setEditingHistoryId(null);
        if (profileData?.student.MaHocVien) {
          fetchStudentProfile(profileData.student.MaHocVien);
        }
      }
    } catch (err: any) {
      setError('Lỗi khi cập nhật kết quả: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/students`, { headers });
      if (response.data && response.data.success) {
        setStudents(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải danh sách học viên: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classes`, { headers });
      if (response.data && response.data.success) {
        // Filter classes that are active (TrangThai === 1 or 2) and have vacancy
        const activeClasses = response.data.data.filter((c: any) => c.TrangThai === 1 || c.TrangThai === 2);
        setClasses(activeClasses);
        if (activeClasses.length > 0) {
          setEnrollClassId(activeClasses[0].MaLopHoc);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách lớp học:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStudents();
      fetchClasses();
    }
  }, [token]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormHoTen('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormStatus(1);
    setFormParentPhone('');
    setFormDob('');
    setFormGender(1);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingId(student.MaHocVien);
    setFormHoTen(student.HoTen);
    setFormPhone(student.SoDienThoai);
    setFormEmail(student.Email);
    setFormAddress(student.DiaChi || '');
    setFormStatus(student.TrangThai);
    setFormParentPhone(student.SDTPhuHuynh || '');
    // Format date string YYYY-MM-DD
    const dobFormatted = student.NgaySinh ? student.NgaySinh.split('T')[0] : '';
    setFormDob(dobFormatted);
    setFormGender(student.GioiTinh);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formHoTen || !formPhone || !formEmail || !formDob) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const payload = {
      HoTen: formHoTen,
      SoDienThoai: formPhone,
      Email: formEmail,
      DiaChi: formAddress || null,
      TrangThai: formStatus,
      SDTPhuHuynh: formParentPhone || null,
      NgaySinh: formDob,
      GioiTinh: formGender
    };

    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editingId) {
        // Edit student
        const response = await axios.put(`${API_BASE_URL}/api/students/${editingId}`, payload, { headers });
        if (response.data.success) {
          setSuccess('Cập nhật hồ sơ học viên thành công!');
          setIsFormOpen(false);
          fetchStudents();
        }
      } else {
        // Create student
        const response = await axios.post(`${API_BASE_URL}/api/students`, payload, { headers });
        if (response.data.success) {
          setSuccess('Tạo hồ sơ học viên thành công!');
          setIsFormOpen(false);
          fetchStudents();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin học viên.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ học viên ${id}?`)) return;
    setError('');
    setSuccess('');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/students/${id}`, { headers });
      if (response.data.success) {
        setSuccess('Xóa hồ sơ học viên thành công!');
        fetchStudents();
      }
    } catch (err: any) {
      setError('Lỗi khi xóa học viên: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenEnroll = (student: Student) => {
    setSelectedStudent(student);
    setIsEnrollModalOpen(true);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStudent || !enrollClassId) {
      setError('Vui lòng chọn lớp học để xếp.');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.post(`${API_BASE_URL}/api/enrollments`, {
        MaHocVien: selectedStudent.MaHocVien,
        MaLopHoc: enrollClassId
      }, { headers });

      if (response.data.success) {
        setSuccess(`Xếp lớp thành công cho học viên ${selectedStudent.HoTen}. Học phí: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(response.data.data.HocPhi)}`);
        setIsEnrollModalOpen(false);
        fetchStudents();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi xếp lớp cho học viên.');
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
      case 1: return <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Đang học</span>;
      case 2: return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Bảo lưu</span>;
      case 0: return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Đã nghỉ</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase">Chưa rõ</span>;
    }
  };

  const uniqueLevels = Array.from(new Set(classes.map(c => c.TrinhDo).filter(Boolean)));

  const filteredClassesForEnroll = classes.filter(cls => {
    // 1. Lọc theo Lịch học
    if (enrollFilterDays !== 'all') {
      const days = cls.ScheduleDays || '';
      if (enrollFilterDays === '2-4-6') {
        if (days !== '2,4,6') return false;
      } else if (enrollFilterDays === '3-5-7') {
        if (days !== '3,5,7') return false;
      } else if (enrollFilterDays === 'other') {
        if (days === '2,4,6' || days === '3,5,7') return false;
      }
    }

    // 2. Lọc theo Khung giờ
    if (enrollFilterTime !== 'all') {
      const startTime = cls.NgayBatDau || '';
      if (!startTime) return false;
      const hour = parseInt(startTime.split(':')[0], 10);
      if (enrollFilterTime === 'morning') {
        if (hour >= 12) return false;
      } else if (enrollFilterTime === 'afternoon') {
        if (hour < 12 || hour >= 17) return false;
      } else if (enrollFilterTime === 'evening') {
        if (hour < 17) return false;
      }
    }

    // 3. Lọc theo Trình độ
    if (enrollFilterLevel !== 'all') {
      if (cls.TrinhDo !== enrollFilterLevel) return false;
    }

    return true;
  });

  useEffect(() => {
    if (isEnrollModalOpen) {
      if (filteredClassesForEnroll.length > 0) {
        setEnrollClassId(filteredClassesForEnroll[0].MaLopHoc);
      } else {
        setEnrollClassId('');
      }
    }
  }, [enrollFilterDays, enrollFilterTime, enrollFilterLevel, isEnrollModalOpen, classes]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filteredStudents = students.filter(s => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      s.HoTen.toLowerCase().includes(query) || 
      s.MaHocVien.toLowerCase().includes(query) || 
      s.SoDienThoai.includes(query) || 
      s.Email.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || String(s.TrangThai) === statusFilter;

    const matchesClass = classFilter === 'all' || 
      (classFilter === 'none' && !s.CurrentClasses) ||
      (s.CurrentClasses && s.CurrentClasses.includes(classFilter));

    const matchesDebt = debtFilter === 'all' ||
      (debtFilter === 'debt' && s.TotalDebt && s.TotalDebt > 0) ||
      (debtFilter === 'paid' && (!s.TotalDebt || s.TotalDebt === 0));

    return matchesSearch && matchesStatus && matchesClass && matchesDebt;
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Học viên</h1>
        {user?.role === 'Quản lý' && (
          <button
            onClick={handleOpenCreate}
            className="bg-[#0040a1] hover:bg-[#0056d2] text-white font-bold py-2 px-4 rounded-lg transition shadow-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Thêm Học viên
          </button>
        )}
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase">Tổng học viên</span>
          <p className="text-2xl font-black text-gray-800 mt-0.5">{students.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-150">
          <span className="text-xs font-bold text-green-600 uppercase">Đang theo học</span>
          <p className="text-2xl font-black text-green-800 mt-0.5">{students.filter(s => s.TrangThai === 1).length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-150">
          <span className="text-xs font-bold text-blue-600 uppercase">Bảo lưu hồ sơ</span>
          <p className="text-2xl font-black text-blue-800 mt-0.5">{students.filter(s => s.TrangThai === 2).length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-150">
          <span className="text-xs font-bold text-red-600 uppercase">Đã nghỉ học</span>
          <p className="text-2xl font-black text-red-800 mt-0.5">{students.filter(s => s.TrangThai === 0).length}</p>
        </div>
      </div>

      {/* Visual Progress Bar Chart */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex justify-between text-xs text-gray-500 font-bold mb-2">
          <span>Tỷ lệ trạng thái học viên</span>
          <div className="flex gap-3">
            <span className="text-green-600">Đang học: {students.length > 0 ? ((students.filter(s => s.TrangThai === 1).length / students.length) * 100).toFixed(0) : 0}%</span>
            <span className="text-blue-600">Bảo lưu: {students.length > 0 ? ((students.filter(s => s.TrangThai === 2).length / students.length) * 100).toFixed(0) : 0}%</span>
            <span className="text-red-500">Đã nghỉ: {students.length > 0 ? ((students.filter(s => s.TrangThai === 0).length / students.length) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden flex">
          {students.length > 0 && (
            <>
              <div 
                style={{ width: `${(students.filter(s => s.TrangThai === 1).length / students.length) * 100}%` }} 
                className="bg-green-500 h-full"
                title="Đang học"
              ></div>
              <div 
                style={{ width: `${(students.filter(s => s.TrangThai === 2).length / students.length) * 100}%` }} 
                className="bg-blue-500 h-full"
                title="Bảo lưu"
              ></div>
              <div 
                style={{ width: `${(students.filter(s => s.TrangThai === 0).length / students.length) * 100}%` }} 
                className="bg-red-500 h-full"
                title="Đã nghỉ"
              ></div>
            </>
          )}
        </div>
      </div>

      {/* Search and Advanced Filters Panel */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Tìm kiếm nhanh</label>
          <input 
            type="text" 
            placeholder="Mã HV, Họ tên, SĐT, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Trạng thái học viên</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded text-xs font-bold text-gray-700 outline-none bg-white cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="1">Đang học</option>
            <option value="2">Bảo lưu</option>
            <option value="0">Đã nghỉ</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Lớp học hiện tại</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded text-xs font-bold text-gray-700 outline-none bg-white cursor-pointer"
          >
            <option value="all">Tất cả lớp học</option>
            <option value="none">Chưa xếp lớp</option>
            {classes.map(c => (
              <option key={c.MaLopHoc} value={c.TenLopHoc}>{c.TenLopHoc}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Tình trạng học phí</label>
          <select
            value={debtFilter}
            onChange={(e) => setDebtFilter(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded text-xs font-bold text-gray-700 outline-none bg-white cursor-pointer"
          >
            <option value="all">Tất cả tình trạng</option>
            <option value="debt">Còn nợ học phí</option>
            <option value="paid">Đã đóng đủ</option>
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã HV</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Họ và tên</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lớp hiện tại</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nợ học phí</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày nhập học</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.MaHocVien} className="hover:bg-gray-50 group">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{student.MaHocVien}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                    <button 
                      onClick={() => handleOpenProfile(student.MaHocVien)} 
                      className="text-[#0040a1] hover:text-blue-800 hover:underline font-bold text-left"
                    >
                      {student.HoTen}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{student.SoDienThoai}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{student.Email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{student.CurrentClasses || <span className="text-gray-400 italic text-xs">Chưa xếp lớp</span>}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {student.TotalDebt && student.TotalDebt > 0 ? (
                      <span className="text-red-600 font-extrabold">{formatCurrency(student.TotalDebt)}</span>
                    ) : (
                      <span className="text-green-600 font-bold">Đóng đủ</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateDisplay(student.NgayDangKy)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">{getStatusBadge(student.TrangThai)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 transition z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] overflow-visible">
                    <div className="relative flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveStudentMenuId(activeStudentMenuId === student.MaHocVien ? null : student.MaHocVien);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition cursor-pointer"
                        title="Tùy chọn"
                      >
                        <span className="material-symbols-outlined text-lg">settings</span>
                      </button>
                      
                      {activeStudentMenuId === student.MaHocVien && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveStudentMenuId(null)}></div>
                          <div className="absolute right-full mr-2 -top-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 animate-fade-in text-left">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenProfile(student.MaHocVien);
                                setActiveStudentMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">assignment_ind</span>
                              Xem Hồ sơ
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenEnroll(student);
                                setActiveStudentMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">school</span>
                              Xếp lớp học
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleOpenEdit(student);
                                setActiveStudentMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              Sửa thông tin
                            </button>

                            {user?.role === 'Quản lý' && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleDelete(student.MaHocVien);
                                  setActiveStudentMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Xóa hồ sơ
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">Chưa có hồ sơ học viên nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editingId ? `Sửa hồ sơ học viên: ${editingId}` : 'Tạo hồ sơ học viên mới'}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Họ và tên *</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formHoTen} 
                    onChange={(e) => setFormHoTen(e.target.value)} 
                    placeholder="Ví dụ: Nguyễn Văn A"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại *</label>
                    <input 
                      type="tel" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formPhone} 
                      onChange={(e) => setFormPhone(e.target.value)} 
                      placeholder="Ví dụ: 0901234567"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                    <input 
                      type="email" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formEmail} 
                      onChange={(e) => setFormEmail(e.target.value)} 
                      placeholder="email@example.com"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ngày sinh *</label>
                    <input 
                      type="date" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                      value={formDob} 
                      onChange={(e) => setFormDob(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Giới tính *</label>
                    <div className="flex gap-4 pt-3">
                      <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                        <input 
                          type="radio" 
                          name="form-gender" 
                          checked={formGender === 1} 
                          onChange={() => setFormGender(1)} 
                        />
                        Nam
                      </label>
                      <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                        <input 
                          type="radio" 
                          name="form-gender" 
                          checked={formGender === 0} 
                          onChange={() => setFormGender(0)} 
                        />
                        Nữ
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại Phụ huynh</label>
                    <input 
                      type="tel" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formParentPhone} 
                      onChange={(e) => setFormParentPhone(e.target.value)} 
                      placeholder="Số điện thoại ba/mẹ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái học tập *</label>
                    <select
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formStatus}
                      onChange={(e) => setFormStatus(Number(e.target.value))}
                    >
                      <option value={1}>Đang học</option>
                      <option value={2}>Bảo lưu</option>
                      <option value={0}>Đã nghỉ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formAddress} 
                    onChange={(e) => setFormAddress(e.target.value)} 
                    placeholder="Số nhà, tên đường, quận/huyện..." 
                  />
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
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Class Modal */}
      {isEnrollModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Xếp lớp học viên</h2>
            <p className="text-sm text-gray-500 mb-4">Học viên: <strong className="text-gray-800">{selectedStudent.HoTen}</strong> ({selectedStudent.MaHocVien})</p>
            
            <form onSubmit={handleEnrollSubmit}>
              <div className="space-y-4 mb-6">
                {/* Bộ lọc lớp học */}
                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Lịch học</label>
                    <select
                      value={enrollFilterDays}
                      onChange={(e) => setEnrollFilterDays(e.target.value)}
                      className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-gray-700 bg-white"
                    >
                      <option value="all">Tất cả</option>
                      <option value="2-4-6">Thứ 2-4-6</option>
                      <option value="3-5-7">Thứ 3-5-7</option>
                      <option value="other">Lịch khác</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Khung giờ</label>
                    <select
                      value={enrollFilterTime}
                      onChange={(e) => setEnrollFilterTime(e.target.value)}
                      className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-gray-700 bg-white"
                    >
                      <option value="all">Tất cả</option>
                      <option value="morning">Ca Sáng</option>
                      <option value="afternoon">Ca Chiều</option>
                      <option value="evening">Ca Tối</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Trình độ</label>
                    <select
                      value={enrollFilterLevel}
                      onChange={(e) => setEnrollFilterLevel(e.target.value)}
                      className="w-full p-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-gray-700 bg-white"
                    >
                      <option value="all">Tất cả</option>
                      {uniqueLevels.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Lớp học tuyển sinh khả dụng *</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    value={enrollClassId}
                    onChange={(e) => setEnrollClassId(e.target.value)}
                    required
                  >
                    {filteredClassesForEnroll.length === 0 ? (
                      <option value="">Không có lớp học phù hợp bộ lọc</option>
                    ) : (
                      filteredClassesForEnroll.map(cls => {
                        const start = cls.NgayBatDau ? cls.NgayBatDau.substring(0, 5) : '';
                        const end = cls.NgayKetThuc ? cls.NgayKetThuc.substring(0, 5) : '';
                        const timeStr = start && end ? ` (${start}-${end})` : '';
                        const dayStr = cls.ScheduleDays === '2,4,6' ? ' - T246' : cls.ScheduleDays === '3,5,7' ? ' - T357' : '';
                        return (
                          <option key={cls.MaLopHoc} value={cls.MaLopHoc}>
                            {cls.TenLopHoc} - {cls.TenKhoaHoc} ({cls.SiSoHienTai}/{cls.SiSoToiDa} HV){timeStr}{dayStr}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition"
                  disabled={classes.length === 0}
                >
                  Xác nhận Xếp lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            {profileLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-sm font-semibold text-gray-500">Đang tải hồ sơ học viên...</p>
              </div>
            ) : profileData ? (
              <div className="space-y-6">
                {/* Header profile */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-gray-800">{profileData.student.HoTen}</h2>
                      <span className="bg-gray-100 text-gray-700 font-mono text-xs font-bold px-2 py-0.5 rounded">
                        {profileData.student.MaHocVien}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-400 mt-1">Hồ sơ chi tiết & Lịch sử học tập</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {profileData.history.some(h => h.TrangThai === 2 || h.TrangThai === 3) && (
                      <button
                        onClick={() => {
                          setSelectedStudent(profileData.student);
                          setIsProfileOpen(false);
                          setIsEnrollModalOpen(true);
                        }}
                        className="bg-[#0040a1] hover:bg-[#0056d2] text-white text-xs font-bold py-1.5 px-3 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Tái đăng ký xếp lớp nối tiếp lộ trình"
                      >
                        <span className="material-symbols-outlined text-[14px]">school</span>
                        Tái đăng ký & Xếp lớp ⚡
                      </button>
                    )}
                    {getStatusBadge(profileData.student.TrangThai)}
                    <button 
                      onClick={() => setIsProfileOpen(false)} 
                      className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg transition"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>

                {/* Personal Information Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Số điện thoại</span>
                    <p className="font-semibold text-gray-700 mt-0.5">{profileData.student.SoDienThoai}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Email</span>
                    <p className="font-semibold text-gray-700 mt-0.5 truncate" title={profileData.student.Email}>{profileData.student.Email}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Ngày sinh</span>
                    <p className="font-semibold text-gray-700 mt-0.5">{formatDateDisplay(profileData.student.NgaySinh)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Giới tính</span>
                    <p className="font-semibold text-gray-700 mt-0.5">{profileData.student.GioiTinh === 1 ? 'Nam' : 'Nữ'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">SĐT Phụ huynh</span>
                    <p className="font-semibold text-gray-700 mt-0.5">{profileData.student.SDTPhuHuynh || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Ngày nhập học</span>
                    <p className="font-semibold text-gray-700 mt-0.5">{formatDateDisplay(profileData.student.NgayDangKy)}</p>
                  </div>
                  <div className="col-span-2 md:col-span-3 border-t border-gray-200/50 pt-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Địa chỉ cư trú</span>
                    <p className="font-semibold text-gray-700 mt-0.5">{profileData.student.DiaChi || 'Chưa cung cấp'}</p>
                  </div>
                </div>

                {/* Tab Navigator */}
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => { setActiveProfileTab('history'); setEditingHistoryId(null); }}
                    className={`py-2.5 px-4 font-bold text-sm border-b-2 transition ${
                      activeProfileTab === 'history'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    📖 Khóa học & Kết quả
                  </button>
                  <button
                    onClick={() => setActiveProfileTab('attendance')}
                    className={`py-2.5 px-4 font-bold text-sm border-b-2 transition ${
                      activeProfileTab === 'attendance'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    📅 Lịch sử chuyên cần
                  </button>
                  <button
                    onClick={() => setActiveProfileTab('placement')}
                    className={`py-2.5 px-4 font-bold text-sm border-b-2 transition ${
                      activeProfileTab === 'placement'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    📝 Điểm thi đầu vào
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="min-h-[200px]">
                  {activeProfileTab === 'history' && (
                    <div className="space-y-4">
                      <div className="overflow-x-auto border border-gray-150 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-250 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Khóa học</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Lớp học</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Ngày xếp lớp</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Điểm kết thúc</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Trạng thái</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-150">
                            {profileData.history.map((item) => {
                              const isEditing = editingHistoryId === item.MaDangKy;
                              return (
                                <tr key={item.MaDangKy} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-3 font-semibold text-gray-800">
                                    <p>{item.TenKhoaHoc}</p>
                                    <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block uppercase">
                                      Cấp độ: {item.TrinhDo}
                                    </span>
                                    {!isEditing && getRecommendation(item)}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-gray-700">{item.TenLopHoc}</td>
                                  <td className="px-4 py-3 text-gray-500">{formatDateDisplay(item.NgayDangKy)}</td>
                                  <td className="px-4 py-3">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        placeholder="Điểm số (0-10)"
                                        className="w-24 p-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={formFinalGrade}
                                        onChange={(e) => setFormFinalGrade(e.target.value)}
                                      />
                                    ) : (
                                      <span className="font-extrabold text-indigo-600 text-sm">
                                        {item.DiemKetThuc !== null ? `${Number(item.DiemKetThuc).toFixed(1)}đ` : 'Chưa có'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {isEditing ? (
                                      <select
                                        className="p-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-gray-700 bg-white"
                                        value={formEnrollStatus}
                                        onChange={(e) => setFormEnrollStatus(Number(e.target.value))}
                                      >
                                        <option value={1}>Đang học</option>
                                        <option value={2}>Đạt (Hoàn thành)</option>
                                        <option value={3}>Chưa đạt (Học lại)</option>
                                        <option value={0}>Hủy học/Bảo lưu</option>
                                      </select>
                                    ) : (
                                      <span>
                                        {item.TrangThai === 1 ? (
                                          <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Đang học</span>
                                        ) : item.TrangThai === 2 ? (
                                          <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Đạt (Hoàn thành)</span>
                                        ) : item.TrangThai === 3 ? (
                                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Chưa đạt (Học lại)</span>
                                        ) : (
                                          <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Hủy/Bảo lưu</span>
                                        )}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {user && ['Quản lý', 'Học vụ', 'Giáo viên'].includes(user.role) && (
                                      isEditing ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={(e) => handleGradeSubmit(e, item.MaDangKy)}
                                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2.5 rounded text-xs transition"
                                          >
                                            Lưu
                                          </button>
                                          <button
                                            onClick={() => setEditingHistoryId(null)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1 px-2.5 rounded text-xs transition border border-gray-200"
                                          >
                                            Hủy
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setEditingHistoryId(item.MaDangKy);
                                            setFormFinalGrade(item.DiemKetThuc !== null ? String(item.DiemKetThuc) : '');
                                            setFormEnrollStatus(item.TrangThai);
                                          }}
                                          className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold text-xs"
                                        >
                                          Nhập/Sửa kết quả
                                        </button>
                                      )
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {profileData.history.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic">Học viên chưa từng được xếp vào lớp học nào.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeProfileTab === 'attendance' && (
                    <div className="space-y-4">
                      {/* Attendance summary statistics */}
                      <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Tổng số buổi đã học</span>
                          <p className="text-xl font-black text-gray-800 mt-0.5">{profileData.attendance.length} buổi</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-green-600 uppercase">Tỷ lệ đi học</span>
                          <p className="text-xl font-black text-green-600 mt-0.5">
                            {profileData.attendance.length > 0 
                              ? `${((profileData.attendance.filter(a => a.AttendanceStatus === 1 || a.AttendanceStatus === null).length / profileData.attendance.length) * 100).toFixed(0)}%`
                              : '0%'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-red-500 uppercase">Số buổi vắng</span>
                          <p className="text-xl font-black text-red-500 mt-0.5">
                            {profileData.attendance.filter(a => a.AttendanceStatus === 0).length} buổi
                          </p>
                        </div>
                      </div>

                      {/* Attendance table list */}
                      <div className="overflow-x-auto border border-gray-150 rounded-xl">
                        <table className="min-w-full divide-y divide-gray-250 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Lớp học</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Buổi học</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Ngày học</th>
                              <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-xs">Ca học</th>
                              <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase text-xs">Điểm danh</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-150">
                            {profileData.attendance.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-semibold text-gray-800">{item.TenLopHoc}</td>
                                <td className="px-4 py-3 font-bold text-gray-700">Buổi số {item.BuoiSo}</td>
                                <td className="px-4 py-3 text-gray-500">{formatDateDisplay(item.NgayHoc)}</td>
                                <td className="px-4 py-3 text-gray-500">{item.GioBatDau ? item.GioBatDau.substring(0, 5) : ''} - {item.GioKetThuc ? item.GioKetThuc.substring(0, 5) : ''}</td>
                                <td className="px-4 py-3 text-center">
                                  {item.AttendanceStatus === 1 || item.AttendanceStatus === null ? (
                                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Có mặt</span>
                                  ) : (
                                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Vắng mặt</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {profileData.attendance.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 italic">Chưa có thông tin điểm danh.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeProfileTab === 'placement' && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex items-center justify-center min-h-[160px]">
                      {profileData.placementTest ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full text-center">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Điểm thi đầu vào</span>
                            <p className="text-3xl font-black text-indigo-600 mt-1">{Number(profileData.placementTest.Diem).toFixed(1)}đ</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Trình độ gợi ý</span>
                            <p className="text-2xl font-black text-gray-800 mt-1">{profileData.placementTest.TrinhDo}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Ngày làm test</span>
                            <p className="font-semibold text-gray-700 mt-2">{formatDateDisplay(profileData.placementTest.NgayKiemTra)}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Giáo viên đánh giá</span>
                            <p className="font-semibold text-gray-700 mt-2">{profileData.placementTest.TenGiaoVien || 'Chưa gán'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 italic">
                          Học viên này được tạo trực tiếp, không qua thi thử kiểm tra đầu vào.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-red-500 font-bold">
                Có lỗi xảy ra khi tải dữ liệu hồ sơ học viên.
              </div>
            )}
            
            <div className="flex justify-end gap-3 border-t border-gray-150 pt-4 mt-6">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="px-6 py-2 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;