'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PathCard } from './PathCard';
import { WeeklyPlan } from './WeeklyPlan';
import type { CareerRoadmap } from '@/lib/types';

interface PathSelectorProps {
  roadmaps: CareerRoadmap[];
  onPathChange?: (pathType: string | null) => void;
}

export function PathSelector({ roadmaps, onPathChange }: PathSelectorProps) {
  const [selected, setSelected] = useState<CareerRoadmap | null>(null);

  return (
    <div className="space-y-8">
      <p className="text-base text-white">Select a path below to view your week-by-week plan.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roadmaps.map((r, idx) => (
          <PathCard
            key={`${r.pathType}-${idx}`}
            roadmap={r}
            isSelected={selected?.pathType === r.pathType}
            onClick={() => {
              const next = selected?.pathType === r.pathType ? null : r;
              setSelected(next);
              onPathChange?.(next?.pathType ?? null);
            }}
          />
        ))}
      </div>
      {selected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-8"
        >
          <WeeklyPlan roadmap={selected} />
        </motion.div>
      )}
    </div>
  );
}
