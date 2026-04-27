import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusField, setFocusField] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      toast.success('Logged in successfully!');

      const userData = res.data;
      localStorage.setItem('token', userData.token);
      login(userData);

      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'doctor') {
        if (!userData.isActive) navigate('/doctor-pending');
        else if (userData.profileCompleted) navigate('/doctor');
        else navigate('/doctor/profile');
      }
      else navigate('/patient');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-1 animate-slide-up-3d">Welcome back</h2>
      <p className="text-sm text-slate-400 mb-6 animate-slide-up-3d" style={{ animationDelay: '50ms' }}>Sign in to continue to MediCore</p>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="animate-slide-up-3d" style={{ animationDelay: '200ms' }}>
          <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${focusField === 'email' ? 'text-primary-600' : 'text-slate-600'}`}>
            Email Address
          </label>
          <div className={`relative rounded-xl transition-all duration-300 ${focusField === 'email' ? 'shadow-md shadow-primary-100' : ''}`}>
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusField('email')}
              onBlur={() => setFocusField('')}
              placeholder="john@example.com"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300
                ${focusField === 'email' ? 'border-primary-300 bg-white' : 'border-slate-200'}`}
              id="login-email"
              required
            />
          </div>
        </div>

        <div className="animate-slide-up-3d" style={{ animationDelay: '250ms' }}>
          <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${focusField === 'password' ? 'text-primary-600' : 'text-slate-600'}`}>
            Password
          </label>
          <div className={`relative rounded-xl transition-all duration-300 ${focusField === 'password' ? 'shadow-md shadow-primary-100' : ''}`}>
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusField('password')}
              onBlur={() => setFocusField('')}
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all duration-300
                ${focusField === 'password' ? 'border-primary-300 bg-white' : 'border-slate-200'}`}
              id="login-password"
              required
            />
          </div>
          <div className="flex justify-end mt-2">
            <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>

        <div className="animate-slide-up-3d" style={{ animationDelay: '300ms' }}>
          <Button type="submit" size="lg" className="w-full hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200 active:scale-[0.98]" icon={ArrowRight}>
            Sign In
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center space-y-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <p className="text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline hover:text-primary-700 transition-colors" id="register-link">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
