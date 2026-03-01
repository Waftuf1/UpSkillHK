'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { saveUserProgress, loadUserProgress } from '@/lib/firestore';
import type { UserProfile, SkillGapMap, CareerRoadmap } from '@/lib/types';

interface UserContextType {
  profile: UserProfile | null;
  diagnosis: SkillGapMap | null;
  roadmaps: CareerRoadmap[] | null;
  suitableJobs: string[];
  setProfile: (profile: UserProfile | null) => void;
  setDiagnosis: (diagnosis: SkillGapMap | null) => void;
  setRoadmaps: (roadmaps: CareerRoadmap[] | null) => void;
  setSuitableJobs: (jobs: string[]) => void;
  reset: () => void;
  loadingProgress: boolean;
}

const defaultProfile: UserProfile = {
  currentRole: '',
  industry: '',
  seniorityLevel: 'mid',
  yearsExperience: 3,
  location: 'Hong Kong',
  hardSkills: [],
  softSkills: [],
  tools: [],
  certifications: [],
  languages: [],
  education: [],
  primaryGoal: 'unsure',
  weeklyHoursAvailable: 5,
  preferredFormats: ['video', 'audio'],
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [diagnosis, setDiagnosisState] = useState<SkillGapMap | null>(null);
  const [roadmaps, setRoadmapsState] = useState<CareerRoadmap[] | null>(null);
  const [suitableJobs, setSuitableJobsState] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      prevUserIdRef.current = user.uid;
    } else if (prevUserIdRef.current) {
      prevUserIdRef.current = null;
      setProfileState(null);
      setDiagnosisState(null);
      setRoadmapsState(null);
      setSuitableJobsState([]);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    setLoadingProgress(true);
    loadUserProgress(user.uid)
      .then((data) => {
        if (data) {
          setProfileState(data.profile ?? null);
          setDiagnosisState(data.diagnosis ?? null);
          setRoadmapsState(data.roadmaps ?? null);
          setSuitableJobsState(data.suitableJobs ?? []);
        }
      })
      .catch((err) => {
        console.warn('Could not load progress (offline or error):', err);
      })
      .finally(() => setLoadingProgress(false));
  }, [user?.uid]);

  const saveProgress = useCallback(() => {
    if (!user?.uid) return;
    saveUserProgress(user.uid, {
      profile: profile ?? undefined,
      diagnosis: diagnosis ?? undefined,
      roadmaps: roadmaps ?? undefined,
      suitableJobs: suitableJobs.length ? suitableJobs : undefined,
    }).catch(console.error);
  }, [user?.uid, profile, diagnosis, roadmaps, suitableJobs]);

  useEffect(() => {
    if (!user?.uid) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveProgress, 1500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [user?.uid, profile, diagnosis, roadmaps, suitableJobs, saveProgress]);

  const setProfile = useCallback((p: UserProfile | null) => {
    setProfileState(p);
  }, []);

  const setDiagnosis = useCallback((d: SkillGapMap | null) => {
    setDiagnosisState(d);
  }, []);

  const setRoadmaps = useCallback((r: CareerRoadmap[] | null) => {
    setRoadmapsState(r);
  }, []);

  const setSuitableJobs = useCallback((jobs: string[]) => {
    setSuitableJobsState(jobs);
  }, []);

  const reset = useCallback(() => {
    setProfileState(null);
    setDiagnosisState(null);
    setRoadmapsState(null);
    setSuitableJobsState([]);
  }, []);

  return (
    <UserContext.Provider
      value={{
        profile,
        diagnosis,
        roadmaps,
        suitableJobs,
        setProfile,
        setDiagnosis,
        setRoadmaps,
        setSuitableJobs,
        reset,
        loadingProgress,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export { defaultProfile };
