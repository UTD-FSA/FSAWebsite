'use client'

// ── AnimatedLetters.tsx ──────────────────────────────────────
// Per-letter slideFromRight entrance — used for the hero titles
// (PAMILYAS, GOODPHIL). Splitting text into independent
// inline-block spans breaks the browser's own font kerning (e.g.
// "PAMILYAS" reads too wide around the Y-A-S run), so instead of
// animating the real text directly, we measure each letter's true
// on-screen position (Range API, after the browser has shaped and
// kerned the whole word as one run) and animate absolutely-
// positioned clones into those exact slots. The real text stays in
// the DOM (invisible) purely to drive the measurement and to size
// the container; only the clones are ever seen once they exist.
//
// notes: mirrors AnimatedTitle's mount + pageshow (bfcache) replay
//        routine so back/forward nav re-triggers the entrance.
//        Assumes single-code-unit characters (fine for the ASCII
//        titles this is used for); a ResizeObserver re-measures on
//        breakpoint/clamp() changes without replaying the entrance.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/lib/useRevealOnScroll'

const TIMING = '0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)'

type Rect = { left: number; top: number; width: number; height: number }

type Props = {
  text: string
  as?: 'h1' | 'span' | 'div'
  /** base delay before the first letter starts, ms */
  delay?: number
  /** delay added per subsequent letter, ms */
  step?: number
  className?: string
  style?: React.CSSProperties
}

export default function AnimatedLetters({
  text,
  as: Tag = 'span',
  delay = 0,
  step = 55,
  className,
  style,
}: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const overlayRef = useRef<HTMLSpanElement>(null)
  const [rects, setRects] = useState<Rect[] | null>(null)
  const reduced = prefersReducedMotion()
  const hasRects = rects !== null

  // measure each letter's real, kerned position — re-runs on resize (fluid
  // clamp() font-sizes) but doesn't reset `rects` to null, so it repositions
  // without replaying the entrance below
  useEffect(() => {
    if (reduced) return
    const anchor = anchorRef.current
    const textNode = textRef.current?.firstChild
    if (!anchor || !textNode) return

    function measure() {
      const anchorRect = anchor!.getBoundingClientRect()
      setRects(Array.from(text).map((_, i) => {
        const range = document.createRange()
        range.setStart(textNode!, i)
        range.setEnd(textNode!, i + 1)
        const r = range.getBoundingClientRect()
        return { left: r.left - anchorRect.left, top: r.top - anchorRect.top, width: r.width, height: r.height }
      }))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(anchor)
    return () => ro.disconnect()
  }, [text, reduced])

  useEffect(() => {
    if (reduced || !hasRects) return

    function play() {
      const el = overlayRef.current
      if (!el) return
      Array.from(el.children).forEach((letter, i) => {
        const l = letter as HTMLElement
        l.style.animation = 'none'
        void l.offsetHeight
        l.style.animation = `slideFromRight ${TIMING} ${delay + i * step}ms both`
      })
    }

    const rafId = requestAnimationFrame(play)
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) play() }
    window.addEventListener('pageshow', onPageShow)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [hasRects, delay, step, reduced])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const El = Tag as any
  const showOverlay = !reduced && rects !== null

  return (
    <El className={className} style={style}>
      <span ref={anchorRef} style={{ position: 'relative', display: 'inline-block' }}>
        <span ref={textRef} style={{ whiteSpace: 'pre', visibility: showOverlay ? 'hidden' : 'visible' }}>
          {text}
        </span>
        {showOverlay && (
          <span ref={overlayRef} style={{ position: 'absolute', inset: 0 }}>
            {Array.from(text).map((char, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  left: rects![i].left,
                  top: rects![i].top,
                  width: rects![i].width,
                  height: rects![i].height,
                  whiteSpace: 'pre',
                  opacity: 0,
                }}
              >
                {char}
              </span>
            ))}
          </span>
        )}
      </span>
    </El>
  )
}
