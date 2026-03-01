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
      <h1 className="text-2xl font-bold text-slate-900">Confirm your profile</h1>
      <p className="text-slate-600 text-sm">
        This helps us compare you only to professionals in your field in Hong Kong — not across all industries.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Job title / Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Accountant, Marketing Manager"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
          <select
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); setSubSector(''); }}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        {subSectorOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sub-sector (optional)</label>
            <select
              value={subSector}
              onChange={(e) => setSubSector(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select sub-sector</option>
              {subSectorOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Seniority level</label>
          <div className="flex flex-wrap gap-2">
            {SENIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSeniority(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  seniority === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Years of experience: {yearsExperience}
          </label>
          <input
            type="range"
            min={0}
            max={50}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(parseInt(e.target.value, 10) || 0)}
            className="w-full accent-blue-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Primary career goal</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPrimaryGoal(opt.value)}
                className={`p-4 rounded-xl text-left border-2 transition-colors ${
                  primaryGoal === opt.value ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-slate-900">{opt.label}</div>
                <div className="text-sm text-slate-600">{opt.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
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
        className="w-full px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Generate My Skill Map →
      </button>
    </div>
  );
}
