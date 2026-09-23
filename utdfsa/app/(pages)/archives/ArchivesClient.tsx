// ── ArchivesClient.tsx ───────────────────────────────────────
// client component — photo archive gallery grid with semester filter pills
//
// data:  galleries prop (Gallery[]) — passed from server component (archives/page.tsx)
//        fields used: id, title, cover_photo_url, google_photos_url, semester, year
// notes: filter options are derived from the galleries array at render time;
//        clicking a gallery card opens the google_photos_url in a new tab;
//        cards without a google_photos_url render as non-interactive divs.
//        layout ported from the "FSA Archives v2" design: the title/term caption
//        sits under the cover (always visible), so hover is only the photo
//        zoom — same treatment as the goodphil about team cards.
//        bottom join band (→ /membership) mirrors the goodphil modern recruitment band
// deps:  SmoothImage (hover-zoom curve), BaybayinRule, useRevealOnScroll / useStaggeredReveal
// ─────────────────────────────────────────────────────────────
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import SmoothImage from '@/components/SmoothImage'
import BaybayinRule from '@/components/BaybayinRule'
import type { Gallery } from '@/types/database'
import { useRevealOnScroll, useStaggeredReveal } from '@/lib/useRevealOnScroll'

interface Props {
  galleries: Gallery[]
}

export default function ArchivesClient({ galleries }: Props) {
  // activeFilter drives pill highlight immediately on click
  // displayFilter drives which cards render (lags by 220ms for crossfade)
  const [activeFilter, setActiveFilter] = useState('All')
  const [displayFilter, setDisplayFilter] = useState('All')
  const [gridVisible, setGridVisible] = useState(true)
  const eyebrowRef = useRef<HTMLParagraphElement>(null)
  const titleRef   = useRef<HTMLHeadingElement>(null)
  const ruleRef    = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLDivElement>(null)
  const ctaRef     = useRef<HTMLDivElement>(null)
  const ctaVisible = useRevealOnScroll(ctaRef)

  // ── filter options ────────────────────────────────────────
  const filterOptions = useMemo(() => {
    const seen = new Set<string>()
    const options = ['All']
    for (const g of galleries) {
      if (g.semester && g.year) {
        const label = `${g.semester} ${g.year}`
        if (!seen.has(label)) { seen.add(label); options.push(label) }
      }
    }
    return options
  }, [galleries])

  const filtered = useMemo(() => {
    if (displayFilter === 'All') return galleries
    return galleries.filter(g => `${g.semester} ${g.year}` === displayFilter)
  }, [galleries, displayFilter])

  // ── header entrance (mount only) ─────────────────────────
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const sequence = [
      { ref: eyebrowRef, anim: 'archFadeUp16 600ms var(--ease-smooth) both' },
      { ref: titleRef,   anim: 'archFadeUp24 700ms var(--ease-smooth) 100ms both' },
      { ref: ruleRef,    anim: 'archFadeUp12 500ms var(--ease-smooth) 200ms both' },
      { ref: filtersRef, anim: 'archFadeUp12 500ms var(--ease-smooth) 250ms both' },
    ]

    if (reduced) {
      sequence.forEach(({ ref }) => { if (ref.current) ref.current.style.opacity = '1' })
      return
    }

    sequence.forEach(({ ref, anim }) => {
      const el = ref.current
      if (!el) return
      el.style.animation = 'none'
      void el.offsetHeight
      el.style.animation = anim
    })
  }, [])

  // ── gallery card entrance (scroll-triggered) — resetKey re-arms the reveal
  // on filter change so switching filters replays the same staggered reveal
  // as the first load. delay is scoped to the card's row (grouped by
  // offsetTop, same pattern as AboutClient's officer board) rather than
  // visible-batch order, so cards that reveal on load together stagger by
  // grid position instead of observer callback order ──
  useStaggeredReveal(
    () => (gridRef.current ? (Array.from(gridRef.current.querySelectorAll('.gcard')) as HTMLElement[]) : []),
    (card, cards) => {
      const row = cards.filter(c => Math.abs(c.offsetTop - card.offsetTop) < 4)
      const delay = Math.min(row.indexOf(card) * 75, 225)
      card.style.transform = 'translateY(24px) scale(0.98)'
      card.style.transition = `opacity 600ms var(--ease-smooth) ${delay}ms, transform 600ms var(--ease-smooth) ${delay}ms`
      card.style.opacity = '1'
      card.style.transform = 'translateY(0) scale(1)'
      // remove inline styles after entrance so CSS hover transitions take back over
      setTimeout(() => { card.style.cssText = '' }, 600 + delay + 50)
    },
    { resetKey: displayFilter },
  )

  // ── filter change: crossfade grid, then swap cards ────────
  function handleFilterChange(option: string) {
    if (option === activeFilter) return
    setActiveFilter(option)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setDisplayFilter(option); return }
    setGridVisible(false)
    setTimeout(() => { setDisplayFilter(option); setGridVisible(true) }, 220)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 pt-14 lg:pt-[72px] pb-16">

        {/* Page header — eyebrow / title / baybayin rule */}
        <div className="flex flex-col gap-4">
          <p
            ref={eyebrowRef}
            className="text-[12px] font-semibold tracking-[0.14em] text-[#8c8c8c]"
            style={{ opacity: 0 }}
          >
            EVERY MOMENT, CAPTURED
          </p>
          <h1
            ref={titleRef}
            className="font-display font-black leading-none tracking-[-0.03em] text-white"
            style={{ fontSize: 'clamp(42px,5vw,52px)', opacity: 0 }}
          >
            Archives
          </h1>
          <div ref={ruleRef} className="self-start" style={{ opacity: 0 }}>
            <BaybayinRule word="ᜐᜒᜈᜓᜉᜈ᜔" size="20px" />
          </div>
        </div>

        {/* Filter pills + gallery count (count pinned right via ml-auto) */}
        <div
          ref={filtersRef}
          className="pt-9 flex items-center gap-2.5 flex-wrap"
          style={{ opacity: 0 }}
        >
          {filterOptions.map((option) => {
            const active = option === activeFilter
            return (
              <button
                key={option}
                onClick={() => handleFilterChange(option)}
                className="filter-pill px-[18px] py-[9px] rounded-full text-[13px] font-semibold transition-all duration-150 cursor-pointer active:scale-95"
                style={{
                  background: active ? '#75ba78' : 'transparent',
                  color: active ? '#0e0e0e' : '#b8b8b8',
                  border: `1px solid ${active ? '#75ba78' : 'rgba(255,255,255,0.16)'}`,
                }}
              >
                {option}
              </button>
            )
          })}
          <span className="ml-auto text-[13px] text-[#8c8c8c] font-medium whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? 'gallery' : 'galleries'}
          </span>
        </div>

        {/* Gallery grid or empty state */}
        <div className="pt-8">
          {filtered.length === 0 ? (
            <div
              className="border border-dashed border-white/10 rounded-2xl min-h-[300px] flex flex-col items-center justify-center gap-4 text-center px-10 py-10"
              style={{ animation: 'archFadeUp24 500ms var(--ease-smooth) both' }}
            >
              <div className="w-[58px] h-[58px] rounded-2xl bg-white/[0.04] border border-white/[0.09] flex items-center justify-center">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.7" />
                  <path d="M21 15l-5-5L4 21" />
                </svg>
              </div>
              <p className="font-display font-bold text-[18px] text-[#cfcfcf] tracking-[-0.01em]">No galleries yet</p>
              <p className="text-[15px] text-[#7a7a7a] font-medium max-w-[280px] leading-relaxed">
                Check back soon — we&apos;re busy capturing the next chapter of the FSA pamilya.
              </p>
            </div>
          ) : (
            <div
              ref={gridRef}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-[18px] gap-y-5"
              style={{ opacity: gridVisible ? 1 : 0, transition: 'opacity 200ms var(--ease-smooth)' }}
            >
              {filtered.map((gallery) => {
                const termLabel = [gallery.semester, gallery.year].filter(Boolean).join(' ')
                const linked = !!gallery.google_photos_url
                const caption = [termLabel, linked ? '' : 'album coming soon'].filter(Boolean).join(' · ')

                const inner = (
                  <>
                    <div className="relative aspect-square rounded-[10px] overflow-hidden bg-[#161616] border border-white/[0.06]">
                      {gallery.cover_photo_url ? (
                        // zoom promoted to its own compositor layer (transform-gpu +
                        // will-change), same as the goodphil about team cards; the
                        // transition curve lives in SmoothImage. unlinked cards don't zoom
                        <SmoothImage
                          src={gallery.cover_photo_url}
                          alt={gallery.title}
                          fill
                          className={`object-cover object-center${linked ? ' transform-gpu will-change-transform group-hover:scale-[1.04]' : ''}`}
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 264px"
                          quality={85}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <span className="text-sm text-white/20 font-medium text-center">{gallery.title}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-[3px]">
                      <h3 className="font-display font-bold text-[13px] leading-[1.25] tracking-[-0.005em] text-white text-balance m-0">
                        {gallery.title}
                      </h3>
                      {caption && (
                        <span className="text-[11.5px] font-medium text-[#8c8c8c]">{caption}</span>
                      )}
                    </div>
                  </>
                )

                const cardClass = `gcard flex flex-col gap-2.5${linked ? ' group cursor-pointer' : ''}`

                // route: gallery.google_photos_url — opens the Google Photos album in a new tab — do not change this path
                return linked ? (
                  <Link key={gallery.id} href={gallery.google_photos_url!} target="_blank" rel="noopener noreferrer" className={cardClass}>
                    {inner}
                  </Link>
                ) : (
                  <div key={gallery.id} className={cardClass}>{inner}</div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Join CTA (split band) — same treatment as the goodphil modern recruitment band */}
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
            Every album here is full of people who just showed up. Become a member and{' '}
            <strong className="font-bold text-accent-green">make it into the next one.</strong>
          </p>
          <Link
            href="/membership"
            className="inline-flex items-center gap-2 flex-none px-[26px] py-[13px] rounded-xl bg-accent-green text-[#0e0e0e] font-sans font-semibold text-[15px] whitespace-nowrap transition-all duration-200 hover:brightness-[1.08]"
          >
            Become a member
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes archFadeUp24 {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes archFadeUp16 {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes archFadeUp12 {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gcard { opacity: 1 !important; transform: none !important; transition: none !important; }
        }
        .filter-pill:hover { border-color: rgba(255,255,255,0.34) !important; }
      `}</style>
    </div>
  )
}
