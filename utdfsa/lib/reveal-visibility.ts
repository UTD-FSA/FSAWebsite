// ── reveal-visibility.ts ──────────────────────────────────────
// pure predicate behind the site's scroll-reveal system — see lib/useRevealOnScroll.ts
//
// the trigger is viewport-relative, not element-relative: an element reveals
// once its top edge crosses a fixed line down the viewport, regardless of the
// element's own height. this replaces IntersectionObserver's threshold
// (fraction of the *element's* height visible), which made tall elements
// straddling the fold fail to reveal on load while short neighbors passed —
// the membership pricing card bug this file exists to fix.
// ──────────────────────────────────────────────────────────────

// element top must cross 88% down the viewport to be considered "reached" —
// leaves ~12% of breathing room below the fold so content doesn't reveal
// while still mostly off-screen, while still catching tall elements whose
// bottom edge is nowhere near the viewport on load
export const REVEAL_LINE = 0.88

// past the line = should be revealed. deliberately ignores rect.bottom: an
// element scrolled entirely above the viewport (anchor jump, scroll restore,
// back-navigation) is content the user has already reached — show it, don't
// hide it waiting for an intersection that will never come.
export function isPastRevealLine(rect: { top: number }, viewportHeight: number, line = REVEAL_LINE): boolean {
  return rect.top < viewportHeight * line
}

// matching IntersectionObserver geometry: shrink the root's bottom edge to
// the same line, paired with threshold: 0 (any overlap past the shrunk root)
export function revealRootMargin(line = REVEAL_LINE): string {
  return `0px 0px -${Math.round((1 - line) * 100)}% 0px`
}
