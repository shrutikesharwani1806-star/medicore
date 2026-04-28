import { Outlet, Navigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

export default function AuthLayout() {
  const { isLoggedIn, role } = useAuthStore();

  if (isLoggedIn) {
    const path = role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/patient';
    return <Navigate to={path} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-[4vw] pb-[calc(12vh+env(safe-area-inset-bottom))] relative overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source
          src="https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-primary-900/55 to-accent-900/65 z-[1]" />

      {/* Animated morphing gradient orbs */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 animate-morph-bg"
            style={{
              width: `${30 + i * 25}px`,
              height: `${30 + i * 25}px`,
              top: `${10 + i * 14}%`,
              left: `${5 + i * 17}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${8 + i * 2}s`,
            }}
          />
        ))}
        {/* Floating particles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`p-${i}`}
            className="absolute rounded-full bg-primary-400/10 animate-drift"
            style={{
              width: `${4 + i * 2}px`,
              height: `${4 + i * 2}px`,
              left: `${5 + i * 10}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${12 + i * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-slide-up-3d">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-accent-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/30 backdrop-blur-sm border border-white/20 animate-border-glow">
            <Heart className="w-7 h-7 text-white fill-white animate-heartbeat" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Medi<span className="text-primary-300">Core</span>
            </h1>
            <p className="text-xs text-white/50">Hospital Management System</p>
          </div>
        </div>

        {/* Card with 3D glass effect */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/20 border border-white/50 overflow-hidden animate-tilt-in hover:shadow-3xl transition-shadow duration-500">
          <Outlet />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/40 mt-6 animate-fade-in" style={{ animationDelay: '800ms' }}>
          © 2026 MediCore. All rights reserved.
        </p>
      </div>
    </div>
  );
}
