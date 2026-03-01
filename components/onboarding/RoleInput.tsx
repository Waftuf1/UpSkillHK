'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INDUSTRIES, SUB_SECTORS, SENIORITY_OPTIONS, GOAL_OPTIONS, LEARNING_FORMATS, SKILL_SUGGESTIONS } from '@/lib/constants';
import type { UserProfile } from '@/lib/types';

interface RoleInputProps {
  initialData?: Partial<UserProfile>;
  onComplete: (profile: Partial<UserProfile>) => void;
}

export function RoleInput({ initialData, onComplete }: RoleInputProps) {
  const [section, setSection] = useState<'A' | 'B' | 'C' | 'D'>(initialData?.currentRole ? 'D' : 'A');
  const [form, setForm] = useState<Partial<UserProfile>>({
    currentRole: initialData?.currentRole || '',
    industry: initialData?.industry || '',
    subSector: initialData?.subSector || '',
    seniorityLevel: initialData?.seniorityLevel || 'mid',
    yearsExperience: initialData?.yearsExperience ?? 3,
    location: initialData?.location || 'Hong Kong',
    hardSkills: initialData?.hardSkills || [],
    softSkills: initialData?.softSkills || [],
    tools: initialData?.tools || [],
    certifications: initialData?.certifications || [],
    languages: initialData?.languages || ['English', 'Cantonese'],
    primaryGoal: initialData?.primaryGoal || 'unsure',
    weeklyHoursAvailable: initialData?.weeklyHoursAvailable ?? 5,
    preferredFormats: initialData?.preferredFormats || ['video', 'audio'],
  });

  const addTag = (field: 'hardSkills' | 'softSkills' | 'tools' | 'certifications', value: string) => {
    if (value && !form[field]?.includes(value)) {
      setForm((f) => ({ ...f, [field]: [...(f[field] || []), value] }));
    }
  };

  const removeTag = (field: 'hardSkills' | 'softSkills' | 'tools' | 'certifications', value: string) => {
    setForm((f) => ({ ...f, [field]: (f[field] || []).filter((s) => s !== value) }));
  };

  const skillSuggestions = form.industry ? (SKILL_SUGGESTIONS[form.industry] || SKILL_SUGGESTIONS.default) : SKILL_SUGGESTIONS.default;

  return (
    <Card className="max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-zinc-100 mb-6">
        {section === 'A' && 'What do you do?'}
        {section === 'B' && 'What are you good at?'}
        {section === 'C' && 'What languages do you speak?'}
        {section === 'D' && 'What are your goals?'}
      </h3>

      {section === 'A' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Role / Job Title</label>
            <input
              type="text"
              value={form.currentRole}
              onChange={(e) => setForm((f) => ({ ...f, currentRole: e.target.value }))}
              placeholder="e.g. Senior Accountant"
              className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Industry</label>
            <select
              value={form.industry}
              onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value, subSector: '' }))}
              className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          {form.industry && SUB_SECTORS[form.industry] && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Sub-sector</label>
              <select
                value={form.subSector}
                onChange={(e) => setForm((f) => ({ ...f, subSector: e.target.value }))}
                className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select sub-sector</option>
                {SUB_SECTORS[form.industry].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Seniority</label>
            <div className="flex flex-wrap gap-2">
              {SENIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, seniorityLevel: opt.value }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.seniorityLevel === opt.value ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300 border border-zinc-600 hover:border-zinc-500 hover:bg-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === 'B' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Skills (tap to add)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skillSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag('hardSkills', s)}
                  className="px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-sm text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400"
                >
                  + {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(form.hardSkills || []).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-sm">
                  {s} <button type="button" onClick={() => removeTag('hardSkills', s)} className="hover:text-emerald-300">×</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Tools</label>
            <input
              type="text"
              placeholder="Type and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) addTag('tools', val);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
              className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.tools || []).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-sm text-zinc-300">
                  {s} <button type="button" onClick={() => removeTag('tools', s)} className="hover:text-zinc-100">×</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Certifications</label>
            <input
              type="text"
              placeholder="e.g. HKICPA, CPA"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) addTag('certifications', val);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
              className="w-full px-4 py-2 border border-zinc-600 rounded-lg bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.certifications || []).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-sm text-zinc-300">
                  {s} <button type="button" onClick={() => removeTag('certifications', s)} className="hover:text-zinc-100">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === 'C' && (
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">Select languages you speak (we&apos;ll assume basic proficiency if not specified)</p>
          <div className="space-y-2">
            {['English', 'Cantonese', 'Mandarin', 'Other'].map((lang) => (
              <label key={lang} className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={form.languages?.includes(lang)} onChange={(e) => {
                  if (e.target.checked) setForm((f) => ({ ...f, languages: [...(f.languages || []), lang] }));
                  else setForm((f) => ({ ...f, languages: (f.languages || []).filter((l) => l !== lang) }));
                }} className="rounded border-zinc-600 bg-zinc-900 text-emerald-600 focus:ring-emerald-500" />
                <span>{lang}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {section === 'D' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Primary goal</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, primaryGoal: opt.value }))}
                  className={`p-4 rounded-xl text-left border transition-colors ${
                    form.primaryGoal === opt.value ? 'border-emerald-500 bg-emerald-500/20' : 'border-zinc-600 bg-zinc-800/50 hover:border-zinc-500'
                  }`}
                >
                  <div className={`font-semibold ${form.primaryGoal === opt.value ? 'text-zinc-100' : 'text-zinc-300'}`}>{opt.label}</div>
                  <div className={`text-sm ${form.primaryGoal === opt.value ? 'text-zinc-400' : 'text-zinc-500'}`}>{opt.description}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Hours per week for learning: {form.weeklyHoursAvailable}
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={form.weeklyHoursAvailable ?? 5}
              onChange={(e) => setForm((f) => ({ ...f, weeklyHoursAvailable: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Preferred formats</label>
            <div className="flex flex-wrap gap-2">
              {LEARNING_FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => {
                    const current = form.preferredFormats || [];
                    const next = current.includes(fmt.value) ? current.filter((f) => f !== fmt.value) : [...current, fmt.value];
                    setForm((f) => ({ ...f, preferredFormats: next }));
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.preferredFormats?.includes(fmt.value) ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-300 border border-zinc-600 hover:border-zinc-500'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="ghost" onClick={() => setSection(section === 'A' ? 'A' : section === 'B' ? 'A' : section === 'C' ? 'B' : 'C')} disabled={section === 'A'}>
          Back
        </Button>
        {section !== 'D' ? (
          <Button onClick={() => setSection(section === 'A' ? 'B' : section === 'B' ? 'C' : 'D')}>
            Next
          </Button>
        ) : (
          <Button onClick={() => onComplete(form)}>Continue</Button>
        )}
      </div>
    </Card>
  );
}
