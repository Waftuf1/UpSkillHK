'use client';

import { useState } from 'react';
import { INDUSTRIES, SUB_SECTORS, SENIORITY_OPTIONS, GOAL_OPTIONS } from '@/lib/constants';
import type { UserProfile } from '@/lib/types';

interface ProfileConfirmProps {
  profile: Partial<UserProfile>;
  onGenerate: (updatedProfile: Partial<UserProfile>) => void;
}

export function ProfileConfirm({ profile, onGenerate }: ProfileConfirmProps) {
  const [role, setRole] = useState(profile.currentRole || '');
  const [industry, setIndustry] = useState(profile.industry || '');
  const [subSector, setSubSector] = useState(profile.subSector || '');
  const [seniority, setSeniority] = useState<UserProfile['seniorityLevel']>(profile.seniorityLevel || 'mid');
  const [yearsExperience, setYearsExperience] = useState(profile.yearsExperience ?? 3);
  const [primaryGoal, setPrimaryGoal] = useState<UserProfile['primaryGoal']>(profile.primaryGoal || 'unsure');
  const [weeklyHours, setWeeklyHours] = useState(profile.weeklyHoursAvailable ?? 5);

  const handleGenerate = () => {
    onGenerate({
      ...profile,
      currentRole: role,
      industry,
      subSector: subSector || undefined,
      seniorityLevel: seniority,
      yearsExperience,
      primaryGoal,
      weeklyHoursAvailable: weeklyHours,
    });
  };

  const subSectorOptions = industry ? (SUB_SECTORS[industry] || []) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Confirm your profile</h1>
      <p className="text-zinc-400 text-sm">
        This helps us compare you only to professionals in your field in Hong Kong — not across all industries.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Job title / Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Accountant, Marketing Manager"
            className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Industry</label>
          <select
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); setSubSector(''); }}
            className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        {subSectorOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Sub-sector (optional)</label>
            <select
              value={subSector}
              onChange={(e) => setSubSector(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select sub-sector</option>
              {subSectorOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Seniority level</label>
          <div className="flex flex-wrap gap-2">
            {SENIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSeniority(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  seniority === opt.value ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300 border border-zinc-600 hover:border-zinc-500 hover:bg-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Years of experience: {yearsExperience}
          </label>
          <input
            type="range"
            min={0}
            max={50}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(parseInt(e.target.value, 10) || 0)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Primary career goal</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPrimaryGoal(opt.value)}
                className={`p-4 rounded-xl text-left border transition-colors ${
                  primaryGoal === opt.value ? 'border-emerald-500 bg-emerald-500/20' : 'border-zinc-600 bg-zinc-800/50 hover:border-zinc-500'
                }`}
              >
                <div className={`font-semibold ${primaryGoal === opt.value ? 'text-zinc-100' : 'text-zinc-300'}`}>{opt.label}</div>
                <div className={`text-sm ${primaryGoal === opt.value ? 'text-zinc-400' : 'text-zinc-500'}`}>{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Hours per week for learning: {weeklyHours}
          </label>
          <input
            type="range"
            min={1}
            max={20}
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!role.trim() || !industry}
        className="w-full px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Generate My Skill Map →
      </button>
    </div>
  );
}
