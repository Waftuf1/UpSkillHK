'use client';

import { motion } from 'framer-motion';
import type { CareerRoadmap } from '@/lib/types';

interface PathPreviewProps {
  roadmap: CareerRoadmap;
}

export function PathPreview({ roadmap }: PathPreviewProps) {
  const skills = Array.from(new Set((roadmap.milestones ?? []).flatMap((m) => m.skillsTargeted ?? []))).slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-700 p-6"
    >
      <div className="relative">
        <p className="text-xs font-medium text-emerald-500/80 uppercase tracking-wider mb-2">Your path</p>
        <h3 className="text-lg font-bold text-zinc-100 mb-1">{roadmap.targetOutcome}</h3>
        <p className="text-sm text-zinc-400 mb-4">{roadmap.subtitle}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-600 text-sm font-medium text-zinc-300">
            <span className="text-emerald-500">⏱</span> {roadmap.timeline}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-600 text-sm font-medium text-zinc-300">
            <span className="text-emerald-500">📅</span> {roadmap.weeklyCommitment}
          </span>
        </div>

        {skills.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 mb-2">Skills you&apos;ll build</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-600 text-xs font-medium text-zinc-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
