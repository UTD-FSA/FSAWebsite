'use client'

// ── YouTubeFacade.tsx ─────────────────────────────────────────
// click-to-play YouTube embed: renders the video's static thumbnail
// (i.ytimg.com) + a play button, and only mounts the real
// youtube-nocookie.com iframe once clicked. Replaces ~13 duplicated
// raw <iframe> blocks across the Goodphil subpages — each one loaded
// YouTube's JS unconditionally even though most were never played.
//
// data:  none — videoId/title passed in per call site
// deps:  proxy.ts CSP must allow img-src https://i.ytimg.com (added
//        alongside this component) and already allows
//        frame-src https://www.youtube-nocookie.com
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'

type Props = {
  videoId: string
  title: string
  /** start offset in seconds, e.g. a video whose highlight begins partway through */
  start?: number
}

export default function YouTubeFacade({ videoId, title, start }: Props) {
  const [playing, setPlaying] = useState(false)

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1${start ? `&start=${start}` : ''}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full aspect-video rounded-xl"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className="relative w-full aspect-video rounded-xl overflow-hidden block group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, not next/image,
          to avoid adding i.ytimg.com to next.config.ts's deliberately narrow remotePatterns */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors duration-200" />
      <span className="absolute top-3 left-3.5 text-[12px] font-semibold text-white/85">
        {title}
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-[52px] h-[52px] rounded-full bg-white/92 flex items-center justify-center text-[#0e0e0e] text-lg pl-1 group-hover:scale-105 transition-transform duration-200">
          ▶
        </span>
      </span>
    </button>
  )
}
