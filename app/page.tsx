'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 1 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            AI-Powered Career Skill Diagnosis for Hong Kong
          </h1>
          <p className="text-xl text-slate-600 mb-10">
            Discover your skill gaps, see what the market demands, and get three personalised career roadmaps — all in under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                Start Free Diagnosis →
              </motion.span>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 1 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
        >
          {[
            { icon: '🟢', title: 'Skill Gap Map', desc: 'See which skills are strong, fading, or missing' },
            { icon: '📊', title: 'Market Demand', desc: 'Compare your skills to HK job market needs' },
            { icon: '🗺️', title: '3 Roadmaps', desc: 'Stay, Level Up, or Pivot — your choice' },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-semibold text-slate-900 mt-2">{item.title}</h3>
              <p className="text-slate-600 text-sm mt-1">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
