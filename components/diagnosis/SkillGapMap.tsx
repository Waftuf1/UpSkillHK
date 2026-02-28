'use client';

import { motion } from 'framer-motion';
import type { SkillGapMap as SkillGapMapType } from '@/lib/types';
import { GapSummary } from './GapSummary';
import { DataSourcesChart } from './DataSourcesChart';
import { SkillRadarChart } from './SkillRadarChart';
import { SkillCard } from './SkillCard';
import { IndustryContext } from './IndustryContext';
import { FutureForecastSection } from './FutureForecastSection';

interface SkillGapMapProps {
  data: SkillGapMapType;
}

export function SkillGapMap({ data }: SkillGapMapProps) {
  const missing = data.skills.filter((s) => s.status === 'missing');
  const fading = data.skills.filter((s) => s.status === 'fading');
  const strong = data.skills.filter((s) => s.status === 'strong');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-12"
    >
      <GapSummary data={data} />

      <DataSourcesChart />

      {data.topPriorities.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-900 mb-3">🎯 Top 3 priorities for you right now:</h3>
          <ul className="space-y-2">
            {data.topPriorities.map((p, i) => {
              const skill = data.skills.find((s) => s.skillName === p);
              return (
                <li key={p} className="flex items-start gap-2">
                  <span className="text-amber-600 font-medium">{i + 1}.</span>
                  <span className="text-amber-900">{p}</span>
                  {skill?.reasoning && (
                    <span className="text-amber-700 text-sm">— {skill.reasoning}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <SkillRadarChart skills={data.skills} />

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Full Skill List</h3>
        <div className="space-y-4">
          {missing.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-rose-600 mb-2">🔴 Missing ({missing.length})</h4>
              <div className="space-y-3">
                {missing.map((s, i) => (
                  <SkillCard key={s.skillName} skill={s} index={i} />
                ))}
              </div>
            </div>
          )}
          {fading.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-amber-600 mb-2">🟡 Fading ({fading.length})</h4>
              <div className="space-y-3">
                {fading.map((s, i) => (
                  <SkillCard key={s.skillName} skill={s} index={missing.length + i} />
                ))}
              </div>
            </div>
          )}
          {strong.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-emerald-600 mb-2">🟢 Strong ({strong.length})</h4>
              <div className="space-y-3">
                {strong.map((s, i) => (
                  <SkillCard key={s.skillName} skill={s} index={missing.length + fading.length + i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <IndustryContext insights={data.industryInsights} industry={data.industry} />

      <FutureForecastSection data={data} />
    </motion.div>
  );
}
