'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MilestoneTimeline } from './MilestoneTimeline';
import { LearningItem } from './LearningItem';
import type { CareerRoadmap } from '@/lib/types';

interface WeeklyPlanProps {
  roadmap: CareerRoadmap;
}

export function WeeklyPlan({ roadmap }: WeeklyPlanProps) {
  const [expandedWeek, setExpandedWeek] = useState<number>(1);

  return (
    <div className="space-y-8">
      <MilestoneTimeline milestones={roadmap.milestones} />

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Week-by-Week Plan</h3>
        <div className="space-y-4">
          {roadmap.weeklyPlan.map((week) => (
            <motion.div
              key={week.weekNumber}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedWeek(expandedWeek === week.weekNumber ? 0 : week.weekNumber)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-600">Week {week.weekNumber}</span>
                  <span className="text-slate-700">{week.theme}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{week.estimatedHours}h</span>
                  <span className="text-slate-400">{expandedWeek === week.weekNumber ? '−' : '+'}</span>
                </div>
              </button>
              <AnimatePresence>
                {expandedWeek === week.weekNumber && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-3">
                      {week.tasks.map((task, i) => (
                        <LearningItem key={i} task={task} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
