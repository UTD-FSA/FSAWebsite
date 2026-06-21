'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

// Wrap next/image with a blur-up fade-in effect.
// Initial: blur(8px) at 0.7 opacity → Loaded: sharp at full opacity.
// Transition is CSS-only (no layout shift, no size/crop changes).
export default function SmoothImage({ style, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  return (
    <Image
      {...props}
      style={{
        ...style,
        filter: loaded ? 'blur(0px)' : 'blur(8px)',
        opacity: loaded ? 1 : 0.7,
        transition: 'filter 500ms ease-out, opacity 500ms ease-out',
      }}
      onLoad={(e) => {
        setLoaded(true)
        onLoad?.(e)
      }}
    />
  )
}
