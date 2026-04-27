import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, ArrowRight, User, ShieldCheck, Lock } from 'lucide-react';
import Button from '../../components/ui/Button';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');

  const navigate = useNavigate();
  const { login, register } = useAuthStore();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;
    if (!email.trim() && !phone.trim()) {
      toast.error('Provide email or phone');
      return;
    }

    try {
      const payload = {
        name,
        email,
        phone,
        password,
        isDoctor: role === 'doctor',
        role,
      };

      const res = await axiosInstance.post('/auth/register', payload);
      toast.success('Registration successful!');

      const userData = res.data;
      localStorage.setItem('token', userData.token);
      login(userData);

      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'doctor') {
        // Doctors are inactive until admin approves
        if (!userData.isActive) {
          navigate('/doctor-pending');
        } else {
          navigate('/doctor');
        }
      }
      else navigate('/patient');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Create Account</h2>
      <p className="text-sm text-slate-400 mb-6">Join MediCore for better healthcare</p>

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Role Selector — Only Patient or Doctor (Admin is predefined) */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">Register as</label>
          <div className="grid grid-cols-2 gap-2">
            {['patient', 'doctor'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer border ${role === r
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-200'
                  : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                  }`}
                id={`register-role-${r}`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-1 block">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
              id="register-name"
              required
            />
          </div>
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-1 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
              required
            />
          </div>
        </div>

        {/* Doctor info notice */}
        {role === 'doctor' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-blue-700 font-medium">Doctor Registration Flow:</p>
              <ol className="text-[11px] text-blue-600 mt-1 list-decimal list-inside space-y-0.5">
                <li>Register with basic details</li>
                <li>Wait for admin approval</li>
                <li>After approval, complete your profile (specialization, fees, availability, QR code)</li>
                <li>Start receiving appointment requests</li>
              </ol>
            </div>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" icon={ArrowRight}>
          Sign Up
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline" id="login-link">
          Sign In
        </Link>
      </p>
    </div>
  );
}