import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import OTPInput from '../../components/ui/OTPInput';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';

export default function OTPVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  const { name, method, value, role, isLogin } = location.state || {};

  if (!value || !role) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Invalid session. Please try again.</p>
        <Button onClick={() => navigate('/login')} className="mt-4">
          Go to Login
        </Button>
      </div>
    );
  }

  const handleVerify = async () => {
    if (otpValue.length < 6) {
      toast.error('Please enter the complete OTP');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        name: name || (role === 'admin' ? 'Administrator' : 'User'),
        email: method === 'email' ? value : undefined,
        phone: method === 'phone' ? value : undefined,
        role,
        otp: otpValue,
        isLogin
      };

      const res = await axiosInstance.post('/auth/verify-otp', payload);
      const userData = res.data;

      // Save token
      localStorage.setItem('token', userData.token);

      const storeUser = {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        approved: userData.isActive,
        image: `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData.name || 'User'}&backgroundColor=b6e3f4`,
        category: userData.category,
        experience: userData.experience
      };

      if (isLogin) {
        login(storeUser);
      } else {
        register(storeUser);
      }

      toast.success('Verification successful!');

      if (userData.role === 'doctor' && !userData.isActive) {
        navigate('/doctor-pending', { replace: true });
      } else if (userData.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/patient', { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP Verification Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-4 cursor-pointer"
        id="otp-back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Verify OTP</h2>
        <p className="text-sm text-slate-400">
          We've sent a 6-digit code to <br />
          <span className="font-medium text-slate-600">{value}</span>
        </p>
      </div>

      <OTPInput
        length={6}
        onComplete={(code) => setOtpValue(code)}
      />

      <Button
        onClick={handleVerify}
        size="lg"
        className="w-full mt-6"
        loading={loading}
        disabled={otpValue.length < 6}
      >
        Verify & Continue
      </Button>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-400">
          Didn't receive the code?{' '}
          <button
            onClick={() => toast.success('OTP resent!')}
            className="text-primary-600 font-medium hover:underline cursor-pointer"
            id="resend-otp-btn"
          >
            Resend OTP
          </button>
        </p>
        <p className="text-xs text-slate-300 mt-2">Demo: Enter any 6 digits</p>
      </div>
    </div>
  );
}
