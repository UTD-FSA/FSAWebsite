// ── error.tsx (membership) ────────────────────────────────
// membership segment error boundary — shown when /membership throws
//
// notes: logs the error client-side; reset() re-renders the failed segment
// ──────────────────────────────────────────────────────────
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function MembershipError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[membership error boundary]', error)
  }, [error])

  return (
    <main className="bg-brand-bg min-h-screen flex items-center justify-center text-white px-6">
      <div className="text-center max-w-sm">
        <h2 className="font-display font-black text-3xl uppercase mb-3">Something went wrong</h2>
        <p className="font-sans text-white/50 text-sm mb-6">
          This page couldn&apos;t load. Try refreshing — you haven&apos;t been charged.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="font-display font-bold text-xs uppercase tracking-widest px-5 py-3 bg-accent-green text-[#0e0e0e] rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="font-display font-bold text-xs uppercase tracking-widest px-5 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 active:scale-[0.98] transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
