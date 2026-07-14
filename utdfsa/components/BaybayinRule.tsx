// ── BaybayinRule.tsx ────────────────────────────────────────
// "editorial" motif from the FSA Baybayin Headers reference:
// a centered [rule · Baybayin script · rule] row sat beneath
// an English section title. Rule width/gap are em-based so the
// ratio holds at any `size` (title-proportional Baybayin).
//
// data:  none — plain presentational component
// deps:  --font-tagalog (Noto Sans Tagalog, registered in layout.tsx);
//        baybayinGlint keyframe (app/globals.css) for the draw-mode rule sheen
// ─────────────────────────────────────────────────────────────

type Props = {
  /** Baybayin glyphs (Unicode), e.g. "ᜃᜓᜎ᜔ᜆᜓᜍ" */
  word: string
  /** font-size for the Baybayin row (px or clamp()); rule/gap scale in em */
  size: string
  /** adds a soft shadow so the script stays legible over a hero photo */
  onPhoto?: boolean
  /** when provided, the rule lines draw outward and the glyph fades up instead
      of rendering static — pass a scroll-reveal boolean to animate on trigger */
  reveal?: boolean
  /** transition-delay (ms) for the reveal, so it can land mid-cascade */
  delayMs?: number
  /** "ink wipe" mode — the script is masked and unveils left→right as if brushed
      on (plus a one-shot sheen travelling the rule lines). Only meaningful with
      `reveal`; reserved for slow storytelling sections, not the fast GP heroes. */
  draw?: boolean
}

// left→right unveil mask: with mask-size 300% the element shows a 1/3 window of
// this gradient — position 100% lands on the transparent tail (hidden), 0% on the
// solid head (shown), so animating mask-position sweeps the ink across the glyph
const DRAW_MASK = 'linear-gradient(90deg, #000 45%, transparent 62%)'

export default function BaybayinRule({ word, size, onPhoto, reveal, delayMs = 0, draw }: Props) {
  const animated = reveal !== undefined
  const drawing = animated && draw

  const ruleBase: React.CSSProperties = { height: '1px', background: 'rgba(255,255,255,0.25)' }
  const ruleStyle: React.CSSProperties = animated
    ? {
        ...ruleBase,
        width: reveal ? '0.73em' : '0',
        transition: 'width 700ms var(--ease-smooth)',
        transitionDelay: reveal ? `${delayMs}ms` : '0ms',
        ...(drawing && {
          // a faint highlight band that travels the line as it draws outward
          background:
            'linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.25) 38%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.25) 62%, rgba(255,255,255,0.25) 100%)',
          backgroundSize: '300% 100%',
          backgroundPosition: '120% 0',
          animation: reveal ? `baybayinGlint 900ms var(--ease-smooth) ${delayMs}ms both` : undefined,
        }),
      }
    : { ...ruleBase, width: '0.73em' }

  const glyphStyle: React.CSSProperties = {
    fontFamily: 'var(--font-tagalog)',
    lineHeight: 1,
    color: '#fff',
    textShadow: onPhoto ? '0px 4px 28px rgba(0,0,0,0.72), 0px 2px 8px rgba(0,0,0,0.5)' : undefined,
    ...(drawing
      ? {
          WebkitMaskImage: DRAW_MASK,
          maskImage: DRAW_MASK,
          WebkitMaskSize: '300% 100%',
          maskSize: '300% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: reveal ? '0% 0' : '100% 0',
          maskPosition: reveal ? '0% 0' : '100% 0',
          transition:
            '-webkit-mask-position 900ms var(--ease-smooth), mask-position 900ms var(--ease-smooth)',
          transitionDelay: reveal ? `${delayMs}ms` : '0ms',
        }
      : animated && {
          opacity: reveal ? 1 : 0,
          transform: reveal ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
          transitionDelay: reveal ? `${delayMs}ms` : '0ms',
        }),
  }

  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ fontSize: size, gap: '0.47em' }}
      aria-hidden="true"
    >
      <span style={ruleStyle} />
      <span style={glyphStyle}>{word}</span>
      <span style={ruleStyle} />
    </div>
  )
}
