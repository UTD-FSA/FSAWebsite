// ── page.tsx ──────────────────────────────────────────────
// goodphil cultural page — utd pamana dance team profile
//
// notes: fully static; photos:
//        cultural-hero.jpg, cultural-photo-1/2/3.jpg (all in /public);
//        youtube video ids hardcoded in the past-performances
//        section; cta links to @utdpamana on instagram.
//        the intro's right-column photo collage, floating logo badge, and
//        inline Instagram pill were replaced by the PhotoBand below it —
//        the page's Instagram links live in the two CTAs further down.
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

export default function CulturalPage() {
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
        src="/cultural-hero.jpg"
        alt="UTD Pamana cultural dance team"
        eyebrow="GOODPHIL · CULTURAL"
        title="Pamana"
        baybayin="ᜃᜓᜎ᜔ᜆᜓᜍ"
        objectPosition="object-[center_43%]"
      />

      {/* ── SECTION 2 — WHAT IS UTD PAMANA? ──────────────────────── */}
      <section className="bg-section-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="01" title="What Is UTD Pamana?" baybayin="ᜃᜓᜎ᜔ᜆᜓᜍ" />

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 pt-8">
            <p className="font-sans text-[20px] md:text-[23px] leading-snug text-white">
              UTD Pamana, the Tagalog word for &ldquo;legacy&rdquo; or &ldquo;inheritance,&rdquo;
              represents the traditions and stories passed down from generation to generation. As
              UTD FSA&apos;s cultural dance team, Pamana brings those stories to life through{' '}
              <strong className="font-normal text-accent-green">traditional Filipino folk dances
              inspired by the country&rsquo;s diverse regions, history, and traditions.</strong>
            </p>
            <p className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60">
              Each fall, members spend the semester learning choreography, exploring the meaning
              behind every dance, and preparing for{' '}
              <strong className="font-semibold text-white">Isang Mahal</strong>, where cultural
              dance teams from Filipino Student Associations across Texas come together to
              perform. The journey continues into GoodPhil, where Pamana proudly represents UTD
              while sharing the beauty of Filipino culture with audiences from across the state.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2.5 — PHOTO BAND ─────────────────────────────── */}
      <PhotoBand
        photos={[
          { src: '/cultural-photo-1.jpg', alt: 'UTD Pamana performing at Goodphil', objectPosition: 'object-[center_25%]' },
          { src: '/cultural-photo-2.jpg', alt: 'UTD Pamana dancer mid-performance', objectPosition: 'object-[center_65%]' },
          { src: '/cultural-photo-3.jpg', alt: 'UTD Pamana group performance at Goodphil', objectPosition: 'object-[center_55%]' },
        ]}
      />

      {/* ── SECTION 3 — PAST PERFORMANCES ────────────────────────── */}
      {/* Goodphil group (featured + 2-col secondary row for older years) followed
          by the Isang Mahal group (2-col row, most-recent-first); each card is
          a lazy-loaded YouTube embed (components/YouTubeEmbed.tsx) */}
      <section className="bg-brand-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="02" title="Past Performances" rule={false} />

          {/* Group divider — GOODPHIL */}
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
            <p
              className="font-display text-white text-center mb-4"
              style={{ fontSize: 'clamp(14px, 2vw, 30px)', letterSpacing: '1.5px' }}
            >
              <span className="font-black">GOODPHIL 2026 - </span>
              <span className="font-medium">AUSTIN</span>
            </p>
            <div className="max-w-[60rem] mx-auto">
              <YouTubeEmbed videoId="q6mxXQuX4ek" title="Goodphil 2026 - Austin" />
            </div>
          </div>

          {/* Secondary — earlier years */}
          <div className="grid sm:grid-cols-2 gap-8">

            {/* Performance — Goodphil 2025, College Station */}
            <div ref={(el) => { perfCardRefs.current[1] = el }}>
              <p
                className="font-display text-white text-center mb-3"
                style={{ fontSize: 'clamp(13px, 1.6vw, 20px)', letterSpacing: '1px' }}
              >
                <span className="font-black">GOODPHIL 2025 - </span>
                <span className="font-medium">COLLEGE STATION</span>
              </p>
              <YouTubeEmbed videoId="ru_9K8ygmRg" title="Goodphil 2025 - College Station" />
            </div>

            {/* Performance — Goodphil 2024, Arlington */}
            <div ref={(el) => { perfCardRefs.current[2] = el }}>
              <p
                className="font-display text-white text-center mb-3"
                style={{ fontSize: 'clamp(13px, 1.6vw, 20px)', letterSpacing: '1px' }}
              >
                <span className="font-black">GOODPHIL 2024 - </span>
                <span className="font-medium">ARLINGTON</span>
              </p>
              <YouTubeEmbed videoId="j9v1Lt1-xu4" title="Goodphil 2024 - Arlington" />
            </div>

          </div>

          {/* Group divider — ISANG MAHAL */}
          <div className="flex items-center gap-4 max-w-3xl mx-auto mt-16 mb-10">
            <div className="h-px flex-1 bg-white/15" />
            <span
              className="font-display font-black text-accent-green uppercase"
              style={{ fontSize: 'clamp(18px, 2.4vw, 30px)', letterSpacing: '0.14em' }}
            >
              Isang Mahal
            </span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <div className="grid sm:grid-cols-2 gap-8">

            {/* Performance — Isang Mahal 2025, College Station */}
            <div ref={(el) => { perfCardRefs.current[3] = el }}>
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.16] font-display font-bold text-[10px] uppercase tracking-[0.1em] text-[#e8e4dd]/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  2nd Place
                </span>
              </div>
              <p
                className="font-display text-white text-center mb-3"
                style={{ fontSize: 'clamp(13px, 1.6vw, 20px)', letterSpacing: '1px' }}
              >
                <span className="font-black">ISANG MAHAL 2025 - </span>
                <span className="font-medium">COLLEGE STATION</span>
              </p>
              <YouTubeEmbed videoId="IKyewqDOnBg" title="Isang Mahal 2025 - College Station" />
            </div>

            {/* Performance — Isang Mahal 2024, College Station */}
            <div ref={(el) => { perfCardRefs.current[4] = el }}>
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
                <span className="font-black">ISANG MAHAL 2024 - </span>
                <span className="font-medium">COLLEGE STATION</span>
              </p>
              <YouTubeEmbed videoId="Dj88LAg6_O4" title="Isang Mahal 2024 - College Station" />
            </div>

          </div>

          {/* Exit CTA */}
          <div className="flex justify-center mt-14">
            <a
              href="https://www.instagram.com/utdpamana"
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
            <strong className="font-bold text-accent-green">No dance experience? No problem!</strong> Our workshops are open to anyone interested in learning more about Filipino culture through dance.
          </p>
          <a
            href="https://forms.gle/X4o8v3Qjq3CnULRf9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center flex-none px-[26px] py-[13px] rounded-xl bg-accent-green text-[#0e0e0e] font-sans font-semibold text-[15px] whitespace-nowrap transition-all duration-200 hover:brightness-[1.08]"
          >
            Join Pamana
          </a>
        </div>
      </section>

    </main>
  )
}
