'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import type { UserProfile } from '@/lib/types';

interface CVUploadProps {
  onSuccess: (profile: UserProfile) => void;
}

export function CVUpload({ onSuccess }: CVUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse CV');
      }

      const profile = data.profile as UserProfile;
      if (!profile.currentRole || !profile.industry) {
        throw new Error('Could not extract enough information from your CV');
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
      <FileUpload onUpload={handleUpload} isLoading={isLoading} />
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
