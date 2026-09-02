// ── SmoothImage.tsx ───────────────────────────────────────
// blur-up fade-in image wrapper around next/image
//
// notes: the blur-up transition has to be inline (it keys off loaded
//        state), and an inline transition beats any class — so the hover
//        zoom's properties are listed here too, or a caller's
//        `group-hover:scale-*` has nothing to run on and snaps in one frame.
//        BOTH `scale` and `transform` are named on purpose. tailwind v4
//        compiles `scale-*` to the standalone `scale` property, and `scale`
//        is a sibling of `transform`, not a longhand of it — naming only
//        `transform` (correct under v3, where the utility fed the transform
//        shorthand) transitions nothing, which is what silently un-glided
//        every photo-card hover on the goodphil and sports pages.
//        `transform` stays for callers that animate it directly.
//        both share 350ms + --ease-gallery with the archives gallery cards,
//        so every photo-card hover on the site settles on one curve.
//        callers can still pass their own `style.transition` to override,
//        and reduced motion is handled globally (app/globals.css).
//        the curve carries a literal fallback: an undefined var invalidates
//        the whole shorthand at computed-value time, which would silently
//        kill the blur-up fade on every image on the site, not just the zoom.
// ──────────────────────────────────────────────────────────
'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

function blurStyle(loaded: boolean, style?: React.CSSProperties): React.CSSProperties {
  return {
    transition:
      'filter 500ms ease-out, opacity 500ms ease-out, ' +
      'transform 350ms var(--ease-gallery, cubic-bezier(0.2, 0.7, 0.2, 1)), ' +
      'scale 350ms var(--ease-gallery, cubic-bezier(0.2, 0.7, 0.2, 1))',
    ...style,
    filter: loaded ? 'blur(0px)' : 'blur(8px)',
    opacity: loaded ? 1 : 0.7,
  }
}

// Wrap next/image with a blur-up fade-in effect.
export default function SmoothImage({ style, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  return (
    <Image
      {...props}
      style={blurStyle(loaded, style)}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
    />
  )
}
