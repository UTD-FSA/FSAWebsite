// ── HeroWatermark.tsx ────────────────────────────────────────
// decorative drifting-text background for the Pamilyas / Goodphil About
// desktop heroes — 5 rows of the repeated page title, each row running two
// nested animations whose velocities add: a one-shot ease-out entrance
// (rowInL/rowInR) on top of an infinite linear drift (marquee/marqueeR).
// Content is duplicated ×2 per row so the drift's -50% wrap is seamless.
// Paired with a radial vignette so the photo(s)/title stay legible on top.
//
// data:  none — pure decorative layer, aria-hidden
// deps:  rowInL/rowInR/marquee/marqueeR keyframes (app/globals.css);
//        global prefers-reduced-motion rule neutralizes all animation here
// ─────────────────────────────────────────────────────────────

type Props = {
  /** repeated per row, e.g. "PAMILYAS" */
  word: string
  /** row-2 accent tint; defaults to the design's green */
  accentColor?: string
  /** radial-gradient vignette origin, e.g. "42% 46%" */
  vignetteOrigin: string
  /** add a 6th/7th row above/below the centered stack, deliberately clipped by the hero's edges */
  edgeBleed?: boolean
  /** add one extra row pinned above the centered stack (out of flow — doesn't shift the existing rows), clipped by the hero's top edge */
  topBleedRow?: boolean
}

// stagger delay + per-row drift-duration multiplier (depth), rows alternate
// direction (L, R, L, R, L) but each row never reverses once running
const ROWS = [
  { delayMs: 50,  durMult: 1,    fromLeft: false, opacity: 0.20 },
  { delayMs: 180, durMult: 1.25, fromLeft: true,  opacity: null }, // accent row
  { delayMs: 310, durMult: 0.85, fromLeft: false, opacity: 0.14 },
  { delayMs: 440, durMult: 1.4,  fromLeft: true,  opacity: 0.09 },
  { delayMs: 570, durMult: 1.1,  fromLeft: false, opacity: 0.06 },
] as const

// optional 6th/7th rows (see edgeBleed prop) — sit outside the centered 5-row
// stack so they're the ones pushed past the hero's top/bottom edge and clipped;
// slower drift + lower opacity than the body rows reads as further back
const EDGE_ROW_TOP    = { delayMs: 120, durMult: 1.15, fromLeft: true, opacity: 0.14 } as const
const EDGE_ROW_BOTTOM = { delayMs: 700, durMult: 1.3,  fromLeft: true, opacity: 0.12 } as const

const DRIFT_DUR_S = 94.3 // 66 / 0.7 — all rows 30% slower
const DEFAULT_ACCENT = 'rgba(52, 199, 123, 0.34)'

export default function HeroWatermark({ word, accentColor = DEFAULT_ACCENT, vignetteOrigin, edgeBleed, topBleedRow }: Props) {
  // regular spaces between repeats, one non-breaking space at the very end (the seam
  // between the two duplicated spans below) — a plain space right at that inline
  // boundary is vulnerable to being collapsed away by the browser, fusing two words
  const text = Array(4).fill(word).join(' ') + ' '
  const rows = edgeBleed ? [EDGE_ROW_TOP, ...ROWS, EDGE_ROW_BOTTOM] : ROWS

  // shared per-row markup — entrance div (rowInL/rowInR) wrapping the infinite
  // drift div (marquee/marqueeR) wrapping the two duplicated spans. Used for
  // both the centered stack below and the absolutely-positioned topBleedRow.
  const renderRow = (row: { delayMs: number; durMult: number; fromLeft: boolean; opacity: number | null }, key: string | number) => (
    <div
      key={key}
      className="whitespace-nowrap"
      style={{
        animation: `${row.fromLeft ? 'rowInL' : 'rowInR'} 1.4s cubic-bezier(0.16, 1, 0.3, 1) ${row.delayMs}ms both`,
      }}
    >
      <div
        className="inline-flex"
        style={{
          animation: `${row.fromLeft ? 'marqueeR' : 'marquee'} ${DRIFT_DUR_S * row.durMult}s linear infinite`,
        }}
      >
        <span
          className="font-display font-black leading-[1.14]"
          style={{ fontSize: '104px', color: row.opacity === null ? accentColor : `rgba(255,255,255,${row.opacity})` }}
        >
          {text}
        </span>
        <span
          className="font-display font-black leading-[1.14]"
          style={{ fontSize: '104px', color: row.opacity === null ? accentColor : `rgba(255,255,255,${row.opacity})` }}
        >
          {text}
        </span>
      </div>
    </div>
  )

  return (
    <>
      <div
        className="absolute inset-0 flex flex-col justify-center overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {topBleedRow && (
          <div className="absolute left-0 right-0 top-0" style={{ transform: 'translateY(-85px)' }}>
            {renderRow(EDGE_ROW_TOP, 'top-bleed')}
          </div>
        )}
        {rows.map((row, i) => renderRow(row, i))}
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 90% 80% at ${vignetteOrigin}, transparent 40%, rgba(11,11,11,0.9) 100%)` }}
      />
    </>
  )
}
