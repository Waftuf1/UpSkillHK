import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { UserProfile, SkillGapMap, CareerRoadmap } from '@/lib/types';

export interface UserProgress {
  profile: UserProfile | null;
  diagnosis: SkillGapMap | null;
  roadmaps: CareerRoadmap[] | null;
  suitableJobs: string[];
  updatedAt: string;
}

export async function saveUserProgress(
  userId: string,
  data: Partial<Omit<UserProgress, 'updatedAt'>>
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  try {
    const ref = doc(db, 'users', userId);
    await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Firestore save failed (offline or error):', err);
  }
}

export async function loadUserProgress(userId: string): Promise<UserProgress | null> {
  if (!isFirebaseConfigured() || !db) return null;
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as UserProgress;
  } catch (err) {
    // Handle offline, permission, or network errors gracefully
    console.warn('Firestore load failed (offline or error):', err);
    return null;
  }
}
