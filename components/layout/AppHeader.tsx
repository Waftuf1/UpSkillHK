'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          UpSkill HK
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/onboarding" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
            Get Started
          </Link>
          {user ? (
            <>
              <span className="text-sm text-slate-500 truncate max-w-[160px] hidden sm:inline">{user.email}</span>
              <button type="button" onClick={() => signOut()} className="px-3 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-slate-700 hover:text-slate-900 font-medium text-sm">
                Sign in
              </Link>
              <Link href="/signup" className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
