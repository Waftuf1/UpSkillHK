'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { UserProfile } from '@/lib/types';

interface LinkedInInputProps {
  onSuccess: (profile: UserProfile) => void;
}

export function LinkedInInput({ onSuccess }: LinkedInInputProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), type: 'linkedin' }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse LinkedIn profile');
      }

      const profile = data.profile as UserProfile;
      if (!profile.currentRole || !profile.industry) {
        throw new Error('Could not extract enough information. Please paste more of your profile.');
      }

      onSuccess(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your LinkedIn 'About' and 'Experience' sections here..."
        rows={8}
        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
      />
      <Button onClick={handleSubmit} isLoading={isLoading} disabled={!text.trim()}>
        Parse My Profile
      </Button>
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
