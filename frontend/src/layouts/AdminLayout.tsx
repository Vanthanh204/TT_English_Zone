import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const hasRole = (allowedRoles: string[]) => {
    return user && allowedRoles.includes(user.role);
  };

  const handleLinkClick = () => {
    setIsMobileOpen(false);
  };

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `block p-2.5 rounded text-sm font-semibold transition-all ${
      isActive 
        ? 'bg-gray-800 text-blue-400 font-bold border-l-4 border-blue-500 pl-3 shadow-md'
        : 'text-gray-300 hover:bg-gray-800 hover:text-white pl-3'
    }`;
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">TT English Zone</h2>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Hệ thống quản lý</p>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
        
        {user && (
          <div className="bg-gray-800 p-3 rounded-lg mb-6 border border-gray-700">
            <p className="text-sm font-semibold truncate">{user.full_name}</p>
            <p className="text-xs text-blue-400 font-medium">{user.role}</p>
          </div>
        )}

        <nav>
          <ul className="space-y-2">
            <li>
              <Link to="/admin-cp" onClick={handleLinkClick} className={getLinkClass('/admin-cp')}>
                Tổng quan
              </Link>
            </li>
            
            {hasRole(['Quản lý']) && (
              <li>
                <Link to="/admin-cp/courses" onClick={handleLinkClick} className={getLinkClass('/admin-cp/courses')}>
                  Quản lý Khóa học
                </Link>
              </li>
            )}
            
            {hasRole(['Quản lý']) && (
              <li>
                <Link to="/admin-cp/enrollments" onClick={handleLinkClick} className={getLinkClass('/admin-cp/enrollments')}>
                  Quản lý Đợt tuyển sinh
                </Link>
              </li>
            )}
            
            {hasRole(['Quản lý', 'Tư vấn']) && (
              <li>
                <Link to="/admin-cp/leads" onClick={handleLinkClick} className={getLinkClass('/admin-cp/leads')}>
                  Quản lý Khách hàng
                </Link>
              </li>
            )}
            
            {hasRole(['Quản lý', 'Giáo viên', 'Học vụ']) && (
              <li>
                <Link to="/admin-cp/classes" onClick={handleLinkClick} className={getLinkClass('/admin-cp/classes')}>
                  Quản lý Lớp học
                </Link>
              </li>
            )}
            
            {hasRole(['Quản lý', 'Giáo viên', 'Học vụ']) && (
              <li>
                <Link to="/admin-cp/schedules" onClick={handleLinkClick} className={getLinkClass('/admin-cp/schedules')}>
                  Lịch học & Điểm danh
                </Link>
              </li>
            )}
            
            {hasRole(['Quản lý', 'Học vụ', 'Kế toán']) && (
              <li>
                <Link to="/admin-cp/payments" onClick={handleLinkClick} className={getLinkClass('/admin-cp/payments')}>
                  Học phí & Kế toán
                </Link>
              </li>
            )}
            
            {hasRole(['Quản lý']) && (
              <li>
                <Link to="/admin-cp/teachers" onClick={handleLinkClick} className={getLinkClass('/admin-cp/teachers')}>
                  Quản lý Nhân sự
                </Link>
              </li>
            )}
            
            {hasRole(['Quản lý', 'Tư vấn', 'Học vụ']) && (
              <li>
                <Link to="/admin-cp/students" onClick={handleLinkClick} className={getLinkClass('/admin-cp/students')}>
                  Quản lý Học viên
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
      
      <button 
        onClick={handleLogout} 
        className="bg-red-600 hover:bg-red-700 text-white font-semibold p-2.5 rounded-lg mt-4 transition duration-200 text-sm cursor-pointer"
      >
        Đăng xuất
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* 1. Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-900 text-white p-4 hidden md:flex flex-col justify-between">
        <SidebarContent />
      </aside>

      {/* 2. Mobile Sidebar Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 3. Mobile Slide-out Drawer Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white p-4 flex flex-col justify-between z-40 transition-transform duration-300 transform md:hidden ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </aside>

      {/* 4. Main content container */}
      <main className="flex-grow min-w-0 bg-gray-100 p-4 md:p-8 flex flex-col">
        {/* Mobile Header Bar */}
        <header className="flex md:hidden items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-xs mb-4">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="material-symbols-outlined text-2xl flex items-center justify-center">menu</span>
          </button>
          <span className="text-sm font-bold text-gray-800">TT English Zone</span>
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-100">
            {user?.role?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
        </header>

        <div className="flex-grow">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
