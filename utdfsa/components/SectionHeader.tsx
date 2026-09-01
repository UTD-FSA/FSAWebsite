'use client'

// ── SectionHeader.tsx ────────────────────────────────────────
// numbered editorial section header used across the public pages:
// "01 · Section title ·············· [— baybayin —]" over a hairline rule.
// Ported from the "FSA Public Layout Directions" design mockup.
//
// data:  none — presentational
// deps:  BaybayinRule (mask-wipe reveal), useRevealOnScroll
// ─────────────────────────────────────────────────────────────

import { useRef } from 'react'
import BaybayinRule from '@/components/BaybayinRule'
import { useRevealOnScroll } from '@/lib/useRevealOnScroll'

type Props = {
  index: string
  title: string
  /** Baybayin glyphs shown flush-right; omit to render the header with no rule/glyph slot */
  baybayin?: string
  size?: 'lg' | 'md'
  /** set false to drop the hairline under the header — for sections whose own
   *  content starts with a divider of its own (the dance pages' video vaults) */
  rule?: boolean
}

export default function SectionHeader({ index, title, baybayin, size = 'lg', rule = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useRevealOnScroll(ref)
  const titleSize = size === 'lg' ? 'clamp(26px,3.2vw,44px)' : 'clamp(24px,2.8vw,38px)'

  return (
    <div
      ref={ref}
      className={`flex items-baseline flex-wrap gap-x-5 gap-y-2 pb-[26px] ${rule ? 'border-b border-white/12' : ''}`}
    >
      <span className="font-display font-semibold text-[14px] text-accent-green flex-none">
        {index}
      </span>
      <span
        className="font-display font-bold text-white leading-none tracking-[-0.015em]"
        style={{ fontSize: titleSize }}
      >
        {title}
      </span>
      {baybayin && (
        <span className="hidden sm:flex ml-auto">
          <BaybayinRule word={baybayin} size="21px" reveal={visible} delayMs={0} draw />
        </span>
      )}
    </div>
  )
}
