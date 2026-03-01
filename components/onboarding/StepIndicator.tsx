'use client';

import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps = 3 }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center shrink-0">
          <motion.div
            initial={false}
            animate={{
              backgroundColor: i + 1 <= currentStep ? '#10b981' : '#27272a',
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${i + 1 <= currentStep ? 'text-white' : 'text-zinc-500'}`}
          >
            {i + 1}
          </motion.div>
          {i < totalSteps - 1 && (
            <div className="w-12 h-8 flex items-center justify-center shrink-0 mx-1">
              <div
                className={`w-full h-px rounded ${i + 1 < currentStep ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
