'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Scroll-reveal backed by IntersectionObserver plus a polling safety net.
// A programmatic / full-page-capture scroll (or a headless render, or a
// backgrounded tab) doesn't always dispatch the normal intersection
// callbacks, which would leave opacity-gated content permanently invisible
// with no fallback — the poll guarantees reveal once the element is actually
// in the viewport, without pre-revealing off-screen content early. Reduced
// motion bypasses the whole reveal and shows the content immediately.
// (Lifted from the Goodphil about page so the other Goodphil subpages inherit
// the same never-blank guarantee.)
export function useRevealOnScroll<T extends HTMLElement>(
  ref: RefObject<T | null>,
  threshold = 0.3,
) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (prefersReducedMotion()) { setVisible(true); return }
    const el = ref.current
    if (!el) return
    function reveal() { setVisible(true); observer.disconnect(); clearInterval(poll) }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) reveal()
    }, { threshold })
    observer.observe(el)
    const poll = setInterval(() => {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) reveal()
    }, 500)
    return () => { observer.disconnect(); clearInterval(poll) }
  }, [ref, threshold])
  return visible
}

// Imperative row/index-staggered reveal for a set of card elements that animate
// via CSS keyframes. Same never-blank + reduced-motion guarantees as
// useRevealOnScroll, but drives per-card `style.animation` instead of a boolean.
// `revealCard` must be idempotent (guard with your own `animated` set).
export function useStaggeredReveal(
  getCards: () => HTMLElement[],
  revealCard: (card: HTMLElement, cards: HTMLElement[]) => void,
  threshold = 0.3,
) {
  // stash the latest callbacks so the effect can stay dependency-light
  const getCardsRef = useRef(getCards)
  const revealRef = useRef(revealCard)
  getCardsRef.current = getCards
  revealRef.current = revealCard

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

    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) fire(e.target as HTMLElement) })
    }, { threshold })
    cards.forEach(c => observer.observe(c))

    // safety net: reveal any card the observer missed once it's in view
    const poll = setInterval(() => {
      cards.forEach(c => {
        if (done.has(c)) return
        const r = c.getBoundingClientRect()
        if (r.top < window.innerHeight && r.bottom > 0) fire(c)
      })
      if (done.size === cards.length) clearInterval(poll)
    }, 500)

    return () => { observer.disconnect(); clearInterval(poll) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold])
}
