'use client';

import { motion } from 'framer-motion';
import type { LearningTask } from '@/lib/types';

interface LearningItemProps {
  task: LearningTask;
}

const FORMAT_ICONS: Record<string, string> = {
  video: '🎥',
  audio: '🎧',
  reading: '📖',
  interactive: '🎮',
  practice: '✏️',
  quiz: '📝',
  reflection: '💭',
};

export function LearningItem({ task }: LearningItemProps) {
  const icon = FORMAT_ICONS[task.format] || '📄';
  const difficultyDots = task.difficulty === 'beginner' ? 1 : task.difficulty === 'intermediate' ? 2 : 3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-4 p-4 bg-slate-50 rounded-lg"
    >
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900">{task.title}</div>
        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="px-2 py-0.5 bg-white rounded text-xs font-medium">{task.duration}</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{task.skillTargeted}</span>
          <span className="text-slate-400 text-xs">
            {'•'.repeat(difficultyDots)} {task.difficulty}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
