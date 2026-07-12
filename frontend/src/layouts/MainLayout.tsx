import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const isSpatialPage = location.pathname === '/' || location.pathname === '/login';
  if (isSpatialPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e] font-sans">
      {/* Header */}
      {/* Modern Top Gradient Accent Line */}
      <div className="h-[4px] bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 w-full sticky top-0 z-50"></div>

      {/* Header */}
      <header className={`sticky top-[4px] w-full z-50 transition-all duration-300 h-20 bg-white/90 backdrop-blur-md border-b border-gray-200/80 ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <nav className="max-w-[1200px] mx-auto px-6 flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-black text-[#0040a1] tracking-tight hover:opacity-90 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-blue-600">domain</span>
              TT English Zone
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <button onClick={() => scrollToSection('courses')} className="text-[#0040a1] bg-blue-50/80 px-4 py-2 rounded-full font-bold hover:bg-blue-100 hover:text-[#0056d2] transition-all text-sm cursor-pointer">
              Khóa học
            </button>
            <button onClick={() => scrollToSection('about')} className="text-gray-600 hover:text-[#0040a1] px-4 py-2 rounded-full hover:bg-gray-100/70 transition-all font-semibold text-sm cursor-pointer">
              Về chúng tôi
            </button>
            <button onClick={() => scrollToSection('faculty')} className="text-gray-600 hover:text-[#0040a1] px-4 py-2 rounded-full hover:bg-gray-100/70 transition-all font-semibold text-sm cursor-pointer">
              Giảng viên
            </button>
            <button onClick={() => scrollToSection('schedule')} className="text-gray-600 hover:text-[#0040a1] px-4 py-2 rounded-full hover:bg-gray-100/70 transition-all font-semibold text-sm cursor-pointer">
              Ý kiến học viên
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/admin')} 
              className="hidden md:flex items-center px-4 py-2 text-[#0040a1] font-bold hover:bg-blue-50 hover:text-[#0056d2] rounded-full active:scale-95 transition-all text-sm cursor-pointer"
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => scrollToSection('cta')}
              className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-5 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md hover:from-blue-800 hover:to-indigo-900 transition-all active:scale-95 text-sm cursor-pointer"
            >
              Đăng ký ngay
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </nav>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex flex-col space-y-3 shadow-lg absolute left-0 right-0 top-20 z-40">
            <button onClick={() => scrollToSection('courses')} className="text-left py-2 font-semibold text-gray-700 hover:text-[#0040a1]">
              Khóa học
            </button>
            <button onClick={() => scrollToSection('about')} className="text-left py-2 font-semibold text-gray-700 hover:text-[#0040a1]">
              Về chúng tôi
            </button>
            <button onClick={() => scrollToSection('faculty')} className="text-left py-2 font-semibold text-gray-700 hover:text-[#0040a1]">
              Giảng viên
            </button>
            <button onClick={() => scrollToSection('schedule')} className="text-left py-2 font-semibold text-gray-700 hover:text-[#0040a1]">
              Ý kiến học viên
            </button>
            <button 
              onClick={() => { setIsMenuOpen(false); navigate('/admin'); }} 
              className="text-left py-2 font-bold text-[#0040a1] border-t border-gray-100 pt-3"
            >
              Đăng nhập hệ thống
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 w-full py-12">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col space-y-4">
            <span className="text-2xl font-extrabold text-[#0040a1] tracking-tight">TT English Zone</span>
            <p className="text-gray-600 text-sm">
              Cung cấp chương trình đào tạo tiếng Anh chuẩn quốc tế từ năm 2025. Chất lượng vượt trội cho thế hệ trẻ toàn cầu.
            </p>
            <div className="flex space-x-3 mt-2">
              <a className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-[#0040a1] hover:bg-[#0040a1] hover:text-white transition-all" href="#">
                <span className="material-symbols-outlined text-lg">public</span>
              </a>
              <a className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-[#0040a1] hover:bg-[#0040a1] hover:text-white transition-all" href="#">
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
              <a className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-[#0040a1] hover:bg-[#0040a1] hover:text-white transition-all" href="#">
                <span className="material-symbols-outlined text-lg">call</span>
              </a>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <h4 className="font-bold text-gray-800 mb-2">Các khóa học</h4>
            <button onClick={() => scrollToSection('courses')} className="text-left text-gray-600 hover:text-[#0040a1] transition-all">Tiếng Anh Giao Tiếp</button>
            <button onClick={() => scrollToSection('courses')} className="text-left text-gray-600 hover:text-[#0040a1] transition-all">Luyện thi IELTS</button>
            <button onClick={() => scrollToSection('courses')} className="text-left text-gray-600 hover:text-[#0040a1] transition-all">Luyện thi TOEIC</button>
            <button onClick={() => scrollToSection('courses')} className="text-left text-gray-600 hover:text-[#0040a1] transition-all">Tiếng Anh Mất Gốc</button>
          </div>
          
          <div className="flex flex-col space-y-2">
            <h4 className="font-bold text-gray-800 mb-2">Thông tin</h4>
            <button onClick={() => scrollToSection('about')} className="text-left text-gray-600 hover:text-[#0040a1] transition-all">Câu chuyện của chúng tôi</button>
            <button onClick={() => scrollToSection('faculty')} className="text-left text-gray-600 hover:text-[#0040a1] transition-all">Đội ngũ giáo viên</button>
            <button onClick={() => scrollToSection('about')} className="text-left text-gray-600 hover:text-[#0040a1] transition-all">Cơ sở vật chất</button>
          </div>
          
          <div className="flex flex-col space-y-2">
            <h4 className="font-bold text-gray-800 mb-2">Hỗ trợ</h4>
            <a className="text-gray-600 hover:text-[#0040a1] transition-all" href="#">Liên hệ tư vấn</a>
            <a className="text-gray-600 hover:text-[#0040a1] transition-all" href="#">Điều khoản sử dụng</a>
            <a className="text-gray-600 hover:text-[#0040a1] transition-all" href="#">Chính sách bảo mật</a>
          </div>
        </div>
        
        <div className="max-w-[1200px] mx-auto px-6 mt-12 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            © 2026 TT English Zone. Đồng hành cùng tri thức toàn cầu.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
