'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { SkillGapMap } from '@/components/diagnosis/SkillGapMap';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { WaffleSpinner } from '@/components/ui/WaffleSpinner';
import { Button } from '@/components/ui/Button';
import type { SkillGapMap as SkillGapMapType } from '@/lib/types';

const STORAGE_KEY = 'upskillhk-diagnosis';

export default function DiagnosisPage() {
  const router = useRouter();
  const { diagnosis, setDiagnosis } = useUser();

  useEffect(() => {
    if (diagnosis) return;
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SkillGapMapType;
        setDiagnosis(parsed);
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
    } catch {}
    router.replace('/onboarding');
  }, [diagnosis, setDiagnosis, router]);

  if (!diagnosis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <WaffleSpinner size={64} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Home
          </Link>
          <Link href="/onboarding?step=2" className="text-blue-600 hover:underline text-sm">
            ← Back to Step 2
          </Link>
        </div>

        <StepIndicator currentStep={3} totalSteps={3} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-sm font-medium text-slate-500 mb-1">Step 3 of 3</p>
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
