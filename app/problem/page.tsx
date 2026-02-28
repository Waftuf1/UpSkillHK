'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ProblemContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Something went wrong. Please try again.';
  const from = searchParams.get('from') || 'app';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-rose-200 shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-slate-600 mb-6 whitespace-pre-wrap">{message}</p>
        <div className="space-y-3">
          <Link
            href={from === 'roadmap' ? '/diagnosis' : '/onboarding'}
            className="block w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Try again
          </Link>
          <Link
            href="/"
            className="block w-full py-3 px-4 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProblemPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <ProblemContent />
    </Suspense>
  );
}
