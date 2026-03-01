'use client';

interface WaffleSpinnerProps {
  size?: number;
  className?: string;
}

/** Loading spinner – simple circle, no waffle branding */
export function WaffleSpinner({ size = 80, className = '' }: WaffleSpinnerProps) {
  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="animate-spin"
        style={{ animationDuration: '1s', animationTimingFunction: 'linear' }}
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="32 96"
          className="text-emerald-500"
        />
      </svg>
    </div>
  );
}
