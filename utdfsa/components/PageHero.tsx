'use client'

// ── PageHero.tsx ──────────────────────────────────────────────
// full-bleed photo hero with a bottom-left editorial stack (eyebrow /
// Unbounded-900 title / BaybayinRule) and an optional right-hand slot,
// used across the public interior pages (about, pamilyas, goodphil + its
// four subpages). Ported from the "FSA Public Layout Directions" mockup —
// replaces the previous centered-giant-title hero pattern on those pages.
//
// mobile (<md): eyebrow and the right-hand slot are hidden and the title
// floor drops 15% (45px -> 38.25px) — the small viewport only has room for
// the title + baybayin mark. the clamp floor is what binds below ~600px,
// so lowering it is inherently a mobile-only change.
//
// data:  none — presentational
// deps:  SmoothImage, AnimatedTitle (fadeUp entrance + bfcache replay),
//        BaybayinRule; heroPhotoSettle keyframe (app/globals.css)
// ─────────────────────────────────────────────────────────────

import type { ReactNode } from 'react'
import SmoothImage from '@/components/SmoothImage'
import AnimatedTitle from '@/components/AnimatedTitle'
import BaybayinRule from '@/components/BaybayinRule'

type Props = {
  src: string
  alt: string
  eyebrow: string
  title: string
  baybayin: string
  /** height classes — defaults match the mockup's ~560px desktop heroes */
  heightClassName?: string
  /** photo focal point utility, e.g. "object-top" / "object-[center_30%]" */
  objectPosition?: string
  /** optional supplementary copy shown to the right of the stack on md+, below it on mobile */
  right?: ReactNode
}

export default function PageHero({
  src,
  alt,
  eyebrow,
  title,
  baybayin,
  heightClassName = 'h-[50vh] md:h-[560px]',
  objectPosition = 'object-top',
  right,
}: Props) {
  return (
    <section className={`relative w-full overflow-hidden ${heightClassName}`}>
      {/* photo — settles in from a slight zoom, same pattern as the existing hero sections */}
      <div
        className="absolute inset-0 z-0"
        style={{ animation: 'heroPhotoSettle 1200ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <SmoothImage
          src={src}
          alt={alt}
          fill
          className={`object-cover ${objectPosition}`}
          preload
          quality={85}
          sizes="100vw"
        />
      </div>

      {/* scrim — strong at the bottom (text legibility), fading out toward the top */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to top, rgba(14,14,14,0.92) 0%, rgba(14,14,14,0.3) 48%, rgba(14,14,14,0.05) 78%)',
        }}
      />

      {/* deliberately NOT boxed to the sections' max-w-6xl shell — the hero
          title hangs off the viewport's own left edge, and only the section
          headings below it share a common edge with each other */}
      <AnimatedTitle
        as="div"
        animation="fadeUp"
        delay={250}
        className="absolute inset-x-6 sm:inset-x-10 lg:inset-x-14 bottom-8 sm:bottom-10 z-20"
      >
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
          <div className="flex flex-col gap-3 items-start">
            <span className="hidden md:inline font-display font-semibold text-[12px] tracking-[0.14em] text-[#e8e4dd]/72">
              {eyebrow}
            </span>
            <h1
              className="font-display font-black text-white leading-none tracking-[-0.03em]"
              style={{ fontSize: 'clamp(38.25px,7.5vw,62.5px)' }}
            >
              {title}
            </h1>
            {/* 27px = the 21px section-header glyph size +30%, so the hero mark
                reads at title scale rather than at subheading scale */}
            <BaybayinRule word={baybayin} size="27px" onPhoto />
          </div>
          {right && (
            <div className="hidden md:block max-w-[30ch] md:text-right text-[#e8e4dd]/90">{right}</div>
          )}
        </div>
      </AnimatedTitle>
    </section>
  )
}
