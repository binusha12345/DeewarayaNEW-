import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineMail, 
  HiOutlineLockClosed, 
  HiOutlineEye, 
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineExclamationCircle,
  HiOutlineUser
} from 'react-icons/hi';
import { FaAnchor } from 'react-icons/fa';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE}/admin/login`,
        formData
      );

      if (response.data.success) {
        adminLogin({                    // CHANGED: login → adminLogin
          token: response.data.token,
          user: response.data.user
        });
        navigate('/dw-admin/dashboard');

      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      ></div>

      {/* LEFT SIDE - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-8 xl:p-12">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group w-fit">
          <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
            <FaAnchor className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Deewaraya</h1>
            <p className="text-[10px] text-blue-300 tracking-widest uppercase">Admin Portal</p>
          </div>
        </Link>

        {/* Animated SVG Illustration */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-md">
            
            {/* Floating decoration circles */}
            <div className="absolute top-0 right-10 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl animate-float"></div>
            <div className="absolute bottom-10 left-0 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-float-delayed"></div>
            
            {/* Main SVG Illustration */}
            <svg viewBox="0 0 500 500" className="w-full h-auto drop-shadow-2xl">
              
              {/* Desk */}
              <ellipse cx="250" cy="420" rx="180" ry="15" fill="#1e293b" opacity="0.5"/>
              <rect x="100" y="380" width="300" height="40" rx="5" fill="#334155"/>
              <rect x="100" y="380" width="300" height="8" fill="#475569"/>
              
              {/* Chair back */}
              <rect x="220" y="280" width="60" height="120" rx="10" fill="#0ea5e9"/>
              <rect x="225" y="285" width="50" height="100" rx="8" fill="#38bdf8"/>
              
              {/* Body */}
              <path d="M 200 320 Q 200 280 250 280 Q 300 280 300 320 L 300 380 L 200 380 Z" fill="#0284c7"/>
              
              {/* Arms */}
              <rect x="180" y="320" width="25" height="60" rx="10" fill="#0ea5e9" className="animate-type-left" style={{transformOrigin: '192px 325px'}}/>
              <rect x="295" y="320" width="25" height="60" rx="10" fill="#0ea5e9" className="animate-type-right" style={{transformOrigin: '308px 325px'}}/>
              
              {/* Hands */}
              <circle cx="192" cy="378" r="10" fill="#fbbf24" className="animate-type-left" style={{transformOrigin: '192px 325px'}}/>
              <circle cx="308" cy="378" r="10" fill="#fbbf24" className="animate-type-right" style={{transformOrigin: '308px 325px'}}/>
              
              {/* Neck */}
              <rect x="240" y="245" width="20" height="40" fill="#fbbf24"/>
              
              {/* Head */}
              <circle cx="250" cy="220" r="45" fill="#fbbf24"/>
              
              {/* Hair */}
              <path d="M 210 210 Q 210 175 250 170 Q 290 175 290 210 L 290 195 Q 285 180 250 178 Q 215 180 210 195 Z" fill="#1e293b"/>
              <path d="M 215 200 Q 220 185 240 180 L 245 195 Q 230 200 220 210 Z" fill="#1e293b"/>
              
              {/* Face - Eyes (closed - focused) */}
              <path d="M 230 220 Q 235 218 240 220" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M 260 220 Q 265 218 270 220" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round"/>
              
              {/* Glasses */}
              <circle cx="235" cy="220" r="10" fill="none" stroke="#1e293b" strokeWidth="2"/>
              <circle cx="265" cy="220" r="10" fill="none" stroke="#1e293b" strokeWidth="2"/>
              <line x1="245" y1="220" x2="255" y2="220" stroke="#1e293b" strokeWidth="2"/>
              
              {/* Mouth - slight smile */}
              <path d="M 240 240 Q 250 245 260 240" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round"/>
              
              {/* Ears */}
              <circle cx="207" cy="222" r="6" fill="#fbbf24"/>
              <circle cx="293" cy="222" r="6" fill="#fbbf24"/>
              
              {/* Laptop base */}
              <path d="M 160 380 L 340 380 L 355 395 L 145 395 Z" fill="#64748b"/>
              <rect x="150" y="393" width="200" height="5" rx="2" fill="#475569"/>
              
              {/* Laptop screen */}
              <rect x="170" y="320" width="160" height="65" rx="4" fill="#1e293b"/>
              <rect x="175" y="325" width="150" height="55" rx="2" fill="#0f172a"/>
              
              {/* Screen content - code lines */}
              <rect x="182" y="332" width="30" height="3" rx="1" fill="#0ea5e9" className="animate-blink"/>
              <rect x="182" y="340" width="50" height="3" rx="1" fill="#22d3ee"/>
              <rect x="182" y="348" width="40" height="3" rx="1" fill="#0ea5e9"/>
              <rect x="182" y="356" width="60" height="3" rx="1" fill="#22d3ee"/>
              <rect x="182" y="364" width="35" height="3" rx="1" fill="#0ea5e9"/>
              <rect x="182" y="372" width="45" height="3" rx="1" fill="#22d3ee" className="animate-blink"/>
              
              {/* Screen glow */}
              <rect x="175" y="325" width="150" height="55" rx="2" fill="url(#screenGlow)" opacity="0.3"/>
              
              {/* Coffee cup */}
              <rect x="380" y="360" width="25" height="30" rx="3" fill="#fff"/>
              <rect x="380" y="360" width="25" height="8" fill="#78350f"/>
              <path d="M 405 368 Q 415 370 415 378 Q 415 385 405 385" stroke="#fff" strokeWidth="2" fill="none"/>
              {/* Steam */}
              <path d="M 388 355 Q 386 350 388 345" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.6" className="animate-steam"/>
              <path d="M 395 355 Q 397 350 395 345" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.6" className="animate-steam" style={{animationDelay: '0.5s'}}/>
              
              {/* Plant */}
              <rect x="85" y="360" width="20" height="25" rx="2" fill="#78350f"/>
              <ellipse cx="95" cy="358" rx="15" ry="12" fill="#10b981"/>
              <ellipse cx="88" cy="352" rx="6" ry="10" fill="#059669" transform="rotate(-20 88 352)"/>
              <ellipse cx="102" cy="352" rx="6" ry="10" fill="#059669" transform="rotate(20 102 352)"/>
              
              {/* Floating notification badges */}
              <g className="animate-float">
                <circle cx="120" cy="180" r="20" fill="#0ea5e9" opacity="0.9"/>
                <path d="M 112 180 L 118 186 L 128 174" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </g>
              
              <g className="animate-float-delayed">
                <circle cx="400" cy="200" r="18" fill="#22d3ee" opacity="0.9"/>
                <text x="400" y="207" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">!</text>
              </g>
              
              <g className="animate-float" style={{animationDelay: '1.5s'}}>
                <circle cx="410" cy="290" r="16" fill="#0284c7" opacity="0.9"/>
                <path d="M 402 290 L 408 296 L 418 284" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </g>
              
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="screenGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee"/>
                  <stop offset="100%" stopColor="transparent"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center">
          <h2 className="text-2xl xl:text-3xl font-bold text-white mb-2">
            Welcome to <span className="bg-gradient-to-r from-cyan-300 to-sky-400 bg-clip-text text-transparent">Deewaraya Admin</span>
          </h2>
          <p className="text-blue-200/70 text-sm">
            Manage your smart fishing fleet with confidence 🌊
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 relative z-10">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaAnchor className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Deewaraya</h1>
                <p className="text-[10px] text-blue-300 tracking-widest uppercase">Admin Portal</p>
              </div>
            </Link>
          </div>

          {/* Login Card */}
          <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8">
            
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 mb-3">
                <HiOutlineShieldCheck className="text-white text-xl" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Admin Sign In
              </h2>
              <p className="text-blue-200/70 text-sm">
                Enter your credentials to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-blue-100 mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/70 text-lg group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@deewaraya.com"
                    required
                    autoComplete="off"    
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-blue-200/40 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-blue-100 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/70 text-lg group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="off"
                    className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-blue-200/40 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/70 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <HiOutlineEyeOff className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl animate-shake">
                  <HiOutlineExclamationCircle className="text-red-400 text-lg flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-xs font-medium">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transform hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In to Dashboard
                      <HiOutlineArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] text-blue-200/50 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* User Login */}
            <Link 
              to="/login" 
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-blue-100 text-sm font-medium rounded-xl transition-all"
            >
              <HiOutlineUser />
              Sign in as User
            </Link>

            {/* Back to Home */}
            <div className="mt-4 text-center">
              <Link 
                to="/" 
                className="inline-flex items-center gap-1.5 text-xs text-blue-200/70 hover:text-cyan-400 transition-colors"
              >
                <HiOutlineArrowLeft />
                Back to Home
              </Link>
            </div>
          </div>

          {/* Security Note */}
          <p className="text-center text-[11px] text-blue-300/50 mt-4 flex items-center justify-center gap-1.5">
            <HiOutlineShieldCheck />
            Protected by enterprise-grade security
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-float-delayed { animation: float 3s ease-in-out infinite; animation-delay: 1.5s; }
        
        @keyframes typeLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }
        .animate-type-left { animation: typeLeft 0.6s ease-in-out infinite; }
        
        @keyframes typeRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
        .animate-type-right { animation: typeRight 0.6s ease-in-out infinite; animation-delay: 0.3s; }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-blink { animation: blink 1s ease-in-out infinite; }
        
        @keyframes steam {
          0% { opacity: 0.6; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-steam { animation: steam 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default AdminLogin;