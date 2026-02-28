'use client';

import { motion } from 'framer-motion';
import type { Milestone } from '@/lib/types';

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-4">
        {milestones.map((m, i) => (
          <motion.div
            key={m.week}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 flex-shrink-0"
          >
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                W{m.week}
              </div>
              {i < milestones.length - 1 && (
                <div className="w-0.5 h-8 bg-slate-200 my-1" />
              )}
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 min-w-[200px] max-w-[280px]">
              <h4 className="font-semibold text-slate-900">{m.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{m.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {m.skillsTargeted.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
