'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { UserProfile, SkillGapMap, CareerRoadmap } from '@/lib/types';

interface UserContextType {
  profile: UserProfile | null;
  diagnosis: SkillGapMap | null;
  roadmaps: CareerRoadmap[] | null;
  setProfile: (profile: UserProfile | null) => void;
  setDiagnosis: (diagnosis: SkillGapMap | null) => void;
  setRoadmaps: (roadmaps: CareerRoadmap[] | null) => void;
  reset: () => void;
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
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [diagnosis, setDiagnosisState] = useState<SkillGapMap | null>(null);
  const [roadmaps, setRoadmapsState] = useState<CareerRoadmap[] | null>(null);

  const setProfile = useCallback((p: UserProfile | null) => {
    setProfileState(p);
  }, []);

  const setDiagnosis = useCallback((d: SkillGapMap | null) => {
    setDiagnosisState(d);
  }, []);

  const setRoadmaps = useCallback((r: CareerRoadmap[] | null) => {
    setRoadmapsState(r);
  }, []);

  const reset = useCallback(() => {
    setProfileState(null);
    setDiagnosisState(null);
    setRoadmapsState(null);
  }, []);

  return (
    <UserContext.Provider
      value={{
        profile,
        diagnosis,
        roadmaps,
        setProfile,
        setDiagnosis,
        setRoadmaps,
        reset,
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
