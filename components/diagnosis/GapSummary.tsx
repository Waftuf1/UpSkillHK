'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Card } from '@/components/ui/Card';
import type { SkillGapMap, ReadinessRubric } from '@/lib/types';

interface GapSummaryProps {
  data: SkillGapMap;
}

const RUBRIC_ITEMS: { key: keyof ReadinessRubric; label: string; max: number; desc: string }[] = [
  { key: 'skillCoverage',    label: 'Skill Coverage',    max: 30, desc: '% of market skills you have' },
  { key: 'criticalGaps',     label: 'Critical Gaps',     max: 25, desc: 'Penalty for missing critical skills' },
  { key: 'proficiencyDepth', label: 'Proficiency Depth', max: 20, desc: 'How deep your strong skills are' },
  { key: 'trendAlignment',   label: 'Trend Alignment',   max: 15, desc: 'Your skills match rising demand' },
  { key: 'fadingRisk',       label: 'Fading Risk',       max: 10, desc: 'Penalty for obsolete skills' },
];

const RUBRIC_CRITERIA = [
  {
    title: 'Skill Coverage',
    weight: '30 points',
    formula: '(Strong skills / Total assessed skills) x 30',
    detail: 'Measures what proportion of the skills the HK market needs for your role you actually have on your CV. More strong skills = higher coverage.',
  },
  {
    title: 'Critical Gaps',
    weight: '25 points',
    formula: 'Starts at 25, loses points for each critical missing skill',
    detail: 'Identifies skills the market urgently demands (marketDemand >= 60) that are absent from your CV. Each critical gap reduces this score proportionally.',
  },
  {
    title: 'Proficiency Depth',
    weight: '20 points',
    formula: 'Average (your level / market demand) across strong skills x 20',
    detail: 'For skills you do have, how deep is your proficiency relative to what the market expects? A skill listed on your CV but with shallow experience scores lower.',
  },
  {
    title: 'Trend Alignment',
    weight: '15 points',
    formula: '(Strong skills with rising demand / Strong skills) x 15',
    detail: 'Are your existing skills aligned with where the HK market is heading? Based on 5-year demand trajectory (2020-2025). Skills in rising demand score higher.',
  },
  {
    title: 'Fading Risk',
    weight: '10 points',
    formula: 'Starts at 10, loses points for each fading skill',
    detail: 'Penalises for skills on your CV that the market no longer values or is moving away from. Fewer obsolete skills = less risk = higher score.',
  },
];

function computeConfidence(data: SkillGapMap): number {
  if (data.skills.length < 2) return 8;
  const contributions = data.skills.map(
    (s) => (s.userLevel / 100) * (s.marketDemand / 100)
  );
  const mean = contributions.reduce((a, b) => a + b, 0) / contributions.length;
  const variance =
    contributions.reduce((sum, c) => sum + (c - mean) ** 2, 0) / contributions.length;
  const sd = Math.sqrt(variance) * 100;
  return Math.max(4, Math.min(15, Math.round(sd)));
}

export function GapSummary({ data }: GapSummaryProps) {
  const [showCriteria, setShowCriteria] = useState(false);
  const score = data.overallReadiness;
  const spread = computeConfidence(data);
  const lo = Math.max(0, score - spread);
  const hi = Math.min(100, score + spread);
  const rubric = data.rubric;

  const readinessColor =
    score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400';
  const barColor =
    score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  const rangeBg =
    score >= 70 ? 'bg-emerald-500/30' : score >= 40 ? 'bg-amber-500/30' : 'bg-rose-500/30';

  return (
    <div className="space-y-8">
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-8">
        <div className="text-center">
          <h2 className="text-xl font-bold text-zinc-100 mb-4">Overall Readiness Score</h2>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex flex-col items-center mb-5"
          >
            <div className={`text-6xl font-bold ${readinessColor}`}>
              <AnimatedCounter value={score} />
            </div>
            <span className="text-zinc-500 text-sm mt-1">out of 100</span>
          </motion.div>

          {/* Confidence bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className={`absolute top-0 h-full rounded-full ${rangeBg}`}
                initial={{ width: 0, left: `${score}%` }}
                animate={{ width: `${hi - lo}%`, left: `${lo}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
              <motion.div
                className={`absolute top-0 h-full rounded-full ${barColor}`}
                style={{ width: 6 }}
                initial={{ left: '0%' }}
                animate={{ left: `calc(${score}% - 3px)` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-1.5">
              <span>0</span>
              <span className="text-zinc-400 font-medium">
                Confidence range: {lo}–{hi}
              </span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Rubric breakdown */}
        {rubric && (
          <div className="border-t border-zinc-800 pt-5 mt-2">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Score Breakdown</h3>
            <div className="space-y-3">
              {RUBRIC_ITEMS.map((item) => {
                const val = rubric[item.key];
                const pct = (val / item.max) * 100;
                const barCl =
                  pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                return (
                  <div key={item.key}>
                    <div className="flex items-baseline justify-between text-sm mb-1">
                      <span className="text-zinc-300 font-medium">{item.label}</span>
                      <span className="text-zinc-500 text-xs">{val}/{item.max}</span>
                    </div>
                    <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${barCl}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* "How is this scored?" button */}
        <div className="text-center mt-5">
          <button
            type="button"
            onClick={() => setShowCriteria(!showCriteria)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showCriteria ? 'Hide scoring criteria' : 'How is this scored?'}
          </button>
        </div>

        <AnimatePresence>
          {showCriteria && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border border-zinc-600 rounded-xl bg-zinc-800/50 p-6">
                <h3 className="text-base font-bold text-zinc-100 mb-1">Scoring Rubric</h3>
                <p className="text-xs text-zinc-500 mb-4">
                  Your readiness score is calculated from 5 weighted components based on your CV compared against Hong Kong market data from the past 5 years (2020–2025).
                </p>
                <div className="space-y-4">
                  {RUBRIC_CRITERIA.map((c, i) => (
                    <div key={i} className="bg-zinc-900/50 rounded-lg border border-zinc-700 p-4">
                      <div className="flex items-baseline justify-between mb-1">
                        <h4 className="font-semibold text-zinc-200 text-sm">{c.title}</h4>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">{c.weight}</span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono mb-2">{c.formula}</p>
                      <p className="text-sm text-zinc-400">{c.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-300">
                  <strong>Data sources:</strong> Market demand and trend data are sourced via AI web search from HK job boards (JobsDB, LinkedIn HK, jobs.gov.hk), regulatory bodies (HKMA, SFC, HKEX), and salary surveys. The confidence range reflects the statistical variance across your skill assessments.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {data.peerComparison && (
          <p className="text-zinc-400 mt-5 text-sm text-center">{data.peerComparison}</p>
        )}
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-rose-500/10 border-rose-500/30 text-center">
          <div className="text-3xl font-bold text-rose-400">
            <AnimatedCounter value={data.missingCount} />
          </div>
          <div className="text-rose-300 font-medium text-sm mt-1">Missing</div>
          <div className="text-rose-500/80 text-xs mt-0.5">Not on your CV</div>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30 text-center">
          <div className="text-3xl font-bold text-amber-400">
            <AnimatedCounter value={data.fadingCount} />
          </div>
          <div className="text-amber-300 font-medium text-sm mt-1">Fading</div>
          <div className="text-amber-500/80 text-xs mt-0.5">On CV, declining demand</div>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/30 text-center">
          <div className="text-3xl font-bold text-emerald-400">
            <AnimatedCounter value={data.strongCount} />
          </div>
          <div className="text-emerald-300 font-medium text-sm mt-1">Strong</div>
          <div className="text-emerald-500/80 text-xs mt-0.5">On CV & in demand</div>
        </Card>
      </div>
    </div>
  );
}
