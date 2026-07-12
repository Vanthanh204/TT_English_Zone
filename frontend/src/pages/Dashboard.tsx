import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

interface StatsSummary {
  totalStudents: number;
  activeStudents: number;
  totalLeads: number;
  activeClasses: number;
  revenueCollected: number;
  revenuePending: number;
  revenueTotal: number;
}

interface ClassSize {
  TenLopHoc: string;
  SiSoHienTai: number;
  SiSoToiDa: number;
}

interface LeadFunnel {
  TrangThai: number;
  count: number;
}



interface UpcomingTest {
  MaKhachHangTiemNang: string;
  HoTen: string;
  LichHenTest: string;
  HinhThucTest: string;
  TenNhanVienPhuTrach: string | null;
}

const Dashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [classSizes, setClassSizes] = useState<ClassSize[]>([]);
  const [funnel, setFunnel] = useState<LeadFunnel[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<UpcomingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Student states
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get('http://localhost:5000/api/dashboard/stats', { headers });
      if (response.data && response.data.success) {
        setSummary(response.data.data.summary);
        setClassSizes(response.data.data.classSizes);
        setFunnel(response.data.data.leadFunnel);
        setUpcomingTests(response.data.data.upcomingTests || []);
      }
    } catch (err: any) {
      setError('Lỗi khi tải báo cáo thống kê: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProfile = async () => {
    if (!user?.id) return;
    setStudentLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`http://localhost:5000/api/students/${user.id}/profile`, { headers });
      if (response.data && response.data.success) {
        setStudentProfile(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải thông tin học tập: ' + (err.response?.data?.message || err.message));
    } finally {
      setStudentLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (user?.role === 'Học viên') {
        fetchStudentProfile();
      } else {
        fetchStats();
      }
    }
  }, [token, user]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getLeadStatusName = (status: number) => {
    switch (status) {
      case 1: return 'Mới';
      case 2: return 'Đã liên hệ';
      case 3: return 'Đặt lịch test';
      case 4: return 'Đã test';
      case 5: return 'Chờ đăng ký';
      case 6: return 'Đăng ký học';
      case 0: return 'Từ chối';
      default: return 'Khác';
    }
  };

  // Group and map funnel counts
  const funnelStages = [1, 2, 3, 4, 5, 6].map(stage => {
    const found = funnel.find(f => f.TrangThai === stage);
    return {
      stage,
      name: getLeadStatusName(stage),
      count: found ? found.count : 0
    };
  });

  const maxFunnelCount = Math.max(...funnelStages.map(s => s.count), 1);

  const formatDateTimeDisplay = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  // 1. STUDENT DASHBOARD BRANCH
  if (user?.role === 'Học viên') {
    if (studentLoading) {
      return (
        <div className="flex justify-center py-20 bg-white rounded-xl shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!studentProfile) {
      return (
        <div className="space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500 font-semibold shadow-xs">
            Đang tải dữ liệu hồ sơ học viên hoặc không có quyền truy cập...
          </div>
        </div>
      );
    }

    const { student, history, attendance, placementTest, payments } = studentProfile;

    const totalSessions = attendance ? attendance.length : 0;
    const presentSessions = attendance ? attendance.filter((a: any) => a.AttendanceStatus === 'Có mặt').length : 0;
    const absentSessions = attendance ? attendance.filter((a: any) => a.AttendanceStatus === 'Vắng').length : 0;
    const lateSessions = attendance ? attendance.filter((a: any) => a.AttendanceStatus === 'Đi muộn').length : 0;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;

    const totalDebt = payments?.reduce((acc: number, cur: any) => acc + Number(cur.ConNo), 0) || 0;

    return (
      <div className="space-y-6 text-gray-700">
        {/* Welcome Section */}
        <div className="relative bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-lg overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-2xl"></div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center font-black text-2xl overflow-hidden flex-shrink-0">
                {student.AnhDaiDien ? (
                  <img src={student.AnhDaiDien} alt={student.HoTen} className="w-full h-full object-cover" />
                ) : (
                  student.HoTen.substring(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black">Chào mừng, {student.HoTen}! 👋</h1>
                <p className="text-blue-100 text-xs md:text-sm mt-1 font-semibold">Mã học viên: {student.MaHocVien} | Email: {student.Email}</p>
              </div>
            </div>
            <button 
              onClick={fetchStudentProfile}
              className="px-4 py-2 bg-white/25 hover:bg-white/35 backdrop-blur-md rounded-xl text-xs font-bold border border-white/20 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Cập nhật dữ liệu
            </button>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Active Class */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lớp học hiện tại</span>
              <p className="text-base font-black text-gray-800 mt-1 truncate" title={history && history.length > 0 ? history[0].TenLopHoc : 'Chưa xếp lớp'}>
                {history && history.length > 0 ? history[0].TenLopHoc : 'Chưa xếp lớp'}
              </p>
              <span className="text-[10px] text-gray-400 font-semibold block truncate">
                {history && history.length > 0 ? history[0].TenKhoaHoc : 'Liên hệ học vụ'}
              </span>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
          </div>

          {/* Card 2: Attendance Rate */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tỷ lệ đi học</span>
              <p className="text-2xl font-black text-green-600 mt-1">{attendanceRate}%</p>
              <span className="text-[10px] text-gray-400 font-semibold block">
                Đã học {presentSessions}/{totalSessions} buổi
              </span>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">task_alt</span>
            </div>
          </div>

          {/* Card 3: Tuition Balance */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Học phí còn nợ</span>
              <p className={`text-xl font-black mt-1 ${totalDebt > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {formatCurrency(totalDebt)}
              </p>
              <span className="text-[10px] text-gray-400 font-semibold block">
                {totalDebt > 0 ? 'Cần thanh toán sớm' : 'Đã đóng đủ học phí'}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${totalDebt > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
              <span className="material-symbols-outlined text-2xl">credit_card</span>
            </div>
          </div>

          {/* Card 4: Placement Test Score */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Test đầu vào</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {placementTest ? `${placementTest.Diem}đ` : 'Chưa test'}
              </p>
              <span className="text-[10px] text-gray-400 font-semibold block">
                {placementTest ? `Cấp độ đề xuất: ${placementTest.TrinhDo}` : 'Chưa cập nhật'}
              </span>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">assignment_turned_in</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Study History & Tuition */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 lg:col-span-7 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Lịch sử học tập & Điểm số</h3>
              <p className="text-xs text-gray-500">Danh sách các lớp học đã tham gia và kết quả thi đánh giá cuối khóa.</p>
            </div>

            <div className="space-y-4">
              {history && history.length > 0 ? (
                history.map((h: any) => (
                  <div key={h.MaDangKy} className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-all bg-gray-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-gray-800 text-sm">{h.TenLopHoc}</h4>
                        <p className="text-[10px] text-gray-500 font-semibold mt-1">Khóa học: {h.TenKhoaHoc} | Trình độ: {h.TrinhDo}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        h.TrangThai === 'Đạt' 
                          ? 'bg-green-100 text-green-800' 
                          : h.TrangThai === 'Chưa đạt' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {h.TrangThai || 'Đang học'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100/60 text-xs font-semibold">
                      <span className="text-gray-500">Kết quả thi cuối khóa:</span>
                      <span className="font-black text-gray-800 text-sm">
                        {h.DiemKetThuc !== null ? `${h.DiemKetThuc}đ` : 'Chưa có điểm'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 italic text-sm">Bạn chưa tham gia lớp học nào.</div>
              )}
            </div>

            {/* Invoices */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Học phí & Hóa đơn đóng tiền</h3>
              <div className="space-y-3">
                {payments && payments.length > 0 ? (
                  payments.map((p: any) => (
                    <div key={p.MaHocPhi} className="p-4 rounded-xl border border-gray-100 flex justify-between items-center text-xs bg-white">
                      <div>
                        <p className="font-extrabold text-gray-800">{p.TenKhoaHoc}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Hạn nộp phí: {new Date(p.HanNop).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-800 text-sm">{formatCurrency(p.ThanhTien)}</p>
                        {Number(p.ConNo) > 0 ? (
                          <span className="inline-block text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded mt-1">Còn nợ: {formatCurrency(p.ConNo)}</span>
                        ) : (
                          <span className="inline-block text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded mt-1">Đã hoàn thành</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 italic text-sm">Không có dữ liệu hóa đơn học phí.</div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Roll Call Attendance */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 lg:col-span-5 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Nhật ký chuyên cần & Điểm danh</h3>
              <p className="text-xs text-gray-500">Thông tin điểm danh các buổi học của bạn trong kỳ.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs font-bold">
              <div className="bg-green-50 p-3 rounded-xl text-green-700">
                <span className="block text-xl font-black">{presentSessions}</span>
                Có mặt
              </div>
              <div className="bg-yellow-50 p-3 rounded-xl text-yellow-700">
                <span className="block text-xl font-black">{lateSessions}</span>
                Đi muộn
              </div>
              <div className="bg-red-50 p-3 rounded-xl text-red-700">
                <span className="block text-xl font-black">{absentSessions}</span>
                Vắng học
              </div>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {attendance && attendance.length > 0 ? (
                attendance.map((a: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-gray-50 text-xs hover:bg-gray-50/50">
                    <div>
                      <p className="font-extrabold text-gray-800">Buổi số {a.BuoiSo}</p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        Ngày {new Date(a.NgayHoc).toLocaleDateString('vi-VN')} ({a.GioBatDau.substring(0, 5)} - {a.GioKetThuc.substring(0, 5)})
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.AttendanceStatus === 'Có mặt' 
                        ? 'bg-green-100 text-green-800' 
                        : a.AttendanceStatus === 'Vắng' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {a.AttendanceStatus}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400 italic text-sm">Chưa có thông tin điểm danh.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ADMIN / STAFF DASHBOARD BRANCH
  if (loading) {
    return (
      <div className="flex justify-center py-20 bg-white rounded-xl shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-xs border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo Thống kê & Tổng quan</h1>
        </div>
        <button 
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-semibold text-gray-700 transition"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Tải lại dữ liệu
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Summary Cards Grid */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Students */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Học viên Đang học</span>
              <p className="text-3xl font-extrabold text-[#0040a1] mt-1">{summary.activeStudents} <span className="text-sm font-normal text-gray-500">/ {summary.totalStudents}</span></p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-[#0040a1] rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
          </div>

          {/* Card 2: CRM Leads */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Khách hàng Tiềm năng</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{summary.totalLeads}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
          </div>

          {/* Card 3: Classes */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lớp học Đang mở</span>
              <p className="text-3xl font-extrabold text-green-600 mt-1">{summary.activeClasses}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">local_library</span>
            </div>
          </div>

          {/* Card 4: Revenue */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Doanh thu Đã thu</span>
              <p className="text-2xl font-black text-amber-600 mt-1.5">{formatCurrency(summary.revenueCollected)}</p>
              <p className="text-[11px] text-gray-500 font-semibold mt-1">Chờ thu: <strong className="text-red-500 font-bold">{formatCurrency(summary.revenuePending)}</strong></p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Class Sizes Bar Chart (Tailwind Custom Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 lg:col-span-8 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Sĩ số học viên trong các lớp học</h3>
            <p className="text-xs text-gray-500 mb-6">So sánh số lượng học viên hiện tại so với sĩ số tối đa của lớp học.</p>
          </div>

          <div className="flex items-end justify-between h-64 gap-3 pt-6 border-b border-gray-100 px-2">
            {classSizes.length === 0 ? (
              <div className="w-full text-center text-sm text-gray-400 py-20 italic">Chưa có thông tin lớp học hoạt động</div>
            ) : (
              classSizes.map(c => {
                const fillPercent = Math.min((c.SiSoHienTai / c.SiSoToiDa) * 100, 100);
                return (
                  <div key={c.TenLopHoc} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 bg-gray-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-md">
                      Sĩ số: {c.SiSoHienTai}/{c.SiSoToiDa} ({fillPercent.toFixed(0)}%)
                    </div>
                    {/* Bar Container */}
                    <div className="w-10 bg-gray-100 rounded-t-lg h-48 flex items-end overflow-hidden border border-gray-100 shadow-inner">
                      {/* Bar Fill */}
                      <div 
                        style={{ height: `${fillPercent || 5}%` }} 
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          fillPercent >= 90 
                            ? 'bg-red-500' 
                            : fillPercent >= 60 
                            ? 'bg-[#0040a1]' 
                            : 'bg-green-500'
                        }`}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-700 mt-2 rotate-12 md:rotate-0 truncate max-w-[80px]" title={c.TenLopHoc}>
                      {c.TenLopHoc}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">{c.SiSoHienTai} HV</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-4 pt-4 text-xs font-semibold justify-center text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 rounded-xs"></span>Lớp vắng (&lt; 60%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0040a1] rounded-xs"></span>Lớp ổn định (&gt; 60%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-500 rounded-xs"></span>Lớp đầy (&gt; 90%)</span>
          </div>
        </div>

        {/* Right: Tuition Fee Stack Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Tỷ lệ thu phí & Công nợ</h3>
            <p className="text-xs text-gray-500 mb-6">Tình hình hoàn thành đóng học phí của học viên tại trung tâm.</p>
          </div>

          {summary && (
            <div className="space-y-6">
              {/* Circular Gauge approximation */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="w-32 h-32 rounded-full border-8 border-gray-100 flex flex-col items-center justify-center shadow-xs">
                  <span className="text-2xl font-black text-green-600">
                    {summary.revenueTotal > 0 
                      ? `${((summary.revenueCollected / summary.revenueTotal) * 100).toFixed(0)}%` 
                      : '0%'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Đã hoàn thành</span>
                </div>
              </div>

              {/* Progress Detail */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-600 font-semibold mb-1">
                    <span>Đã thu (Học phí hoàn tất)</span>
                    <span>{summary.revenueTotal > 0 ? ((summary.revenueCollected / summary.revenueTotal) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${summary.revenueTotal > 0 ? (summary.revenueCollected / summary.revenueTotal) * 100 : 0}%` }} 
                      className="bg-green-500 h-full rounded-full"
                    ></div>
                  </div>
                  <p className="text-xs text-green-600 font-bold mt-1 text-right">{formatCurrency(summary.revenueCollected)}</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-600 font-semibold mb-1">
                    <span>Chờ thu (Công nợ phát sinh)</span>
                    <span>{summary.revenueTotal > 0 ? ((summary.revenuePending / summary.revenueTotal) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${summary.revenueTotal > 0 ? (summary.revenuePending / summary.revenueTotal) * 100 : 0}%` }} 
                      className="bg-red-400 h-full rounded-full"
                    ></div>
                  </div>
                  <p className="text-xs text-red-500 font-bold mt-1 text-right">{formatCurrency(summary.revenuePending)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leads Conversion Funnel Visual */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Phễu chuyển đổi Tuyển sinh</h3>
        <p className="text-xs text-gray-500 mb-6">Thống kê số lượng khách hàng tiềm năng qua từng bước của quy trình tư vấn & xếp lớp.</p>

        <div className="space-y-4">
          {funnelStages.map(stage => {
            const widthPercent = (stage.count / maxFunnelCount) * 100;
            return (
              <div key={stage.stage} className="flex items-center gap-4">
                <span className="w-28 text-sm font-semibold text-gray-600 truncate" title={stage.name}>
                  {stage.name}
                </span>
                <div className="flex-1 bg-gray-50 h-8 rounded-lg overflow-hidden flex items-center pr-4 border border-gray-100">
                  <div 
                    style={{ width: `${widthPercent || 2}%` }} 
                    className="bg-indigo-500 hover:bg-indigo-600 h-full transition-all duration-500 flex items-center justify-end px-3 rounded-lg shadow-sm"
                  >
                    {stage.count > 0 && (
                      <span className="text-[11px] font-black text-white">{stage.count}</span>
                    )}
                  </div>
                  {stage.count === 0 && (
                    <span className="text-[10px] text-gray-400 font-bold pl-2">0</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Placement Tests */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-yellow-600 text-2xl">calendar_month</span>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Lịch hẹn kiểm tra đầu vào sắp tới</h3>
            <p className="text-xs text-gray-500">Danh sách học viên hẹn test đầu vào đã được phân công giáo viên phụ trách.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Học viên hẹn test</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hình thức</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giáo viên phụ trách</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {upcomingTests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm font-medium">Chưa có lịch hẹn test đầu vào nào được đặt.</td>
                </tr>
              ) : (
                upcomingTests.map((t) => (
                  <tr key={t.MaKhachHangTiemNang} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{t.HoTen} ({t.MaKhachHangTiemNang})</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{formatDateTimeDisplay(t.LichHenTest)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        t.HinhThucTest === 'Trực tuyến' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.HinhThucTest}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">{t.TenNhanVienPhuTrach || <span className="text-gray-400 italic">Chưa gán</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
