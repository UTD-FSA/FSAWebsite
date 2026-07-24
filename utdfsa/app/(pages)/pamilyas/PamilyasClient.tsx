// ── PamilyasClient.tsx ────────────────────────────────────
// client component — pamilyas page: fan carousel, sign-up form cards
// (ading / kuya-ate / protection form), and state-driven popups
//
// data:  memberState prop from pamilyas/page.tsx (login, membership,
//        application, and onboarding state)
// notes: each card's cta routes by member state — login, membership,
//        onboarding, reapply, or a blocking popup (see the prop helpers)
// ──────────────────────────────────────────────────────────
'use client'

import { useState, useEffect, useRef, type PointerEvent, type MouseEvent } from 'react'
import Modal from '@/components/Modal'
import SmoothImage from '@/components/SmoothImage'
import Link from 'next/link'
import AnimatedLetters from '@/components/AnimatedLetters'
import BaybayinRule from '@/components/BaybayinRule'
import HeroWatermark from '@/components/HeroWatermark'
import QuickNavRail from '@/components/QuickNavRail'
import { useRevealOnScroll, useStaggeredReveal } from '@/lib/useRevealOnScroll'

const PAMILYAS_NAV_ITEMS = [
  { label: 'What Is a Pamilya', href: '#what-is-a-pamilya' },
  { label: 'Meet',              href: '#meet' },
  { label: 'Sign Up',           href: '#signup' },
]

export type MemberState = {
  isLoggedIn: boolean
  isMember: boolean
  memberType: string | null
  hasAdingApp: boolean
  hasKuyateApp: boolean
  onboardingComplete: boolean
}

// ── Pamilyas Carousel ─────────────────────────────────────────────────────────

const PAM_SLIDES = [
  { src: '/pam1.jpg', alt: 'Pamilya 1' },
  { src: '/pam2.jpg', alt: 'Pamilya 2' },
  { src: '/pam3.jpg', alt: 'Pamilya 3' },
  { src: '/pam4.jpg', alt: 'Pamilya 4' },
  { src: '/pam5.jpg', alt: 'Pamilya 5' },
]

// rotate deliberately omitted from PosConfig — cards stack flat with no vertical tilt
type PosConfig = {
  scale: number
  translateX: string
  zIndex: number
  opacity: number
}

// flanking idle opacity sits closer to full (0.65–0.78) so the focused card reads
// via scale/shadow rather than a hard opacity cliff; hover-to-0.9 still brightens further
const DESKTOP: PosConfig[] = [
  { scale: 0.70, translateX: '-90%', zIndex: 30, opacity: 0.65 },
  { scale: 0.85, translateX: '-55%', zIndex: 40, opacity: 0.78 },
  { scale: 1.03, translateX: '0%',   zIndex: 50, opacity: 1.00 },
  { scale: 0.85, translateX: '55%',  zIndex: 40, opacity: 0.78 },
  { scale: 0.70, translateX: '90%',  zIndex: 30, opacity: 0.65 },
]

const MOBILE_POS: PosConfig[] = [
  { scale: 0.65, translateX: '-85%', zIndex: 30, opacity: 0.65 },
  { scale: 0.82, translateX: '-50%', zIndex: 40, opacity: 0.78 },
  { scale: 1.03, translateX: '0%',   zIndex: 50, opacity: 1.00 },
  { scale: 0.82, translateX: '50%',  zIndex: 40, opacity: 0.78 },
  { scale: 0.65, translateX: '85%',  zIndex: 30, opacity: 0.65 },
]

const PAM_HOVER_OPACITY = 0.90

function PamilyasCarousel() {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  // slide index of the flanking card currently hovered, so it can brighten toward PAM_HOVER_OPACITY
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(i => (i + 1) % PAM_SLIDES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [timerKey])

  const total = PAM_SLIDES.length
  const resetTimer = () => setTimerKey(k => k + 1)
  const prev = () => { setCurrent(i => (i - 1 + total) % total); resetTimer() }
  const next = () => { setCurrent(i => (i + 1) % total); resetTimer() }
  const dragStart = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const suppressClick = useRef(false)
  const positions = isMobile ? MOBILE_POS : DESKTOP

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    dragStart.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start) return

    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    const isHorizontalSwipe = Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.25

    dragStart.current = null
    e.currentTarget.releasePointerCapture(start.pointerId)

    if (!isHorizontalSwipe) return

    suppressClick.current = true
    if (dx < 0) next()
    else prev()

    window.setTimeout(() => {
      suppressClick.current = false
    }, 120)
  }

  const handlePointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    dragStart.current = null
    if (start) e.currentTarget.releasePointerCapture(start.pointerId)
  }

  // 4:3 landscape dimensions — larger than before to fill the section
  const cardW = isMobile ? 320 : 640
  const cardH = isMobile ? 240 : 480

  // Cards visually overlap (the fan effect), so per-card onClick + native DOM
  // hit-testing resolves to whichever card is topmost at that point, not the
  // card whose own rendered center the click is closest to. Resolve intent by
  // position math instead — find which of the 5 known fan-slot x-offsets the
  // click is nearest to (mirrors PhotoCarousel's stage-click resolution).
  const handleStageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (suppressClick.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left - rect.width / 2
    const slotOffsetsPx = positions.map(p => (parseFloat(p.translateX) / 100) * cardW)
    let nearestSlot = 2
    let nearestDist = Infinity
    slotOffsetsPx.forEach((slotX, i) => {
      const dist = Math.abs(clickX - slotX)
      if (dist < nearestDist) { nearestDist = dist; nearestSlot = i }
    })
    const offsetFromCenter = nearestSlot - 2
    if (offsetFromCenter === 0) return

    if (isMobile) {
      offsetFromCenter < 0 ? prev() : next()
    } else {
      setCurrent((current + offsetFromCenter + total) % total)
      resetTimer()
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* stage height accommodates 4:3 active card with breathing room */}
      <div
        className="relative h-[280px] md:h-[560px] cursor-grab touch-pan-y select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleStageClick}
      >
        {PAM_SLIDES.map((slide, slideIdx) => {
          let offset = (slideIdx - current + total) % total
          if (offset > Math.floor(total / 2)) offset -= total
          const pos = positions[offset + 2]
          const isCenter = offset === 0
          const opacity = !isCenter && hoveredIdx === slideIdx ? PAM_HOVER_OPACITY : pos.opacity

          return (
            <div
              key={slideIdx}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${cardW}px`,
                height: `${cardH}px`,
                // no rotate — cards stack flat
                transform: `translateX(-50%) translateY(-50%) translateX(${pos.translateX}) scale(${pos.scale})`,
                zIndex: pos.zIndex,
                opacity,
                boxShadow: isCenter ? 'var(--shadow-card)' : 'none',
                transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
              className="rounded-2xl overflow-hidden bg-[#2a2a2a] cursor-pointer"
              // Click handling lives on the stage container (handleStageClick above) — see comment there.
              onMouseEnter={!isCenter ? () => setHoveredIdx(slideIdx) : undefined}
              onMouseLeave={!isCenter ? () => setHoveredIdx(null) : undefined}
            >
              <SmoothImage
                src={slide.src}
                alt={slide.alt}
                fill
                draggable={false}
                className="object-cover object-center"
                sizes="(max-width: 768px) 50vw, 40vw"
                quality={90}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-2 shrink-0">
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="p-3 text-white hover:opacity-70 transition-opacity"
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5 px-2">
          {PAM_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); resetTimer() }}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full bg-white transition-all duration-200 ${
                i === current ? 'w-4 h-4' : 'w-3 h-3 opacity-50'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          aria-label="Next slide"
          className="p-3 text-white hover:opacity-70 transition-opacity"
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Form Card ─────────────────────────────────────────────────────────────────

function FormCard({
  photo,
  title,
  caption,
  href,
  externalHref,
  onClick,
}: {
  photo: string
  title: string
  caption: string
  href?: string
  externalHref?: string
  onClick?: () => void
}) {
  const inner = (
    <>
      <SmoothImage
        src={photo}
        alt=""
        fill
        className="object-cover object-top"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        quality={85}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <span className="absolute inset-0 flex items-center justify-center text-center text-white font-display font-black text-xl uppercase tracking-wide px-4">
        {title}
      </span>
      {/* delight: arrow nudges in on hover/focus — reads as an invitation, not just a label */}
      <span
        aria-hidden="true"
        className="absolute bottom-5 right-5 flex items-center justify-center w-9 h-9 rounded-full bg-accent-green/90 text-[#0e0e0e] opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200 ease-out"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </>
  )

  const cls = 'group relative aspect-[4/5] rounded-[27px] overflow-hidden block hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer bg-transparent border-0 p-0 w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue focus-visible:outline-offset-2'

  // eligibility caption — surfaces who each form is for at the decision point itself,
  // instead of requiring visitors to scroll back and recall role definitions
  const captionEl = (
    <p className="font-sans text-white/60 text-[13px] sm:text-sm leading-snug text-center mt-3">
      {caption}
    </p>
  )

  // external link (protection form) opens in new tab
  if (externalHref) {
    return (
      <div>
        <a href={externalHref} target="_blank" rel="noopener noreferrer" className={cls}>
          {inner}
        </a>
        {captionEl}
      </div>
    )
  }
  if (href) {
    return (
      <div>
        <Link href={href} className={cls}>{inner}</Link>
        {captionEl}
      </div>
    )
  }
  // popup trigger — card is always clickable
  return (
    <div>
      <button type="button" className={cls} onClick={onClick}>
        {inner}
      </button>
      {captionEl}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PamilyasClient({
  memberState,
  isKuyateOpen,
}: {
  memberState: MemberState
  isKuyateOpen: boolean
}) {
  // blocking popup content; null = no popup open
  const [popup, setPopup] = useState<{ title: string; message: string } | null>(null)

  // Baybayin subheader — opacity fade-in as it scrolls into view (matches goodphil subpages)
  const baybayinRef = useRef<HTMLDivElement>(null)
  const [baybayinVisible, setBaybayinVisible] = useState(false)

  useEffect(() => {
    const el = baybayinRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setBaybayinVisible(true)
      observer.disconnect()
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // "Meet the Pamilyas" coming-soon card — scroll reveal
  const comingSoonRef = useRef<HTMLDivElement>(null)
  const comingSoonVisible = useRevealOnScroll(comingSoonRef, 0.3)

  // sign-up FormCards — staggered entrance
  const formGridRef = useRef<HTMLDivElement>(null)
  useStaggeredReveal(
    () => Array.from(formGridRef.current?.querySelectorAll<HTMLElement>('[data-formcard]') ?? []),
    (card, cards) => {
      const i = cards.indexOf(card)
      card.style.animation = `fadeUp 0.55s var(--ease-smooth) ${i * 100}ms both`
    },
  )

  // ── Card prop helpers ────────────────────────────────────────────────────────

  function kuyateCardProps(): { href?: string; onClick?: () => void } {
    // not logged in → login with redirect
    if (!memberState.isLoggedIn)
      return { href: '/login?next=/pamilyas' }

    // logged in but not a paid member → membership page
    if (!memberState.isMember)
      return { href: '/membership' }

    // already submitted a kuyate app → already submitted popup
    if (memberState.memberType === 'kuyate' && memberState.hasKuyateApp)
      return { onClick: () => setPopup({
        title: 'Application Submitted',
        message: 'You have already submitted your Kuya/Ate application. The pam chair will be in touch after the sorting process.',
      })}

    // already submitted an ading app → cross-apply block popup
    if (memberState.memberType === 'ading' && memberState.hasAdingApp)
      return { onClick: () => setPopup({
        title: 'Already Applied as Ading',
        message: 'You have already submitted an Ading application. You cannot apply as both Ading and Kuya/Ate.',
      })}

    // kuyate applications are closed → closed popup
    if (!isKuyateOpen)
      return { onClick: () => setPopup({
        title: 'Applications Closed',
        message: 'Kuya/Ate applications have closed for this semester.',
      })}

    // not_interested member → reapply flow with type param
    if (memberState.memberType === 'not_interested')
      return { href: '/onboarding?reapply=true&type=kuyate' }

    // member with no type yet → normal onboarding
    return { href: '/onboarding' }
  }

  function adingCardProps(): { href?: string; onClick?: () => void } {
    // not logged in → login with redirect
    if (!memberState.isLoggedIn)
      return { href: '/login?next=/pamilyas' }

    // logged in but not a paid member → membership page
    if (!memberState.isMember)
      return { href: '/membership' }

    // already submitted an ading app → already submitted popup
    if (memberState.memberType === 'ading' && memberState.hasAdingApp)
      return { onClick: () => setPopup({
        title: 'Application Submitted',
        message: 'You have already submitted your Ading application. The pam chair will be in touch after the sorting process.',
      })}

    // already submitted a kuyate app → cross-apply block popup
    if (memberState.memberType === 'kuyate' && memberState.hasKuyateApp)
      return { onClick: () => setPopup({
        title: 'Already Applied as Kuya/Ate',
        message: 'You have already submitted a Kuya/Ate application. You cannot apply as both Kuya/Ate and Ading.',
      })}

    // not_interested member → reapply flow with type param
    if (memberState.memberType === 'not_interested')
      return { href: '/onboarding?reapply=true&type=ading' }

    // member with no type yet → normal onboarding
    return { href: '/onboarding' }
  }

  function protectionCardProps(): { href?: string; externalHref?: string } {
    if (!memberState.isLoggedIn) return { href: '/login?next=/pamilyas' }
    if (!memberState.isMember) return { href: '/membership' }
    // protection form is an external google form — opens in new tab
    return {
      externalHref: 'https://docs.google.com/forms/d/e/1FAIpQLSdlewwrMBLXLK_4oRI_J7bb2fh-uR11_G4asmzaa26LUXes2Q/viewform?usp=dialog',
    }
  }

  const kuyate = kuyateCardProps()
  const ading = adingCardProps()
  const protection = protectionCardProps()

  return (
    <main className="bg-section-bg text-white overflow-x-clip">
      <QuickNavRail mode="sections" ariaLabel="Pamilyas page sections" items={PAMILYAS_NAV_ITEMS} />

      {/* popup modal — renders when popup is not null */}
      {popup && (
        <Modal onClose={() => setPopup(null)} size="sm">
          <div className="bg-[#262626] rounded-2xl p-6 text-center shadow-2xl">
            <h3 className="font-display font-black text-white text-lg uppercase mb-3">
              {popup.title}
            </h3>
            <p className="font-sans text-white/60 text-sm leading-relaxed mb-6">
              {popup.message}
            </p>
            <button
              onClick={() => setPopup(null)}
              className="w-full bg-accent-green text-[#0e0e0e] font-display font-black uppercase tracking-widest py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </div>
        </Modal>
      )}

      {/* ── SECTION 1 — HERO ──────────────────────────────────────── */}

      {/* Mobile/compact hero — simplified single-image layout. Covers everything
          below xl (not just lg) since the watermark hero below is only pixel-
          accurate at >=1280px per the design handoff; below that this one is
          the more correct layout, not a compromise. */}
      <div className="block xl:hidden">
        <div className="relative w-full h-[50vh] overflow-hidden bg-[#1f1f1f]">
          <SmoothImage
            src="/pam-hero.jpg"
            alt="Pamilyas"
            fill
            className="object-cover object-center"
            preload
            quality={85}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40" />
          <AnimatedLetters
            as="h1"
            text="PAMILYAS"
            className="absolute bottom-4 left-4 font-display font-black text-5xl text-white leading-none z-10"
            style={{ letterSpacing: '-0.03em' }}
          />
        </div>
      </div>

      {/* Desktop hero — watermark hero design (design_handoff_hero_sections/pamilyas-hero.html):
          drifting "PAMILYAS" watermark + vignette replaces the old pam-hero-bg.png pattern
          layer; photo and title stay the same live assets, repositioned to the new spec.
          Fixed pixel values throughout (no clamp/vw/vh) — safe because this only ever
          renders at >=1280px (xl:), matching the handoff's own fidelity boundary and its
          660px-tall reference container (adapted from its 100svh model since this page's
          navbar sits in normal flow above the hero, not overlaid). */}
      <section className="hidden xl:block relative w-full overflow-hidden bg-[#0b0b0b] h-[660px]">

        <HeroWatermark word="PAMILYAS" vignetteOrigin="42% 46%" edgeBleed />

        {/* pam-hero.jpg — left-anchored floating photo card */}
        <div
          className="absolute z-10 overflow-hidden rounded-[6px]"
          style={{
            left: '72px',
            top: '96px',
            width: '640px',
            height: '440px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            animation: 'fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) 750ms both',
          }}
        >
          <SmoothImage
            src="/pam-hero.jpg"
            alt="Pamilyas"
            fill
            className="object-cover"
            style={{ objectPosition: '43% 51%' }}
            preload
            quality={85}
            sizes="640px"
          />
        </div>

        {/* PAMILYAS title + tagline */}
        <div
          className="absolute z-10 flex flex-col items-end text-right"
          style={{ right: '76px', bottom: '76px', gap: '14px' }}
        >
          <AnimatedLetters
            as="h1"
            text="PAMILYAS"
            className="font-display font-black text-white leading-none"
            style={{ fontSize: '112px', letterSpacing: '-0.02em', lineHeight: 0.98 }}
          />
          <span
            className="font-sans font-semibold uppercase"
            style={{ fontSize: '16px', letterSpacing: '0.14em', color: '#9a9a9a' }}
          >
            Find the pam that's right for you
          </span>
        </div>

      </section>

      {/* ── SECTION 2 — WHAT IS A PAMILYA? ───────────────────────── */}
      <section id="what-is-a-pamilya" className="scroll-mt-20">

        <div className="bg-brand-bg py-10 px-4">
          <h2 className="font-display font-black text-[clamp(18px,4.2vw,64px)] text-white text-center whitespace-nowrap mb-4">
            WHAT IS A PAMILYA?
          </h2>
          <div ref={baybayinRef} className="mb-8">
            <BaybayinRule word="ᜉᜋᜒᜎ᜔ᜌ" size="clamp(16px,2vw,27px)" reveal={baybayinVisible} delayMs={140} draw />
          </div>
          <p className="font-sans text-[clamp(16px,2vw,29px)] text-white/60 leading-relaxed text-center max-w-[1218px] mx-auto">
            <strong className="font-bold text-accent-green">Pamilyas</strong> (&lsquo;<strong className="font-bold text-white">pam</strong>&rsquo; for short), which is also{' '}
            <strong className="font-bold text-accent-gold">the Tagalog word for family</strong>, are smaller groups within{' '}
            <strong className="font-bold text-white">UTD FSA</strong> where members{' '}
            <strong className="font-bold text-accent-green">form friendships, learn from one another, and create memories that last well beyond college.</strong>
          </p>
        </div>

        <div className="bg-section-bg">
          <div className="max-w-[1218px] mx-auto px-8 pt-12 pb-6 text-center">

            <p className="font-sans text-[clamp(16px,2vw,29px)] text-white/60 leading-relaxed mb-8">
              Each <strong className="font-bold text-white">pam</strong> consists of <strong className="font-bold text-accent-green">Kuyas</strong> (older brothers), <strong className="font-bold text-accent-green">Ates</strong> (older sisters), and <strong className="font-bold text-accent-green">Adings</strong> (younger siblings).
              Built on the idea that <strong className="font-bold text-white">family goes beyond blood</strong>, pamilyas create lifelong bonds
              through shared experiences, traditions, and support.
            </p>

            <p className="font-sans text-[clamp(16px,2vw,29px)] text-white/60 leading-relaxed mb-8">
              Every pamilya <strong className="font-bold text-accent-gold">has its own mix of hobbies and interests!</strong> The Pamilya Chair
              and UTD FSA Officer Board work carefully to match each ading with a pamilya where they can feel comfortable,
              get involved, and make the most of their time in UTD FSA.
            </p>

            <p className="font-sans text-[clamp(16px,2vw,29px)] text-white/60 leading-relaxed">
              The pamilya system is <strong className="font-bold text-white">exclusive to UTD FSA members only.</strong>
            </p>

            <a href="#signup" className="pamilya-cta-glow group inline-block mt-6 rounded-2xl border border-accent-green/30 bg-accent-green/10 px-6 py-4 sm:px-8 sm:py-5 transition-colors hover:bg-accent-green/15">
              <p className="font-sans font-semibold text-white text-[clamp(16px,1.8vw,22px)] leading-snug text-center">
                Please pay your dues before filling out the{' '}
                <span className="relative inline-block">
                  Kuya/Ate or Ading form
                  <span
                    aria-hidden="true"
                    className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-accent-green transition-all duration-300 ease-out group-hover:w-full"
                  />
                </span>.
              </p>
              <svg
                aria-hidden="true"
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                className="mx-auto mt-2 text-accent-green nudge-down"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

          </div>
        </div>

      </section>

      {/* ── SECTION 3 — PAMILYA CAROUSEL ─────────────────────────── */}
      <section className="bg-section-bg px-8 pt-4 pb-12">
        <PamilyasCarousel />
      </section>

      {/* ── SECTION 4 — MEET THE PAMILYAS (coming soon) ──────────── */}
      <section id="meet" className="scroll-mt-20">

        <div className="bg-brand-bg py-10 px-4">
          <h2 className="font-display font-black text-[clamp(18px,4.2vw,64px)] text-white text-center whitespace-nowrap">
            MEET THE PAMILYAS
          </h2>
        </div>

        <div className="bg-section-bg py-16 px-8">
          <div
            ref={comingSoonRef}
            className="max-w-xl mx-auto"
            style={{
              opacity: comingSoonVisible ? 1 : 0,
              transform: comingSoonVisible ? 'none' : 'translateY(20px)',
              transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
            }}
          >
            <div className="bg-white rounded-3xl p-8 text-center">
              <p className="font-sans font-semibold text-[#1f1f1f] text-lg leading-relaxed">
                Pamilyas will be revealed at the 2nd General Meeting. Check back soon!
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* ── SECTION 5 — WHERE DO I SIGN UP? ──────────────────────── */}
      <section id="signup" className="scroll-mt-20">

        <div className="bg-brand-bg py-10 px-4">
          <h2 className="font-display font-black text-[clamp(18px,4.2vw,64px)] text-white text-center whitespace-nowrap">
            WHERE DO I SIGN UP?
          </h2>
        </div>

        <div className="bg-section-bg px-8 py-12">

          <p className="font-sans font-normal text-[clamp(16px,1.5vw,22px)] text-white/70 text-center mb-10 max-w-[1194px] mx-auto">
            Select the form that best fits the role you&rsquo;ll play in your UTD FSA pamilya experience!
          </p>

          <div ref={formGridRef} className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[1218px] mx-auto">

            <div data-formcard>
              <FormCard
                photo="/kuyate-form.png"
                title="KUYA/ATE FORM"
                caption="Ready to lead a pamilya? Start here."
                href={kuyate.href}
                onClick={kuyate.onClick}
              />
            </div>

            <div data-formcard>
              <FormCard
                photo="/ading-form.png"
                title="ADING FORM"
                caption="New to FSA and looking for guidance? Start here."
                href={ading.href}
                onClick={ading.onClick}
              />
            </div>

            <div data-formcard>
              <FormCard
                photo="/protect-form.png"
                title="PAMILYA PROTECTION FORM"
                caption="Reporting a pamilya concern? Click here."
                href={protection.href}
                externalHref={protection.externalHref}
              />
            </div>

          </div>
        </div>

      </section>

    </main>
  )
}
