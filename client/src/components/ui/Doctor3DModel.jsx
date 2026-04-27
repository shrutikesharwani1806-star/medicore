import { useRef, useEffect, useState } from 'react';
import { Stethoscope, Heart, Shield, Star, Activity } from 'lucide-react';

/**
 * 3D Doctor Model — Premium doctor visualization with layered parallax.
 * Uses real avatar images + floating medical elements that track cursor.
 */
export default function Doctor3DModel({ size = 'lg', className = '' }) {
  const containerRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const animFrameRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = (e.clientX - centerX) / (rect.width / 2);
        const y = (e.clientY - centerY) / (rect.height / 2);
        setOffset({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const sizeClasses = size === 'sm' ? 'w-52 h-60' : size === 'md' ? 'w-72 h-80' : 'w-[340px] h-[420px]';
  const imgSize = size === 'sm' ? 'w-32 h-32' : size === 'md' ? 'w-44 h-44' : 'w-56 h-56';
  const ringSize = size === 'sm' ? 'w-40 h-40' : size === 'md' ? 'w-52 h-52' : 'w-64 h-64';

  const layer = (mult) => ({
    transform: `translate(${offset.x * mult}px, ${offset.y * mult}px)`,
    transition: 'transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  });

  // Also compute a subtle 3D rotation on the whole container
  const containerRotation = {
    transform: `perspective(1200px) rotateX(${offset.y * -8}deg) rotateY(${offset.x * 8}deg)`,
    transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    transformStyle: 'preserve-3d',
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${sizeClasses} ${className}`}
      style={containerRotation}
    >
      {/* === Layer 0: Large ambient glow === */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={layer(4)}
      >
        <div className="w-4/5 h-4/5 rounded-full bg-gradient-to-br from-primary-400/15 via-accent-300/10 to-primary-500/8 blur-3xl animate-breathe" />
      </div>

      {/* === Layer 1: Orbiting ring === */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={layer(6)}
      >
        <div className={`${ringSize} rounded-full border-2 border-dashed border-primary-200/30 animate-spin-slow`} />
      </div>

      {/* === Layer 2: Back circle glow === */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={layer(8)}
      >
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-accent-200/30 to-primary-200/30 animate-morph-bg blur-sm" />
      </div>

      {/* === Layer 3: Main Doctor Avatar === */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ ...layer(14), transform: `translate(${offset.x * 14}px, ${offset.y * 14}px) translateZ(20px)` }}
      >
        <div className="relative">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=DrSarah&backgroundColor=b6e3f4"
            alt="Doctor"
            className={`${imgSize} rounded-3xl border-4 border-white shadow-2xl bg-gradient-to-br from-primary-50 to-accent-50 animate-float`}
            style={{ filter: 'drop-shadow(0 20px 40px rgba(37,99,235,0.2))' }}
          />
          {/* Stethoscope badge */}
          <div className="absolute -bottom-2 -right-2 w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center border-3 border-white shadow-lg animate-bounce-in" style={{ animationDelay: '0.5s' }}>
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          {/* Star badge */}
          <div className="absolute -top-2 -right-2 w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center border-2 border-white shadow-lg animate-bounce-in" style={{ animationDelay: '0.8s' }}>
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      </div>

      {/* === Layer 4: Secondary doctors (smaller, orbiting) === */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={layer(20)}
      >
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=DrMichael&backgroundColor=c0aede"
          alt="Doctor 2"
          className="absolute left-0 top-8 w-16 h-16 rounded-2xl border-3 border-white shadow-xl bg-white animate-float"
          style={{ animationDelay: '1s', filter: 'drop-shadow(0 8px 16px rgba(13,148,136,0.15))' }}
        />
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=DrEmily&backgroundColor=ffd5dc"
          alt="Doctor 3"
          className="absolute right-0 top-16 w-14 h-14 rounded-2xl border-3 border-white shadow-xl bg-white animate-float"
          style={{ animationDelay: '2s', filter: 'drop-shadow(0 8px 16px rgba(37,99,235,0.15))' }}
        />
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=DrJames&backgroundColor=d1d4f9"
          alt="Doctor 4"
          className="absolute left-6 bottom-4 w-12 h-12 rounded-xl border-2 border-white shadow-lg bg-white animate-float"
          style={{ animationDelay: '3.5s', filter: 'drop-shadow(0 8px 16px rgba(20,184,166,0.15))' }}
        />
      </div>

      {/* === Layer 5: Floating medical icons === */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={layer(28)}
      >
        {/* Cross */}
        <div className="absolute top-0 right-6 w-9 h-9 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center animate-float shadow-lg border border-red-100/50">
          <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7V2z" />
          </svg>
        </div>
        {/* Heart */}
        <div className="absolute bottom-12 left-0 w-9 h-9 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl flex items-center justify-center animate-float shadow-lg border border-pink-100/50" style={{ animationDelay: '2s' }}>
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
        </div>
        {/* Shield */}
        <div className="absolute top-1/3 -left-2 w-8 h-8 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center animate-float shadow-lg border border-green-100/50" style={{ animationDelay: '3.5s' }}>
          <Shield className="w-3.5 h-3.5 text-green-600" />
        </div>
        {/* Pulse */}
        <div className="absolute bottom-6 right-2 w-10 h-7 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center animate-float shadow-lg border border-blue-100/50" style={{ animationDelay: '1s' }}>
          <Activity className="w-4 h-4 text-blue-600" />
        </div>
      </div>

      {/* === Ambient center glow === */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={layer(2)}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-primary-400/8 rounded-full blur-3xl animate-breathe" />
      </div>
    </div>
  );
}
