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
    : (data.futureForecast ?? []).map((item): FutureForecastItem => {
        if (typeof item === 'string') return { title: item };
        if (item && typeof item === 'object' && 'title' in item) return item as FutureForecastItem;
        const o = item as Record<string, unknown>;
        const title = o?.title ?? o?.name ?? o?.skill ?? o?.text;
        return { title: typeof title === 'string' ? title : String(item) };
      });

  if (detail.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-zinc-800 border border-zinc-600 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-emerald-400 mb-2">Future forecast (next 1–2 years)</h3>
      <p className="text-sm text-zinc-400 mb-4">
        Skills and capabilities likely to become more important for your role in Hong Kong, based on trends from the past 6 months.
      </p>
      <ul className="space-y-3">
        {detail.map((item, i) => (
          <li key={i} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-medium text-zinc-200">{typeof item.title === 'string' ? item.title : String(item.title ?? '')}</span>
              {(item.explanation || item.dataUsed || (item.links && item.links.length > 0)) ? (
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                  aria-expanded={openIndex === i}
                >
                  {openIndex === i ? 'Hide details' : 'In-depth explanation'}
                  <span className="text-emerald-400">{openIndex === i ? '−' : '+'}</span>
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
                  <div className="mt-2 p-4 bg-zinc-900 rounded-lg border border-zinc-600 text-sm text-zinc-400 space-y-3">
                    {item.explanation && (
                      <div>
                        <p className="font-medium text-zinc-200 mb-1">Why this skill is increasing</p>
                        <p>{item.explanation}</p>
                      </div>
                    )}
                    {item.dataUsed && (
                      <div>
                        <p className="font-medium text-zinc-200 mb-1">Data used for this forecast</p>
                        <p>{item.dataUsed}</p>
                      </div>
                    )}
                    {item.links && item.links.length > 0 && (
                      <div>
                        <p className="font-medium text-zinc-200 mb-2">Sources &amp; links</p>
                        <ul className="space-y-1.5">
                          {item.links.map((url, j) => (
                            <li key={j}>
                              <a
                                href={url.startsWith('http') ? url : `https://${url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:underline break-all"
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
