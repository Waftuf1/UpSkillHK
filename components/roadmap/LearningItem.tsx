'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LearningTask, LearningResource } from '@/lib/types';

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

const RESOURCE_ICONS: Record<string, string> = {
  video: '🎥',
  article: '📄',
  course: '📚',
  tool: '🛠️',
};

function ResourceBlock({ resource }: { resource: LearningResource }) {
  const icon = RESOURCE_ICONS[resource.type] || '📄';
  const content = (
    <div className="flex gap-3 p-3 bg-white rounded-lg border border-slate-100 items-start">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 text-sm">{resource.title}</div>
        {resource.description && (
          <p className="text-xs text-slate-600 mt-0.5">{resource.description}</p>
        )}
      </div>
      {resource.url && (
        <span className="text-xs text-blue-600 font-medium flex-shrink-0">Open ↗</span>
      )}
    </div>
  );
  if (resource.url) {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:border-blue-300 rounded-lg transition-colors border border-transparent"
      >
        {content}
      </a>
    );
  }
  return <div className="rounded-lg">{content}</div>;
}

export function LearningItem({ task }: LearningItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const icon = FORMAT_ICONS[task.format] || '📄';
  const difficultyDots = task.difficulty === 'beginner' ? 1 : task.difficulty === 'intermediate' ? 2 : 3;
  const hasDetails = task.learningGuide || (task.resources && task.resources.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-0 p-4 bg-slate-50 rounded-lg border border-slate-100"
    >
      <div className="flex gap-4">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-900">{task.title}</div>
          <p className="text-sm text-slate-600 mt-1">{task.description}</p>
          <div className="flex flex-wrap gap-2 mt-2 items-center">
            <span className="px-2 py-0.5 bg-white rounded text-xs font-medium">{task.duration}</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{task.skillTargeted}</span>
            <span className="text-slate-400 text-xs">
              {'•'.repeat(difficultyDots)} {task.difficulty}
            </span>
            {hasDetails && (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 ml-1"
              >
                {showDetails ? 'Hide details' : 'How to do this →'}
              </button>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showDetails && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 pl-12 sm:pl-14">
              {task.learningGuide && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">How to approach this</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{task.learningGuide}</p>
                </div>
              )}
              {task.resources && task.resources.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Suggested resources</h4>
                  <div className="space-y-2">
                    {task.resources.map((resource, i) => (
                      <ResourceBlock key={i} resource={resource} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
