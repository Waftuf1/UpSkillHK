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
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : skill.status === 'fading'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-rose-100 text-rose-800 border-rose-200';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
    >
      {/* Status + skill name header — impossible to miss */}
      <div className={`px-4 py-3 border-b ${statusBg}`}>
        <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{statusLabel}</div>
        <h4 className="font-bold text-xl leading-tight">{skill.skillName || 'Unnamed Skill'}</h4>
      </div>
      <div className="p-4">
        {/* Meta: category, priority, trend */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge variant="default">{skill.category}</Badge>
          {skill.priority === 'critical' && <Badge variant="critical">Critical</Badge>}
          <span className="text-slate-500 text-sm">{trendIcon} {skill.demandTrend}</span>
        </div>
      {/* Data: your level & market demand with numbers */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">Your level: {skill.userLevel}</div>
          <ProgressBar value={skill.userLevel} color="blue" />
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Market demand: {skill.marketDemand}</div>
          <ProgressBar value={skill.marketDemand} color="amber" />
        </div>
      </div>
      {/* Reasoning and time to acquire — always visible */}
      <div className="pt-3 border-t border-slate-200 text-sm text-slate-600">
        <p><strong>Why:</strong> {skill.reasoning}</p>
        {skill.timeToAcquire && (
          <p className="mt-2"><strong>Time to acquire:</strong> {skill.timeToAcquire}</p>
        )}
      </div>
      </div>
    </motion.div>
  );
}
