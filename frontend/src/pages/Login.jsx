import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { Eye, EyeOff, RefreshCw, ShieldCheck, Activity, Users, Lock } from 'lucide-react';
import heroImage from '../assets/hero.jpg';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const { triggerToast } = useContext(NotificationContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Layout States (NLP Marine UI)
  const [activeTab, setActiveTab] = useState('Exim Trade');
  const [captchaNum1, setCaptchaNum1] = useState(1);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 9) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  useEffect(() => {
    if (location.search.includes('expired=true')) {
      triggerToast('Session Expired', 'Your connection expired. Please authenticate again.', 'error');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      triggerToast('Missing Fields', 'Please enter both Email Address and Password.', 'error');
      return;
    }

    const isCaptchaCorrect = parseInt(captchaAnswer) === (captchaNum1 + captchaNum2);
    if (!isCaptchaCorrect) {
      triggerToast('Captcha Failed', 'Please enter the correct sum for the captcha.', 'error');
      generateCaptcha();
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      triggerToast('Access Authorized', `Welcome back, ${username}!`, 'success');
      navigate(from, { replace: true });
    } else {
      triggerToast('Login Failed', result.error, 'error');
      generateCaptcha();
    }
  };

  const handleRoleAutofill = (roleName, u, p) => {
    setUsername(u);
    setPassword(p);
    setCaptchaAnswer('');
    triggerToast('Credentials Loaded', `Loaded credentials for ${roleName}. Please enter captcha to log in.`, 'info');
  };

  const testAccounts = [
    { label: 'Shipping Agent', u: 'shipping', p: 'password123', role: 'Shipping Agent' },
    { label: 'Operations', u: 'ops', p: 'password123', role: 'Operations & Warehouse' },
    { label: 'Customs', u: 'customs', p: 'password123', role: 'Customs' },
    { label: 'Finance', u: 'finance', p: 'password123', role: 'Finance' },
    { label: 'Super Admin', u: 'admin', p: 'password123', role: 'Super Admin' }
  ];

  const dynamicContent = {
    'Exim Trade': {
      title: 'Login as a Customer',
      subtext: 'Importer, Exporter, CHA'
    },
    'Service Provider': {
      title: 'Login as a Service Provider',
      subtext: 'Terminal Operations, Stevedores, Shipping Lines'
    },
    'Regulatory Body': {
      title: 'Login as a Regulatory Body',
      subtext: 'Customs Officers, Port Security, Health Authorities'
    },
    'Custodian': {
      title: 'Login as a Custodian',
      subtext: 'Port Authority, Warehouse Managers, Terminal Operators'
    }
  };

  return (
    <div className="min-h-screen w-full bg-white grid grid-cols-1 md:grid-cols-12 font-sans overflow-x-hidden select-none">
      
      {/* Left 50%: Hero Container Banner */}
      <div 
        className="md:col-span-6 relative p-8 md:p-12 lg:p-14 flex flex-col justify-between text-white bg-cover bg-center min-h-[500px] md:min-h-screen shadow-2xl overflow-hidden select-none"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Deep Ocean Blue Vignette Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0284c7]/85 via-[#0284c7]/65 to-slate-950/85 z-0"></div>

        {/* Top Header: Brand Title */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-yellow-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase font-sans drop-shadow-md">
              Port Inventory Management System
            </h2>
            <p className="text-xs text-sky-200 font-semibold tracking-wide uppercase mt-0.5">
              National Logistics Portal (Marine)
            </p>
          </div>
        </div>

        {/* Hero Middle: Positioned Higher Up Under Logo */}
        <div className="relative z-10 mt-6 sm:mt-8 md:mt-10 mb-auto py-4 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight drop-shadow-xl font-sans">
            <span className="text-white block">Efficient Port</span>
            <span className="text-yellow-400 block mt-1.5">Inventory Management</span>
            <span className="text-white block mt-1.5">for Seamless Operations</span>
          </h1>
        </div>

        {/* Bottom Security Pill Badge matching reference image */}
        <div className="relative z-10 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-xl text-xs font-bold text-white/90 shadow-lg">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Authorized Network Access Only &bull; National Logistics Portal (Marine)</span>
          </div>
        </div>
      </div>

      {/* Right 50%: Flat Formal Form Area */}
      <div className="md:col-span-6 p-8 sm:p-12 md:p-14 lg:p-16 flex flex-col justify-between bg-white text-slate-800 relative min-h-screen overflow-y-auto">
        
        <div className="my-auto py-4 space-y-8">
          {/* Top Header */}
          <div className="pb-3 border-b-2 border-slate-200">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Login</h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username / Email Address Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Username or Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter Username or Email Address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 px-4 border-2 border-slate-300 rounded-none focus:border-[#009fe3] focus:outline-none text-base text-slate-900 transition-colors"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 border-2 border-slate-300 rounded-none focus:border-[#009fe3] focus:outline-none text-base text-slate-900 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 bottom-0 px-4 bg-slate-100 border-l-2 border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Math Captcha Row */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-wider">
                {captchaNum1} + {captchaNum2}
              </span>
              <span className="text-2xl font-black text-slate-500">=</span>
              <input
                type="text"
                required
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="w-36 h-12 px-3 border-2 border-slate-300 rounded-none text-center text-xl font-black font-mono focus:border-[#009fe3] focus:outline-none text-slate-900"
              />
              <button
                type="button"
                onClick={generateCaptcha}
                className="p-2.5 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                title="Refresh Captcha"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between pt-4">
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  triggerToast('Password Assistance', 'Please contact your mngprt terminal administrator to reset credentials.', 'info');
                }}
                className="text-sm text-[#009fe3] hover:underline font-bold"
              >
                Forgot / Reset Password?
              </a>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-[#009fe3] hover:bg-[#0089c4] disabled:bg-sky-300 text-white font-black text-sm uppercase tracking-wider rounded-none transition cursor-pointer shadow-md"
              >
                {loading ? 'Processing...' : 'Login'}
              </button>
            </div>

          </form>

          {/* Prominently Highlighted Register Section (Positioned Below) */}
          <div className="p-6 bg-[#e8f4f9] border-2 border-[#009fe3]/30 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="block text-sm font-bold text-slate-900">Don't have an account?</span>
              <span className="block text-xs text-slate-600 font-medium mt-0.5">Register as a Shipping Agent to manage manifests & clearance.</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/register-agent')}
              className="px-6 py-3 bg-[#009fe3] hover:bg-[#0089c4] text-white text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              Register New Account &rarr;
            </button>
          </div>

          {/* Small Test Auto Login Buttons */}
          <div className="pt-6 border-t-2 border-slate-200">
            <span className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-3">
              Quick Select Role Credentials:
            </span>
            <div className="flex flex-wrap gap-2.5">
              {testAccounts.map(acc => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleRoleAutofill(acc.label, acc.u, acc.p)}
                  className="px-4 py-2 bg-slate-100 hover:bg-[#009fe3] text-slate-800 hover:text-white border-2 border-slate-250 hover:border-[#009fe3] rounded-lg text-xs font-extrabold transition shadow-xs cursor-pointer flex items-center gap-2 group"
                >
                  <span className="w-2 h-2 rounded-full bg-[#009fe3] group-hover:bg-white transition"></span>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Formal Footer */}
        <div className="mt-8 text-xs text-slate-500 font-medium border-t border-slate-200 pt-4">
          &copy; {new Date().getFullYear()} National Logistics Portal (Marine) &bull; Port Inventory Management System
        </div>

      </div>
    </div>
  );
};

export default Login;
