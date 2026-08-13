'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { isPastRevealLine, revealRootMargin, REVEAL_LINE } from './reveal-visibility'

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type RevealOptions = {
  // element top must cross this fraction of the viewport height to reveal —
  // defaults to REVEAL_LINE (near the bottom of the viewport, so tall and
  // short elements alike reveal as soon as they're actually on screen).
  // lower it (e.g. 0.6) for effects that should wait until well into view,
  // like a mid-paragraph color sweep.
  line?: number
  // bump this to re-arm the reveal — e.g. when the target mounts later
  // (a conditionally-rendered section) or its contents get replaced (a
  // filtered grid). omit for a plain mount-once reveal.
  resetKey?: unknown
}

// Scroll-reveal backed by IntersectionObserver plus a polling safety net.
//
// The trigger is viewport-relative, not element-relative: an element reveals
// once its top edge crosses `line` (default 88%) down the viewport, regardless
// of the element's own height. On mount, an element already past the line
// reveals on the next frame instead of waiting for a scroll — that's what
// makes above-the-fold content animate in on load instead of staying stuck
// invisible until the user scrolls (see lib/reveal-visibility.ts for why a
// height-fraction threshold got this wrong for tall elements).
//
// A programmatic / full-page-capture scroll (or a headless render, or a
// backgrounded tab) doesn't always dispatch the normal intersection
// callbacks, which would leave opacity-gated content permanently invisible
// with no fallback — the poll guarantees reveal once the element is actually
// in the viewport, without pre-revealing off-screen content early. Reduced
// motion bypasses the whole reveal and shows the content immediately.
export function useRevealOnScroll<T extends HTMLElement>(
  ref: RefObject<T | null>,
  opts: RevealOptions = {},
) {
  const { line = REVEAL_LINE, resetKey } = opts
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (prefersReducedMotion()) { setVisible(true); return }
    const el = ref.current
    if (!el) return

    // already on screen at mount (incl. browser scroll-restoration on
    // refresh) — reveal next frame instead of waiting for a scroll event
    // that may never come. nothing to tear down here, there's no
    // observer/poll on this path — must not reuse the observer/poll `reveal`
    // closure below, or calling it here throws (TDZ: those consts don't
    // exist yet on this branch).
    if (isPastRevealLine(el.getBoundingClientRect(), window.innerHeight, line)) {
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    }

    function reveal() { setVisible(true); observer.disconnect(); clearInterval(poll) }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) reveal()
    }, { threshold: 0, rootMargin: revealRootMargin(line) })
    observer.observe(el)
    const poll = setInterval(() => {
      if (isPastRevealLine(el.getBoundingClientRect(), window.innerHeight, line)) reveal()
    }, 500)
    return () => { observer.disconnect(); clearInterval(poll) }
  }, [ref, line, resetKey])
  return visible
}

// Imperative row/index-staggered reveal for a set of card elements that animate
// via CSS keyframes. Same never-blank + reduced-motion + on-load-if-already-
// visible guarantees as useRevealOnScroll, but drives per-card
// `style.animation` instead of a boolean.
// `revealCard` must be idempotent (guard with your own `animated` set).
export function useStaggeredReveal(
  getCards: () => HTMLElement[],
  revealCard: (card: HTMLElement, cards: HTMLElement[]) => void,
  opts: RevealOptions = {},
) {
  const { line = REVEAL_LINE, resetKey } = opts

  // stash the latest callbacks so the effect can stay dependency-light —
  // assigned in an effect (not during render) per react-hooks/refs
  const getCardsRef = useRef(getCards)
  const revealRef = useRef(revealCard)
  useEffect(() => {
    getCardsRef.current = getCards
    revealRef.current = revealCard
  })

  useEffect(() => {
    const cards = getCardsRef.current()
    if (!cards.length) return

    // reduced motion: leave every card at its natural (visible) state
    if (prefersReducedMotion()) return

    cards.forEach(c => { c.style.opacity = '0' })
    const done = new Set<HTMLElement>()
    const fire = (card: HTMLElement) => {
      if (done.has(card)) return
      done.add(card)
      observer.unobserve(card)
      revealRef.current(card, cards)
    }

    const vh = window.innerHeight
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) fire(e.target as HTMLElement) })
    }, { threshold: 0, rootMargin: revealRootMargin(line) })

    cards.forEach(c => {
      // already on screen at mount — reveal next frame instead of waiting
      if (isPastRevealLine(c.getBoundingClientRect(), vh, line)) {
        requestAnimationFrame(() => fire(c))
      } else {
        observer.observe(c)
      }
    })

    // safety net: reveal any card the observer missed once it's in view
    const poll = setInterval(() => {
      cards.forEach(c => {
        if (done.has(c)) return
        if (isPastRevealLine(c.getBoundingClientRect(), window.innerHeight, line)) fire(c)
      })
      if (done.size === cards.length) clearInterval(poll)
    }, 500)

    return () => { observer.disconnect(); clearInterval(poll) }
  }, [line, resetKey])
}
