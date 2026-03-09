'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PathPreview } from './PathPreview';
import { LearningItem } from './LearningItem';
import type { CareerRoadmap, LearningTask } from '@/lib/types';

interface WeeklyPlanProps {
  roadmap: CareerRoadmap;
  expandedWeek?: number;
  onExpandedWeekChange?: (week: number) => void;
}

function getWeekSubtitle(week: { theme?: string; tasks?: { title?: string; skillTargeted?: string }[] }): string {
  const theme = week.theme?.trim();
  if (theme && !/^Week \d+$/i.test(theme)) return theme;
  const first = week.tasks?.[0];
  if (first?.title) return first.title;
  if (first?.skillTargeted) return first.skillTargeted;
  return '';
}

export function WeeklyPlan({ roadmap, expandedWeek: controlledExpanded, onExpandedWeekChange }: WeeklyPlanProps) {
  const [internalExpanded, setInternalExpanded] = useState<number>(1);
  const isControlled = controlledExpanded !== undefined && onExpandedWeekChange !== undefined;
  const weeklyPlan = useMemo(() => roadmap.weeklyPlan ?? [], [roadmap.weeklyPlan]);
  const maxWeek = weeklyPlan.length > 0 ? Math.max(1, ...weeklyPlan.map((w) => w.weekNumber ?? (w as { week?: number }).week ?? 1)) : 1;
  const rawExpanded = isControlled ? controlledExpanded : internalExpanded;
  const expandedWeek = rawExpanded === 0 ? 0 : Math.min(Math.max(1, rawExpanded), maxWeek);
  const setExpandedWeek = isControlled ? onExpandedWeekChange! : setInternalExpanded;

  return (
    <div className="space-y-4">
      <PathPreview roadmap={roadmap} />

      <div>
        <h3 className="text-xl font-semibold text-zinc-100 mb-1">Week-by-Week Plan</h3>
        <p className="text-sm text-zinc-500 mb-3">
          First {weeklyPlan.length} weeks of tasks below. Your full path runs {roadmap.timeline}.
        </p>
        <div className="space-y-2">
          {weeklyPlan.map((week) => {
            const weekNum = week.weekNumber ?? (week as { week?: number }).week ?? 1;
            const subtitle = getWeekSubtitle(week);
            return (
              <motion.div
                key={weekNum}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedWeek(expandedWeek === weekNum ? 0 : weekNum)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-800/50 gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-emerald-400 shrink-0">Week {weekNum}</span>
                    {subtitle && (
                      <span className="text-zinc-400 text-sm truncate">{subtitle}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-zinc-500">{week.estimatedHours ?? 0}h</span>
                    <span className="text-zinc-500">{expandedWeek === weekNum ? '−' : '+'}</span>
                  </div>
                </button>
                {expandedWeek === weekNum && (
                  <div className="border-t border-zinc-800">
                    <div className="px-4 py-3 space-y-2">
                      {(week.tasks ?? []).length > 0 ? (
                        (week.tasks ?? []).map((task, i) => (
                          <LearningItem key={i} task={task as LearningTask} />
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500 italic">No tasks for this week yet. Check back after we regenerate your plan.</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
