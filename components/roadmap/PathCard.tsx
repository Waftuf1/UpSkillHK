'use client';

import { motion } from 'framer-motion';
import type { CareerRoadmap } from '@/lib/types';

interface PathCardProps {
  roadmap: CareerRoadmap;
  isSelected: boolean;
  onClick: () => void;
}

const PATH_CONFIG = {
  stay_dominate: { color: 'blue', icon: '🛡️' },
  level_up: { color: 'purple', icon: '🚀' },
  pivot: { color: 'orange', icon: '🧭' },
};

export function PathCard({ roadmap, isSelected, onClick }: PathCardProps) {
  const config = PATH_CONFIG[roadmap.pathType] ?? PATH_CONFIG.stay_dominate;
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50',
    purple: 'border-violet-500 bg-violet-50',
    orange: 'border-orange-500 bg-orange-50',
  };

  return (
    <motion.div
      whileHover={{ scale: isSelected ? 1 : 1.02 }}
      className={`rounded-xl border-2 p-6 cursor-pointer transition-all ${
        isSelected ? colorClasses[config.color as keyof typeof colorClasses] : 'border-slate-200 bg-white hover:border-slate-300'
      } ${!isSelected ? 'opacity-75' : ''}`}
      onClick={onClick}
    >
      <div className="text-3xl mb-3">{config.icon}</div>
      <h3 className="text-xl font-bold text-slate-900">{roadmap.title}</h3>
      <p className="text-slate-600 mt-1">{roadmap.subtitle}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="px-2 py-1 bg-white/80 rounded text-sm font-medium">{roadmap.timeline}</span>
        <span className="px-2 py-1 bg-white/80 rounded text-sm">{roadmap.weeklyCommitment}</span>
      </div>
      {(() => {
        const fromMilestones = roadmap.milestones?.slice(0, 2).flatMap((m) => m.skillsTargeted ?? []).slice(0, 4).filter(Boolean) ?? [];
        const fromTasks = roadmap.weeklyPlan?.slice(0, 2).flatMap((w) => w.tasks?.map((t) => t.skillTargeted).filter(Boolean) ?? []) ?? [];
        const skills = fromMilestones.length > 0 ? fromMilestones : Array.from(new Set(fromTasks)).slice(0, 4);
        return skills.length > 0 ? (
          <div className="mt-4 text-sm text-slate-500">
            Key skills: {skills.join(', ')}
          </div>
        ) : null;
      })()}
    </motion.div>
  );
}
