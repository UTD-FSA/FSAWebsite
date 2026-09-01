'use client'

// ── WhoAreWeText.tsx ─────────────────────────────────────────
// "Who are we?" — numbered section header + two-column body
// (lede left, supporting copy right). Ported from the design mockup;
// content and reveal behavior carried over from the previous
// centered-title version.
//
// data:  none — static copy, mirrors what used to live inline in app/page.tsx
// ─────────────────────────────────────────────────────────────

import { useRef } from 'react'
import SectionHeader from '@/components/SectionHeader'
import { useRevealOnScroll } from '@/lib/useRevealOnScroll'

export default function WhoAreWeText() {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useRevealOnScroll(ref)

  return (
    <div className="w-full flex flex-col">
      <SectionHeader index="01" title="Who Are We?" baybayin="ᜆᜓᜅ᜔ᜃᜓᜎ᜔" />

      <div
        ref={ref}
        className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 pt-8"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
        }}
      >
        <p className="font-sans text-[20px] md:text-[23px] leading-snug text-white">
          <strong className="font-medium text-accent-green">UTD FSA</strong> is a student-led
          organization dedicated to building friendships, celebrating Filipino culture, and
          creating a welcoming community for everyone.
        </p>
        <p
          className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60"
          style={{ transitionDelay: visible ? '180ms' : '0ms' }}
        >
          As one of UTD&rsquo;s largest student organizations, we bring together students from
          all backgrounds through social events, cultural traditions, sports, dance, and our
          close-knit <strong className="font-semibold text-white">Pamilya program</strong>. New
          to UTD or just looking to meet people? You&rsquo;ll find plenty of opportunities to
          get involved, form meaningful connections, and make UTD feel a little more like home.
        </p>
      </div>
    </div>
  )
}
