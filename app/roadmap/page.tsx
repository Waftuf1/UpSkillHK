'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import type { CareerRoadmap } from '@/lib/types';
import { PathSelector } from '@/components/roadmap/PathSelector';
import { WaffleSpinner } from '@/components/ui/WaffleSpinner';

const ROADMAP_LOADING_MESSAGES = [
  'Mapping your career paths...',
  'Analysing skill gaps...',
  'Building week-by-week plans...',
  'Finding HK market opportunities...',
];

export default function RoadmapPage() {
  const router = useRouter();
  const { diagnosis, profile, roadmaps, suitableJobs, setRoadmaps, setSuitableJobs } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(1);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!diagnosis) {
      router.replace('/onboarding');
    }
  }, [diagnosis, router]);

  useEffect(() => {
    if (!diagnosis || roadmaps || error) {
      setLoading(false);
      return;
    }

    const fetchRoadmaps = async () => {
      setLoadingProgress(1);
      setLoadingMessageIndex(0);
      messageRef.current = setInterval(() => {
        setLoadingMessageIndex((i) => (i + 1) % ROADMAP_LOADING_MESSAGES.length);
      }, 1800);
      progressRef.current = setInterval(() => {
        setLoadingProgress((prev) => (prev >= 95 ? 95 : prev + 1));
      }, 280);

      try {
        const res = await fetch('/api/roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            diagnosis,
            preferences: {
              weeklyHours: profile?.weeklyHoursAvailable ?? 5,
              formats: profile?.preferredFormats ?? ['video', 'audio'],
              goal: profile?.primaryGoal ?? 'unsure',
              targetRole: profile?.targetRole,
            },
          }),
        });
        let data: { success?: boolean; roadmaps?: CareerRoadmap[]; suitableJobs?: string[]; error?: string };
        try {
          data = await res.json();
        } catch {
          setError('Invalid response from server. Please try again.');
          return;
        }
        if (data.success && data.roadmaps?.length) {
          if (progressRef.current) clearInterval(progressRef.current);
          setLoadingProgress(100);
          setRoadmaps(data.roadmaps);
          setSuitableJobs(data.suitableJobs ?? []);
        } else {
          setError(data.error || 'Failed to generate roadmaps.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        if (messageRef.current) clearInterval(messageRef.current);
        if (progressRef.current) clearInterval(progressRef.current);
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, [diagnosis, profile, roadmaps, setRoadmaps, setSuitableJobs, error]);

  if (!diagnosis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <WaffleSpinner size={70} />
      </div>
    );
  }

  if (loading) {
    const pct = Math.round(loadingProgress);
    return (
      <div className="min-h-screen bg-zinc-950 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/diagnosis" className="text-zinc-400 hover:text-zinc-100 text-sm mb-6 inline-block transition-colors">
            ← Back to Skill Map
          </Link>

          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">Your Career Roadmaps</h1>
            <p className="text-zinc-400 mt-2">Regenerating your paths...</p>
          </div>

          {suitableJobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 bg-zinc-900/50 rounded-xl border border-zinc-800 p-6"
            >
              <h2 className="text-xl font-bold text-zinc-100 mb-1">Your potential career paths</h2>
              <p className="text-sm text-zinc-500 mb-5">
                Jobs you could move into based on your CV and skills against the Hong Kong market.
              </p>
              <ul className="space-y-2">
                {suitableJobs.map((job, i) => (
                  <li key={job} className="flex items-center gap-3 text-zinc-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-medium">{job}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-8">
            <div className="text-center max-w-md mx-auto">
              <WaffleSpinner size={80} className="mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-zinc-100 mb-2">{ROADMAP_LOADING_MESSAGES[loadingMessageIndex]}</h2>
              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden mt-4">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: '1%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <p className="text-sm text-zinc-500 mt-2 font-medium">{pct}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-2">Something went wrong</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              href={`/problem?message=${encodeURIComponent(error)}&from=roadmap`}
              className="block w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 transition-colors"
            >
              See more & try again
            </Link>
            <Link
              href="/diagnosis"
              className="block w-full py-3 px-4 border border-zinc-700 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Back to Skill Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmaps || roadmaps.length === 0) {
    return null;
  }

  const handleRegenerate = () => {
    setRoadmaps(null);
    setError(null);
    setLoading(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/diagnosis" className="text-zinc-400 hover:text-zinc-100 text-sm mb-6 inline-block transition-colors">
          ← Back to Skill Map
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">Your Career Roadmaps</h1>
              <p className="text-zinc-400 mt-2">
                Choose a path to see milestones, a week-by-week plan with tasks under each path, and your career timeline.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRegenerate}
              className="flex-shrink-0 px-4 py-2.5 border border-zinc-600 rounded-xl text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
            >
              Regenerate roadmaps
            </button>
          </div>
        </motion.div>

        {suitableJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-zinc-900/50 rounded-xl border border-zinc-800 p-6"
          >
            <h2 className="text-xl font-bold text-zinc-100 mb-1">Your potential career paths</h2>
            <p className="text-sm text-zinc-500 mb-5">
              Jobs you could move into based on your CV and skills against the Hong Kong market. Honest and realistic.
            </p>
            <ul className="space-y-2">
              {suitableJobs.map((job, i) => (
                <li key={job} className="flex items-center gap-3 text-zinc-300">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium">{job}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <PathSelector roadmaps={roadmaps} />
      </div>
    </div>
  );
}
