'use client';

import { motion } from 'framer-motion';

interface IndustryContextProps {
  insights: string[];
  industry: string;
}

const INSIGHT_ICONS = ['📈', '⚠️', '💡', '📊', '🎯'];

export function IndustryContext({ insights, industry }: IndustryContextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6"
    >
      <h3 className="text-lg font-semibold text-zinc-100 mb-4">
        Overview: What&apos;s changing in Hong Kong
      </h3>
      <p className="text-sm text-zinc-500 mb-3">
        Trends and shifts in {industry} relevant to your role.
      </p>
      <ul className="space-y-3">
        {insights.map((insight, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-xl flex-shrink-0">{INSIGHT_ICONS[i % INSIGHT_ICONS.length]}</span>
            <span className="text-zinc-400">{insight}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
