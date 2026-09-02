// ── page.tsx ──────────────────────────────────────────────
// goodphil sports page — 9-sport grid, captain interest form,
// and captain meeting booking cta
//
// notes: fully static; hero: sports-hero.jpg (/public); band photos are
//        sports-photo-1.jpg, goodphil-games.jpg, sports-photo-3.jpg;
//        sport photos live in the SPORTS array below (photo: null
//        renders the mystery-sport placeholder tile); captain form
//        and booking links are hardcoded google forms/calendar urls;
//        no purple highlights anywhere; Our Sports section uses
//        bg-brand-bg (#0e0e0e), same dark tone as the About page's
//        "Get in Touch" section.
//        copy palette is white / green / muted only, no gold.
// ──────────────────────────────────────────────────────────

'use client'

import { useRef } from 'react'
import SmoothImage from '@/components/SmoothImage'
import GoodphilNavRail from '@/components/GoodphilNavRail'
import PageHero from '@/components/PageHero'
import PhotoBand from '@/components/PhotoBand'
import SectionHeader from '@/components/SectionHeader'
import { useRevealOnScroll, useStaggeredReveal } from '@/lib/useRevealOnScroll'

// ── sport roster ──────────────────────────────────────────────
// order is the display order; photo: null = the not-yet-announced tile
const SPORTS: { name: string; photo: string | null }[] = [
  { name: "Men's Basketball",   photo: '/sport-mens-basketball.jpg' },
  { name: "Women's Basketball", photo: '/sport-womens-basketball.jpg' },
  { name: "Men's Volleyball",   photo: '/sport-mens-volleyball.jpg' },
  { name: "Women's Volleyball", photo: '/sport-womens-volleyball.jpg' },
  { name: 'Coed Volleyball',    photo: '/sport-coed-volleyball.jpg' },
  { name: "Men's Flag Football", photo: '/sport-mens-flag-football.jpg' },
  { name: 'Coed Soccer',        photo: '/sport-coed-soccer.jpg' },
  { name: 'Ultimate Frisbee',   photo: '/sport-ultimate-frisbee.jpg' },
  { name: 'Mystery Sport: TBD', photo: null },
]

export default function SportsPage() {
  // captain CTA cards — own scroll trigger since they sit below the fold
  const headingRef = useRef<HTMLDivElement>(null)
  const headingVisible = useRevealOnScroll(headingRef)

  // sports card grid — row-staggered scroll-triggered fade-up (same pattern as
  // About's officer board), now with the shared never-blank + reduced-motion guard
  const sportsGridRef = useRef<HTMLDivElement>(null)
  useStaggeredReveal(
    () => (sportsGridRef.current ? (Array.from(sportsGridRef.current.children) as HTMLElement[]) : []),
    (card, cards) => {
      // reveal the whole row together, keyed on shared offsetTop
      const top = card.offsetTop
      cards
        .filter(c => Math.abs(c.offsetTop - top) < 4)
        .forEach(c => {
          if (c.dataset.revealed) return
          c.dataset.revealed = '1'
          c.style.animation = 'none'
          void c.offsetHeight
          c.style.animation = 'fadeUp 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
        })
    },
  )

  return (
    <main className="bg-section-bg text-white overflow-x-clip">
      <GoodphilNavRail />

      {/* ── SECTION 1 — HERO ──────────────────────────────────────── */}
      <PageHero
        src="/sports-hero.jpg"
        alt="UTD FSA Sports team"
        eyebrow="GOODPHIL · SPORTS"
        title="Sports"
        baybayin="ᜉᜎᜃᜐᜈ᜔"
        objectPosition="object-[center_20%]"
      />

      {/* ── SECTION 2 — WHAT IS UTD FSA SPORTS? ──────────────────── */}
      <section className="bg-section-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="01" title="What Is UTD FSA Sports?" baybayin="ᜉᜎᜃᜐᜈ᜔" />

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 pt-8">
            <p className="font-sans text-[20px] md:text-[23px] leading-snug text-white">
              UTD FSA Sports is where our{' '}
              <strong className="font-normal text-accent-green">competitive spirit comes
              alive.</strong> Throughout the weekend, members represent UTD in a variety of sports
              while competing against Filipino Student Associations from across Texas.
            </p>
            <p className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60">
              From first-time players to seasoned competitors, there&rsquo;s a place for everyone.
              Whether you&rsquo;re chasing a championship or trying a new sport with friends,
              it&rsquo;s all about teamwork, sportsmanship, and{' '}
              <strong className="font-semibold text-white">creating lasting memories both on and
              off the court</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2.5 — PHOTO BAND ─────────────────────────────── */}
      <PhotoBand
        photos={[
          { src: '/sports-photo-1.jpg', alt: 'UTD FSA Sports at Goodphil', objectPosition: 'object-center' },
          { src: '/goodphil-games.jpg', alt: 'UTD FSA Sports at Goodphil', objectPosition: 'object-center' },
          { src: '/sports-photo-3.jpg', alt: 'UTD FSA Sports at Goodphil', objectPosition: 'object-center' },
        ]}
      />

      {/* ── SECTION 3 — OUR SPORTS ───────────────────────────────── */}
      <section className="bg-brand-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="02" title="Our Sports" baybayin="ᜉᜎᜃᜐᜈ᜔" />

          {/* photo tiles with the label set over the crop — the bordered
              card chrome around each photo read as nine separate widgets
              rather than one roster */}
          <div ref={sportsGridRef} className="grid grid-cols-2 md:grid-cols-3 gap-1 pt-10">
            {SPORTS.map(({ name, photo }) => (
              // the roster is 9 tiles, so the 2-col mobile grid leaves the last one
              // (the mystery tile) orphaned in the left column — span both columns and
              // center it at one column's width. md+ is an exact 3x3, nothing to fix.
              <div
                key={name}
                className={`relative aspect-[4/3] overflow-hidden group${
                  photo ? '' : ' max-md:col-span-2 max-md:w-1/2 max-md:mx-auto'
                }`}
              >
                {photo ? (
                  <SmoothImage
                    src={photo}
                    alt={name}
                    fill
                    className="object-cover object-center transform-gpu will-change-transform group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    quality={85}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#111] flex items-center justify-center">
                    <span className="text-5xl" aria-hidden="true">❓</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <h3
                  className="absolute bottom-3 left-4 font-display font-bold text-white leading-none"
                  style={{ fontSize: '19px', letterSpacing: '-0.01em' }}
                >
                  {name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — CAPTAINS ─────────────────────────────────── */}
      <section className="bg-section-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="03" title="Captains" />

          <div ref={headingRef} className="grid sm:grid-cols-2 gap-6 pt-10">

            {/* primary cta — captain interest form */}
            <div
              className="bg-[#141414] border border-white/10 rounded-2xl px-8 py-10 text-center"
              style={{
                opacity: headingVisible ? 1 : 0,
                transform: headingVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
              }}
            >
              <h3
                className="font-display font-black text-white mb-3"
                style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                Want to Captain a Sport?
              </h3>
              <p
                className="font-sans text-[#e8e4dd]/60 mb-6"
                style={{ fontSize: '14.5px', lineHeight: 1.6, fontWeight: 500 }}
              >
                Sports captains lead their team throughout Goodphil season. If you&apos;re interested in taking on a leadership role, fill out the captain interest form!
              </p>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSc4CPQXu9A_CaCMmZO9xJiUl_7Up5R8bBxLPKlo2fFZpuxFGg/viewform?pli=1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-accent-green text-[#0e0e0e] rounded-xl font-sans font-bold transition-all duration-200 hover:brightness-[1.08]"
                style={{ fontSize: '14px', letterSpacing: '0.01em' }}
              >
                Fill Out Captain Interest Form
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            </div>

            {/* secondary cta — book a captain meeting */}
            <div
              className="bg-[#141414] border border-white/10 rounded-2xl px-8 py-10 text-center flex flex-col items-center"
              style={{
                opacity: headingVisible ? 1 : 0,
                transform: headingVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
                transitionDelay: headingVisible ? '80ms' : '0ms',
              }}
            >
              <h3
                className="font-display font-black text-white mb-3"
                style={{ fontSize: 'clamp(20px, 2.2vw, 26px)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
              >
                Book a Captain Meeting
              </h3>
              <p
                className="font-sans text-[#8a8a8a] mb-6"
                style={{ fontSize: '14.5px', lineHeight: 1.6, fontWeight: 500 }}
              >
                Already a captain or interested in becoming one? Book a meeting with a Sports Coordinator to discuss your team, scheduling, and Goodphil prep.
              </p>
              <a
                href="https://calendar.app.google/DeGvXnzB5Ux2DEQa8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 border border-white/40 text-[#e8e4dd]/80 rounded-xl font-sans font-bold transition-all duration-200 hover:border-white/60 hover:text-white"
                style={{ fontSize: '14px', letterSpacing: '0.01em' }}
              >
                Book a Meeting
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </a>
            </div>

          </div>
        </div>
      </section>

    </main>
  )
}
