const statusStyles = {
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  active: 'bg-accent-50 text-accent-700 border border-accent-200',
  inactive: 'bg-slate-50 text-slate-500 border border-slate-200',
};

export default function Badge({ status, children, className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
        ${statusStyles[status] || 'bg-slate-100 text-slate-600'}
        ${className}
      `}
    >
      {children || status}
    </span>
  );
}
