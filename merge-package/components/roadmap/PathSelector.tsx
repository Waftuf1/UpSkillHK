'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PathCard } from './PathCard';
import { WeeklyPlan } from './WeeklyPlan';
import { playSelect } from '@/lib/sounds';
import type { CareerRoadmap } from '@/lib/types';

interface PathSelectorProps {
  roadmaps: CareerRoadmap[];
  onPathChange?: (pathType: string | null) => void;
}

/** Persist which week is expanded per path so switching roadmaps and back doesn't reset it */
export function PathSelector({ roadmaps, onPathChange }: PathSelectorProps) {
  const [selected, setSelected] = useState<CareerRoadmap | null>(null);
  const [expandedByPath, setExpandedByPath] = useState<Record<string, number>>({});

  const handleExpandedWeekChange = useCallback((pathType: string, week: number) => {
    setExpandedByPath((prev) => ({ ...prev, [pathType]: week }));
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roadmaps.map((r) => (
          <PathCard
            key={r.pathType}
            roadmap={r}
            isSelected={selected?.pathType === r.pathType}
            onClick={() => {
              playSelect();
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
          <WeeklyPlan
            roadmap={selected}
            expandedWeek={expandedByPath[selected.pathType] ?? 1}
            onExpandedWeekChange={(week) => handleExpandedWeekChange(selected.pathType, week)}
          />
        </motion.div>
      )}
    </div>
  );
}
