// ── error.tsx (officer) ───────────────────────────────────
// officer-area segment error boundary — shown when an /officer/* page throws
//
// notes: logs the error client-side; reset() re-renders the failed segment
// ──────────────────────────────────────────────────────────
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function OfficerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[officer error boundary]', error)
  }, [error])

  return (
    <main className="min-h-screen bg-[#070707] flex items-center justify-center text-white px-6">
      <div className="text-center max-w-sm">
        <h2 className="font-display font-black text-3xl uppercase mb-3">Something went wrong</h2>
        <p className="font-sans text-white/50 text-sm mb-6">
          This officer page couldn&apos;t load. Try refreshing or navigating to another section.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="font-display font-bold text-xs uppercase tracking-widest px-5 py-3 bg-[#9747FF] text-white rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Try Again
          </button>
          <Link
            href="/officer/events"
            className="font-display font-bold text-xs uppercase tracking-widest px-5 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 active:scale-[0.98] transition-all"
          >
            Officer Home
          </Link>
        </div>
      </div>
    </main>
  )
}
