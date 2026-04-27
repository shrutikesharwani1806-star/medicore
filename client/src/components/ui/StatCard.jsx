import { useRef } from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend, onClick }) {
  const cardRef = useRef(null);

  const colors = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'text-primary-600',
      border: 'border-primary-100/60',
      glow: 'hover:shadow-primary-100/50',
    },
    accent: {
      bg: 'bg-accent-50',
      icon: 'text-accent-600',
      border: 'border-accent-100/60',
      glow: 'hover:shadow-accent-100/50',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      border: 'border-amber-100/60',
      glow: 'hover:shadow-amber-100/50',
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'text-rose-600',
      border: 'border-rose-100/60',
      glow: 'hover:shadow-rose-100/50',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-100/60',
      glow: 'hover:shadow-purple-100/50',
    },
  };

  const c = colors[color] || colors.primary;

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border ${c.border} hover:shadow-lg ${c.glow} transition-shadow duration-300 animate-slide-up-3d ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.2s ease-out, box-shadow 0.3s ease' }}
    >
      <div className="flex items-start justify-between" style={{ transform: 'translateZ(10px)' }}>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${c.bg} transition-transform duration-300 hover:scale-110 hover:rotate-3`}>
          {Icon && <Icon className={`w-6 h-6 ${c.icon}`} />}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1" style={{ transform: 'translateZ(5px)' }}>
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-slate-400">vs last month</span>
        </div>
      )}
    </div>
  );
}
