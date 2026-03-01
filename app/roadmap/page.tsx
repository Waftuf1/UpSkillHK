'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import type { CareerRoadmap } from '@/lib/types';
import { PathSelector } from '@/components/roadmap/PathSelector';
import { RoadmapChat } from '@/components/roadmap/RoadmapChat';
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
  const [activePath, setActivePath] = useState<string | null>(null);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <WaffleSpinner size={70} />
      </div>
    );
  }

  if (loading) {
    const pct = Math.round(loadingProgress);
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/diagnosis" className="text-blue-600 hover:underline text-sm mb-6 inline-block">
            ← Back to Skill Map
          </Link>

          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Your Career Roadmaps</h1>
            <p className="text-slate-600 mt-2">Regenerating your paths...</p>
          </div>

          {suitableJobs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-1">Your potential career paths</h2>
              <p className="text-sm text-slate-600 mb-5">
                Jobs you could move into based on your CV and skills against the Hong Kong market.
              </p>
              <ul className="space-y-2">
                {suitableJobs.map((job, i) => (
                  <li key={job} className="flex items-center gap-3 text-slate-800">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-medium">{job}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <div className="text-center max-w-md mx-auto">
              <WaffleSpinner size={80} className="mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{ROADMAP_LOADING_MESSAGES[loadingMessageIndex]}</h2>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden mt-4">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
                  initial={{ width: '1%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <p className="text-sm text-slate-500 mt-2 font-medium">{pct}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-rose-200 shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              href={`/problem?message=${encodeURIComponent(error)}&from=roadmap`}
              className="block w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              See more & try again
            </Link>
            <Link
              href="/diagnosis"
              className="block w-full py-3 px-4 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
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
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/diagnosis" className="text-blue-600 hover:underline text-sm mb-6 inline-block">
          ← Back to Skill Map
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Your Career Roadmaps</h1>
              <p className="text-slate-600 mt-2">
                Choose a path to see milestones, a week-by-week plan with tasks under each path, and your career timeline.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRegenerate}
              className="flex-shrink-0 px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-white hover:border-slate-400 transition-colors"
            >
              🔄 Regenerate roadmaps
            </button>
          </div>
        </motion.div>

        {suitableJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-1">Your potential career paths</h2>
            <p className="text-sm text-slate-600 mb-5">
              Jobs you could move into based on your CV and skills against the Hong Kong market. Honest and realistic.
            </p>
            <ul className="space-y-2">
              {suitableJobs.map((job, i) => (
                <li key={job} className="flex items-center gap-3 text-slate-800">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium">{job}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <PathSelector roadmaps={roadmaps} onPathChange={setActivePath} />
        <RoadmapChat roadmaps={roadmaps} selectedPath={activePath ?? undefined} />
      </div>
    </div>
  );
}
