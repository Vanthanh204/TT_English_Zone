import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

interface Teacher {
  MaNhanVien: string;
  HoTen: string;
}

interface Lead {
  MaKhachHangTiemNang: string;
  HoTen: string;
  SoDienThoai: string;
  Email: string;
  NgaySinh: string;
  GioiTinh: number; // 1: Nam, 0: Nữ
  DiaChi: string;
  NgayTao: string;
  TrangThai: number; // 1: Mới, 2: Đã LH, 3: Đặt test, 4: Đã test, 5: Chờ ĐK, 6: Đã ĐK học, 0: Từ chối
  TenDotTuyenSinh: string;
  TenKhoaHoc: string;
  Diem?: number | null;
  TrinhDo?: string | null;
  MaGiaoVienCham?: string | null;
  LichHenTest?: string | null;
  MaNhanVienPhuTrach?: string | null;
  HinhThucTest?: string | null;
  TenNhanVienPhuTrach?: string | null;
}

const ManageLeads: React.FC = () => {
  const { token, user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering state
  const [activeTab, setActiveTab] = useState<number | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLeadMenuId, setActiveLeadMenuId] = useState<string | null>(null);

  // Test Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formTeacher, setFormTeacher] = useState('');
  const [formScore, setFormScore] = useState(0);
  const [formLevel, setFormLevel] = useState('A1');
  const [formTestDate, setFormTestDate] = useState('');

  // Schedule Test Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedLeadForSchedule, setSelectedLeadForSchedule] = useState<Lead | null>(null);
  const [formTestDateTime, setFormTestDateTime] = useState('');
  const [formTeacherAssigned, setFormTeacherAssigned] = useState('');
  const [formTestFormat, setFormTestFormat] = useState('Trực tiếp');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Add Lead Modal State
  interface EnrollmentSession {
    MaDotTuyenSinh: string;
    TenDotTuyenSinh: string;
  }
  const [sessions, setSessions] = useState<EnrollmentSession[]>([]);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addDob, setAddDob] = useState('');
  const [addGender, setAddGender] = useState(1); // 1: Nam, 0: Nữ
  const [addAddress, setAddAddress] = useState('');
  const [addSessionId, setAddSessionId] = useState('');
  // Test schedule sub-fields
  const [addScheduleTest, setAddScheduleTest] = useState(true);
  const [addTestDateTime, setAddTestDateTime] = useState('');
  const [addTeacherAssigned, setAddTeacherAssigned] = useState('');
  const [addTestFormat, setAddTestFormat] = useState('Trực tiếp');

  const handleToggleSelectAll = () => {
    const eligibleLeads = filteredLeads.filter(l => l.TrangThai === 4 || l.TrangThai === 5);
    const eligibleIds = eligibleLeads.map(l => l.MaKhachHangTiemNang);
    if (selectedLeadIds.length === eligibleIds.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(eligibleIds);
    }
  };

  const handleToggleSelectLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter(item => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleBulkConvert = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển ${selectedLeadIds.length} khách hàng đã chọn thành Học viên chính thức?`)) return;

    setError('');
    setSuccess('');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/students/bulk-convert-lead`,
        { leadIds: selectedLeadIds },
        { headers }
      );
      if (response.data.success) {
        setSuccess(response.data.message);
        setSelectedLeadIds([]);
        fetchLeads();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi chuyển đổi hàng loạt.');
    }
  };

  const handleStatusSelectChange = (lead: Lead, newStatus: number) => {
    if (newStatus === 3) {
      setSelectedLeadForSchedule(lead);
      setFormTestDateTime('');
      setFormTeacherAssigned(teachers.length > 0 ? teachers[0].MaNhanVien : '');
      setFormTestFormat('Trực tiếp');
      setIsScheduleModalOpen(true);
    } else {
      handleUpdateStatus(lead.MaKhachHangTiemNang, newStatus);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedLeadForSchedule || !formTestDateTime || !formTeacherAssigned || !formTestFormat) {
      setError('Vui lòng nhập đầy đủ thông tin lịch hẹn test.');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/leads/${selectedLeadForSchedule.MaKhachHangTiemNang}/schedule-test`,
        {
          LichHenTest: formTestDateTime,
          MaNhanVienPhuTrach: formTeacherAssigned,
          HinhThucTest: formTestFormat
        },
        { headers }
      );
      if (response.data.success) {
        setSuccess('Đặt lịch hẹn test và phân công giáo viên thành công!');
        setIsScheduleModalOpen(false);
        fetchLeads();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi đặt lịch hẹn test.');
    }
  };

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

  const fetchLeads = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.get(`${API_BASE_URL}/api/leads`, { headers });
      if (response.data && response.data.success) {
        setLeads(response.data.data);
      }
    } catch (err: any) {
      setError('Lỗi khi tải danh sách khách hàng tiềm năng: ' + (err.response?.data?.message || err.message));
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
        if (response.data.data.length > 0) {
          setFormTeacher(response.data.data[0].MaNhanVien);
        }
      }
    } catch (err) {
      console.error('Không thể tải danh sách giáo viên:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/enrollment-sessions`);
      if (response.data && response.data.success) {
        setSessions(response.data.data);
      }
    } catch (err) {
      console.error('Không thể tải đợt tuyển sinh:', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await fetchLeads();
      await fetchTeachers();
      await fetchSessions();
    };
    initData();
  }, []);

  const handleOpenAddLeadModal = () => {
    setAddName('');
    setAddPhone('');
    setAddEmail('');
    setAddDob('');
    setAddGender(1);
    setAddAddress('');
    setAddSessionId(sessions.length > 0 ? sessions[0].MaDotTuyenSinh : '');
    setAddScheduleTest(true);
    setAddTestDateTime('');
    setAddTeacherAssigned(teachers.length > 0 ? teachers[0].MaNhanVien : '');
    setAddTestFormat('Trực tiếp');
    setIsAddLeadOpen(true);
  };

  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!addName || !addPhone || !addEmail || !addDob || !addSessionId) {
      setError('Vui lòng nhập đầy đủ các thông tin bắt buộc.');
      return;
    }

    const leadPayload = {
      MaDotTuyenSinh: addSessionId,
      HoTen: addName,
      SoDienThoai: addPhone,
      Email: addEmail,
      NgaySinh: addDob,
      GioiTinh: addGender,
      DiaChi: addAddress
    };

    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Create Lead
      const createRes = await axios.post(`${API_BASE_URL}/api/leads`, leadPayload);
      if (createRes.data.success) {
        const newLeadId = createRes.data.data.MaKhachHangTiemNang;

        // 2. Schedule Test if checked
        if (addScheduleTest && addTestDateTime && addTeacherAssigned) {
          await axios.put(
            `${API_BASE_URL}/api/leads/${newLeadId}/schedule-test`,
            {
              LichHenTest: addTestDateTime,
              MaNhanVienPhuTrach: addTeacherAssigned,
              HinhThucTest: addTestFormat
            },
            { headers }
          );
          setSuccess(`Thêm khách hàng và xếp lịch kiểm tra đầu vào cho ${addName} thành công!`);
        } else {
          setSuccess(`Thêm khách hàng tiềm năng ${addName} thành công!`);
        }

        setIsAddLeadOpen(false);
        fetchLeads();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo khách hàng hoặc đặt lịch.');
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: number) => {
    setError('');
    setSuccess('');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/leads/${leadId}/status`,
        { TrangThai: newStatus },
        { headers }
      );
      if (response.data.success) {
        setSuccess('Cập nhật trạng thái khách hàng thành công!');
        fetchLeads();
      }
    } catch (err: any) {
      setError('Lỗi khi cập nhật trạng thái: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenTestModal = (lead: Lead) => {
    setSelectedLead(lead);
    setFormTeacher(lead.MaGiaoVienCham || (teachers.length > 0 ? teachers[0].MaNhanVien : ''));
    setFormScore(lead.Diem !== undefined && lead.Diem !== null ? lead.Diem : 0);
    setFormLevel(lead.TrinhDo || 'A1');
    const today = new Date().toISOString().split('T')[0];
    setFormTestDate(today);
    setIsTestModalOpen(true);
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedLead || !formTeacher || formScore === undefined || !formLevel || !formTestDate) {
      setError('Vui lòng điền đầy đủ thông tin kết quả kiểm tra.');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      MaKhachHangTiemNang: selectedLead.MaKhachHangTiemNang,
      MaNhanVien: formTeacher,
      Diem: formScore,
      TrinhDo: formLevel,
      NgayKiemTra: formTestDate
    };

    try {
      if (selectedLead.TrangThai >= 4) {
        // Edit existing placement test score
        const response = await axios.put(`${API_BASE_URL}/api/placement-tests/lead/${selectedLead.MaKhachHangTiemNang}`, payload, { headers });
        if (response.data.success) {
          setSuccess('Cập nhật điểm thi đầu vào thành công!');
          setIsTestModalOpen(false);
          fetchLeads();
        }
      } else {
        // Create new placement test score
        const response = await axios.post(`${API_BASE_URL}/api/placement-tests`, payload, { headers });
        if (response.data.success) {
          setSuccess('Ghi nhận điểm thi đầu vào và cập nhật trạng thái khách hàng thành công!');
          setIsTestModalOpen(false);
          fetchLeads();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi nhập/sửa kết quả thi.');
    }
  };

  const handleConvertLead = async (lead: Lead) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển khách hàng ${lead.HoTen} thành Học viên chính thức?`)) return;
    setError('');
    setSuccess('');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.post(`${API_BASE_URL}/api/students/convert-lead/${lead.MaKhachHangTiemNang}`, {}, { headers });
      if (response.data.success) {
        setSuccess(`Chuyển đổi thành công! Học viên được tạo với mã ${response.data.data.MaHocVien}`);
        fetchLeads();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi chuyển đổi thành học viên.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khách hàng tiềm năng ${id}?`)) return;
    setError('');
    setSuccess('');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/leads/${id}`, { headers });
      if (response.data.success) {
        setSuccess('Xóa khách hàng tiềm năng thành công!');
        fetchLeads();
      }
    } catch (err: any) {
      setError('Lỗi khi xóa khách hàng: ' + (err.response?.data?.message || err.message));
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



  const tabs = [
    { value: 'all', label: 'Tất cả' },
    { value: 1, label: 'Mới' },
    { value: 2, label: 'Đã liên hệ' },
    { value: 3, label: 'Đặt lịch test' },
    { value: 4, label: 'Đã test' },
    { value: 5, label: 'Chờ đăng ký' },
    { value: 6, label: 'Đã đăng ký học' },
    { value: 0, label: 'Từ chối' }
  ];

  const filteredLeads = leads.filter(lead => {
    const matchesTab = activeTab === 'all' || Number(lead.TrangThai) === Number(activeTab);
    const matchesSearch = !searchTerm || 
      lead.HoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.SoDienThoai.includes(searchTerm) ||
      lead.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.TenKhoaHoc && lead.TenKhoaHoc.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.TenDotTuyenSinh && lead.TenDotTuyenSinh.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Khách hàng</h1>
        <button
          onClick={handleOpenAddLeadModal}
          className="bg-[#0040a1] hover:bg-[#0056d2] text-white rounded-lg px-4 py-2 text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm font-black">person_add</span>
          Thêm Khách Hàng & Xếp Lịch Test
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto flex-grow">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`py-2 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition ${
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Search Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg w-full md:w-80 bg-gray-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0040a1]/30 focus-within:border-[#0040a1] transition">
          <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
          <input
            type="text"
            className="w-full bg-transparent border-none outline-none text-sm text-gray-700 py-1"
            placeholder="Tìm theo Tên, SĐT, Email, Lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-gray-400 uppercase">Tổng số Leads</span>
          <p className="text-2xl font-black text-gray-800 mt-0.5">{leads.length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-150">
          <span className="text-xs font-bold text-blue-600 uppercase">Khách hàng Mới</span>
          <p className="text-2xl font-black text-blue-800 mt-0.5">{leads.filter(l => l.TrangThai === 1).length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-150">
          <span className="text-xs font-bold text-yellow-600 uppercase">Đặt lịch kiểm tra</span>
          <p className="text-2xl font-black text-yellow-800 mt-0.5">{leads.filter(l => l.TrangThai === 3).length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-150">
          <span className="text-xs font-bold text-green-600 uppercase">Học viên chính thức</span>
          <p className="text-2xl font-black text-green-800 mt-0.5">{leads.filter(l => l.TrangThai === 6).length}</p>
        </div>
      </div>

      {/* Visual Progress Bar Chart */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <div className="flex justify-between text-xs text-gray-500 font-bold mb-2">
          <span>Tỷ lệ phân bổ trạng thái phễu tuyển sinh</span>
          <div className="flex gap-3 text-[10px]">
            <span className="text-blue-500 font-bold">Mới: {leads.length > 0 ? ((leads.filter(l => l.TrangThai === 1).length / leads.length) * 100).toFixed(0) : 0}%</span>
            <span className="text-yellow-600 font-bold">Lịch Test: {leads.length > 0 ? ((leads.filter(l => l.TrangThai === 3).length / leads.length) * 100).toFixed(0) : 0}%</span>
            <span className="text-purple-600 font-bold">Đã Test: {leads.length > 0 ? ((leads.filter(l => l.TrangThai === 4).length / leads.length) * 100).toFixed(0) : 0}%</span>
            <span className="text-green-600 font-bold">Đã Nhập học: {leads.length > 0 ? ((leads.filter(l => l.TrangThai === 6).length / leads.length) * 100).toFixed(0) : 0}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden flex">
          {leads.length > 0 && (
            <>
              <div 
                style={{ width: `${(leads.filter(l => l.TrangThai === 1).length / leads.length) * 100}%` }} 
                className="bg-blue-400 h-full"
                title="Mới"
              ></div>
              <div 
                style={{ width: `${(leads.filter(l => l.TrangThai === 2).length / leads.length) * 100}%` }} 
                className="bg-indigo-300 h-full"
                title="Đã liên hệ"
              ></div>
              <div 
                style={{ width: `${(leads.filter(l => l.TrangThai === 3).length / leads.length) * 100}%` }} 
                className="bg-yellow-400 h-full"
                title="Đặt lịch test"
              ></div>
              <div 
                style={{ width: `${(leads.filter(l => l.TrangThai === 4).length / leads.length) * 100}%` }} 
                className="bg-purple-500 h-full"
                title="Đã test"
              ></div>
              <div 
                style={{ width: `${(leads.filter(l => l.TrangThai === 5).length / leads.length) * 100}%` }} 
                className="bg-orange-400 h-full"
                title="Chờ đăng ký"
              ></div>
              <div 
                style={{ width: `${(leads.filter(l => l.TrangThai === 6).length / leads.length) * 100}%` }} 
                className="bg-green-500 h-full"
                title="Đã đăng ký học"
              ></div>
              <div 
                style={{ width: `${(leads.filter(l => l.TrangThai === 0).length / leads.length) * 100}%` }} 
                className="bg-red-400 h-full"
                title="Từ chối"
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

      {selectedLeadIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl flex items-center justify-between mb-4 animate-fade-in shadow-xs">
          <span className="text-sm font-semibold text-indigo-800">
            Đang chọn <strong className="text-base font-black text-indigo-900">{selectedLeadIds.length}</strong> khách hàng (Đã test / Chờ đăng ký) để chuyển hàng loạt
          </span>
          <button
            type="button"
            onClick={handleBulkConvert}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-black">group_add</span>
            Chuyển thành Học viên Hàng loạt
          </button>
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
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredLeads.filter(l => l.TrangThai === 4 || l.TrangThai === 5).length > 0 &&
                      selectedLeadIds.length === filteredLeads.filter(l => l.TrangThai === 4 || l.TrangThai === 5).length
                    }
                    onChange={handleToggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Chọn tất cả để chuyển đổi"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã KH</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Họ và tên</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Điện thoại</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Đợt tuyển sinh (Khóa học)</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.MaKhachHangTiemNang} className="hover:bg-gray-50 group">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(lead.TrangThai === 4 || lead.TrangThai === 5) ? (
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.MaKhachHangTiemNang)}
                        onChange={() => handleToggleSelectLead(lead.MaKhachHangTiemNang)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        disabled
                        className="rounded text-gray-200 cursor-not-allowed opacity-50"
                        title="Chỉ chuyển đổi học viên đã test hoặc chờ đăng ký"
                      />
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{lead.MaKhachHangTiemNang}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                    <p>{lead.HoTen}</p>
                    {lead.TrangThai === 3 && lead.LichHenTest && (
                      <div className="mt-1 bg-yellow-50 border border-yellow-150 text-yellow-800 text-[10px] font-bold p-1.5 rounded-lg whitespace-normal leading-normal max-w-xs shadow-xs">
                        📅 Lịch test: {formatDateTimeDisplay(lead.LichHenTest)} ({lead.HinhThucTest})
                        <br />
                        🧑‍🏫 GV: {lead.TenNhanVienPhuTrach || 'Chưa gán'}
                      </div>
                    )}
                    {lead.TrangThai >= 4 && lead.Diem !== undefined && lead.Diem !== null && (
                      <span className="inline-block mt-1 bg-purple-100 text-purple-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                        Đầu vào: {lead.Diem} ({lead.TrinhDo})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{lead.SoDienThoai}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{lead.Email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    <p className="font-semibold">{lead.TenDotTuyenSinh}</p>
                    <p className="text-xs text-blue-500">{lead.TenKhoaHoc}</p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateDisplay(lead.NgayTao)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <select
                      value={lead.TrangThai}
                      onChange={(e) => handleStatusSelectChange(lead, Number(e.target.value))}
                      className="p-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                    >
                      <option value={1}>Mới</option>
                      <option value={2}>Đã liên hệ</option>
                      <option value={3}>Đặt lịch test</option>
                      <option value={4}>Đã test</option>
                      <option value={5}>Chờ đăng ký</option>
                      <option value={6}>Đã đăng ký học</option>
                      <option value={0}>Từ chối</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sticky right-0 bg-white group-hover:bg-gray-50 transition z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)] overflow-visible">
                    <div className="relative flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLeadMenuId(activeLeadMenuId === lead.MaKhachHangTiemNang ? null : lead.MaKhachHangTiemNang);
                        }}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 flex items-center justify-center text-gray-500 hover:text-indigo-600 shadow-sm transition cursor-pointer"
                        title="Tùy chọn"
                      >
                        <span className="material-symbols-outlined text-lg">settings</span>
                      </button>

                      {activeLeadMenuId === lead.MaKhachHangTiemNang && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveLeadMenuId(null)}></div>
                          <div className="absolute right-full mr-2 -top-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 animate-fade-in text-left">
                            {(lead.TrangThai === 2 || lead.TrangThai === 3) && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenTestModal(lead);
                                  setActiveLeadMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">edit_note</span>
                                Nhập điểm test
                              </button>
                            )}

                            {lead.TrangThai >= 4 && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleOpenTestModal(lead);
                                  setActiveLeadMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">edit_square</span>
                                Sửa điểm test
                              </button>
                            )}

                            {(lead.TrangThai === 4 || lead.TrangThai === 5) && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleConvertLead(lead);
                                  setActiveLeadMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">person_add</span>
                                Chuyển học viên
                              </button>
                            )}

                            {user?.role === 'Quản lý' && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeleteLead(lead.MaKhachHangTiemNang);
                                  setActiveLeadMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Xóa khách hàng
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Không có khách hàng tiềm năng nào ở mục này.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Placement Test Score Modal */}
      {isTestModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {selectedLead.TrangThai >= 4 ? 'Chỉnh sửa kết quả kiểm tra: ' : 'Nhập kết quả kiểm tra: '}{selectedLead.HoTen} ({selectedLead.MaKhachHangTiemNang})
            </h2>
            <form onSubmit={handleTestSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giáo viên chấm thi *</label>
                  <select 
                     className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    required
                  >
                    {teachers.length === 0 ? (
                      <option value="">Chưa có giáo viên hoạt động</option>
                    ) : (
                      teachers.map(teacher => (
                        <option key={teacher.MaNhanVien} value={teacher.MaNhanVien}>
                          {teacher.HoTen} ({teacher.MaNhanVien})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Điểm số *</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="10"
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formScore} 
                      onChange={(e) => setFormScore(Number(e.target.value))} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Trình độ đánh giá *</label>
                    <input 
                      type="text" 
                      className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formLevel} 
                      onChange={(e) => setFormLevel(e.target.value)} 
                      placeholder="Ví dụ: B1, IELTS 5.5"
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ngày kiểm tra *</label>
                  <input 
                    type="date" 
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formTestDate} 
                    onChange={(e) => setFormTestDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition"
                  disabled={teachers.length === 0}
                >
                  Ghi nhận điểm số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Placement Test Modal */}
      {isScheduleModalOpen && selectedLeadForSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-2 text-gray-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-600">calendar_month</span>
              Đặt lịch hẹn kiểm tra & Phân công giáo viên
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Đặt lịch hẹn kiểm tra trình độ cho khách hàng: <strong className="text-gray-700">{selectedLeadForSchedule.HoTen}</strong> ({selectedLeadForSchedule.MaKhachHangTiemNang})
            </p>
            
            <form onSubmit={handleScheduleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ngày & Giờ kiểm tra *</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-700"
                    value={formTestDateTime}
                    onChange={(e) => setFormTestDateTime(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giáo viên phụ trách kiểm tra *</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-700 cursor-pointer"
                    value={formTeacherAssigned}
                    onChange={(e) => setFormTeacherAssigned(e.target.value)}
                    required
                  >
                    {teachers.length === 0 ? (
                      <option value="">Chưa có giáo viên hoạt động</option>
                    ) : (
                      teachers.map(teacher => (
                        <option key={teacher.MaNhanVien} value={teacher.MaNhanVien}>
                          {teacher.HoTen} ({teacher.MaNhanVien})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Hình thức kiểm tra *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 font-semibold text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="testFormat"
                        value="Trực tiếp"
                        checked={formTestFormat === 'Trực tiếp'}
                        onChange={() => setFormTestFormat('Trực tiếp')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Trực tiếp (Tại trung tâm)
                    </label>
                    <label className="flex items-center gap-2 font-semibold text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="testFormat"
                        value="Trực tuyến"
                        checked={formTestFormat === 'Trực tuyến'}
                        onChange={() => setFormTestFormat('Trực tuyến')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Trực tuyến (Online Zoom/Meet)
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-150 p-3 rounded-lg">
                  <h4 className="text-xs font-bold text-[#0040a1] mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">notifications</span>
                    Kênh & Đối tượng nhận thông báo tự động:
                  </h4>
                  <ul className="text-[10px] text-blue-800 list-disc pl-4 space-y-0.5 font-medium">
                    <li><strong>Gửi Khách hàng:</strong> Email xác nhận thời gian, địa điểm / đường link tham gia.</li>
                    <li><strong>Gửi Giáo viên phụ trách:</strong> Email phân công chấm bài test, hiển thị lịch test trên dashboard.</li>
                    <li><strong>Gửi Nhân viên tư vấn:</strong> Cập nhật trạng thái trực tiếp trên CRM.</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition cursor-pointer"
                  disabled={teachers.length === 0}
                >
                  Xác nhận đặt lịch & Thông báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD LEAD & SCHEDULE TEST MODAL */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">person_add</span>
                  Thêm Khách Hàng Mới & Xếp Lịch Test
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Đăng ký trực tiếp cho học viên đến tư vấn tại trung tâm và phân công lịch kiểm tra đầu vào.
                </p>
              </div>
              <button 
                onClick={() => setIsAddLeadOpen(false)}
                className="text-gray-400 hover:text-gray-600 flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddLeadSubmit}>
              {/* SECTION 1: Customer Info */}
              <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-xs font-black uppercase text-blue-600 tracking-wider mb-3 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm font-black">badge</span>
                  1. Thông tin khách hàng tiềm năng
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Họ và tên *</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Số điện thoại *</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      placeholder="Ví dụ: 0987654321"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email liên hệ *</label>
                    <input
                      type="email"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="Ví dụ: nguyenvana@gmail.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Ngày sinh *</label>
                    <input
                      type="date"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 font-semibold"
                      value={addDob}
                      onChange={(e) => setAddDob(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Giới tính *</label>
                    <select
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium bg-white text-gray-800"
                      value={addGender}
                      onChange={(e) => setAddGender(Number(e.target.value))}
                      required
                    >
                      <option value={1}>Nam</option>
                      <option value={0}>Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Đợt tuyển sinh áp dụng *</label>
                    <select
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-bold text-gray-700 bg-white"
                      value={addSessionId}
                      onChange={(e) => setAddSessionId(e.target.value)}
                      required
                    >
                      {sessions.length === 0 ? (
                        <option value="">Chưa có đợt tuyển sinh mở</option>
                      ) : (
                        sessions.map(s => (
                          <option key={s.MaDotTuyenSinh} value={s.MaDotTuyenSinh}>
                            {s.TenDotTuyenSinh}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Địa chỉ thường trú</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                      value={addAddress}
                      onChange={(e) => setAddAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Test Schedule Info */}
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-150 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm font-black">calendar_month</span>
                    2. Lên lịch hẹn kiểm tra đầu vào
                  </h3>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addScheduleTest}
                      onChange={(e) => setAddScheduleTest(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    Đặt lịch ngay bây giờ
                  </label>
                </div>

                {addScheduleTest && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Ngày & Giờ kiểm tra *</label>
                      <input
                        type="datetime-local"
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-700 bg-white"
                        value={addTestDateTime}
                        onChange={(e) => setAddTestDateTime(e.target.value)}
                        required={addScheduleTest}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Giáo viên phụ trách test *</label>
                      <select
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold text-gray-700 bg-white"
                        value={addTeacherAssigned}
                        onChange={(e) => setAddTeacherAssigned(e.target.value)}
                        required={addScheduleTest}
                      >
                        {teachers.length === 0 ? (
                          <option value="">Chưa có giáo viên</option>
                        ) : (
                          teachers.map(t => (
                            <option key={t.MaNhanVien} value={t.MaNhanVien}>
                              {t.HoTen} ({t.MaNhanVien})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Hình thức test *</label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-1.5 font-semibold text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="addTestFormat"
                            value="Trực tiếp"
                            checked={addTestFormat === 'Trực tiếp'}
                            onChange={() => setAddTestFormat('Trực tiếp')}
                          />
                          Trực tiếp (Tại trung tâm)
                        </label>
                        <label className="flex items-center gap-1.5 font-semibold text-xs text-gray-700 cursor-pointer">
                          <input
                            type="radio"
                            name="addTestFormat"
                            value="Trực tuyến"
                            checked={addTestFormat === 'Trực tuyến'}
                            onChange={() => setAddTestFormat('Trực tuyến')}
                          />
                          Trực tuyến (Online Zoom/Meet)
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition text-sm cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm font-black">save</span>
                  Lưu & Lên lịch hẹn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLeads;