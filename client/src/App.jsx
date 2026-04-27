import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import router from './routes/AppRouter';
import AIChatbot from './components/ui/AIChatbot';
import { Heart } from 'lucide-react';
import axiosInstance from './api/axiosInstance';
import useAuthStore from './store/useAuthStore';

function LoadingScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(timer); setTimeout(onFinish, 300); return 100; }
        return prev + 2;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-primary-900 to-accent-900 flex flex-col items-center justify-center">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 animate-pulse-soft"
            style={{
              width: `${10 + Math.random() * 30}px`,
              height: `${10 + Math.random() * 30}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-accent-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/30 mb-6 animate-pulse-soft">
          <Heart className="w-10 h-10 text-white fill-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Medi<span className="text-primary-300">Core</span>
        </h1>
        <p className="text-white/40 text-sm mb-10 tracking-wider">HOSPITAL MANAGEMENT SYSTEM</p>

        {/* Progress Bar */}
        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-accent-400 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white/30 text-xs mt-3 font-mono">{progress}%</p>
      </div>

      {/* ECG line animation */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center">
        <svg width="300" height="50" viewBox="0 0 300 50" className="text-primary-500/20">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points="0,25 50,25 60,10 70,40 80,25 100,25 110,5 120,45 130,25 200,25 210,10 220,40 230,25 300,25"
            className="animate-pulse-soft"
          />
        </svg>
      </div>
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const { login } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Try to get current user info - we'll need to add this endpoint
          const res = await axiosInstance.get('/auth/me');
          login(res.data);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [login]);

  return (
    <>
      {loading && <LoadingScreen onFinish={() => setLoading(false)} />}
      <div className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
        <RouterProvider router={router} />
        <AIChatbot />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '16px', padding: '12px 16px', fontSize: '14px',
              fontFamily: 'Inter, sans-serif', boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            },
            success: { iconTheme: { primary: '#0d9488', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </div>
    </>
  );
}
