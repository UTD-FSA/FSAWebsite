// ── PhotoBand.tsx ────────────────────────────────────────────
// full-bleed 3-up photo band that sits under the intro section on
// pamilyas and the four goodphil team pages. the middle photo is the
// only one kept on mobile — three 33vw crops stacked would push the
// next section a full screen down.
//
// data:  none — presentational
// deps:  SmoothImage
// notes: src: null renders the dashed photo placeholder instead, for
//        bands whose real photos haven't been supplied yet (sports).
// ─────────────────────────────────────────────────────────────

import SmoothImage from '@/components/SmoothImage'

type Photo = {
  /** null = not-yet-supplied, renders the dashed placeholder tile */
  src: string | null
  alt: string
  /** focal point utility, e.g. "object-top" / "object-[center_30%]" */
  objectPosition?: string
}

function Placeholder() {
  return (
    <div className="absolute inset-0 bg-[#1a1a1a] border border-dashed border-white/15 flex flex-col items-center justify-center gap-1.5">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/25" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <span className="text-[#e8e4dd]/25 text-[11px] font-sans uppercase tracking-wide">Photo</span>
    </div>
  )
}

export default function PhotoBand({ photos }: { photos: [Photo, Photo, Photo] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-[260px]">
      {photos.map(({ src, alt, objectPosition }, i) => (
        <div
          key={i}
          className={`relative w-full h-full overflow-hidden ${i === 1 ? '' : 'hidden md:block'}`}
        >
          {src ? (
            <SmoothImage
              src={src}
              alt={alt}
              fill
              className={`object-cover ${objectPosition ?? ''}`}
              sizes="(max-width: 768px) 100vw, 33vw"
              quality={85}
            />
          ) : (
            <Placeholder />
          )}
        </div>
      ))}
    </div>
  )
}
