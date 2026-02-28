'use client';

import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps = 3 }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center">
          <motion.div
            initial={false}
            animate={{
              scale: i + 1 === currentStep ? 1.1 : 1,
              backgroundColor: i + 1 <= currentStep ? '#2563EB' : '#E2E8F0',
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
          >
            {i + 1}
          </motion.div>
          {i < totalSteps - 1 && (
            <div
              className={`w-12 h-0.5 mx-1 rounded ${i + 1 < currentStep ? 'bg-blue-600' : 'bg-slate-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
