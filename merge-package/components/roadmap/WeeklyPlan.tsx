'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LearningItem } from './LearningItem';
import { playExpand, playCollapse } from '@/lib/sounds';
import type { CareerRoadmap, WeekVideo } from '@/lib/types';

const WEEKS_PER_MONTH = 4;

interface WeeklyPlanProps {
  roadmap: CareerRoadmap;
  /** When provided, expanded state is controlled by parent (persists when switching paths) */
  expandedWeek?: number;
  onExpandedWeekChange?: (week: number) => void;
}

/** Group weeks into months (e.g. Weeks 1-4 = Month 1) for easier scanning when plan is long */
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

function VideoCard({ video }: { video: WeekVideo }) {
  const inner = (
    <div className="flex gap-3 p-3 bg-white rounded-lg border border-slate-100 items-start group-hover:border-amber-300 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
        <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.9 31.9 0 000 12a31.9 31.9 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.9 31.9 0 0024 12a31.9 31.9 0 00-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 text-sm leading-tight">{video.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {video.channel && <span className="text-xs text-slate-500">{video.channel}</span>}
          {video.duration && <span className="text-xs text-slate-400">· {video.duration}</span>}
        </div>
        {video.whyWatch && <p className="text-xs text-slate-500 mt-1">{video.whyWatch}</p>}
      </div>
      {video.url && <span className="text-xs text-red-500 font-medium flex-shrink-0 mt-0.5">Watch ↗</span>}
    </div>
  );

  if (video.url) {
    return (
      <a href={video.url} target="_blank" rel="noopener noreferrer" className="block group">
        {inner}
      </a>
    );
  }
  return <div>{inner}</div>;
}

export function WeeklyPlan({ roadmap, expandedWeek: controlledExpanded, onExpandedWeekChange }: WeeklyPlanProps) {
  const [internalExpanded, setInternalExpanded] = useState<number>(1);
  const isControlled = controlledExpanded !== undefined && onExpandedWeekChange !== undefined;
  const weeklyPlan = roadmap.weeklyPlan ?? [];
  const byMonth = useMemo(() => groupWeeksByMonth(weeklyPlan), [weeklyPlan]);
  const showMonths = weeklyPlan.length > 6;
  const maxWeek = weeklyPlan.length > 0 ? Math.max(1, ...weeklyPlan.map((w) => w.weekNumber ?? w.week ?? 1)) : 1;
  const rawExpanded = isControlled ? controlledExpanded : internalExpanded;
  const expandedWeek = rawExpanded === 0 ? 0 : Math.min(Math.max(1, rawExpanded), maxWeek);
  const setExpandedWeek = isControlled ? onExpandedWeekChange! : setInternalExpanded;

  return (
    <div className="space-y-8">
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
                  const weekNum = week.weekNumber ?? week.week ?? 1;
                  return (
                  <motion.div
                    key={weekNum}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const closing = expandedWeek === weekNum;
                        closing ? playCollapse() : playExpand();
                        setExpandedWeek(closing ? 0 : weekNum);
                      }}
                      className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-600">Week {weekNum}</span>
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
                              <LearningItem key={i} task={task} />
                            ))}
                            {week.recommendedVideos && week.recommendedVideos.length > 0 && (
                              <div className="pt-4 mt-2 border-t border-slate-100">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                  <span className="w-5 h-5 bg-red-50 rounded flex items-center justify-center">
                                    <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.9 31.9 0 000 12a31.9 31.9 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.9 31.9 0 0024 12a31.9 31.9 0 00-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>
                                  </span>
                                  Recommended Videos for This Week
                                </h4>
                                <div className="space-y-2">
                                  {week.recommendedVideos.map((video, vi) => (
                                    <VideoCard key={vi} video={video} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );})}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 leading-relaxed">
          <span className="font-semibold">Remember:</span> This roadmap is a starting point, not a limit. Feel free to explore beyond these resources, dive deeper into topics that excite you, and find your own learning materials. Your curiosity is your best guide.
        </div>
      </div>
    </div>
  );
}
