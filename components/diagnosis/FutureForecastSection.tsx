'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SkillGapMap as SkillGapMapType, FutureForecastItem } from '@/lib/types';

interface FutureForecastSectionProps {
  data: SkillGapMapType;
}

export function FutureForecastSection({ data }: FutureForecastSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const detail = data.futureForecastDetail && data.futureForecastDetail.length > 0
    ? data.futureForecastDetail
    : (data.futureForecast ?? []).map((title) => ({ title } as FutureForecastItem));

  if (detail.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-violet-50 border border-violet-200 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-violet-900 mb-2">Future forecast (next 1–2 years)</h3>
      <p className="text-sm text-violet-700 mb-4">
        Skills and capabilities likely to become more important for your role in Hong Kong, based on trends from the past 6 months.
      </p>
      <ul className="space-y-3">
        {detail.map((item, i) => (
          <li key={i} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-medium text-violet-800">{item.title}</span>
              {(item.explanation || item.dataUsed || (item.links && item.links.length > 0)) ? (
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-200/80 text-violet-900 text-sm font-medium hover:bg-violet-200 transition-colors"
                  aria-expanded={openIndex === i}
                >
                  {openIndex === i ? 'Hide details' : 'In-depth explanation'}
                  <span className="text-violet-600">{openIndex === i ? '−' : '+'}</span>
                </button>
              ) : null}
            </div>
            <AnimatePresence>
              {openIndex === i && (item.explanation || item.dataUsed || (item.links && item.links.length > 0)) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-4 bg-white rounded-lg border border-violet-200 text-sm text-slate-700 space-y-3">
                    {item.explanation && (
                      <div>
                        <p className="font-medium text-slate-900 mb-1">Why this skill is increasing</p>
                        <p>{item.explanation}</p>
                      </div>
                    )}
                    {item.dataUsed && (
                      <div>
                        <p className="font-medium text-slate-900 mb-1">Data used for this forecast</p>
                        <p>{item.dataUsed}</p>
                      </div>
                    )}
                    {item.links && item.links.length > 0 && (
                      <div>
                        <p className="font-medium text-slate-900 mb-2">Sources &amp; links</p>
                        <ul className="space-y-1.5">
                          {item.links.map((url, j) => (
                            <li key={j}>
                              <a
                                href={url.startsWith('http') ? url : `https://${url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-violet-600 hover:underline break-all"
                              >
                                {url.replace(/^https?:\/\//, '')}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
