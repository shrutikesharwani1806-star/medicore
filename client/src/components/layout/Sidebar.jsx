import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Search, Calendar, MessageSquare, FileText,
  User, Users, Pill, CheckSquare, BarChart3, ShieldCheck, X, Heart,
  LogIn, Home, Coins, DollarSign, Stethoscope
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const menuItems = {
  patient: [
    { path: '/patient', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/patient/find-doctor', icon: Search, label: 'Find Doctors' },
    { path: '/patient/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/patient/payment-requests', icon: DollarSign, label: 'Payment Requests' },
    { path: '/patient/buy-credits', icon: Coins, label: 'Buy Credits' },
    { path: '/patient/chat', icon: MessageSquare, label: 'Messages' },
    { path: '/patient/reports', icon: FileText, label: 'Reports' },
    { path: '/patient/profile', icon: User, label: 'Profile' },
  ],
  doctor: [
    { path: '/doctor', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/doctor/appointments', icon: Stethoscope, label: 'Attend Patients' },
    { path: '/doctor/personal-appointments', icon: Calendar, label: 'Personal Appointments' },
    { path: '/doctor/patients', icon: Users, label: 'My Patients' },
    { path: '/doctor/prescriptions', icon: Pill, label: 'Prescriptions' },
    { path: '/doctor/buy-credits', icon: Coins, label: 'Recharge Credits' },
    { path: '/doctor/chat', icon: MessageSquare, label: 'Messages' },
    { path: '/doctor/profile', icon: User, label: 'Profile' },
  ],
  admin: [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { path: '/admin/doctor-approval', icon: CheckSquare, label: 'Doctor Approval' },
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/appointments', icon: Calendar, label: 'All Appointments' },
    { path: '/admin/credits', icon: DollarSign, label: 'Credits & Earnings' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ],
};

const panelColors = {
  patient: 'from-primary-600 to-primary-500',
  doctor: 'from-accent-600 to-accent-500',
  admin: 'from-slate-700 to-slate-600',
};

const panelLabels = {
  patient: 'Patient Panel',
  doctor: 'Doctor Panel',
  admin: 'Admin Panel',
};

export default function Sidebar({ isOpen, onClose, panel = 'patient' }) {
  const items = menuItems[panel] || menuItems.patient;
  const { isLoggedIn } = useAuthStore();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      )}

      {/* RIGHT Sidebar with 3D slide */}
      <aside
        className={`
          fixed top-0 right-0 bottom-0 w-72 bg-white/90 backdrop-blur-2xl border-l border-slate-100/60 z-50
          transition-all duration-500 ease-out shadow-2xl shadow-slate-300/30
          ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
        style={{
          transform: isOpen ? 'perspective(1000px) translateX(0) rotateY(0deg)' : 'perspective(1000px) translateX(100%) rotateY(-10deg)',
          transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.3s ease',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`bg-gradient-to-r ${panelColors[panel]} p-5 flex items-center justify-between relative overflow-hidden`}>
            {/* Animated background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full animate-breathe" />
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/5 rounded-full animate-breathe" style={{ animationDelay: '1s' }} />
            </div>
            <div className="flex items-center gap-2 relative z-10">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Heart className="w-5 h-5 text-white fill-white animate-heartbeat" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">MediCore</p>
                <p className="text-white/60 text-[10px] uppercase tracking-wider">{panelLabels[panel]}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer relative z-10 active:scale-90">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <NavLink
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all duration-300 mb-2 hover:translate-x-1"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </NavLink>

            <div className="w-full h-px bg-slate-100 my-2" />

            {items.map((item, i) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-100 border border-primary-100/50 translate-x-1'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:translate-x-1'
                  }`
                }
                style={{ animationDelay: `${i * 50}ms` }}
                id={`sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>


          {/* Auth / Support */}
          <div className="border-t border-slate-100 p-4">
            {!isLoggedIn && (
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-all duration-300 mb-3 hover:shadow-md hover:shadow-primary-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            )}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-4 border border-primary-100/30">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                <p className="text-sm font-semibold text-primary-700">Need Help?</p>
              </div>
              <p className="text-xs text-slate-500 mb-3">Contact our support team</p>
              <button className="w-full py-2 text-xs font-medium bg-white rounded-xl text-primary-600 hover:bg-primary-50 transition-all duration-300 shadow-sm cursor-pointer hover:shadow-md active:scale-[0.98]">
                Get Support
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
