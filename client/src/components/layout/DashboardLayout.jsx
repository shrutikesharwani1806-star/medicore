import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Heart, LogOut, Coins } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import socket from '../../socket';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, user, isLoggedIn, logout } = useAuthStore();

  useEffect(() => {
    if (role === 'admin') {
      socket.on("receive_notification", (data) => {
        if (data.type === "NEW_DOCTOR_REQUEST") {
          toast(data.message, { icon: '🧑‍⚕️', duration: 5000 });
        }
      });

      return () => {
        socket.off("receive_notification");
      };
    }
  }, [role]);

  const getPanel = () => {
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/doctor')) return 'doctor';
    return 'patient';
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const panel = getPanel();

  return (
    <div className="min-h-screen bg-slate-50/80 flex relative overflow-hidden">
      {/* Animated background mesh */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-100/15 rounded-full blur-3xl animate-morph-bg" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-accent-100/15 rounded-full blur-3xl animate-morph-bg" style={{ animationDelay: '7s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary-50/10 rounded-full blur-2xl animate-breathe" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary-300/5 animate-drift"
            style={{
              width: `${4 + i * 2}px`,
              height: `${4 + i * 2}px`,
              left: `${15 + i * 18}%`,
              animationDelay: `${i * 4}s`,
              animationDuration: `${18 + i * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {/* Top bar */}
        <div className="h-14 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 bg-white/60 backdrop-blur-2xl border-b border-slate-100/60 shadow-sm shadow-slate-100/30">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary-300/30 transition-all duration-300 group-hover:scale-105">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">
              Medi<span className="text-primary-600">Core</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Credits display for patients */}
            {isLoggedIn && panel === 'patient' && (
              <button
                onClick={() => navigate('/patient/buy-credits')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium hover:bg-amber-100 transition-all cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>₹{user?.credits || 0}</span>
              </button>
            )}

            {/* Logout button */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                title="Logout"
                id="topbar-logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-primary-600 transition-all duration-300 cursor-pointer hover:shadow-sm active:scale-95"
              id="sidebar-toggle"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} panel={panel} />

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
    </div>
  );
}
