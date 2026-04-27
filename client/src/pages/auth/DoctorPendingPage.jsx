import { Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function DoctorPendingPage() {
  const navigate = useNavigate();
  const { logout, approveCurrentDoctor } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  // Demo: auto-approve for testing
  const handleDemoApprove = () => {
    approveCurrentDoctor();
    toast.success('Your account has been approved!');
    navigate('/doctor', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-accent-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center animate-scale-in">
        <div className="mx-auto w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Approval Pending</h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Your doctor account is under review. Our admin team will verify your credentials and approve
          your account shortly. You'll be notified once approved.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-primary-500" />
            <p className="text-sm font-medium text-slate-700">What happens next?</p>
          </div>
          <ul className="space-y-2 text-left">
            {[
              'Admin reviews your application',
              'Credentials & qualifications verified',
              'Account approved & dashboard unlocked',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <Button onClick={handleDemoApprove} size="lg" className="w-full" variant="success">
            Demo: Auto-Approve
          </Button>
          <Button onClick={handleLogout} variant="ghost" size="md" className="w-full" icon={ArrowLeft}>
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
