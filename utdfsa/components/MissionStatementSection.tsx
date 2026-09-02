'use client'

// ── MissionStatementSection.tsx ─────────────────────────────
// homepage mission statement — numbered section header, then a
// text/photo split: both paragraphs stacked in the left column
// (white lede closing on a green clause, muted support copy below
// it), a 4-tile photo grid on the right.
//
// notes: white / green / muted only — no gold, and no highlight
//        sweep behind the lede's closing clause (both removed
//        deliberately; the green clause carries the emphasis now).
//
// data:  none — static copy, mirrors what used to live inline in app/page.tsx
// ─────────────────────────────────────────────────────────────

import { useRef } from 'react'
import SectionHeader from '@/components/SectionHeader'
import SmoothImage from '@/components/SmoothImage'
import { useRevealOnScroll } from '@/lib/useRevealOnScroll'

function MissionPhoto({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className ?? ''}`}>
      <SmoothImage src={src} alt={alt} fill className="object-cover object-center" sizes="(max-width: 1024px) 50vw, 260px" quality={85} />
    </div>
  )
}

export default function MissionStatementSection() {
  const copyRef = useRef<HTMLDivElement>(null)
  const pillarsVisible = useRevealOnScroll(copyRef)

  return (
    <section className="bg-section-bg px-4 sm:px-8 lg:px-16 pt-14 sm:pt-20 lg:pt-24 pb-6 sm:pb-8 lg:pb-10">
      <div className="max-w-[1241px] mx-auto">
        <SectionHeader index="02" title="Our Mission" baybayin="ᜋᜒᜐ᜔ᜌᜓᜈ᜔" />

        <div ref={copyRef} className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 pt-8">
          <div className="flex flex-col gap-6">
            <p className="font-sans text-[20px] md:text-[23px] leading-snug text-white">
              Founded in 2001, the Filipino Student Association at UT Dallas is committed to
              promoting Filipino culture while empowering students to{' '}
              <strong className="font-normal text-accent-green">grow as leaders, serve their
              communities, and make a significant impact on campus.</strong>
            </p>
            <p
              className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60"
              style={{
                opacity: pillarsVisible ? 1 : 0,
                transform: pillarsVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
                transitionDelay: pillarsVisible ? '180ms' : '0ms',
              }}
            >
              Through cultural education, volunteer initiatives, and leadership opportunities, we
              strive to inspire pride in our heritage while helping students of all backgrounds
              grow and support one another.
            </p>
          </div>

          {/* photo grid — 2 columns, 2 stacked photos each, independent aspect
              ratios per the reference layout (roughly 55/45 top/bottom). ratios
              rather than fixed heights: below lg the grid goes full-width, and
              fixed heights stretched the crops badly around 1000px */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-3">
              <MissionPhoto src="/mission-photo-1.jpg" alt="UTD FSA members" className="aspect-[10/7]" />
              <MissionPhoto src="/mission-photo-2.jpg" alt="UTD FSA members" className="aspect-[16/9]" />
            </div>
            <div className="flex flex-col gap-3">
              <MissionPhoto src="/mission-photo-3.jpg" alt="UTD FSA members" className="aspect-[7/6]" />
              <MissionPhoto src="/mission-photo-4.jpg" alt="UTD FSA pamilya" className="aspect-[8/5]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
