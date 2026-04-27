import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import Button from '../components/ui/Button';
import { LogIn, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Wrapper component that shows a login prompt instead of redirecting
export function RequireAuth({ children }) {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-scale-in">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            You need to sign in to access this feature. Create an account or log in to book appointments, chat with doctors, and more.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/login')} size="lg" className="w-full" icon={LogIn}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/register')} variant="outline" size="md" className="w-full">
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

// Strict redirect guard for doctor/admin routes
export function RequireRole({ role, children }) {
  const { isLoggedIn, role: userRole } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== role) {
    const path = userRole === 'admin' ? '/admin' : userRole === 'doctor' ? '/doctor' : '/patient';
    return <Navigate to={path} replace />;
  }

  return children;
}
