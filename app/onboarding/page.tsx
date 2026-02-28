'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { RoleInput } from '@/components/onboarding/RoleInput';
import { CVUpload } from '@/components/onboarding/CVUpload';
import { LinkedInInput } from '@/components/onboarding/LinkedInInput';
import { ProfileConfirm } from '@/components/onboarding/ProfileConfirm';
import { MOCK_PROFILE } from '@/lib/mockData';
import type { UserProfile } from '@/lib/types';

const LOADING_MESSAGES = [
  'Scanning Hong Kong market data...',
  'Analysing 10,000+ job postings...',
  'Mapping industry demand signals...',
  'Comparing with peer profiles...',
  'Building your personalised skill map...',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, setDiagnosis } = useUser();
  const [step, setStep] = useState(1);
  const [inputMethod, setInputMethod] = useState<'cv' | 'linkedin' | 'manual' | null>(null);
  const [profile, setProfileState] = useState<Partial<UserProfile> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (!isGenerating) return;
    const id = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, [isGenerating]);

  const handleCVSuccess = (p: UserProfile) => {
    setProfileState(p);
    setProfile(p);
    setStep(3);
  };

  const handleLinkedInSuccess = (p: UserProfile) => {
    setProfileState(p);
    setProfile(p);
    setStep(3);
  };

  const handleManualComplete = (p: Partial<UserProfile>) => {
    setProfileState(p);
    setStep(3);
  };

  const handleGenerate = async (updatedProfile?: Partial<UserProfile>) => {
    const source = updatedProfile ?? profile;
    if (!source) return;

    const fullProfile: UserProfile = {
      ...MOCK_PROFILE,
      ...source,
      currentRole: source.currentRole || '',
      industry: source.industry || '',
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
      weeklyHoursAvailable: source.weeklyHoursAvailable ?? 5,
      preferredFormats: source.preferredFormats || ['video', 'audio'],
    };

    setProfile(fullProfile);
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
      router.push('/diagnosis');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Skill map generation failed.';
      router.push(`/problem?message=${encodeURIComponent(message)}&from=onboarding`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Generating your Skill Gap Map</h2>
          <p className="text-slate-600">{LOADING_MESSAGES[loadingMessageIndex]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline text-sm mb-6 inline-block">
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
              <h1 className="text-2xl font-bold text-slate-900">How should we get to know you?</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setInputMethod('cv')}
                  className="p-6 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all"
                >
                  <div className="text-2xl mb-2">📤</div>
                  <h3 className="font-semibold">Upload CV</h3>
                  <p className="text-sm text-slate-600 mt-1">PDF or DOCX — we&apos;ll extract everything automatically</p>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod('linkedin')}
                  className="p-6 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all"
                >
                  <div className="text-2xl mb-2">💼</div>
                  <h3 className="font-semibold">Paste LinkedIn</h3>
                  <p className="text-sm text-slate-600 mt-1">Paste your LinkedIn profile text or URL</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setInputMethod('manual'); setStep(2); }}
                  className="p-6 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all"
                >
                  <div className="text-2xl mb-2">✏️</div>
                  <h3 className="font-semibold">Tell us manually</h3>
                  <p className="text-sm text-slate-600 mt-1">Answer 4 quick questions — takes 90 seconds</p>
                </button>
              </div>

              {inputMethod === 'cv' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                  <CVUpload onSuccess={handleCVSuccess} />
                </motion.div>
              )}
              {inputMethod === 'linkedin' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                  <LinkedInInput onSuccess={handleLinkedInSuccess} />
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && inputMethod === 'manual' && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <RoleInput onComplete={handleManualComplete} />
            </motion.div>
          )}

          {step === 3 && profile && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
            >
              <ProfileConfirm
                profile={profile}
                onGenerate={handleGenerate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
