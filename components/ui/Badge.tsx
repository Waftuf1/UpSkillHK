'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'strong' | 'fading' | 'missing' | 'default' | 'critical' | 'important';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    strong: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    fading: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    missing: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-semibold',
    important: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    default: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
