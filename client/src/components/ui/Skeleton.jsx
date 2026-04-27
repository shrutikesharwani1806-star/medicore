export default function Skeleton({ className = '', variant = 'rect' }) {
  const base = 'animate-pulse-soft bg-slate-200 rounded-xl';

  if (variant === 'circle') {
    return <div className={`${base} rounded-full ${className}`} />;
  }

  if (variant === 'text') {
    return <div className={`${base} h-4 ${className}`} />;
  }

  return <div className={`${base} ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
