// ── BaybayinRule.tsx ────────────────────────────────────────
// "editorial" motif from the FSA Baybayin Headers reference:
// a centered [rule · Baybayin script · rule] row sat beneath
// an English section title. Rule width/gap are em-based so the
// ratio holds at any `size` (title-proportional Baybayin).
//
// data:  none — plain presentational component
// deps:  --font-tagalog (Noto Sans Tagalog, registered in layout.tsx)
// ─────────────────────────────────────────────────────────────

type Props = {
  /** Baybayin glyphs (Unicode), e.g. "ᜃᜓᜎ᜔ᜆᜓᜍ" */
  word: string
  /** font-size for the Baybayin row (px or clamp()); rule/gap scale in em */
  size: string
  /** adds a soft shadow so the script stays legible over a hero photo */
  onPhoto?: boolean
}

export default function BaybayinRule({ word, size, onPhoto }: Props) {
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ fontSize: size, gap: '0.47em' }}
      aria-hidden="true"
    >
      <span style={{ width: '0.73em', height: '1px', background: 'rgba(255,255,255,0.25)' }} />
      <span
        style={{
          fontFamily: 'var(--font-tagalog)',
          lineHeight: 1,
          color: '#fff',
          textShadow: onPhoto ? '0px 4px 28px rgba(0,0,0,0.72), 0px 2px 8px rgba(0,0,0,0.5)' : undefined,
        }}
      >
        {word}
      </span>
      <span style={{ width: '0.73em', height: '1px', background: 'rgba(255,255,255,0.25)' }} />
    </div>
  )
}
