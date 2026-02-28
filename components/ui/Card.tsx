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
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${onClick ? 'text-left w-full cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}
