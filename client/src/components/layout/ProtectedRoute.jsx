import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, role, isApproved, profileCompleted } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Strictly block pending doctors from professional dashboards, but allow demo on patient-side
  if (role === 'doctor') {
    if (!isApproved) {
      // If they are trying to access professional doctor routes, redirect to pending page
      if (allowedRoles && allowedRoles.includes('doctor') && !allowedRoles.includes('patient')) {
        return <Navigate to="/doctor-pending" replace />;
      }
    } else if (!profileCompleted) {
      // If approved but profile not complete, force them to profile setup
      // Allow them to stay ON the profile page though!
      const currentPath = window.location.pathname;
      if (currentPath !== '/doctor/profile' && allowedRoles && allowedRoles.includes('doctor')) {
        return <Navigate to="/doctor/profile" replace />;
      }
    }
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If user doesn't have permission, redirect to their role's default dashboard
    const defaultPaths = {
      admin: '/admin',
      doctor: isApproved ? '/doctor' : '/doctor-pending',
      patient: '/patient'
    };
    return <Navigate to={defaultPaths[role] || '/'} replace />;
  }

  return children;
}
