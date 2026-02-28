'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import type { SkillAssessment } from '@/lib/types';

interface SkillCardProps {
  skill: SkillAssessment;
  index: number;
}

export function SkillCard({ skill, index }: SkillCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusLabel = skill.status === 'strong' ? 'STRONG' : skill.status === 'fading' ? 'FADING' : 'MISSING';
  const trendIcon = skill.demandTrend === 'rising' ? '↑' : skill.demandTrend === 'stable' ? '→' : '↓';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">{skill.skillName}</span>
            <Badge variant={skill.status === 'strong' ? 'strong' : skill.status === 'fading' ? 'fading' : 'missing'}>
              {statusLabel}
            </Badge>
            <Badge variant="default">{skill.category}</Badge>
            {skill.priority === 'critical' && <Badge variant="critical">Critical</Badge>}
            <span className="text-slate-500 text-sm">{trendIcon} {skill.demandTrend}</span>
          </div>
          <span className="text-slate-400">{expanded ? '−' : '+'}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-slate-500 mb-1">Your Level</div>
            <ProgressBar value={skill.userLevel} color="blue" />
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Market Demand</div>
            <ProgressBar value={skill.marketDemand} color="amber" />
          </div>
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600">
              <p><strong>Why:</strong> {skill.reasoning}</p>
              {skill.timeToAcquire && (
                <p className="mt-2"><strong>Time to acquire:</strong> {skill.timeToAcquire}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
