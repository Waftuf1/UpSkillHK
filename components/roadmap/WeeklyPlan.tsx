'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MilestoneTimeline } from './MilestoneTimeline';
import { LearningItem } from './LearningItem';
import type { CareerRoadmap, LearningTask } from '@/lib/types';

const WEEKS_PER_MONTH = 4;

interface WeeklyPlanProps {
  roadmap: CareerRoadmap;
  expandedWeek?: number;
  onExpandedWeekChange?: (week: number) => void;
}

function groupWeeksByMonth(weeks: { weekNumber?: number; week?: number; theme?: string; tasks?: unknown[]; estimatedHours?: number }[]) {
  const groups: { monthLabel: string; weeks: typeof weeks }[] = [];
  for (let i = 0; i < weeks.length; i += WEEKS_PER_MONTH) {
    const chunk = weeks.slice(i, i + WEEKS_PER_MONTH);
    const start = chunk[0]?.weekNumber ?? chunk[0]?.week ?? i + 1;
    const end = chunk[chunk.length - 1]?.weekNumber ?? chunk[chunk.length - 1]?.week ?? i + WEEKS_PER_MONTH;
    groups.push({
      monthLabel: chunk.length === 1 ? `Week ${start}` : `Weeks ${start}–${end}`,
      weeks: chunk,
    });
  }
  return groups;
}

export function WeeklyPlan({ roadmap, expandedWeek: controlledExpanded, onExpandedWeekChange }: WeeklyPlanProps) {
  const [internalExpanded, setInternalExpanded] = useState<number>(1);
  const isControlled = controlledExpanded !== undefined && onExpandedWeekChange !== undefined;
  const weeklyPlan = useMemo(() => roadmap.weeklyPlan ?? [], [roadmap.weeklyPlan]);
  const byMonth = useMemo(() => groupWeeksByMonth(weeklyPlan), [weeklyPlan]);
  const showMonths = weeklyPlan.length > 6;
  const maxWeek = weeklyPlan.length > 0 ? Math.max(1, ...weeklyPlan.map((w) => w.weekNumber ?? (w as { week?: number }).week ?? 1)) : 1;
  const rawExpanded = isControlled ? controlledExpanded : internalExpanded;
  const expandedWeek = rawExpanded === 0 ? 0 : Math.min(Math.max(1, rawExpanded), maxWeek);
  const setExpandedWeek = isControlled ? onExpandedWeekChange! : setInternalExpanded;

  return (
    <div className="space-y-8">
      <MilestoneTimeline milestones={roadmap.milestones} />

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-1">Week-by-Week Plan</h3>
        <p className="text-sm text-slate-500 mb-1">
          {weeklyPlan.length} weeks · Full path: {roadmap.timeline}
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Expand a week below to see tasks and resources.
        </p>
        <div className="space-y-8">
          {byMonth.map(({ monthLabel, weeks: monthWeeks }) => (
            <div key={monthLabel}>
              {showMonths && (
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{monthLabel}</h4>
              )}
              <div className="space-y-4">
                {monthWeeks.map((week) => {
                  const weekNum = week.weekNumber ?? (week as { week?: number }).week ?? 1;
                  return (
                    <motion.div
                      key={weekNum}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedWeek(expandedWeek === weekNum ? 0 : weekNum)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-600">Week {weekNum}</span>
                          <span className="text-slate-700">{week.theme}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500">{week.estimatedHours ?? 0}h</span>
                          <span className="text-slate-400">{expandedWeek === weekNum ? '−' : '+'}</span>
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedWeek === weekNum && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-3">
                              {(week.tasks ?? []).map((task, i) => (
                                <LearningItem key={i} task={task as LearningTask} />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
