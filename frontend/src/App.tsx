import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';

import ManageTeachers from './pages/ManageTeachers';
import ManageStudents from './pages/ManageStudents';
import ManageCourses from './pages/ManageCourses';
import ManageEnrollments from './pages/ManageEnrollments';
import ManageLeads from './pages/ManageLeads';
import ManageClasses from './pages/ManageClasses';
import Dashboard from './pages/Dashboard';
import ManageSchedules from './pages/ManageSchedules';
import ManagePayments from './pages/ManagePayments';
import { AuthProvider } from './components/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
          </Route>

          {/* Admin Login Route */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* Admin Protected Routes */}
          <Route 
            path="/admin-cp" 
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route 
              path="courses" 
              element={
                <ProtectedRoute allowedRoles={['Quản lý']}>
                  <ManageCourses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="enrollments" 
              element={
                <ProtectedRoute allowedRoles={['Quản lý']}>
                  <ManageEnrollments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="leads" 
              element={
                <ProtectedRoute allowedRoles={['Quản lý', 'Tư vấn']}>
                  <ManageLeads />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="classes" 
              element={
                <ProtectedRoute allowedRoles={['Quản lý', 'Giáo viên', 'Học vụ']}>
                  <ManageClasses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="schedules" 
              element={
                <ProtectedRoute allowedRoles={['Quản lý', 'Giáo viên', 'Học vụ']}>
                  <ManageSchedules />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="payments" 
              element={
                <ProtectedRoute allowedRoles={['Quản lý', 'Học vụ']}>
                  <ManagePayments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="teachers" 
              element={
                <ProtectedRoute allowedRoles={['Quản lý']}>
                  <ManageTeachers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="students" 
              element={
                <ProtectedRoute allowedRoles={['Quản lý', 'Tư vấn', 'Học vụ']}>
                  <ManageStudents />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
