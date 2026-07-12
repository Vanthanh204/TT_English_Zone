import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Ví dụ: ['Quản lý', 'Giáo viên', 'Tư vấn', 'Học vụ', 'Kế toán']
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Chưa đăng nhập thì chuyển hướng về trang đăng nhập admin
    return <Navigate to="/admin" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Đã đăng nhập nhưng không có vai trò phù hợp
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Truy Cập Bị Từ Chối</h2>
          <p className="text-gray-600 mb-6">
            Tài khoản của bạn ({user.full_name}) có vai trò là <strong>{user.role}</strong>, không được phép truy cập chức năng này.
          </p>
          <button 
            onClick={() => window.history.back()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition duration-200"
          >
            Quay lại trang trước
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
