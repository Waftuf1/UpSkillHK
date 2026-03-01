'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-zinc-100 tracking-tight">
          UpSkill HK
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/onboarding" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors text-sm">
            Get Started
          </Link>
          {user ? (
            <>
              <span className="text-sm text-zinc-500 truncate max-w-[160px] hidden sm:inline">{user.email}</span>
              <button type="button" onClick={() => signOut()} className="px-3 py-2 text-zinc-400 hover:text-zinc-100 text-sm font-medium transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-zinc-400 hover:text-zinc-100 font-medium text-sm transition-colors">
                Sign in
              </Link>
              <Link href="/signup" className="px-3 py-2 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 font-medium text-sm transition-colors">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
