'use client';

interface WaffleSpinnerProps {
  size?: number;
  className?: string;
}

export function WaffleSpinner({ size = 80, className = '' }: WaffleSpinnerProps) {
  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="animate-spin"
        style={{ animationDuration: '2.5s', animationTimingFunction: 'linear' }}
      >
        <defs>
          <radialGradient id="waffleGlaze" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#E8B84B" />
            <stop offset="50%" stopColor="#C4853C" />
            <stop offset="100%" stopColor="#8B5E2B" />
          </radialGradient>
          <radialGradient id="syrupShine" cx="35%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#D4943A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6B3A1A" stopOpacity="0" />
          </radialGradient>
          <filter id="waffleShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#5C3310" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer ring — oven dial edge */}
        <circle cx="60" cy="60" r="56" fill="#7A4A1E" filter="url(#waffleShadow)" />
        <circle cx="60" cy="60" r="53" fill="url(#waffleGlaze)" />

        {/* Waffle grid — 4x4 squares */}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={22 + col * 19}
              y={22 + row * 19}
              width={17}
              height={17}
              rx={3}
              fill="#A06830"
              stroke="#8B5724"
              strokeWidth="1"
            />
          ))
        )}

        {/* Grid deep shadows for 3D waffle look */}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`shadow-${row}-${col}`}
              x={23 + col * 19}
              y={23 + row * 19}
              width={15}
              height={15}
              rx={2}
              fill="#6B3D18"
              opacity="0.3"
            />
          ))
        )}

        {/* Syrup glaze drizzle */}
        <ellipse cx="45" cy="38" rx="12" ry="8" fill="#D4943A" opacity="0.5" />
        <ellipse cx="72" cy="55" rx="8" ry="10" fill="#C88530" opacity="0.4" />
        <ellipse cx="55" cy="78" rx="14" ry="6" fill="#B87828" opacity="0.35" />

        {/* Shine highlight */}
        <circle cx="60" cy="60" r="53" fill="url(#syrupShine)" />

        {/* Oven dial notch/indicator */}
        <rect x="56" y="6" width="8" height="14" rx="4" fill="#5C3310" />
        <rect x="57" y="8" width="6" height="10" rx="3" fill="#E8C06A" />
      </svg>
    </div>
  );
}
