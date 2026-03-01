'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { RoleInput } from '@/components/onboarding/RoleInput';
import { CVUpload } from '@/components/onboarding/CVUpload';
import { ProfileConfirm } from '@/components/onboarding/ProfileConfirm';
import { WaffleSpinner } from '@/components/ui/WaffleSpinner';
import type { UserProfile } from '@/lib/types';

const PROFILE_STORAGE_KEY = 'upskillhk-profile';

const LOADING_MESSAGES = [
  'Scanning Hong Kong market data...',
  'Analysing 10,000+ job postings...',
  'Mapping industry demand signals...',
  'Comparing with peer profiles...',
  'Building your personalised skill map...',
];

export default function OnboardingPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-950"><div className="animate-spin w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>}>
      <OnboardingPage />
    </Suspense>
  );
}

function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { diagnosis, setProfile, setDiagnosis } = useUser();
  const [step, setStep] = useState(1);
  const [inputMethod, setInputMethod] = useState<'cv' | 'manual' | null>(null);
  const [profile, setProfileState] = useState<Partial<UserProfile> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restoredRef = useRef(false);

  // Restore profile & step when navigating back from diagnosis
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const wantStep = searchParams.get('step');
    if (wantStep === '2') {
      try {
        const raw = sessionStorage.getItem(PROFILE_STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<UserProfile>;
          if (saved?.currentRole && saved?.industry) {
            setProfileState(saved);
            setProfile(saved as UserProfile);
            setStep(2);
          }
        }
      } catch {}
    }
  }, [searchParams, setProfile]);

  // If step 2 but no profile, reset to step 1 (handles cleared storage / edge cases)
  useEffect(() => {
    if (step === 2 && !profile) setStep(1);
  }, [step, profile]);

  useEffect(() => {
    if (!isGenerating) return;
    const msgId = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    setLoadingProgress(0);
    progressRef.current = setInterval(() => {
      setLoadingProgress((prev) => (prev >= 95 ? 95 : prev + 1));
    }, 315);
    return () => {
      clearInterval(msgId);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isGenerating]);

  const saveProfile = (p: Partial<UserProfile>) => {
    setProfileState(p);
    setProfile(p as UserProfile);
    try { sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(p)); } catch {}
  };

  const handleCVSuccess = (p: UserProfile) => {
    saveProfile(p);
    setStep(2);
  };

  const handleManualComplete = (p: Partial<UserProfile>) => {
    saveProfile(p);
    setStep(2);
  };

  const handleGenerate = async (updatedProfile?: Partial<UserProfile>) => {
    const source = updatedProfile ?? profile;
    if (!source) return;

    const fullProfile: UserProfile = {
      name: source.name,
      currentRole: source.currentRole || '',
      industry: source.industry || '',
      subSector: source.subSector,
      seniorityLevel: source.seniorityLevel || 'mid',
      yearsExperience: source.yearsExperience ?? 3,
      location: source.location || 'Hong Kong',
      hardSkills: source.hardSkills || [],
      softSkills: source.softSkills || [],
      tools: source.tools || [],
      certifications: source.certifications || [],
      languages: source.languages || [],
      education: source.education || [],
      primaryGoal: source.primaryGoal || 'unsure',
      targetRole: source.targetRole,
      weeklyHoursAvailable: source.weeklyHoursAvailable ?? 5,
      preferredFormats: source.preferredFormats || ['video', 'audio'],
    };

    saveProfile(fullProfile);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: fullProfile }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Diagnosis failed');
      setDiagnosis(data.diagnosis);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('upskillhk-diagnosis', JSON.stringify(data.diagnosis));
        } catch {}
      }
      if (progressRef.current) clearInterval(progressRef.current);
      setLoadingProgress(100);
      await new Promise((r) => setTimeout(r, 500));
      router.push('/diagnosis');
      // Keep isGenerating=true on success so step 2 doesn't flash before navigation completes
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      const message = err instanceof Error ? err.message : 'Skill map generation failed.';
      router.push(`/problem?message=${encodeURIComponent(message)}&from=onboarding`);
    }
  };

  if (isGenerating) {
    const pct = Math.round(loadingProgress);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
        <div className="text-center max-w-md w-full">
          <WaffleSpinner size={90} className="mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Generating your Skill Gap Map</h2>
          <p className="text-zinc-400 mb-5">{LOADING_MESSAGES[loadingMessageIndex]}</p>
          <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <p className="text-sm text-zinc-500 mt-2 font-medium">{pct}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-zinc-100 text-sm mb-6 inline-block transition-colors">
          ← Back to home
        </Link>

        <StepIndicator currentStep={step} totalSteps={3} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <p className="text-sm font-medium text-zinc-500">Step 1 of 3</p>
              <h1 className="text-2xl font-bold text-zinc-100">How should we get to know you?</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setInputMethod('cv')}
                  className="p-6 rounded-xl border border-zinc-600 bg-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-700/80 text-left transition-all"
                >
                  <div className="text-2xl mb-2">📤</div>
                  <h3 className="font-semibold text-zinc-100">Upload CV</h3>
                  <p className="text-sm text-zinc-500 mt-1">PDF or DOCX — we&apos;ll extract everything automatically</p>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod('manual')}
                  className="p-6 rounded-xl border border-zinc-600 bg-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-700/80 text-left transition-all"
                >
                  <div className="text-2xl mb-2">✏️</div>
                  <h3 className="font-semibold text-zinc-100">Tell us manually</h3>
                  <p className="text-sm text-zinc-500 mt-1">Answer 4 quick questions — takes 90 seconds</p>
                </button>
              </div>

              {inputMethod === 'cv' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                  <CVUpload onSuccess={handleCVSuccess} onUseManual={() => setInputMethod('manual')} />
                </motion.div>
              )}
              {inputMethod === 'manual' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                  <RoleInput onComplete={handleManualComplete} />
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && profile && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-zinc-500">Step 2 of 3</p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                  ← Back to Step 1
                </button>
              </div>
              <ProfileConfirm
                profile={profile}
                onGenerate={handleGenerate}
              />
              {diagnosis && (
                <button
                  type="button"
                  onClick={() => router.push('/diagnosis')}
                  className="w-full mt-3 px-8 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  View existing results (no changes) →
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
