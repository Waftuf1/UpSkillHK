'use client';

import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      whileHover={hover ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
      className={`bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 ${onClick ? 'text-left w-full cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}
