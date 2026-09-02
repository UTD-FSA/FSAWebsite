// ── page.tsx ──────────────────────────────────────────────
// goodphil about page — hero, what-is, participation rules,
// and a full-bleed team band linking to spirit/cultural/modern/sports
//
// notes: fully static; all photos served from /public —
//        goodphil-hero.jpg, goodphil-participate.jpg, and the
//        goodphil-team-*.jpg set.
//        copy palette is white / green / muted only — no gold, and no
//        highlight-sweep spans (both removed deliberately).
//        the five HOST_SCHOOLS hexes below are the host schools' own
//        brand colors, not FSA palette entries — that's why UT Austin's
//        burnt orange is here despite the sitewide no-orange rule.
// ──────────────────────────────────────────────────────────

'use client'

import { useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import SmoothImage from '@/components/SmoothImage'
import Link from 'next/link'
import GoodphilNavRail from '@/components/GoodphilNavRail'
import PageHero from '@/components/PageHero'
import SectionHeader from '@/components/SectionHeader'
import { useRevealOnScroll } from '@/lib/useRevealOnScroll'

// host-school logo grid data — colors match the hover hex already used on the
// UTA/TAMU/UT/UH/UTSA abbreviation spans in the "rotating between five host
// schools" paragraph, so the logo tiles stay color-consistent with the text above
const HOST_SCHOOLS = [
  { abbr: 'UTA',  name: 'The University of Texas at Arlington',  logo: '/uta-logo.png',  color: '#0064b1' },
  { abbr: 'UTSA', name: 'The University of Texas at San Antonio', logo: '/utsa-logo.png', color: '#687eb0' },
  { abbr: 'UH',   name: 'The University of Houston',              logo: '/uh-logo.png',   color: '#c34f62' },
  { abbr: 'TAMU', name: 'Texas A&M University',                   logo: '/tamu-logo.png', color: '#dd4446' },
  { abbr: 'UT',   name: 'The University of Texas at Austin',      logo: '/ut-logo.png',   color: '#d46920' },
] as const

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function GoodphilAboutPage() {
  // team band — staggered fade/slide-up once scrolled into view
  const teamGridRef = useRef<HTMLDivElement>(null)
  const teamGridVisible = useRevealOnScroll(teamGridRef)

  // host-school logo grid — staggered fade/slide-up once scrolled into view
  const hostSchoolsRef = useRef<HTMLDivElement>(null)
  const hostSchoolsVisible = useRevealOnScroll(hostSchoolsRef)

  return (
    <main className="bg-section-bg text-white overflow-x-clip">
      <GoodphilNavRail />

      {/* ── SECTION 1 — HERO ──────────────────────────────────────── */}
      <PageHero
        src="/goodphil-hero.jpg"
        alt="Goodphil competition"
        eyebrow="SPRING · FOUR DAYS · ALL FUN"
        title="GoodPhil"
        baybayin="ᜄᜓᜇ᜔ᜉᜒᜎ᜔"
        objectPosition="object-center"
        right={
          <span className="font-sans font-semibold uppercase tracking-[0.13em] text-[15px]">
            The biggest Filipino intercollegiate event in the South
          </span>
        }
      />

      {/* Autoscroll marquee bar */}
      <div className="bg-brand-bg h-[56px] md:h-[68px] flex items-center overflow-hidden">
        <div className="flex gap-8 whitespace-nowrap w-max animate-marquee" style={{ animationDuration: '78s' }}>
          {/* alternating white/green copies — the color flip is what makes the
              loop read as motion at wide viewports where a whole copy fits */}
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className={`font-display font-bold text-[clamp(18px,3.5vw,52px)] shrink-0 ${i % 2 ? 'text-accent-green' : 'text-white'}`}
            >
              THE INTERCOLLEGIATE COMPETITION OF THE YEAR.
            </span>
          ))}
        </div>
      </div>

      {/* ── SECTION 2 — WHAT IS GOODPHIL? ────────────────────────── */}
      <section className="bg-section-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="01" title="What Is GoodPhil?" baybayin="ᜄᜓᜇ᜔ᜉᜒᜎ᜔" />

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 pt-8">
            <p className="font-sans text-[20px] md:text-[23px] leading-snug text-white">
              The GoodPhil Games bring Filipino Student Associations from across Texas and
              Oklahoma together for{' '}
              <strong className="font-normal text-accent-green">four days of sports,
              performances, and friendly competition.</strong>
            </p>
            <p className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60">
              Every school spends months preparing for this weekend, building traditions and
              school pride before finally coming together to compete, cheer each other on, and
              celebrate as one FSA community. Held annually in the Spring, rotating between five
              host schools.
            </p>
          </div>

          {/* Host-school logo grid — one row on desktop, 2+2+1 (last tile
              centered) on mobile, aligned to the section's left edge. Each
              tile is tinted to that school's signature color, composited
              over the section's dark background rather than a
              painted-in base — the low tint keeps UT's thin line-art and TAMU's
              maroon legible while the border carries the color identity. */}
          <div
            ref={hostSchoolsRef}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-12"
          >
            {HOST_SCHOOLS.map((school, i) => (
              <div
                key={school.abbr}
                // odd tile out (5th of 5) centers itself across the mobile
                // 2-col grid instead of hanging off the left edge — 2+2+1
                className={
                  i === HOST_SCHOOLS.length - 1
                    ? 'col-span-2 w-[calc(50%-0.5rem)] mx-auto sm:col-span-1 sm:w-auto sm:mx-0'
                    : undefined
                }
                style={{
                  transform: hostSchoolsVisible ? 'translateY(0)' : 'translateY(16px)',
                  opacity: hostSchoolsVisible ? 1 : 0,
                  transition: `transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 80}ms, opacity 600ms ease-out ${i * 80}ms`,
                }}
              >
                <div
                  style={{
                    backgroundColor: hexToRgba(school.color, 0.12),
                    borderColor: hexToRgba(school.color, 0.35),
                    '--host-border-hover': hexToRgba(school.color, 0.7),
                  } as CSSProperties}
                  className="h-full rounded-xl border px-3 py-4 flex flex-col items-center gap-2.5 transition-all duration-300 ease-out hover:scale-[1.03] hover:[border-color:var(--host-border-hover)]"
                >
                  <div className="relative w-full h-[54px]">
                    <Image
                      src={school.logo}
                      alt={`${school.abbr} FSA logo`}
                      fill
                      className="object-contain"
                      sizes="200px"
                    />
                  </div>
                  <p className="font-sans text-[11px] font-semibold text-[#e8e4dd]/70 text-center leading-snug text-balance">
                    {school.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ── SECTION 3 — HOW CAN I PARTICIPATE? ───────────────────── */}
      <section className="bg-section-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="02" title="How Can I Participate?" baybayin="ᜄᜓᜇ᜔ᜉᜒᜎ᜔" />

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 pt-8 items-start">
            <div className="flex flex-col gap-8">
              <p className="font-sans text-[20px] md:text-[23px] leading-snug text-white">
                All GoodPhil participants must be{' '}
                <strong className="font-normal text-accent-green">members in good standing</strong>{' '}
                with the FSA they are affiliated with.
              </p>

              {/* hairline-separated checklist — the bordered card this replaced
                  read as a callout box competing with the section header */}
              <div>
                <p className="font-display font-semibold text-[12px] tracking-[0.14em] text-[#e8e4dd]/50 mb-2">
                  UTD FSA CORE REQUIREMENTS
                </p>
                <ul className="font-sans text-[15px] text-white">
                  {[
                    <>
                      <Link href="/membership" className="text-accent-green underline underline-offset-2">Be a paid member</Link>
                      {' '}of UTD FSA
                    </>,
                    <>Earn 6 GoodPhil points by attending UTD FSA events</>,
                    <>Attend 3 General Meetings</>,
                    <>Submit all Travel Forms, if you are a currently registered UTD student</>,
                  ].map((line, i) => (
                    <li key={i} className="flex items-start gap-4 py-3.5 border-b border-white/10">
                      <span className="text-[#e8e4dd]/40 shrink-0" aria-hidden="true">&#10003;</span>
                      <span className="leading-snug">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60">
                Unless the host school specifies otherwise, spectating Goodphil is{' '}
                <strong className="font-semibold text-white">free!</strong> Come out and support
                UTD FSA as we compete across sports, spirit, modern, and cultural events.
              </p>
            </div>

            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden">
              <SmoothImage
                src="/goodphil-participate.jpg"
                alt="UTD FSA competing at Goodphil"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 45vw"
                quality={85}
              />
            </div>
          </div>
        </div>

      </section>

      {/* ── SECTION 4 — ALL COMPETING GOODPHIL TEAMS ─────────────── */}
      <section className="bg-brand-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="03" title="All Competing Teams" size="md" />

          {/* 2×2 inside the section shell — same card treatment as the
              full-bleed strip this replaced (crop, scrim, bottom-left label),
              just boxed instead of running edge to edge */}
          <div ref={teamGridRef} className="grid grid-cols-2 gap-4 pt-10">
            {[
              { name: 'Spirit',   photo: '/goodphil-team-spirit.jpg',   href: '/goodphil/spirit' },
              { name: 'Cultural', photo: '/goodphil-team-cultural.jpg', href: '/goodphil/cultural' },
              { name: 'Modern',   photo: '/goodphil-team-modern.jpg', href: '/goodphil/modern' },
              { name: 'Sports',   photo: '/goodphil-team-sports.jpg',   href: '/goodphil/sports' },
            ].map(({ name, photo, href }, i) => (
              <Link
                key={name}
                href={href}
                className="relative h-[180px] lg:h-[220px] block overflow-hidden rounded-xl group"
                style={{
                  transform: teamGridVisible ? 'translateY(0)' : 'translateY(16px)',
                  opacity: teamGridVisible ? 1 : 0,
                  transition: `transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 100}ms, opacity 600ms ease-out ${i * 100}ms`,
                }}
              >
                {/* the zoom is promoted to its own compositor layer (transform-gpu
                    + will-change) so the browser stops re-rasterizing the photo
                    against the parent's rounded overflow clip every frame. that
                    promotion is worth keeping, but it was never what made the hover
                    glide — the curve lives in SmoothImage, and until it named the
                    `scale` property there was no transition here at all. */}
                <SmoothImage
                  src={photo}
                  alt={name}
                  fill
                  className="object-cover object-[center_25%] transform-gpu will-change-transform group-hover:scale-[1.04]"
                  sizes="(max-width: 768px) 50vw, 560px"
                  quality={85}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <span
                  className="absolute bottom-4 left-5 font-display font-black text-white leading-none"
                  style={{ fontSize: 'clamp(22px, 2.6vw, 34px)' }}
                >
                  {name}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </section>

    </main>
  )
}
