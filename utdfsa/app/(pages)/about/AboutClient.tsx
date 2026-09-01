// ── AboutClient.tsx ──────────────────────────────────────────
// client component — about page UI with officer board and past officers accordion
//
// data:  none — all officer data is hardcoded in constants below
// deps:  lib/useRevealOnScroll (useRevealOnScroll, useStaggeredReveal)
// notes: officer photos not yet available; placeholder silhouettes used.
//        update OFFICERS_2025_2026 and PAST_OFFICERS each semester.
//        accordion uses a single openYear string so only one year shows at a time,
//        and its border/rounding live on a constant outer wrapper rather than on
//        the trigger button — the button's own className used to toggle its corner
//        radius on open, which snapped square instantly while the panel below was
//        still mid-collapse. nothing to keep in sync now, so nothing can desync.
//        entrance stagger is scoped per row, not per global index — see the
//        comments on each useStaggeredReveal call for why.
// ─────────────────────────────────────────────────────────────
'use client'

import { useState, useRef } from 'react'
import QuickNavRail from '@/components/QuickNavRail'
import PageHero from '@/components/PageHero'
import SectionHeader from '@/components/SectionHeader'
import { useRevealOnScroll, useStaggeredReveal } from '@/lib/useRevealOnScroll'

const ABOUT_NAV_ITEMS = [
  { label: 'Officers', href: '#officers' },
  { label: 'Contact',  href: '#contact' },
  { label: 'Connect',  href: '#connect' },
  { label: 'Past Boards', href: '#past-boards' },
]

// ── officer data ──────────────────────────────────────────────
// update position/name entries each year; add new year block to PAST_OFFICERS
// leadership (President, VP, Secretary, Treasurer) render in their own dedicated
// row above the rest of the board
const OFFICERS_LEADERSHIP = [
  { position: 'President',           name: 'Genna Ibarra' },
  { position: 'Vice President',      name: 'Simon Choi' },
  { position: 'Secretary',           name: 'Kevalin Staats' },
  { position: 'Treasurer',           name: 'Tristan Casillan' },
]

const OFFICERS_2025_2026 = [
  { position: 'Board Advisor',       name: 'Leo dos Remedios' },
  { position: 'Event Coordinator',   name: 'Kim Pham' },
  { position: 'Pamilya Chair',       name: 'Christopher Hay' },
  { position: 'Webmaster',           name: 'Adrian Hautea' },
  { position: 'Sports Coordinator',  name: 'Aidan Liu' },
  { position: 'Sports Coordinator',  name: 'Shayna Silvestre' },
  { position: 'Modern Director',     name: 'Livy Ker' },
  { position: 'Cultural Director',   name: 'Gianna Toledo' },
  { position: 'Cultural Ambassador', name: 'Raffi Abeleda' },
  { position: 'Historian',           name: 'Aliyah Carabeo' },
  { position: 'Marketing Chair',     name: 'Lance Martinez' },
  { position: 'Graphics Chair',      name: 'Skylar Dang' },
  { position: 'Philanthropy Chair',  name: 'Kenneth Le' },
  { position: 'Fundraising Chair',   name: 'Brian Leung' },
]

const PAST_OFFICERS = [
  {
    year: '2025-2026',
    officers: [
      { position: 'President',           names: 'DJ Sagutaon' },
      { position: 'Vice President',      names: 'Leo dos Remedios' },
      { position: 'Secretary',           names: 'Genna Ibarra' },
      { position: 'Treasurer',           names: 'Renzo Artates' },
      { position: 'Board Advisor',       names: 'Czar Nonot' },
      { position: 'Fundraising Chair',   names: 'Ariana Halili' },
      { position: 'Event Coordinator',   names: 'Livy Ker' },
      { position: 'Sports Coordinators', names: 'Richard Aryata, Phuc Tran' },
      { position: 'Historian',           names: 'Lance Martinez' },
      { position: 'Marketing Chair',     names: 'Lauren Siacunco' },
      { position: 'Graphics Chairs',     names: 'Michael Dao, Zoe Zhang' },
      { position: 'Pamilya Chair',       names: 'Josh Eromonsele' },
      { position: 'Webmaster',           names: 'Josh Eromonsele' },
      { position: 'Cultural Ambassador', names: 'Patrick Enerio' },
      { position: 'Cultural Director',   names: 'Tristan Casillan' },
      { position: 'Philanthropy Chair',  names: 'Simon Choi' },
      { position: 'Modern Director',     names: 'Kaden Thephavong' },
    ],
  },
  {
    year: '2024-2025',
    officers: [
      { position: 'President',           names: 'Alvin Bagaoisan' },
      { position: 'Vice President',      names: 'DJ Sagutaon' },
      { position: 'Secretary',           names: 'Vy Tran' },
      { position: 'Treasurer',           names: 'Czar Nonot' },
      { position: 'Event Coordinator',   names: 'Jennifer Chen' },
      { position: 'Historian',           names: 'Russell Ha' },
      { position: 'Marketing Chair',     names: 'Katherine Tran' },
      { position: 'Graphics Chair',      names: 'DJ Sagutaon' },
      { position: 'Pamilya Chair',       names: 'Leo dos Remedios' },
      { position: 'Sports Coordinators', names: 'Brian Luu, Keanu Lee' },
      { position: 'Cultural Ambassador', names: 'Nathan Bucasas' },
      { position: 'Cultural Director',   names: 'Renzo Artates' },
      { position: 'Modern Director',     names: 'Kaden Thephavong' },
      { position: 'Spirit Directors',    names: 'Helena Ramning, Yuan Paulino' },
      { position: 'Fundraising Chair',   names: 'Phat Phung' },
      { position: 'Philanthropy Chair',  names: 'Christopher Chang' },
    ],
  },
  {
    year: '2023-2024',
    officers: [
      { position: 'President',           names: 'Sabrina Uy Tesy' },
      { position: 'Vice President',      names: 'Chris Chan' },
      { position: 'Secretary',           names: 'Julia Nguyen' },
      { position: 'Treasurer',           names: 'Yuan Paulino' },
      { position: 'Event Coordinator',   names: 'Jennifer Chen' },
      { position: 'Historian',           names: 'Adit Patel' },
      { position: 'Graphics Chair',      names: 'Arianna Poblete' },
      { position: 'Pamilya Chair',       names: 'Kevin Ly' },
      { position: 'Sports Coordinators', names: 'Maya Bhaidasna, Marshall Mao' },
      { position: 'Cultural Ambassador', names: 'Alvin Bagaoisan' },
      { position: 'Cultural Director',   names: 'Helena Ramning' },
      { position: 'Modern Directors',    names: 'DJ Sagutaon, Zamira Miranda' },
      { position: 'Fundraising Chair',   names: 'Vy Tran' },
      { position: 'Philanthropy Chair',  names: 'Weber Tsao' },
      { position: 'Spirit Directors',    names: 'Christina Lam, Helena Ramning' },
    ],
  },
  {
    year: '2022-2023',
    officers: [
      { position: 'President',                              names: 'Lani Bergantin' },
      { position: 'Vice President',                         names: 'Eric Brian Roca' },
      { position: 'Secretary',                              names: 'Erica Nah' },
      { position: 'Event Coordinator',                      names: 'Leah Miranda' },
      { position: 'Historian',                              names: 'Kyle Zeng' },
      { position: 'Graphics Chair',                         names: 'Amber Bui' },
      { position: 'Pamilya Chair',                          names: 'Catalina Chang' },
      { position: 'Sports Coordinators',                    names: 'Thach Huynh, Sonny Ton' },
      { position: 'Cultural Ambassador / Spirit Director',  names: 'Rafa Evangelista' },
      { position: 'Cultural Director',                      names: 'Sabrina Uy Tesy' },
      { position: 'Modern Directors',                       names: 'Christina Lam, Lynn Pham' },
      { position: 'Philanthropy Chair',                     names: 'Chris Chan' },
    ],
  },
]

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/fsautd',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@fsautd',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <polygon points="10,9 16,12 10,15" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@utdfsa',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.29 8.29 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: 'https://discord.gg/uVRmuF3BT',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.002.023.016.045.034.059a19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.104 13.1 13.1 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:fsautd@gmail.com',
    icon: (
      <img src="/gmail.svg" alt="Gmail" width={24} height={24} className="w-7 h-7 opacity-60" />
    ),
  },
]

// two-letter initials for the placeholder avatar — first + last name initial
function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

// cycles through the existing tonal surface stack so avatars aren't one flat identical tile,
// without introducing a new color outside the design system
const AVATAR_TONES = ['#1e1e1e', '#262626', '#1a1a1a']

export default function AboutClient() {
  // tracks which past-officer accordion row is expanded; empty string = all collapsed
  const [openYear, setOpenYear] = useState<string>('')

  // ── accordion toggle ──────────────────────────────────────
  // clicking the same open year collapses it; clicking a different year opens it
  function toggleYear(year: string) {
    setOpenYear(prev => prev === year ? '' : year)
  }

  // ── current officer board — staggered fade-up entrance ────
  // delay is scoped to the card's row (grouped by offsetTop), not its global index —
  // an 18-card grid staggered globally leaves the last card blank ~1.4s after it is
  // already on screen. per-row reset caps the wait at 135ms at every breakpoint.
  const boardGridRef = useRef<HTMLDivElement>(null)
  useStaggeredReveal(
    () => Array.from(boardGridRef.current?.querySelectorAll<HTMLElement>('[data-officer-card]') ?? []),
    (card, cards) => {
      const row = cards.filter(c => Math.abs(c.offsetTop - card.offsetTop) < 4)
      card.style.animation = `fadeUp 0.45s var(--ease-smooth) ${row.indexOf(card) * 45}ms both`
    },
  )

  // ── past officer boards — staggered fade-up entrance ──────
  // one observer on the whole group (not one per card, like useStaggeredReveal) —
  // on a slow scroll each card crossing the reveal line at its own moment made the
  // stagger read as "one at a time" instead of a single wave. gating every card off
  // one boolean fires them together, staggered only by the fixed per-index delay below.
  const pastGridRef = useRef<HTMLDivElement>(null)
  const pastVisible = useRevealOnScroll(pastGridRef)

  // ── contact + connect sections — scroll reveal (were static; rest of page animates) ──
  const contactRef = useRef<HTMLDivElement>(null)
  const contactVisible = useRevealOnScroll(contactRef)

  const connectGridRef = useRef<HTMLDivElement>(null)
  useStaggeredReveal(
    () => Array.from(connectGridRef.current?.querySelectorAll<HTMLElement>('[data-social-tile]') ?? []),
    (card, cards) => {
      const i = cards.indexOf(card)
      card.style.animation = `fadeUp 0.5s var(--ease-smooth) ${i * 70}ms both`
    },
  )

  return (
    <main className="bg-brand-bg text-white overflow-x-clip">
      <QuickNavRail mode="sections" ariaLabel="About page sections" items={ABOUT_NAV_ITEMS} />

      {/* ── SECTION 1 — WHO WE ARE ──────────────────────────────────── */}
      <PageHero
        src="/about-us-hero.jpg"
        alt="UTD FSA"
        eyebrow="EST. 2001 · UT DALLAS"
        title="About Us"
        baybayin="ᜆᜓᜅ᜔ᜃᜓᜎ᜔"
        objectPosition="object-center"
        heightClassName="h-[45vh] md:h-[500px]"
      />

      {/* ── SECTION 1.5 — OUR IMPACT ─────────────────────────────────── */}
      <section className="py-16 px-6 bg-brand-bg">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="01" title="Our Impact" baybayin="ᜋᜒᜐ᜔ᜌᜓᜈ᜔" />
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 pt-8">
            <p className="font-sans text-[20px] md:text-[23px] leading-snug text-white">
              Throughout the year, <strong className="font-medium text-accent-green">UTD FSA
              offers a wide variety of opportunities</strong> for members to get involved both
              on and off campus.
            </p>
            <p className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60">
              From our Pamilya program, GoodPhil and Isang Mahal performances, cultural
              showcases, and some of our most anticipated social events, there&rsquo;s always
              something to look forward to! No matter your interests, every experience is an
              opportunity to meet new people, try something new, and{' '}
              <strong className="font-semibold text-white">become part of our
              traditions.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — OFFICER BOARD ───────────────────────────────── */}
      <section id="officers" className="py-16 px-6 bg-section-bg scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          {/* centered plain heading, not a numbered SectionHeader — the board is
              the page's own masthead rather than another numbered read-through */}
          <h2
            className="font-display font-black text-white text-center"
            style={{ fontSize: 'clamp(16px, 2.2vw, 32px)', letterSpacing: '0.02em' }}
          >
            2026 – 2027 Officer Board
          </h2>
          <p className="text-center font-display font-semibold text-[12px] tracking-[0.14em] text-accent-green mt-10">
            EXECUTIVE BOARD
          </p>
          <div ref={boardGridRef} className="flex flex-col gap-6 mt-5">
            {/* leadership row — President, VP, Secretary, Treasurer share their own
                row, 2-up on mobile and 4-up from md on */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto w-full">
              {OFFICERS_LEADERSHIP.map(({ position, name }, i) => (
                <div
                  key={`${position}-${name}`}
                  data-officer-card
                  className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden hover:brightness-110 transition-all duration-200"
                >
                  {/* replace this div with Next.js Image when officer photos are available:
                      <SmoothImage src="/officers/[name].jpg" alt="[Name]" fill
                        className="object-cover object-top" /> */}
                  <div
                    className="relative w-full aspect-square flex items-center justify-center overflow-hidden"
                    style={{ background: AVATAR_TONES[i % AVATAR_TONES.length] }}
                  >
                    <span className="font-display font-bold text-[#e8e4dd]/70 text-3xl tracking-wide">
                      {initials(name)}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-sans font-bold text-white text-sm leading-snug mb-0.5">
                      {name}
                    </p>
                    <p className="font-sans text-[#e8e4dd]/55 text-[13px] leading-snug">
                      {position}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* remaining officer board — normal responsive grid */}
            <p className="text-center font-display font-semibold text-[12px] tracking-[0.14em] text-[#e8e4dd]/50 mt-6 mb-1">
              OFFICER BOARD
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {OFFICERS_2025_2026.map(({ position, name }, i) => (
                <div
                  key={`${position}-${name}`}
                  data-officer-card
                  className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden hover:brightness-110 transition-all duration-200"
                >
                  {/* replace this div with Next.js Image when officer photos are available:
                      <SmoothImage src="/officers/[name].jpg" alt="[Name]" fill
                        className="object-cover object-top" /> */}
                  <div
                    className="relative w-full aspect-square flex items-center justify-center overflow-hidden"
                    style={{ background: AVATAR_TONES[i % AVATAR_TONES.length] }}
                  >
                    <span className="font-display font-bold text-[#e8e4dd]/70 text-3xl tracking-wide">
                      {initials(name)}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-sans font-bold text-white text-sm leading-snug mb-0.5">
                      {name}
                    </p>
                    <p className="font-sans text-[#e8e4dd]/55 text-[13px] leading-snug">
                      {position}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — CONTACT US ──────────────────────────────────── */}
      <section id="contact" className="py-16 px-6 bg-brand-bg scroll-mt-20">
        <div
          ref={contactRef}
          className="max-w-xl mx-auto text-center"
          style={{
            opacity: contactVisible ? 1 : 0,
            transform: contactVisible ? 'none' : 'translateY(20px)',
            transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
          }}
        >
          <h2
            className="font-display font-black text-white mb-6"
            style={{ fontSize: 'clamp(16px, 2.2vw, 32px)', letterSpacing: '0.02em' }}
          >
            Get in Touch
          </h2>
          <p
            className="font-sans text-[#e8e4dd]/60 leading-relaxed mb-8"
            style={{ fontSize: 'clamp(14px, 1.4vw, 17px)' }}
          >
            Have questions about UTD FSA? Reach out to us on Instagram! We respond to DMs and
            are happy to help with anything from membership questions to event details.
          </p>
          <a
            href="https://instagram.com/fsautd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-accent-green text-[#08130a] font-sans font-bold text-sm tracking-wide hover:brightness-[1.08] active:scale-[0.98] transition-all duration-200"
          >
            <InstagramIcon className="w-4 h-4" />
            @fsautd
          </a>
        </div>
      </section>

      {/* ── SECTION 4 — CONNECT WITH US ─────────────────────────────── */}
      <section id="connect" className="py-16 px-6 bg-section-bg scroll-mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="font-display font-black text-white mb-10"
            style={{ fontSize: 'clamp(16px, 2.2vw, 32px)', letterSpacing: '0.02em' }}
          >
            Connect with Us
          </h2>
          <div ref={connectGridRef} className="flex flex-wrap justify-center gap-4">
            {SOCIALS.map(({ label, href, icon }) => (
              <a
                key={label}
                data-social-tile
                href={href}
                target={href === '#' ? undefined : '_blank'}
                rel={href === '#' ? undefined : 'noopener noreferrer'}
                className="flex flex-col items-center gap-3 px-8 py-6 bg-[#1a1a1a] border border-white/10 rounded-xl text-[#e8e4dd]/60 hover:text-white hover:brightness-110 hover:border-white/20 transition-all duration-200 min-w-[110px]"
              >
                {icon}
                <span className="font-sans text-xs font-semibold tracking-wide">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — PAST OFFICERS ───────────────────────────────── */}
      <section id="past-boards" className="py-16 px-6 bg-brand-bg scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <h2
            className="font-display font-black text-white text-center mb-10"
            style={{ fontSize: 'clamp(16px, 2.2vw, 32px)', letterSpacing: '0.02em' }}
          >
            Past Officer Boards
          </h2>
          <div ref={pastGridRef} className="flex flex-col gap-3">
            {PAST_OFFICERS.map(({ year, officers }, i) => {
              const isOpen = openYear === year
              // format "2024-2025" → "2024 – 2025" for display
              const displayYear = year.replace('-', ' – ')
              return (
                <div
                  key={year}
                  className="rounded-xl border border-white/10 overflow-hidden"
                  style={{
                    opacity: pastVisible ? 1 : 0,
                    animation: pastVisible ? `fadeUp 0.6s var(--ease-smooth) ${i * 80}ms both` : undefined,
                  }}
                >
                  {/* border + radius live on this constant outer wrapper (not on the button
                      or panel below), mirroring the FAQ accordion in MembershipClient.tsx —
                      a radius toggled per open/closed state snaps instantly (border-radius
                      wasn't in the transitioned property list), popping "closed" the moment
                      isOpen flips while the panel below is still 300ms into collapsing.
                      keeping the radius constant here removes that seam by construction. */}
                  <button
                    id={`past-officers-trigger-${year}`}
                    aria-expanded={isOpen}
                    aria-controls={`past-officers-panel-${year}`}
                    className="w-full flex items-center justify-between py-4 px-6 bg-[#1a1a1a] text-left hover:bg-[#222] transition-colors duration-200"
                    onClick={() => toggleYear(year)}
                  >
                    <span className="font-sans font-bold text-white text-base">{displayYear}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#e8e4dd]/50 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {/* grid-template-rows 0fr→1fr — animates the collapse without touching
                      height directly, so the panel stays always-mounted (no pop-in) */}
                  <div
                    className="grid transition-[grid-template-rows] duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                  >
                    <div className="overflow-hidden">
                      <div
                        id={`past-officers-panel-${year}`}
                        role="region"
                        aria-labelledby={`past-officers-trigger-${year}`}
                        aria-hidden={!isOpen}
                        className="bg-[#161616] px-6 py-2"
                      >
                        {officers.map(({ position, names }, i) => (
                          <div
                            key={`${year}-${position}`}
                            className={`flex flex-col sm:flex-row gap-1 sm:gap-6 py-3 ${i < officers.length - 1 ? 'border-b border-white/10' : ''}`}
                          >
                            <span className="font-sans text-[11px] uppercase tracking-widest text-[#e8e4dd]/60 sm:w-52 sm:flex-shrink-0 sm:pt-0.5">
                              {position}
                            </span>
                            <span className="font-sans text-sm text-white">{names}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

    </main>
  )
}
