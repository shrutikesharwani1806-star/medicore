import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, Menu, X, Heart, LogIn, Coins } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function Navbar({ onMenuToggle, isSidebarOpen, panel = 'patient' }) {
  const { user, isLoggedIn, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const panelColors = {
    patient: 'from-primary-500 to-accent-500',
    doctor: 'from-accent-500 to-primary-500',
    admin: 'from-slate-700 to-primary-700',
  };

  return (
    <>
      <nav className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer" id="menu-toggle-btn">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className={`w-8 h-8 bg-gradient-to-br ${panelColors[panel]} rounded-xl flex items-center justify-center`}>
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-slate-800 hidden sm:block">
              Medi<span className="text-primary-600">Core</span>
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search doctors, appointments..." className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all" id="navbar-search" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn && user?.role === 'patient' && (
            <Link to="/patient/buy-credits" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium hover:bg-amber-100 transition-all" id="credits-display">
              <Coins className="w-4 h-4" />
              <span>₹{user?.credits || 0}</span>
            </Link>
          )}
          {isLoggedIn && user?.role === 'doctor' && (
            <Link to="/doctor/buy-credits" className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-50 border border-accent-200 rounded-xl text-accent-700 text-sm font-medium hover:bg-accent-100 transition-all" id="doctor-credits-display">
              <Coins className="w-4 h-4" />
              <span>₹{user?.credits || 0}</span>
            </Link>
          )}

          <button className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer" id="notifications-btn">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-700">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 capitalize">{panel}</p>
              </div>
              <img src={user?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=User&backgroundColor=b6e3f4`} alt="Avatar" className="w-9 h-9 rounded-xl bg-slate-100 cursor-pointer hover:ring-2 hover:ring-primary-200 transition-all" onClick={() => navigate(`/${panel}/profile`)} />
              <button onClick={handleLogout} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer" title="Logout" id="logout-btn">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-all shadow-sm shadow-primary-200" id="login-btn">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 max-w-sm mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Logout Confirmation</h3>
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all cursor-pointer shadow-sm shadow-red-200"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
