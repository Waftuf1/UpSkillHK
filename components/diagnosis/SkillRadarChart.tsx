'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import type { SkillAssessment } from '@/lib/types';

interface SkillRadarChartProps {
  skills: SkillAssessment[];
}

export function SkillRadarChart({ skills }: SkillRadarChartProps) {
  // Group by category and average
  const byCategory = skills.reduce<Record<string, { user: number[]; market: number[] }>>((acc, s) => {
    const cat = s.category;
    if (!acc[cat]) acc[cat] = { user: [], market: [] };
    acc[cat].user.push(s.userLevel);
    acc[cat].market.push(s.marketDemand);
    return acc;
  }, {});

  const chartData = Object.entries(byCategory).map(([name, vals]) => ({
    subject: name.charAt(0).toUpperCase() + name.slice(1),
    user: Math.round(vals.user.reduce((a, b) => a + b, 0) / vals.user.length),
    market: Math.round(vals.market.reduce((a, b) => a + b, 0) / vals.market.length),
    fullMark: 100,
  }));

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Skill Comparison</h3>
      <p className="text-sm text-slate-500 mb-4">Your skills vs. Hong Kong market demand</p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Your Skills" dataKey="user" stroke="#2563EB" fill="#2563EB" fillOpacity={0.4} />
            <Radar name="Market Demand" dataKey="market" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} strokeDasharray="5 5" />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
