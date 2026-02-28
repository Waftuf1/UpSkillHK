'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Card } from '@/components/ui/Card';
import type { SkillGapMap } from '@/lib/types';

interface GapSummaryProps {
  data: SkillGapMap;
}

export function GapSummary({ data }: GapSummaryProps) {
  const readinessColor = data.overallReadiness >= 70 ? 'text-emerald-600' : data.overallReadiness >= 40 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Overall Readiness Score</h2>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="inline-flex flex-col items-center"
        >
          <div className={`text-6xl font-bold ${readinessColor}`}>
            <AnimatedCounter value={data.overallReadiness} />
          </div>
          <span className="text-slate-500 mt-1">Future Readiness Score</span>
        </motion.div>
        <p className="text-slate-600 mt-4">{data.peerComparison}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-emerald-200">
          <div className="text-3xl font-bold text-emerald-700">
            <AnimatedCounter value={data.strongCount} />
          </div>
          <div className="text-emerald-800 font-medium mt-1">skills STRONG</div>
          <div className="text-emerald-600 text-sm mt-1">In demand & you have them</div>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <div className="text-3xl font-bold text-amber-700">
            <AnimatedCounter value={data.fadingCount} />
          </div>
          <div className="text-amber-800 font-medium mt-1">skills FADING</div>
          <div className="text-amber-600 text-sm mt-1">You have them but market is moving</div>
        </Card>
        <Card className="bg-rose-50 border-rose-200">
          <div className="text-3xl font-bold text-rose-700">
            <AnimatedCounter value={data.missingCount} />
          </div>
          <div className="text-rose-800 font-medium mt-1">skills MISSING</div>
          <div className="text-rose-600 text-sm mt-1">Critical gaps to close</div>
        </Card>
      </div>
    </div>
  );
}
