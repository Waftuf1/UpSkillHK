'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { PathSelector } from '@/components/roadmap/PathSelector';

export default function RoadmapPage() {
  const router = useRouter();
  const { diagnosis, profile, roadmaps, setRoadmaps } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const data = await res.json();
        if (data.success && data.roadmaps?.length) {
          setRoadmaps(data.roadmaps);
        } else {
          setError(data.error || 'Failed to generate roadmaps.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, [diagnosis, profile, roadmaps, setRoadmaps, error]);

  if (!diagnosis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-slate-600">Generating your career roadmaps...</p>
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
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Your Career Roadmaps</h1>
          <p className="text-slate-600 mt-2">
            Choose a path and explore your week-by-week learning plan
          </p>
        </motion.div>

        <PathSelector roadmaps={roadmaps} />
      </div>
    </div>
  );
}
