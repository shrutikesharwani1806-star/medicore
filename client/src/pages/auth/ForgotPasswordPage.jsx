import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import OTPInput from '../../components/ui/OTPInput';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    try {
      await axiosInstance.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified!');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    setLoading(true);
    try {
      await axiosInstance.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <button
        onClick={() => {
          if (step > 1) setStep(step - 1);
          else navigate('/login');
        }}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {step === 1 && (
        <div className="animate-slide-up-3d">
          <div className="mx-auto w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">Forgot Password</h2>
          <p className="text-sm text-slate-400 mb-6 text-center">Enter your email to receive an OTP</p>

          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-600">Email Address</label>
              <div className="relative rounded-xl">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                  required
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={loading} icon={ArrowRight}>
              Send OTP
            </Button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="animate-slide-up-3d">
          <div className="mx-auto w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">Verify OTP</h2>
          <p className="text-sm text-slate-400 mb-6 text-center">Enter the 6-digit code sent to {email}</p>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <OTPInput length={6} onComplete={(code) => setOtp(code)} />
            <Button type="submit" size="lg" className="w-full mt-6" loading={loading} disabled={otp.length < 6}>
              Verify OTP
            </Button>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="animate-slide-up-3d">
          <div className="mx-auto w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">Reset Password</h2>
          <p className="text-sm text-slate-400 mb-6 text-center">Enter your new password</p>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-2 block text-slate-600">New Password</label>
              <div className="relative rounded-xl">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all"
                  required
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Reset Password
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
