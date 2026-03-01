'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import type { UserProfile } from '@/lib/types';

interface CVUploadProps {
  onSuccess: (profile: UserProfile) => void;
  onUseManual?: () => void;
}

export function CVUpload({ onSuccess, onUseManual }: CVUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSelectedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-cv', {
        method: 'POST',
        body: formData,
      });

      let data: { success?: boolean; error?: string; profile?: UserProfile };
      try {
        data = await res.json();
      } catch {
        throw new Error(res.ok ? 'Invalid response from server' : `Upload failed (${res.status})`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse CV');
      }

      const profile = data.profile as UserProfile;
      if (!profile.currentRole || !profile.industry) {
        throw new Error('Could not extract enough information from your CV. Please upload a proper CV or use "Tell us manually".');
      }

      onSuccess(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <FileUpload onUpload={handleUpload} isLoading={isLoading} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400 font-medium">Uploaded: {selectedFile.name}</p>
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-zinc-500 hover:text-zinc-300 underline"
            >
              Choose different file
            </button>
          </div>

          {!isLoading && (
            <FileUpload onUpload={handleUpload} isLoading={isLoading} />
          )}

          {isLoading && (
            <p className="text-sm text-zinc-500 text-center">Extracting your profile...</p>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-sm">
          <p className="font-medium">
            {error.toLowerCase().includes('cv') || error.toLowerCase().includes('resume') || error.toLowerCase().includes('receipt') || error.toLowerCase().includes('document')
              ? "This doesn't look like a CV"
              : 'Upload failed'}
          </p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-rose-400">Please upload a resume or CV with your work experience, skills, and education.</p>
          {onUseManual && (
            <button
              type="button"
              onClick={() => { setError(null); setSelectedFile(null); onUseManual(); }}
              className="mt-3 w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors"
            >
              Use Tell us manually instead →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
