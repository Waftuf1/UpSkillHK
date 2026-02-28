'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { PathSelector } from '@/components/roadmap/PathSelector';
import { MOCK_ROADMAPS } from '@/lib/mockData';

export default function RoadmapPage() {
  const router = useRouter();
  const { diagnosis, profile, roadmaps, setRoadmaps } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!diagnosis) {
      router.replace('/onboarding');
    }
  }, [diagnosis, router]);

  useEffect(() => {
    if (!diagnosis || roadmaps) {
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
          setRoadmaps(MOCK_ROADMAPS);
        }
      } catch {
        setRoadmaps(MOCK_ROADMAPS);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, [diagnosis, profile, roadmaps, setRoadmaps]);

  if (!diagnosis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!roadmaps || roadmaps.length === 0 || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" />
        <p className="text-slate-600">Generating your career roadmaps...</p>
      </div>
    );
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
