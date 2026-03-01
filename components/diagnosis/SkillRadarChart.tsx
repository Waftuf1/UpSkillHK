'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
  }));

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-zinc-800 rounded-xl border border-zinc-600 p-6"
    >
      <h3 className="text-lg font-semibold text-zinc-100 mb-1">Skill Comparison</h3>
      <p className="text-sm text-zinc-500 mb-4">Your skills vs. Hong Kong market demand by category</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis type="number" domain={[0, 100]} stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
            <YAxis type="category" dataKey="subject" stroke="#71717a" tick={{ fill: '#a1a1aa', fontSize: 12 }} width={70} />
            <Tooltip
              contentStyle={{ backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px' }}
              labelStyle={{ color: '#fafafa' }}
            />
            <Legend />
            <Bar name="Your Skills" dataKey="user" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
            <Bar name="Market Demand" dataKey="market" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
