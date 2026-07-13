import React, { useState } from 'react';
import API_BASE_URL from '../config/api';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
      
      const { role } = response.data.user;
      const validRoles = ['Quản lý', 'Giáo viên', 'Tư vấn', 'Học vụ', 'Kế toán'];
      
      if (!validRoles.includes(role)) {
        setError('Truy cập bị từ chối. Tài khoản học viên không được phép đăng nhập cổng quản trị.');
        setLoading(false);
        return;
      }

      login(response.data.token, response.data.user);
      navigate('/admin-cp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#060814] font-sans antialiased text-white p-4">
      {/* CSS Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        .font-display {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .font-body {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
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
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1.25rem 1rem 0.5rem 1rem;
          color: white;
          transition: all 0.2s ease;
          outline: none;
        }

        .spatial-input:focus {
          border-color: #f43f5e;
          box-shadow: inset 0 0 10px rgba(244, 63, 94, 0.1), 0 0 15px rgba(244, 63, 94, 0.25);
          background-color: rgba(255, 255, 255, 0.07);
        }

        .spatial-label {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #8295BA;
          pointer-events: none;
          transition: all 0.2s ease;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .spatial-input:focus + .spatial-label,
        .spatial-input:not(:placeholder-shown) + .spatial-label {
          top: 0.55rem;
          transform: translateY(0);
          font-size: 0.72rem;
          color: #f43f5e;
        }

        .loader {
          border: 2px solid rgba(244, 63, 94, 0.2);
          border-top: 2px solid #f43f5e;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }
      `}</style>

      {/* Ambient Orbs */}
      <div className="ambient-orb bg-[#4c0519] w-[35rem] h-[35rem] -top-[10%] -right-[10%] animate-orb-float"></div>
      <div className="ambient-orb bg-[#f43f5e] w-[25rem] h-[25rem] -bottom-[10%] -left-[5%] opacity-15 animate-orb-float" style={{ animationDelay: '3s' }}></div>

      {/* Minimal Header with Back Button */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-[#8295BA] hover:text-white transition-colors duration-200 group font-display text-xs tracking-wider uppercase font-bold">
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Quay lại Trang chủ
        </Link>
        
        <div className="glass-card px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
          <span className="w-2 h-2 rounded-full bg-[#f43f5e] animate-pulse"></span>
          <span className="font-display text-[10px] tracking-[0.1em] uppercase text-[#8295BA] font-extrabold">ADMIN PORTAL</span>
        </div>
      </div>

      {/* Modal Card */}
      <main className="relative z-10 w-full max-w-[500px] mx-auto">
        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl relative flex flex-col p-8 md:p-10">
          {/* Progress Glow Line */}
          <div className="w-full h-[2px] bg-white/10 absolute top-0 left-0">
            <div className="h-full bg-[#f43f5e]" style={{ width: '100%', boxShadow: '0 0 10px #f43f5e' }}></div>
          </div>

          {/* Header */}
          <div className="mb-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-white/5 text-[#f43f5e] rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(244,63,94,0.15)] mb-3">
              <span className="material-symbols-outlined text-2xl font-black">admin_panel_settings</span>
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-1.5">Cổng Quản Trị</h1>
            <p className="text-[#8295BA] text-xs font-body max-w-xs leading-relaxed">
              Dành riêng cho Quản lý, Giáo viên và Nhân viên vận hành trung tâm.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-xs font-semibold mb-6 animate-fade-in leading-relaxed text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 font-body">
            {/* Username Input */}
            <div className="input-group">
              <input 
                className="spatial-input font-bold" 
                id="username" 
                placeholder=" " 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label className="spatial-label" htmlFor="username">Tên đăng nhập / Email Admin</label>
            </div>

            {/* Password Input */}
            <div className="input-group">
              <input 
                className="spatial-input font-bold pr-12" 
                id="password" 
                placeholder=" " 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label className="spatial-label" htmlFor="password">Mật khẩu hệ thống</label>
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8295BA] hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/5 flex justify-center mt-6">
              <button 
                className="w-full sm:w-auto px-8 py-3.5 bg-[#f43f5e] hover:bg-[#e11d48] text-white rounded-full font-bold shadow-[0_0_15px_rgba(244,63,94,0.2)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 cursor-pointer" 
                id="submitBtn" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="loader"></div>
                ) : (
                  <>
                    <span className="tracking-wide text-xs uppercase font-black">Đăng nhập Hệ thống</span>
                    <span className="material-symbols-outlined text-base font-black">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;