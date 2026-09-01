// ── SmoothImage.tsx ───────────────────────────────────────
// blur-up fade-in image wrapper around next/image
//
// notes: the blur-up transition has to be inline (it keys off loaded
//        state), and an inline transition beats any class — so transform
//        is listed here too. without it a caller's `group-hover:scale-*`
//        class had no transition to run on and the zoom snapped in one
//        frame, which reads as a choppy hover rather than a glide.
//        callers can still pass their own `style.transition` to override.
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
      'filter 500ms ease-out, opacity 500ms ease-out, transform 350ms var(--ease-gallery, cubic-bezier(0.2, 0.7, 0.2, 1))',
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
