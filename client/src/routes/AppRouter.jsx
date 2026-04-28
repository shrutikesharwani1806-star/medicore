import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

// Layouts
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

// Landing + Loading
import LandingPage from '../pages/LandingPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DoctorPendingPage from '../pages/auth/DoctorPendingPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Patient Pages
import PatientDashboard from '../pages/patient/PatientDashboard';
import FindDoctorPage from '../pages/patient/FindDoctorPage';
import DoctorProfilePage from '../pages/patient/DoctorProfilePage';
import BookAppointmentPage from '../pages/patient/BookAppointmentPage';
import MyAppointmentsPage from '../pages/patient/MyAppointmentsPage';
import ReportsPage from '../pages/patient/ReportsPage';
import PatientProfilePage from '../pages/patient/PatientProfilePage';
import BuyCreditsPage from '../pages/patient/BuyCreditsPage';
import PaymentRequestsPage from '../pages/patient/PaymentRequestsPage';
import VideoCallPage from '../pages/VideoCallPage';

// Doctor Pages
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import DoctorAppointmentsPage from '../pages/doctor/DoctorAppointmentsPage';
import PatientListPage from '../pages/doctor/PatientListPage';
import PrescriptionPage from '../pages/doctor/PrescriptionPage';
import DoctorProfilePageDoc from '../pages/doctor/DoctorProfilePage';
import PatientDetailsPage from '../pages/doctor/PatientDetailsPage';
import DoctorBuyCreditsPage from '../pages/doctor/DoctorBuyCreditsPage';
import DoctorPersonalAppointmentsPage from '../pages/doctor/DoctorPersonalAppointmentsPage';


// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import DoctorApprovalPage from '../pages/admin/DoctorApprovalPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import AnalyticsPage from '../pages/admin/AnalyticsPage';
import CreditsManagementPage from '../pages/admin/CreditsManagementPage';
import AdminAppointmentsPage from '../pages/admin/AdminAppointmentsPage';
import AdminDoctorDetailsPage from '../pages/admin/AdminDoctorDetailsPage';
import AppointmentDetailsPage from '../pages/common/AppointmentDetailsPage';
import UnifiedChatPage from '../pages/UnifiedChatPage';

const router = createBrowserRouter([
  // Landing Page - the first page users see
  {
    path: '/',
    element: <LandingPage />,
  },

  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  { path: '/doctor-pending', element: <DoctorPendingPage /> },

  // Public Patient Routes (accessible without login)
  {
    path: '/patient',
    element: <DashboardLayout />,
    children: [
      { path: 'find-doctor', element: <FindDoctorPage /> },
      { path: 'doctor/:id', element: <DoctorProfilePage /> },
    ],
  },

  // Protected Patient Routes
  {
    path: '/patient',
    element: (
      <ProtectedRoute allowedRoles={['patient', 'admin', 'doctor']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PatientDashboard /> },
      { path: 'book/:id', element: <BookAppointmentPage /> },
      { path: 'appointments', element: <MyAppointmentsPage /> },
      { path: 'chat', element: <Navigate to="/chat" replace /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'profile', element: <PatientProfilePage /> },
      { path: 'buy-credits', element: <BuyCreditsPage /> },
      { path: 'payment-requests', element: <PaymentRequestsPage /> },
    ],
  },

  // Doctor Routes
  {
    path: '/doctor',
    element: (
      <ProtectedRoute allowedRoles={['doctor']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DoctorDashboard /> },
      { path: 'appointments', element: <DoctorAppointmentsPage /> },
      { path: 'personal-appointments', element: <DoctorPersonalAppointmentsPage /> },
      { path: 'patients', element: <PatientListPage /> },
      { path: 'prescriptions', element: <PrescriptionPage /> },
      { path: 'profile', element: <DoctorProfilePageDoc /> },
      { path: 'patient/:id', element: <PatientDetailsPage /> },
      { path: 'chat', element: <Navigate to="/chat" replace /> },
      { path: 'buy-credits', element: <DoctorBuyCreditsPage /> },
    ],
  },

  // Admin Routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'doctor-approval', element: <DoctorApprovalPage /> },
      { path: 'users', element: <UserManagementPage /> },
      { path: 'appointments', element: <AdminAppointmentsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'credits', element: <CreditsManagementPage /> },
      { path: 'doctor/:id', element: <AdminDoctorDetailsPage /> },
      { path: 'personal-appointments', element: <MyAppointmentsPage /> },
    ],
  },

  // Common Protected Routes
  {
    path: '/appointment/:id',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AppointmentDetailsPage /> }
    ]
  },

  // Unified Chat Route
  {
    path: '/chat',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <UnifiedChatPage /> }
    ]
  },

  // Video Call Route
  {
    path: '/video-call/:roomId',
    element: (
      <ProtectedRoute>
        <VideoCallPage />
      </ProtectedRoute>
    ),
  },

  // Catch all
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;
