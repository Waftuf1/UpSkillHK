'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';

const SOURCE_DATA = [
  { name: 'HK Job Postings & Demand', value: 35, color: '#2563EB', description: '10,000+ Hong Kong job listings analysed for skill demand', legendLabel: 'HK Job Postings & Demand (35%)' },
  { name: 'Regulatory Frameworks', value: 25, color: '#7C3AED', description: 'HKMA, SFC, HKEX, HKICPA requirements & standards', legendLabel: 'Regulatory Frameworks (25%)' },
  { name: 'Industry Reports & Trends', value: 25, color: '#059669', description: 'Market research, GBA integration, AI disruption signals', legendLabel: 'Industry Reports & Trends (25%)' },
  { name: 'Peer Benchmark Data', value: 15, color: '#F59E0B', description: 'Anonymised professional profiles for comparison', legendLabel: 'Peer Benchmark Data (15%)' },
];

export function DataSourcesChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-1">How we built your diagnosis</h3>
      <p className="text-sm text-slate-500 mb-6">Our methodology combines multiple data sources for a credible, HK-specific assessment</p>

      <div className="flex flex-col lg:flex-row gap-8 items-center">
        <div className="w-full lg:w-1/2 h-64 lg:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SOURCE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ value }) => `${value}%`}
                labelLine={false}
              >
                {SOURCE_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => {
                  const desc = props?.payload?.description ?? '';
                  return [`${value}% — ${desc}`, name];
                }}
              />
              <Legend
                formatter={(_value, entry, index) => SOURCE_DATA[index]?.legendLabel ?? entry.value}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full lg:w-1/2 space-y-4">
          <h4 className="font-semibold text-slate-900">Why you can trust this analysis</h4>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Hong Kong–specific:</strong> We focus exclusively on HK job market, regulations, and regional trends — not generic global data.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Multi-source triangulation:</strong> Demand signals are cross-checked across job postings, regulatory bodies, and industry reports.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Transparent methodology:</strong> We show exactly what data feeds into your assessment — no black box.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Current & relevant:</strong> Analysis reflects 2025–2026 conditions, including GBA integration and AI disruption.</span>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
