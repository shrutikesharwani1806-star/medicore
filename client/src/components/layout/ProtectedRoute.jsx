import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, role, isApproved, profileCompleted } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Strict role isolation
  if (allowedRoles) {
    // Doctor routes
    if (allowedRoles.includes('doctor')) {
      if (role !== 'doctor') {
        // Redirect non-doctors to their own dashboard
        const path = role === 'admin' ? '/admin' : '/patient';
        return <Navigate to={path} replace />;
      }
      if (!isApproved) {
        return <Navigate to="/doctor-pending" replace />;
      }
    }

    // Admin routes
    if (allowedRoles.includes('admin')) {
      if (role !== 'admin') {
        const path = role === 'doctor' ? '/doctor' : '/patient';
        return <Navigate to={path} replace />;
      }
    }

    // Patient routes
    if (allowedRoles.includes('patient')) {
      if (role !== 'patient') {
        const path = role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/patient';
        return <Navigate to={path} replace />;
      }
    }
  }

  return children;
}
