const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-200',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  outline: 'border border-primary-300 text-primary-600 hover:bg-primary-50',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200',
  success: 'bg-accent-600 text-white hover:bg-accent-700 shadow-sm shadow-accent-200',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
  xl: 'px-8 py-3 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-xl
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        cursor-pointer
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {Icon && !loading && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
