import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import axiosReal from 'axios';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  MaDotTuyenSinh: string;
  TenDotTuyenSinh: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  NgayKhaiGiang: string;
  ChiTieu: number;
  MaKhoaHoc: string;
  TenKhoaHoc: string;
  HocPhi: number;
  SoBuoiHoc: number;
  TrinhDo: string;
}

interface GroupedCampaign {
  TenDotTuyenSinh: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  NgayKhaiGiang: string;
  ChiTieu: number;
  Courses: Campaign[];
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection state for Registration Modal
  const [selectedCourse, setSelectedCourse] = useState<Campaign | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  // Registration Form State
  const [regHoTen, setRegHoTen] = useState('');
  const [regSoDienThoai, setRegSoDienThoai] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNgaySinh, setRegNgaySinh] = useState('');
  const [regGioiTinh, setRegGioiTinh] = useState(1); // 1: Nam, 0: Nữ
  const [regDiaChi, setRegDiaChi] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fallback database sessions
  const defaultSessions: Campaign[] = [
    {
      MaDotTuyenSinh: 'DTS001',
      TenDotTuyenSinh: 'Tuyển sinh đợt 08/2026',
      NgayBatDau: '2026-08-01',
      NgayKetThuc: '2026-08-30',
      NgayKhaiGiang: '2026-09-05',
      ChiTieu: 30,
      MaKhoaHoc: 'KH001',
      TenKhoaHoc: 'IELTS Mastery Intensive',
      HocPhi: 6500000,
      SoBuoiHoc: 48,
      TrinhDo: 'B2 - C1'
    },
    {
      MaDotTuyenSinh: 'DTS002',
      TenDotTuyenSinh: 'Tuyển sinh đợt 08/2026',
      NgayBatDau: '2026-08-01',
      NgayKetThuc: '2026-08-30',
      NgayKhaiGiang: '2026-09-10',
      ChiTieu: 40,
      MaKhoaHoc: 'KH002',
      TenKhoaHoc: 'TOEIC Accelerated 650+',
      HocPhi: 4000000,
      SoBuoiHoc: 30,
      TrinhDo: 'B1 - B2'
    },
    {
      MaDotTuyenSinh: 'DTS003',
      TenDotTuyenSinh: 'Tuyển sinh đợt 09/2026',
      NgayBatDau: '2026-09-01',
      NgayKetThuc: '2026-09-30',
      NgayKhaiGiang: '2026-10-05',
      ChiTieu: 25,
      MaKhoaHoc: 'KH003',
      TenKhoaHoc: 'Communicative Immersion',
      HocPhi: 3500000,
      SoBuoiHoc: 24,
      TrinhDo: 'A1 - A2'
    }
  ];

  const fetchData = async () => {
    try {
      const sessionRes = await axiosReal.get(`${API_BASE_URL}/api/enrollment-sessions`);
      if (sessionRes.data && sessionRes.data.success) {
        setSessions(sessionRes.data.data);
      } else {
        setSessions(defaultSessions);
      }
    } catch (err) {
      setSessions(defaultSessions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Prevent background scrolling when registration modal is open
  useEffect(() => {
    if (isRegModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isRegModalOpen]);

  const handleOpenRegModal = (course: Campaign) => {
    setSelectedCourse(course);
    setRegHoTen('');
    setRegSoDienThoai('');
    setRegEmail('');
    setRegNgaySinh('');
    setRegGioiTinh(1);
    setRegDiaChi('');
    setRegError('');
    setRegSuccess('');
    setIsRegModalOpen(true);
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    
    setRegError('');
    setRegSuccess('');
    setSubmitting(true);

    if (!regHoTen || !regSoDienThoai || !regEmail || !regNgaySinh) {
      setRegError('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await axiosReal.post(`${API_BASE_URL}/api/leads`, {
        MaDotTuyenSinh: selectedCourse.MaDotTuyenSinh,
        HoTen: regHoTen,
        SoDienThoai: regSoDienThoai,
        Email: regEmail,
        NgaySinh: regNgaySinh,
        GioiTinh: regGioiTinh,
        DiaChi: regDiaChi || null
      });

      if (response.data.success) {
        setRegSuccess('Đăng ký tư vấn khóa học thành công! Chúng tôi sẽ liên hệ trong ít phút.');
        setTimeout(() => {
          setIsRegModalOpen(false);
        }, 2000);
      }
    } catch (err: any) {
      setRegError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Group campaigns by TenDotTuyenSinh
  const getGroupedCampaigns = () => {
    const map: { [key: string]: GroupedCampaign } = {};
    sessions.forEach(s => {
      const key = s.TenDotTuyenSinh;
      if (!map[key]) {
        map[key] = {
          TenDotTuyenSinh: s.TenDotTuyenSinh,
          NgayBatDau: s.NgayBatDau,
          NgayKetThuc: s.NgayKetThuc,
          NgayKhaiGiang: s.NgayKhaiGiang,
          ChiTieu: s.ChiTieu,
          Courses: []
        };
      }
      map[key].Courses.push(s);
    });
    return Object.values(map).filter(g => 
      g.TenDotTuyenSinh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.Courses.some(c => c.TenKhoaHoc.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const groupedList = getGroupedCampaigns();

  return (
    <div className="min-h-screen flex flex-col relative bg-[#F5F7FA] text-slate-800 font-sans overflow-x-hidden">
      {/* CSS Custom Style block */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        .font-display {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .font-body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .glass-panel-hoverable:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-4px) scale(1.01);
          border-color: rgba(6, 182, 212, 0.3);
          box-shadow: 0 10px 40px rgba(6, 182, 212, 0.12);
        }

        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(150px);
          opacity: 0.12;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }

        .animate-orb-float {
          animation: orbFloat 10s ease-in-out infinite;
        }

        /* Floating Label styling */
        .input-group {
          position: relative;
        }

        .spatial-input {
          width: 100%;
          background-color: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 1.25rem 1rem 0.5rem 1rem;
          color: #1e293b;
          transition: all 0.2s ease;
          outline: none;
        }

        .spatial-input:focus {
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.15);
          background-color: #ffffff;
        }

        .spatial-label {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }

        .spatial-input:focus + .spatial-label,
        .spatial-input:not(:placeholder-shown) + .spatial-label {
          top: 0.55rem;
          transform: translateY(0);
          font-size: 0.72rem;
          color: #06b6d4;
        }

        .loader {
          border: 2px solid rgba(13, 227, 242, 0.2);
          border-top: 2px solid #0de3f2;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Timeline styles */
        .timeline-line {
          width: 2px;
          background: linear-gradient(to bottom, rgba(6, 182, 212, 0.6), rgba(6, 182, 212, 0.08));
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.15);
        }

        /* Custom scrollbars */
        html, body {
          background-color: #F5F7FA !important;
          color: #1e293b !important;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.12);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}</style>

      {/* Ambient Background Orbs */}
      <div className="ambient-orb bg-[#06b6d4] w-[35rem] h-[35rem] top-[-10%] left-[-10%] animate-orb-float"></div>
      <div className="ambient-orb bg-[#8b5cf6] w-[30rem] h-[30rem] bottom-[-10%] right-[-5%] opacity-10 animate-orb-float" style={{ animationDelay: '2s' }}></div>

      {/* Header Container */}
      <div className="relative w-full z-50 flex flex-col max-w-[1200px] mx-auto px-4 py-5 font-display">
        <header className="flex items-center justify-between px-6 py-4 glass-panel rounded-full">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#06b6d4] text-2xl font-black">domain</span>
            <h2 className="text-slate-800 text-lg font-bold leading-tight tracking-tight font-display">TT English Zone</h2>
          </div>
          <nav className="hidden md:flex gap-8 items-center">
            <a className="text-[#06b6d4] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer" href="#catalog">Danh mục tuyển sinh</a>
            <a className="text-slate-500 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer" onClick={() => navigate('/login')}>Cổng Học Viên</a>
          </nav>
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 border border-[#0de3f2]/30 hover:border-[#0de3f2] bg-[#0de3f2]/10 hover:bg-[#0de3f2] text-[#06b6d4] hover:text-slate-900 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-[0_0_10px_rgba(13,227,242,0.15)] hover:shadow-[0_0_15px_rgba(13,227,242,0.35)] cursor-pointer"
          >
            Đăng nhập
          </button>
        </header>
      </div>

      {/* Hero Section */}
      <div className="relative max-w-[1200px] mx-auto px-6 pt-10 pb-8 z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-display">
        <div>
          <span className="text-[#06b6d4] text-xs font-black uppercase tracking-widest block mb-1">Hệ thống Đào tạo Anh ngữ TT English Zone</span>
          <h1 className="text-slate-800 text-4xl md:text-5xl font-black leading-tight tracking-tight">Cổng Tuyển Sinh Trực Tuyến</h1>
          <p className="text-slate-500 text-sm md:text-base max-w-xl font-body leading-relaxed mt-1">
            Tra cứu đợt tuyển sinh đang mở, xem lộ trình học phí chi tiết và đăng ký xếp lịch test đầu vào ngay dưới đây.
          </p>
        </div>
        
        {/* Search Input Box */}
        <div className="w-full md:w-80 flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-full px-4 shadow-sm">
          <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Tìm đợt tuyển sinh hoặc khóa học..."
            className="bg-transparent border-none text-xs text-slate-800 outline-none w-full placeholder-slate-400 font-body py-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ======================= TOP ROW: COMMITMENTS & TARGETS GRID ======================= */}
      <section className="relative z-10 max-w-[1200px] mx-auto px-6 mb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-body">
        {/* Commitment 1 */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden text-left hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7000FF]/15 to-transparent opacity-40"></div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="material-symbols-outlined text-[#06b6d4] text-3xl font-black mb-1">verified</span>
            <h3 className="text-slate-800 font-display font-bold text-base">Cam kết chất lượng</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cam kết đầu ra chuẩn quốc tế bằng văn bản pháp lý. Học viên được đào tạo lại hoàn toàn miễn phí 100% nếu chưa đạt kết quả.
            </p>
          </div>
        </div>

        {/* Commitment 2 */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden text-left hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0de3f2]/10 to-transparent opacity-40"></div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="material-symbols-outlined text-[#7000FF] text-3xl font-black mb-1">groups</span>
            <h3 className="text-slate-800 font-display font-bold text-base">Chỉ tiêu sĩ số nhỏ</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Lớp học giới hạn tối đa 15 học viên. Giúp giảng viên và trợ giảng có thể theo sát và sửa bài chi tiết cho từng cá nhân.
            </p>
          </div>
        </div>

        {/* Commitment 3 */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden text-left hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7000FF]/10 to-transparent opacity-40"></div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="material-symbols-outlined text-[#10b981] text-3xl font-black mb-1">calendar_today</span>
            <h3 className="text-slate-800 font-display font-bold text-base">Lịch học linh hoạt</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Học viên bận rộn dễ dàng lựa chọn lớp 3 buổi/tuần hoặc 6 buổi/tuần, phân bổ ca học Sáng/Chiều linh động trải đều các ngày.
            </p>
          </div>
        </div>

        {/* Commitment 4 */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden text-left hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e11d48]/10 to-transparent opacity-40"></div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="material-symbols-outlined text-[#e11d48] text-3xl font-black mb-1">sync</span>
            <h3 className="text-slate-800 font-display font-bold text-base">Đăng ký & Lịch test</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Thông tin đăng ký tuyển sinh của học viên được kết nối trực tiếp với phòng Học vụ để chuẩn bị đề thi thử và xếp lịch kiểm tra.
            </p>
          </div>
        </div>
      </section>

      {/* ======================= DƯỚI LÀ CÁC ĐỢT TUYỂN SINH MẪU SYLLABUS TIMELINE ======================= */}
      <main id="catalog" className="flex-grow w-full max-w-[1200px] mx-auto px-6 pb-24 z-10 relative space-y-20">
        <h2 className="text-slate-800 font-display text-xl tracking-wider uppercase font-bold text-left border-l-4 border-[#0de3f2] pl-3 mb-6">
          Danh Sách Đợt Tuyển Sinh Đang Mở
        </h2>

        {groupedList.length > 0 ? (
          groupedList.map((campaign) => (
            <div 
              key={campaign.TenDotTuyenSinh} 
              className="flex flex-col lg:flex-row gap-12 border-b border-slate-200 pb-16 relative"
            >
              {/* Left Column: Sticky Campaign info panel */}
              <aside className="w-full lg:w-1/3 relative font-display">
                <div className="lg:sticky lg:top-28 flex flex-col gap-6">
                  {/* Main campaign card */}
                  <div className="glass-panel rounded-2xl p-8 flex flex-col gap-6 shadow-2xl">
                    <div className="flex flex-col gap-3 text-left">
                      <div className="inline-flex items-center justify-center self-start px-3 py-1 rounded-full bg-[#0de3f2]/10 border border-[#0de3f2]/20 text-[#06b6d4] text-xs font-display tracking-widest uppercase font-bold">
                        Chi tiết đợt tuyển sinh
                      </div>
                      <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-slate-800">
                        {campaign.TenDotTuyenSinh}
                      </h3>
                      <p className="text-slate-500 text-xs font-body leading-relaxed">
                        Danh sách các khóa học mở đăng ký trong đợt tuyển sinh này. Vui lòng lựa chọn khóa học ở cột lộ trình bên phải để đăng ký giữ chỗ.
                      </p>
                    </div>
                    <hr className="border-slate-200 w-full" />
                    
                    {/* Time limit details */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-left font-body leading-relaxed">
                      <span className="text-[#06b6d4] font-black uppercase tracking-wider block mb-1 font-display">📅 Thời gian tuyển sinh</span>
                      Hạn đăng ký: Từ <strong className="text-slate-800">{formatDateDisplay(campaign.NgayBatDau)}</strong> đến <strong className="text-slate-800">{formatDateDisplay(campaign.NgayKetThuc)}</strong>.
                    </div>

                    {/* Meta Indicators */}
                    <div className="grid grid-cols-2 gap-3 mt-1 text-left font-body">
                      <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="material-symbols-outlined text-[#06b6d4] text-lg">calendar_month</span>
                        <span className="text-slate-700 text-[10px] font-bold block mt-0.5">Khai giảng: {formatDateDisplay(campaign.NgayKhaiGiang)}</span>
                      </div>
                      <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="material-symbols-outlined text-[#10b981] text-lg">group</span>
                        <span className="text-slate-700 text-[10px] font-bold block mt-0.5">Chỉ tiêu: {campaign.ChiTieu} học viên</span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Right Column: Timeline Courses Open */}
              <section className="w-full lg:w-2/3 relative pl-4 lg:pl-12 pt-8 text-left">
                {/* Central Timeline Vertical Line */}
                <div className="absolute left-[31px] lg:left-[63px] top-8 bottom-0 timeline-line z-0"></div>
                
                <div className="flex flex-col gap-12 relative z-10">
                  {campaign.Courses.map((c, index) => (
                    <div key={c.MaDotTuyenSinh} className="flex gap-8 relative group">
                      {/* Node dot */}
                      <div className="mt-6 w-4 h-4 rounded-full bg-[#0de3f2] flex-shrink-0 relative z-10 shadow-[0_0_10px_rgba(6,182,212,0.5)] scale-110">
                        <div className="absolute inset-[-6px] border border-[#0de3f2]/30 rounded-full animate-ping"></div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="glass-panel rounded-2xl p-6 md:p-8 flex-1 border-white/5 bg-white hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[#06b6d4] font-display text-xs tracking-wider uppercase font-bold">Khóa học {index + 1}</span>
                          <span className="material-symbols-outlined text-slate-500 group-hover:text-[#06b6d4] transition-colors text-xl font-bold">school</span>
                        </div>
                        <h4 className="font-display text-2xl font-bold text-slate-800 mb-2">{c.TenKhoaHoc}</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 py-3 border-y border-slate-100 text-xs text-slate-500 font-body">
                          <div>
                            <strong>Trình độ Target:</strong> <span className="text-slate-800 font-bold">{c.TrinhDo}</span>
                          </div>
                          <div>
                            <strong>Thời lượng:</strong> <span className="text-slate-800 font-bold">{c.SoBuoiHoc} buổi học</span>
                          </div>
                          <div>
                            <strong>Học phí toàn khóa:</strong> <span className="text-[#06b6d4] font-black">{formatCurrency(c.HocPhi)}</span>
                          </div>
                        </div>

                        <p className="text-slate-500 text-xs leading-relaxed mb-6 font-body">
                          Chương trình đào tạo Anh ngữ chuẩn đầu ra của English Zone. Học viên được trang bị đầy đủ tài liệu, luyện tập thực tế và thi thử định kỳ.
                        </p>

                        <button 
                          onClick={() => handleOpenRegModal(c)}
                          className="bg-[#0de3f2]/10 hover:bg-[#0de3f2] border border-[#0de3f2]/30 text-[#06b6d4] hover:text-slate-950 font-bold py-2.5 px-6 rounded-full transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider font-display"
                        >
                          <span>Đăng ký học khóa này</span>
                          <span className="material-symbols-outlined text-xs font-black">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ))
        ) : (
          <div className="glass-panel rounded-[24px] p-8 text-center text-slate-400 font-display">
            {loading ? 'Đang tải danh sách tuyển sinh...' : 'Không tìm thấy đợt tuyển sinh hoạt động nào.'}
          </div>
        )}
      </main>

      {/* ======================= REGISTRATION ENROLLMENT PORTAL MODAL ======================= */}
      {isRegModalOpen && selectedCourse && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-hidden">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-0" onClick={() => setIsRegModalOpen(false)}></div>
          
          {/* Form Modal Container */}
          <main className="relative z-10 w-full max-w-[800px] mx-auto animate-orb-float">
            <div className="bg-white backdrop-blur-2xl border border-slate-200 rounded-[24px] overflow-hidden shadow-2xl relative flex flex-col">
              {/* Top progress glow line */}
              <div className="w-full h-[2px] bg-slate-200 absolute top-0 left-0">
                <div className="h-full bg-[#0de3f2]" style={{ width: '100%', boxShadow: '0 0 8px #06b6d4' }}></div>
              </div>

              <div className="p-6 md:p-10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="mb-6 text-center">
                  <p className="text-[#06b6d4] text-xs font-bold tracking-widest uppercase mb-1 font-display">Step 1 of 2: Personal Details</p>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-1.5 font-display">Enrollment Portal</h1>
                  <p className="text-slate-500 text-xs font-body">Đăng ký giữ chỗ và xếp lịch kiểm tra xếp lớp tại trung tâm cho khóa học: **{selectedCourse.TenKhoaHoc}**.</p>
                </div>

                {regError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4 text-center">
                    {regError}
                  </div>
                )}
                {regSuccess && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-2.5 rounded-xl text-xs font-semibold mb-4 text-center">
                    {regSuccess}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleRegSubmit} className="space-y-4 font-body text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="input-group">
                      <input 
                        className="spatial-input font-bold" 
                        id="regName" 
                        placeholder=" " 
                        value={regHoTen} 
                        onChange={(e) => setRegHoTen(e.target.value)}
                        required 
                        type="text"
                      />
                      <label className="spatial-label" htmlFor="regName">Họ và tên học viên *</label>
                    </div>

                    {/* Phone Number */}
                    <div className="input-group">
                      <input 
                        className="spatial-input font-bold" 
                        id="regPhone" 
                        placeholder=" " 
                        value={regSoDienThoai} 
                        onChange={(e) => setRegSoDienThoai(e.target.value)}
                        required 
                        type="text"
                      />
                      <label className="spatial-label" htmlFor="regPhone">Số điện thoại *</label>
                    </div>

                    {/* Email */}
                    <div className="input-group">
                      <input 
                        className="spatial-input font-bold" 
                        id="regEmail" 
                        placeholder=" " 
                        value={regEmail} 
                        onChange={(e) => setRegEmail(e.target.value)}
                        required 
                        type="email"
                      />
                      <label className="spatial-label" htmlFor="regEmail">Email liên hệ *</label>
                    </div>

                    {/* Date of birth */}
                    <div className="input-group">
                      <input 
                        className="spatial-input font-bold" 
                        id="regDob" 
                        placeholder=" " 
                        value={regNgaySinh} 
                        onChange={(e) => setRegNgaySinh(e.target.value)}
                        required 
                        type="date"
                      />
                      <label className="spatial-label" htmlFor="regDob">Ngày sinh *</label>
                    </div>

                    {/* Gender Selection */}
                    <div className="input-group">
                      <select 
                        className="spatial-input spatial-select font-bold text-slate-800 bg-white" 
                        id="regGender" 
                        value={regGioiTinh}
                        onChange={(e) => setRegGioiTinh(Number(e.target.value))}
                        required
                      >
                        <option value={1}>Nam</option>
                        <option value={0}>Nữ</option>
                      </select>
                      <label className="spatial-label" htmlFor="regGender">Giới tính *</label>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-base">expand_more</span>
                    </div>

                    {/* Target round (Disabled & auto-selected) */}
                    <div className="input-group">
                      <input 
                        className="spatial-input font-bold opacity-75" 
                        id="regRoundName" 
                        value={`${selectedCourse.TenDotTuyenSinh} - [${selectedCourse.TenKhoaHoc}]`} 
                        disabled
                        type="text"
                      />
                      <label className="spatial-label" htmlFor="regRoundName">Đợt tuyển sinh đăng ký</label>
                    </div>

                    {/* Address */}
                    <div className="input-group md:col-span-2">
                      <input 
                        className="spatial-input font-bold" 
                        id="regAddress" 
                        placeholder=" " 
                        value={regDiaChi} 
                        onChange={(e) => setRegDiaChi(e.target.value)}
                        type="text"
                      />
                      <label className="spatial-label" htmlFor="regAddress">Địa chỉ thường trú</label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button 
                      className="text-slate-500 hover:text-white transition-colors text-xs font-semibold" 
                      type="button"
                      onClick={() => setIsRegModalOpen(false)}
                    >
                      Hủy bỏ đơn đăng ký
                    </button>
                    <button 
                      className="w-full sm:w-auto px-8 py-3.5 bg-[#0de3f2] text-slate-955 rounded-full font-bold hover:bg-[#0891b2] transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer" 
                      id="submitBtn" 
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <div className="loader"></div>
                      ) : (
                        <>
                          <span className="tracking-wide text-xs uppercase font-black">Xác nhận Đăng ký</span>
                          <span className="material-symbols-outlined text-base font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-md w-full py-12 mt-20 relative z-10 font-body">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col space-y-4">
            <span className="text-xl font-extrabold text-[#06b6d4] tracking-tight font-display">TT English Zone</span>
            <p className="text-slate-500 text-xs leading-relaxed">
              Hệ thống đào tạo Anh ngữ chuẩn quốc tế. Trải nghiệm không gian học tập tối ưu và ca học linh động cho học viên toàn cầu.
            </p>
          </div>
          
          <div className="flex flex-col space-y-2 text-left">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 font-display">Khóa học tuyển sinh</h4>
            <span className="text-slate-500 text-xs text-left">Tiếng Anh Giao Tiếp Cơ Bản</span>
            <span className="text-slate-500 text-xs text-left">Luyện thi IELTS Foundation / Intensive</span>
            <span className="text-slate-500 text-xs text-left">Luyện thi TOEIC Accelerated 650+</span>
          </div>
          
          <div className="flex flex-col space-y-2 text-left">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 font-display">Cam kết chất lượng</h4>
            <span className="text-slate-500 text-xs text-left">Cam kết chuẩn đầu ra văn bản</span>
            <span className="text-slate-500 text-xs text-left">Giảng viên trình độ chuyên môn cao</span>
            <span className="text-slate-500 text-xs text-left">Đào tạo lại hoàn toàn miễn phí</span>
          </div>
          
          <div className="flex flex-col space-y-2 text-left">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 font-display">Thông tin liên hệ</h4>
            <span className="text-slate-500 text-xs text-left">Địa chỉ: Cổng trường English Zone</span>
            <span className="text-slate-500 text-xs text-left">Điện thoại hỗ trợ học viên</span>
            <span className="text-slate-500 text-xs text-left">Email: support@englishzone.edu.vn</span>
          </div>
        </div>
        
        <div className="max-w-[1200px] mx-auto px-6 mt-10 pt-6 border-t border-slate-100 text-center">
          <p className="text-gray-500 text-xs font-semibold">
            © 2026 TT English Zone. Đồng hành cùng tri thức toàn cầu.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;