'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { SkillGapMap } from '@/components/diagnosis/SkillGapMap';
import { Button } from '@/components/ui/Button';

export default function DiagnosisPage() {
  const router = useRouter();
  const { diagnosis } = useUser();

  useEffect(() => {
    if (!diagnosis) {
      router.replace('/onboarding');
    }
  }, [diagnosis, router]);

  if (!diagnosis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline text-sm mb-6 inline-block">
          ← Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Your Skill Gap Map</h1>
          <p className="text-slate-600 mt-2">
            Based on your profile as a {diagnosis.role} in {diagnosis.industry}, Hong Kong
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Analysis as of {new Date(diagnosis.generatedAt).toLocaleDateString()}
          </p>
        </motion.div>

        <SkillGapMap data={diagnosis} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to close your gaps?</h3>
          <p className="text-slate-600 mb-6">We&apos;ve prepared 3 personalised career roadmaps for you</p>
          <Link href="/roadmap">
            <Button size="lg">View My Roadmaps →</Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
