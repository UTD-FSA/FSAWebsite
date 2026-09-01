// ── page.tsx ──────────────────────────────────────────────
// goodphil spirit page — utd fsa spirit performance category
//
// notes: fully static; hero uses spirit-hero.jpg (/public);
//        spirit-photo-1/2/3.jpg fill the PhotoBand under the intro (it
//        replaced the right-column collage + inline Instagram
//        pill); youtube video ids hardcoded in the past-
//        performances section; cta links to @fsautd on
//        instagram (spirit has no team-specific account).
//        copy palette is white / green / muted only, no gold.
// ──────────────────────────────────────────────────────────

'use client'

import { useRef } from 'react'
import GoodphilNavRail from '@/components/GoodphilNavRail'
import PageHero from '@/components/PageHero'
import PhotoBand from '@/components/PhotoBand'
import SectionHeader from '@/components/SectionHeader'
import YouTubeEmbed from '@/components/YouTubeEmbed'
import { useRevealOnScroll, useStaggeredReveal } from '@/lib/useRevealOnScroll'

export default function SpiritPage() {
  // recruitment CTA — own scroll trigger since it sits far below the fold
  const ctaRef = useRef<HTMLDivElement>(null)
  const ctaVisible = useRevealOnScroll(ctaRef)

  // past-performances video vault — each card animates independently as it individually
  // scrolls into view (mirrors the officer board card pattern in AboutClient.tsx),
  // with the shared never-blank + reduced-motion guard
  const perfCardRefs = useRef<(HTMLDivElement | null)[]>([])
  useStaggeredReveal(
    () => perfCardRefs.current.filter((c): c is HTMLDivElement => c !== null),
    (card, cards) => {
      const delay = cards.indexOf(card) * 150
      card.style.animation = 'none'
      void card.offsetHeight
      card.style.animation = `videoCardIn 700ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms both`
    },
  )

  return (
    <main className="bg-section-bg text-white overflow-x-clip">
      <GoodphilNavRail />

      {/* ── SECTION 1 — HERO ──────────────────────────────────────── */}
      <PageHero
        src="/spirit-hero.jpg"
        alt="UTD FSA Spirit team"
        eyebrow="GOODPHIL · SPIRIT"
        title="Spirit"
        baybayin="ᜇᜒᜏ"
        objectPosition="object-center"
      />

      {/* ── SECTION 2 — WHAT IS UTD SPIRIT? ──────────────────────── */}
      <section className="bg-section-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="01" title="What Is UTD Spirit?" baybayin="ᜇᜒᜏ" />

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 pt-8">
            <p className="font-sans text-[20px] md:text-[23px] leading-snug text-white">
              Spirit is UTD FSA&apos;s performance category at GoodPhil, where{' '}
              <strong className="font-normal text-accent-green">creativity, school pride, and
              Filipino culture</strong> come together in one high-energy performance.
            </p>
            <p className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60">
              Every year, our team creates an original routine filled with choreography, skits,
              music, and plenty of unexpected moments that capture what it means to represent
              UTD. Also, there&rsquo;s no dance experience needed to join! Spirit welcomes anyone
              ready to have fun and be part of something bigger. This is where{' '}
              <strong className="font-semibold text-white">Comet pride</strong> shines the
              brightest.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2.5 — PHOTO BAND ─────────────────────────────── */}
      <PhotoBand
        photos={[
          { src: '/spirit-photo-1.jpg', alt: 'UTD FSA Spirit performing at Goodphil', objectPosition: 'object-[center_45%]' },
          { src: '/spirit-photo-2.jpg', alt: 'UTD FSA Spirit performer mid-performance', objectPosition: 'object-[center_35%]' },
          { src: '/spirit-photo-3.jpg', alt: 'UTD FSA Spirit group performance at Goodphil', objectPosition: 'object-[center_35%]' },
        ]}
      />

      {/* ── SECTION 3 — PAST PERFORMANCES ────────────────────────── */}
      {/* featured (most recent year) + 2-col secondary row for older years;
          each card is a lazy-loaded YouTube embed
          (see components/YouTubeEmbed.tsx) */}
      <section className="bg-brand-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="02" title="Past Performances" rule={false} />

          {/* Group divider — GOODPHIL (same treatment as Cultural/Modern) */}
          <div className="flex items-center gap-4 max-w-3xl mx-auto mt-10 mb-10">
            <div className="h-px flex-1 bg-white/15" />
            <span
              className="font-display font-black text-accent-green uppercase"
              style={{ fontSize: 'clamp(18px, 2.4vw, 30px)', letterSpacing: '0.14em' }}
            >
              Goodphil
            </span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          {/* Featured — Goodphil 2026, Austin (most recent year) */}
          <div className="mb-14" ref={(el) => { perfCardRefs.current[0] = el }}>
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.16] font-display font-bold text-[11px] uppercase tracking-[0.12em] text-[#e8e4dd]/70">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                3rd Place
              </span>
            </div>
            <p
              className="font-display text-white text-center mb-4"
              style={{ fontSize: 'clamp(14px, 2vw, 30px)', letterSpacing: '1.5px' }}
            >
              <span className="font-black">GOODPHIL 2026 - </span>
              <span className="font-medium">AUSTIN</span>
            </p>
            <div className="max-w-[60rem] mx-auto">
              <YouTubeEmbed videoId="R79EE9wmbTc" title="Goodphil 2026 - Austin" />
            </div>
          </div>

          {/* Secondary — earlier years */}
          <div className="grid sm:grid-cols-2 gap-8">

            {/* Performance — Goodphil 2025, College Station */}
            <div ref={(el) => { perfCardRefs.current[1] = el }}>
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/30 font-display font-bold text-[10px] uppercase tracking-[0.1em] text-accent-gold">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                  1st Place
                </span>
              </div>
              <p
                className="font-display text-white text-center mb-3"
                style={{ fontSize: 'clamp(13px, 1.6vw, 20px)', letterSpacing: '1px' }}
              >
                <span className="font-black">GOODPHIL 2025 - </span>
                <span className="font-medium">COLLEGE STATION</span>
              </p>
              <YouTubeEmbed videoId="02wg-b1WghI" title="Goodphil 2025 - College Station" />
            </div>

            {/* Performance — Goodphil 2024, Arlington */}
            <div ref={(el) => { perfCardRefs.current[2] = el }}>
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.16] font-display font-bold text-[10px] uppercase tracking-[0.1em] text-[#e8e4dd]/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  3rd Place
                </span>
              </div>
              <p
                className="font-display text-white text-center mb-3"
                style={{ fontSize: 'clamp(13px, 1.6vw, 20px)', letterSpacing: '1px' }}
              >
                <span className="font-black">GOODPHIL 2024 - </span>
                <span className="font-medium">ARLINGTON</span>
              </p>
              <YouTubeEmbed videoId="4JeGsfOV27E" title="Goodphil 2024 - Arlington" />
            </div>

          </div>

          {/* Exit CTA */}
          <div className="flex justify-center mt-14">
            <a
              href="https://instagram.com/fsautd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-green text-[#0e0e0e] rounded-full font-sans font-bold text-sm transition-all duration-200 hover:brightness-[1.08]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Watch More on Instagram
            </a>
          </div>

        </div>
      </section>

      {/* ── SECTION 4 — RECRUITMENT CTA (split band) ─────────────── */}
      {/* single focused ask, split copy/button — points to @fsautd (not a
          signup form) since Spirit auditions aren't open yet */}
      <section className="bg-section-bg py-16 px-6 border-t border-white/[0.08]">
        <div
          ref={ctaRef}
          className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8"
          style={{
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
          }}
        >
          <p className="font-sans text-white leading-relaxed max-w-[52ch] text-center md:text-left" style={{ fontSize: 'clamp(16px,1.8vw,18px)' }}>
            Spirit auditions begin each <strong className="font-bold text-accent-green">Spring</strong> as GoodPhil season kicks off. Follow us on Instagram to stay up to date on auditions, rehearsals, and{' '}
            <strong className="font-bold text-white">everything you&apos;ll need to join this year&apos;s team!</strong>
          </p>
          <a
            href="https://instagram.com/fsautd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center flex-none px-[26px] py-[13px] rounded-xl bg-accent-green text-[#0e0e0e] font-sans font-semibold text-[15px] whitespace-nowrap transition-all duration-200 hover:brightness-[1.08]"
          >
            Follow @fsautd
          </a>
        </div>
      </section>

    </main>
  )
}
