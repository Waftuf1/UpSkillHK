'use client';

import { GOAL_OPTIONS } from '@/lib/constants';
import type { UserProfile } from '@/lib/types';

interface GoalSelectorProps {
  value: UserProfile['primaryGoal'];
  onChange: (goal: UserProfile['primaryGoal']) => void;
}

export function GoalSelector({ value, onChange }: GoalSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {GOAL_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`p-6 rounded-xl text-left border-2 transition-all ${
            value === opt.value ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="font-semibold text-slate-900">{opt.label}</div>
          <div className="text-sm text-slate-600 mt-1">{opt.description}</div>
        </button>
      ))}
    </div>
  );
}
