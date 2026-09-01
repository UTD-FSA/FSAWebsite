// ── ScrollFadeIn.tsx ──────────────────────────────────────
// fades/rises children in once scrolled into view — thin wrapper over
// useRevealOnScroll (inherits its never-blank + reduced-motion guards).
// Ported from the design mockup's `data-reveal` behavior (a 12px rise,
// not the original scale-in) so section bodies across the public pages
// share one reveal implementation instead of each restating the same
// opacity/transform style block inline.
//
// data:  none — presentational wrapper
// ──────────────────────────────────────────────────────────
'use client'

import { useRef, type ReactNode } from 'react'
import { useRevealOnScroll } from '@/lib/useRevealOnScroll'

export default function ScrollFadeIn({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode
  className?: string
  delayMs?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useRevealOnScroll(ref)
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
        transitionDelay: visible ? `${delayMs}ms` : '0ms',
      }}
    >
      {children}
    </div>
  )
}
