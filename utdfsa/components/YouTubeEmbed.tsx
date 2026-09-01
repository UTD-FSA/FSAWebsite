// ── YouTubeEmbed.tsx ──────────────────────────────────────────
// plain youtube-nocookie.com iframe, one per past-performance card on
// the Goodphil subpages. Wraps the ~13 otherwise-identical <iframe>
// blocks so the src/allow/class list lives in one place.
//
// was briefly a click-to-play thumbnail facade; reverted on request —
// the regular embed is what plays on both mobile and desktop. loading
// ="lazy" keeps the below-the-fold videos off the initial load.
//
// data:  none — videoId/title passed in per call site
// deps:  proxy.ts CSP allows frame-src https://www.youtube-nocookie.com
// ─────────────────────────────────────────────────────────────

type Props = {
  videoId: string
  title: string
  /** start offset in seconds, e.g. a video whose highlight begins partway through */
  start?: number
}

export default function YouTubeEmbed({ videoId, title, start }: Props) {
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}${start ? `?start=${start}` : ''}`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      loading="lazy"
      className="w-full aspect-video rounded-xl"
    />
  )
}
