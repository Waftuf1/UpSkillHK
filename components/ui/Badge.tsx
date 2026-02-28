'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'strong' | 'fading' | 'missing' | 'default' | 'critical' | 'important';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    strong: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    fading: 'bg-amber-100 text-amber-800 border-amber-200',
    missing: 'bg-rose-100 text-rose-800 border-rose-200',
    critical: 'bg-rose-100 text-rose-800 border-rose-200 font-semibold',
    important: 'bg-amber-100 text-amber-800 border-amber-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
