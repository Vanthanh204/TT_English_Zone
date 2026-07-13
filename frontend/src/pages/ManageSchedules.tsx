import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

interface ClassItem {
  MaLopHoc: string;
  TenLopHoc: string;
  TrangThai: number;
}

interface ScheduleSession {
  MaLichHoc: string;
  PhongHoc: string | null;
  NgayHoc: string; // YYYY-MM-DD
  BuoiSo: number;
  TrangThai: number; // 1: Bình thường, 0: Nghỉ / Đã hủy
  GioBatDau: string; // HH:MM:SS
  GioKetThuc: string; // HH:MM:SS
  MaLopHoc: string;
}

interface AttendanceRecord {
  MaHocVien: string;
  HoTen: string;
  SoDienThoai: string;
  MaDiemDanh: string | null;
  TrangThai: number | null; // 1: Có mặt, 0: Vắng mặt, 2: Muộn
  NgayDiemDanh: string | null;
}

const ManageSchedules: React.FC = () => {
  const { token, user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [schedules, setSchedules] = useState<ScheduleSession[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate form states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 1=T2, 2=T3..., 0=CN
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [roomName, setRoomName] = useState('');

  // Attendance Modal states
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [targetSession, setTargetSession] = useState<ScheduleSession | null>(null);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Edit single session modal states
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduleSession | null>(null);
  const [editRoom, setEditRoom] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editStatus, setEditStatus] = useState(1);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeScheduleMenuId, setActiveScheduleMenuId] = useState<string | null>(null);

  const daysOfWeek = [
    { label: 'Thứ 2', value: 1 },
    { label: 'Thứ 3', value: 2 },
    { label: 'Thứ 4', value: 3 },
    { label: 'Thứ 5', value: 4 },
    { label: 'Thứ 6', value: 5 },
    { label: 'Thứ 7', value: 6 },
    { label: 'Chủ Nhật', value: 0 },
  ];

  const fetchClasses = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classes`, { headers });
      if (response.data && response.data.success) {
        setClasses(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedClassId(response.data.data[0].MaLopHoc);
        }
      }
    } catch (err: any) {
      setError('Lỗi khi tải danh sách lớp học: ' + (err.response?.data?.message || err.message));
    }
  };

interface ClassStudent {
  MaHocVien: string;
  HoTen: string;
  SoDienThoai: string;
  Email: string;
  TotalSessions: number;
  PresentCount: number;
  AbsentCount: number;
  LateCount: number;
}

  const [roster, setRoster] = useState<ClassStudent[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const fetchRoster = async (classId: string) => {
    if (!classId) return;
    setLoadingRoster(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classes/${classId}/roster`, { headers });
      if (response.data && response.data.success) {
        setRoster(response.data.data);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách học viên lớp:', err);
    } finally {
      setLoadingRoster(false);
    }
  };

  const fetchSchedules = async (classId: string) => {
    if (!classId) return;
    setLoadingSchedules(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/schedules/class/${classId}`, { headers });
      if (response.data && response.data.success) {
        setSchedules(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải lịch học: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClasses();
    }
  }, [token]);

  useEffect(() => {
    if (selectedClassId) {
      fetchSchedules(selectedClassId);
      fetchRoster(selectedClassId);
    }
  }, [selectedClassId]);

  const handleDaySelect = (val: number) => {
    if (selectedDays.includes(val)) {
      setSelectedDays(selectedDays.filter(d => d !== val));
    } else {
      setSelectedDays([...selectedDays, val]);
    }
  };

  const handleGenerateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedClassId || !startDate || selectedDays.length === 0 || !startTime || !endTime) {
      setError('Vui lòng nhập đầy đủ các thông tin cần thiết để xếp lịch.');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      MaLopHoc: selectedClassId,
      NgayBatDau: startDate,
      ThuTrongTuan: selectedDays,
      GioBatDau: startTime,
      GioKetThuc: endTime,
      PhongHoc: roomName || null
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/schedules/generate`, payload, { headers });
      if (response.data.success) {
        setSuccess(response.data.message);
        setIsGenerateOpen(false);
        fetchSchedules(selectedClassId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể sinh lịch tự động.');
    }
  };

  const handleOpenAttendance = async (session: ScheduleSession) => {
    setTargetSession(session);
    setAttendanceList([]);
    setIsAttendanceOpen(true);
    setLoadingAttendance(true);

    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/attendance/session/${session.MaLichHoc}`, { headers });
      if (response.data && response.data.success) {
        setAttendanceList(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải bảng điểm danh: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: number) => {
    setAttendanceList(prev => prev.map(item => 
      item.MaHocVien === studentId ? { ...item, TrangThai: status } : item
    ));
  };

  const handleSaveAttendance = async () => {
    if (!targetSession) return;
    setError('');
    setSuccess('');

    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      records: attendanceList.map(item => ({
        MaHocVien: item.MaHocVien,
        TrangThai: item.TrangThai !== null ? item.TrangThai : 1 // Mặc định là có mặt (1) nếu chưa chọn
      }))
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/api/attendance/session/${targetSession.MaLichHoc}`, payload, { headers });
      if (response.data.success) {
        setSuccess('Lưu kết quả điểm danh thành công!');
        setIsAttendanceOpen(false);
        fetchSchedules(selectedClassId);
        fetchRoster(selectedClassId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu điểm danh.');
    }
  };

  const handleOpenEditSession = (session: ScheduleSession) => {
    setEditingSession(session);
    setEditRoom(session.PhongHoc || '');
    setEditDate(session.NgayHoc.split('T')[0]);
    setEditStart(session.GioBatDau.substring(0, 5));
    setEditEnd(session.GioKetThuc.substring(0, 5));
    setEditStatus(session.TrangThai);
    setIsEditSessionOpen(true);
  };

  const handleSaveSessionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    setError('');
    setSuccess('');

    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      PhongHoc: editRoom,
      NgayHoc: editDate,
      GioBatDau: editStart,
      GioKetThuc: editEnd,
      TrangThai: editStatus
    };

    try {
      const response = await axios.put(`${API_BASE_URL}/api/schedules/${editingSession.MaLichHoc}`, payload, { headers });
      if (response.data.success) {
        setSuccess('Cập nhật thông tin buổi học thành công!');
        setIsEditSessionOpen(false);
        fetchSchedules(selectedClassId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật buổi học.');
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Calendar logic helpers
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // JS days: 0 (Sun) to 6 (Sat). We want Monday to be first column
    // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6; // Sunday becomes index 6

    const days = [];
    // Add empty slots for padding of previous month
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Add days of current month
    const totalDays = lastDay.getDate();
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const filterSchedulesByDay = (day: Date) => {
    const yyyy = day.getFullYear();
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    const dayStr = `${yyyy}-${mm}-${dd}`;
    return schedules.filter(s => s.NgayHoc.split('T')[0] === dayStr);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lịch Học & Điểm Danh</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class Select */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-700">Lớp học:</span>
            <select
              className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-gray-50 text-gray-800 cursor-pointer"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map(c => (
                <option key={c.MaLopHoc} value={c.MaLopHoc}>{c.TenLopHoc}</option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          {user?.role !== 'Giáo viên' && (
            <button
              onClick={() => {
                setSelectedDays([]);
                setStartDate('');
                setIsGenerateOpen(true);
              }}
              className="bg-[#0040a1] hover:bg-[#0056d2] text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 text-sm shadow-xs transition"
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              Xếp lịch tự động
            </button>
          )}

          {/* View Toggle */}
          <div className="bg-gray-100 p-1 rounded-lg flex border border-gray-200">
            <button
              onClick={() => setViewType('calendar')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                viewType === 'calendar' ? 'bg-white text-[#0040a1] shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              Lịch tháng
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                viewType === 'list' ? 'bg-white text-[#0040a1] shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-sm">list</span>
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-sm">
          {success}
        </div>
      )}

      {loadingSchedules ? (
        <div className="flex justify-center py-20 bg-white rounded-xl shadow-xs border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-100 shadow-xs">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">event_busy</span>
          <h3 className="text-lg font-bold text-gray-700 mb-1">Lớp học chưa được lập lịch học</h3>
          <p className="text-sm text-gray-400 mb-6">Hãy click vào nút "Xếp lịch tự động" phía trên để tạo lịch giảng dạy cho lớp.</p>
        </div>
      ) : viewType === 'calendar' ? (
        /* ================= CALENDAR VIEW ================= */
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
              <span className="material-symbols-outlined text-blue-600">calendar_today</span>
              Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={prevMonth} 
                className="w-10 h-10 border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition flex items-center justify-center"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button 
                onClick={nextMonth} 
                className="w-10 h-10 border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition flex items-center justify-center"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Header weekdays */}
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(h => (
              <div key={h} className="text-center text-xs font-bold text-gray-400 py-2 border-b border-gray-100">{h}</div>
            ))}

            {/* Day grid cells */}
            {getDaysInMonth().map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="bg-gray-50/50 min-h-[100px] border border-gray-100 rounded-lg"></div>;
              
              const daySchedules = filterSchedulesByDay(day);
              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <div 
                  key={day.toISOString()} 
                  className={`min-h-[110px] p-2 border border-gray-100 rounded-lg flex flex-col justify-between transition-all relative ${
                    isToday ? 'bg-blue-50/30 border-blue-300 ring-1 ring-blue-300' : 'bg-white hover:bg-gray-50/30'
                  }`}
                >
                  <span className={`text-xs font-black self-end px-1.5 py-0.5 rounded-full ${
                    isToday ? 'bg-[#0040a1] text-white' : 'text-gray-400'
                  }`}>
                    {day.getDate()}
                  </span>

                  <div className="flex-1 flex flex-col justify-end mt-1 space-y-1">
                    {daySchedules.map(s => (
                      <div 
                        key={s.MaLichHoc} 
                        className={`text-[10px] p-1.5 rounded-md font-bold leading-tight border shadow-xs ${
                          s.TrangThai === 0
                            ? 'bg-red-50 text-red-700 border-red-200 line-through'
                            : 'bg-green-50 text-[#0040a1] border-green-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-[#0040a1] uppercase">B{s.BuoiSo}</span>
                          <span className="text-[9px] text-gray-400">{s.PhongHoc || 'Chưa gán'}</span>
                        </div>
                        <div className="text-[9px] text-gray-500 font-semibold mt-0.5">
                          {formatTime(s.GioBatDau)}-{formatTime(s.GioKetThuc)}
                        </div>

                        {/* Interactive Buttons directly on calendar items */}
                        <div className="flex gap-1 mt-1 border-t border-gray-200/50 pt-1">
                          <button
                            onClick={() => handleOpenAttendance(s)}
                            className="bg-green-600 hover:bg-green-700 text-white rounded px-1.5 py-0.5 text-[8px] font-black transition cursor-pointer"
                            title="Điểm danh"
                            disabled={s.TrangThai === 0}
                          >
                            T.Danh
                          </button>
                          {user?.role !== 'Giáo viên' && (
                            <button
                              onClick={() => handleOpenEditSession(s)}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded px-1.5 py-0.5 text-[8px] font-black transition cursor-pointer"
                              title="Cấu hình"
                            >
                              Sửa
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-x-auto relative">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Buổi số</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày học</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ học</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Phòng học</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((s) => (
                <tr key={s.MaLichHoc} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#0040a1]">Buổi số {s.BuoiSo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{formatDateDisplay(s.NgayHoc)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{formatTime(s.GioBatDau)} - {formatTime(s.GioKetThuc)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">{s.PhongHoc || <span className="text-gray-400 italic">Chưa gán</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {s.TrangThai === 1 ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Bình thường</span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Nghỉ / Hủy học</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 transition z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] overflow-visible">
                    <div className="relative flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScheduleMenuId(activeScheduleMenuId === s.MaLichHoc ? null : s.MaLichHoc);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition cursor-pointer"
                        title="Tùy chọn"
                      >
                        <span className="material-symbols-outlined text-lg">settings</span>
                      </button>

                      {activeScheduleMenuId === s.MaLichHoc && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveScheduleMenuId(null)}></div>
                          <div className="absolute right-full mr-2 -top-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 animate-fade-in text-left">
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenAttendance(s);
                                setActiveScheduleMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={s.TrangThai === 0}
                            >
                              <span className="material-symbols-outlined text-sm">co_present</span>
                              Điểm danh
                            </button>

                            {user?.role !== 'Giáo viên' && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenEditSession(s);
                                  setActiveScheduleMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                Sửa buổi học
                              </button>
                            )}
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

      {/* ================= BẢNG TỔNG HỢP CHUYÊN CẦN LỚP HỌC ================= */}
      {selectedClassId && (() => {
        const elapsedSessions = schedules.filter(s => s.TrangThai === 1 && new Date(s.NgayHoc) <= new Date()).length;
        const totalStudents = roster.length;
        const totalPresentCount = roster.reduce((sum, r) => sum + Number((r as any)?.PresentCount ?? (r as any)?.presentCount ?? (r as any)?.presentcount ?? 0), 0);
        const totalLateCount = roster.reduce((sum, r) => sum + Number((r as any)?.LateCount ?? (r as any)?.lateCount ?? (r as any)?.latecount ?? 0), 0);
        
        const averageAttendanceRate = (totalStudents > 0 && elapsedSessions > 0)
          ? Math.round(((totalPresentCount + totalLateCount) / (totalStudents * elapsedSessions)) * 100)
          : 100;
          
        const studentsInDanger = roster.filter(r => {
          const present = Number((r as any)?.PresentCount ?? (r as any)?.presentCount ?? (r as any)?.presentcount ?? 0);
          const rate = elapsedSessions > 0 ? Math.round((present / elapsedSessions) * 100) : 100;
          return rate < 80;
        }).length;

        const perfectStudents = roster.filter(r => {
          const present = Number((r as any)?.PresentCount ?? (r as any)?.presentCount ?? (r as any)?.presentcount ?? 0);
          return elapsedSessions > 0 && present === elapsedSessions;
        }).length;

        return (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">analytics</span>
                  Báo cáo Chuyên cần & Tình trạng Học viên trong lớp
                </h3>
                <p className="text-xs text-gray-500 mt-1">Danh sách học viên và tỷ lệ đi học, vắng, muộn thực tế của lớp.</p>
              </div>
              <span className="bg-blue-50 text-[#0040a1] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Sĩ số: {roster.length} học viên
              </span>
            </div>

            {/* Detailed Statistics Cards */}
            {!loadingRoster && roster.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/50">
                  <span className="text-[10px] font-extrabold uppercase text-blue-600 block">Tỷ lệ Chuyên cần Lớp</span>
                  <span className="text-2xl font-black text-[#0040a1] mt-1 block">{averageAttendanceRate}%</span>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Mục tiêu: &gt;= 90%</span>
                </div>
                
                <div className="bg-green-50/40 p-4 rounded-xl border border-green-100/50">
                  <span className="text-[10px] font-extrabold uppercase text-green-600 block">Buổi đã diễn ra</span>
                  <span className="text-2xl font-black text-green-700 mt-1 block">{elapsedSessions} / {schedules.length}</span>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Còn lại: {schedules.length - elapsedSessions} buổi</span>
                </div>

                <div className="bg-red-50/40 p-4 rounded-xl border border-red-100/50">
                  <span className="text-[10px] font-extrabold uppercase text-red-600 block">Học viên cảnh báo</span>
                  <span className={`text-2xl font-black mt-1 block ${studentsInDanger > 0 ? 'text-red-600 animate-pulse font-black' : 'text-gray-700'}`}>
                    {studentsInDanger} / {totalStudents}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Tỷ lệ đi học &lt; 80%</span>
                </div>

                <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/50">
                  <span className="text-[10px] font-extrabold uppercase text-amber-600 block">Chuyên cần 100%</span>
                  <span className="text-2xl font-black text-amber-700 mt-1 block">{perfectStudents} / {totalStudents}</span>
                  <span className="text-[9px] text-gray-400 font-semibold block mt-0.5">Học viên đi học đầy đủ</span>
                </div>
              </div>
            )}

            {loadingRoster ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : roster.length === 0 ? (
              <div className="text-center py-6 text-gray-400 italic text-sm">Chưa có học viên nào được xếp lớp.</div>
            ) : (
            <div className="overflow-x-auto border border-gray-200/60 rounded-xl">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Mã HV</th>
                    <th className="px-4 py-3 text-left">Họ và tên</th>
                    <th className="px-4 py-3 text-center">Tổng buổi học</th>
                    <th className="px-4 py-3 text-center">Có mặt</th>
                    <th className="px-4 py-3 text-center">Vắng mặt</th>
                    <th className="px-4 py-3 text-center">Đi muộn</th>
                    <th className="px-4 py-3 text-center">Tỷ lệ đi học</th>
                    <th className="px-4 py-3 text-center">Tình trạng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {roster.map((r) => {
                    const total = Number((r as any)?.TotalSessions ?? (r as any)?.totalSessions ?? (r as any)?.totalsessions ?? 0);
                    const present = Number((r as any)?.PresentCount ?? (r as any)?.presentCount ?? (r as any)?.presentcount ?? 0);
                    const late = Number((r as any)?.LateCount ?? (r as any)?.lateCount ?? (r as any)?.latecount ?? 0);
                    const absent = Number((r as any)?.AbsentCount ?? (r as any)?.absentCount ?? (r as any)?.absentcount ?? 0);
                    const rate = elapsedSessions > 0 ? Math.round((present / elapsedSessions) * 100) : 100;
                    
                    let statusLabel = 'Tốt';
                    let statusClass = 'bg-green-50 text-green-700 border-green-200';
                    if (rate < 80) {
                      statusLabel = 'Cảnh báo vắng! (Nguy cơ)';
                      statusClass = 'bg-red-50 text-red-700 border-red-200 animate-pulse';
                    } else if (rate < 90) {
                      statusLabel = 'Khá';
                      statusClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                    }

                    return (
                      <tr key={r.MaHocVien} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3.5 font-bold text-gray-700">{r.MaHocVien}</td>
                        <td className="px-4 py-3.5 font-bold text-gray-800">
                          <p>{r.HoTen}</p>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{r.SoDienThoai}</p>
                        </td>
                        <td className="px-4 py-3.5 text-center font-semibold text-gray-500">{total}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-green-600">{present}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-red-500">{absent}</td>
                        <td className="px-4 py-3.5 text-center font-bold text-amber-500">{late}</td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                style={{ width: `${rate}%` }} 
                                className={`h-full rounded-full ${rate < 80 ? 'bg-red-500' : rate < 90 ? 'bg-amber-500' : 'bg-green-500'}`}
                              ></div>
                            </div>
                            <span className="font-extrabold">{rate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2.5 py-1 inline-flex text-[10px] font-black rounded-full border ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
        );
      })()}

      {/* MODAL: Auto Generate Schedule */}
      {isGenerateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Sinh Lịch Học Tự Động</h2>
            <form onSubmit={handleGenerateSchedule}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ngày bắt đầu khai giảng *</label>
                  <input 
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Chọn các ngày học trong tuần *</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(d => {
                      const active = selectedDays.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => handleDaySelect(d.value)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                            active 
                              ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Giờ bắt đầu học *</label>
                    <input 
                      type="time"
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Giờ kết thúc *</label>
                    <input 
                      type="time"
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phòng học mặc định</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Ví dụ: Phòng 101, Lab A"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition text-sm"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition text-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">schedule_send</span>
                  Sinh lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Attendance Tracking */}
      {isAttendanceOpen && targetSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Ghi Nhận Điểm Danh</h2>
                <p className="text-xs text-gray-500">
                  Buổi số {targetSession.BuoiSo} - Ngày {formatDateDisplay(targetSession.NgayHoc)} ({formatTime(targetSession.GioBatDau)} - {formatTime(targetSession.GioKetThuc)})
                </p>
              </div>
              <span className="bg-blue-50 text-[#0040a1] text-xs font-black px-2.5 py-1 rounded-full uppercase">
                Phòng: {targetSession.PhongHoc || 'Chưa gán'}
              </span>
            </div>

            {loadingAttendance ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : attendanceList.length === 0 ? (
              <div className="text-center py-10 text-gray-400 italic text-sm">
                Chưa có học viên nào được xếp lớp trong lớp học này. Vui lòng xếp lớp cho học viên trước.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase text-xs">Mã HV</th>
                        <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase text-xs">Họ và tên</th>
                        <th className="px-4 py-2 text-left font-bold text-gray-500 uppercase text-xs">Điện thoại</th>
                        <th className="px-4 py-2 text-center font-bold text-gray-500 uppercase text-xs">Điểm danh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {attendanceList.map((item) => (
                        <tr key={item.MaHocVien} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-gray-700">{item.MaHocVien}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.HoTen}</td>
                          <td className="px-4 py-3 text-gray-500">{item.SoDienThoai}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(item.MaHocVien, 1)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  item.TrangThai === 1 || item.TrangThai === null
                                    ? 'bg-green-600 border-green-600 text-white shadow-xs'
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px] font-black">check_circle</span>
                                Có mặt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(item.MaHocVien, 0)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  item.TrangThai === 0
                                    ? 'bg-red-500 border-red-500 text-white shadow-xs'
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px] font-black">cancel</span>
                                Vắng
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceChange(item.MaHocVien, 2)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                  item.TrangThai === 2
                                    ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px] font-black">schedule</span>
                                Muộn
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAttendanceOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition text-sm"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveAttendance}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition text-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm font-black">save</span>
                    Lưu kết quả
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Edit Single Schedule Session */}
      {isEditSessionOpen && editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Sửa Buổi Học {editingSession.BuoiSo}</h2>
            <form onSubmit={handleSaveSessionEdit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ngày học</label>
                  <input 
                    type="date"
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Giờ bắt đầu</label>
                    <input 
                      type="time"
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Giờ kết thúc</label>
                    <input 
                      type="time"
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phòng học</label>
                  <input 
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái buổi học</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-800"
                    value={editStatus}
                    onChange={(e) => setEditStatus(Number(e.target.value))}
                  >
                    <option value={1}>Bình thường</option>
                    <option value={0}>Hủy học / Báo nghỉ</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditSessionOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition text-sm"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition text-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSchedules;