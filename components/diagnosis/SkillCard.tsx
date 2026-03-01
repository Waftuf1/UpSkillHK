'use client';

import { motion } from 'framer-motion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import type { SkillAssessment } from '@/lib/types';

interface SkillCardProps {
  skill: SkillAssessment;
  index: number;
}

export function SkillCard({ skill, index }: SkillCardProps) {
  const statusLabel = skill.status === 'strong' ? 'Strong' : skill.status === 'fading' ? 'Fading' : 'Missing';
  const trendIcon = skill.demandTrend === 'rising' ? '↑' : skill.demandTrend === 'stable' ? '→' : '↓';
  const statusBg =
    skill.status === 'strong'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      : skill.status === 'fading'
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-zinc-800 rounded-xl border border-zinc-600 overflow-hidden"
    >
      <div className={`px-4 py-3 border-b border-zinc-700 ${statusBg}`}>
        <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{statusLabel}</div>
        <h4 className="font-bold text-xl leading-tight text-zinc-100">{skill.skillName || 'Unnamed Skill'}</h4>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="default">{skill.category}</Badge>
          {skill.priority === 'critical' && <Badge variant="critical">Critical</Badge>}
          <span className="text-zinc-500 text-sm">{trendIcon} {skill.demandTrend}</span>
        </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-zinc-500 mb-1">Your level: {skill.userLevel}</div>
          <ProgressBar value={skill.userLevel} color="blue" />
        </div>
        <div>
          <div className="text-xs text-zinc-500 mb-1">Market demand: {skill.marketDemand}</div>
          <ProgressBar value={skill.marketDemand} color="amber" />
        </div>
      </div>
      <div className="pt-3 border-t border-zinc-700 text-sm text-zinc-400">
        <p><strong>Why:</strong> {skill.reasoning}</p>
        {skill.timeToAcquire && (
          <p className="mt-2"><strong>Time to acquire:</strong> {skill.timeToAcquire}</p>
        )}
      </div>
      </div>
    </motion.div>
  );
}
