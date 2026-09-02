'use client'
// ── HeroSection.tsx ───────────────────────────────────────
// client component that owns the hero logo + subtitle text so
// entrance animations can be reliably restarted on every visit:
//   - Next.js soft navigation (useEffect runs on each mount)
//   - bfcache restoration (pageshow with e.persisted)
// The reflow trick (void el.offsetHeight) forces the browser to
// restart a CSS animation even if the element is already in the DOM.
//
// Subtitle sits centered below the logo (not flanking it) so it stays
// visible and collision-free at every viewport width, not just >=1536px.
// The accessible name lives in the sr-only <h1> in page.tsx, so this
// block is marked aria-hidden to avoid double announcement.
//
// Reverted to this pre-mockup-port layout on request (round 2 of the
// port); the mockup's bottom-left eyebrow/title stack lives on in
// PageHero.tsx for the interior pages. Second "Upcoming events" CTA
// (black) added alongside the original "Become a Member" button. Both CTAs
// render smaller below sm (padding + type) so they don't dominate the phone
// hero under the logo — the base values are the mobile ones, the sm: pair is
// the full-size desktop set.

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  const logoRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const ctaGroupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const BASE = '0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)'

    function play() {
      const targets: [React.RefObject<HTMLElement | null>, string, string][] = [
        [logoRef,     'heroFadeIn', '0s'],
        [subtitleRef, 'heroFadeIn', '0.25s'],
        [ctaGroupRef, 'heroFadeIn', '0.5s'],
      ]
      targets.forEach(([ref, name, delay]) => {
        const el = ref.current
        if (!el) return
        el.style.animation = 'none'
        void el.offsetHeight        // force reflow — restarts the animation
        el.style.animation = `${name} ${BASE} ${delay} both`
      })
    }

    const rafId = requestAnimationFrame(play)
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) play() }
    window.addEventListener('pageshow', onPageShow)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4 z-20 px-6 text-center">
      {/* Logo — starts invisible; useEffect applies heroFadeIn */}
      <div
        ref={logoRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className="pointer-events-none w-[200px] h-[200px] sm:w-[360px] sm:h-[360px] md:w-[515px] md:h-[515px]"
      >
        <Image
          src="/hero-logo.svg"
          alt=""
          width={515}
          height={515}
          className="w-full h-full object-contain"
          preload
        />
      </div>

      {/* Subtitle — starts invisible; useEffect applies heroFadeIn, always shown once animated in */}
      <p
        ref={subtitleRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className="pointer-events-none font-display font-semibold text-white tracking-[0.15em] uppercase text-[10px] sm:text-[13px] md:text-[15px] lg:text-[17px]"
      >
        Filipino Student Association <span className="text-[#e8e4dd]/50 mx-1">·</span> University of Texas at Dallas
      </p>

      {/* CTA pair — anchored to the hero's vertical center (not the section's bottom edge),
          which stays in view regardless of how far h-screen pushes below the navbar */}
      <div
        ref={ctaGroupRef}
        style={{ opacity: 0 }}
        className="mt-1 sm:mt-2 pointer-events-auto flex items-center gap-2 sm:gap-3"
      >
        <Link
          href="/membership"
          className="inline-flex items-center gap-2 px-[22px] py-[11px] sm:px-7 sm:py-3.5 rounded-full bg-accent-green text-[#08130a] font-display font-extrabold text-[11px] sm:text-base tracking-[0.01em] hover:brightness-[1.08] active:scale-[0.98] transition-all duration-200"
        >
          Become a Member
        </Link>
        <a
          href="#upcoming-events"
          className="inline-flex items-center gap-2 px-[22px] py-[11px] sm:px-7 sm:py-3.5 rounded-full bg-black text-white border border-white/20 font-display font-extrabold text-[11px] sm:text-base tracking-[0.01em] hover:brightness-125 active:scale-[0.98] transition-all duration-200"
        >
          Upcoming Events
        </a>
      </div>
    </div>
  )
}
