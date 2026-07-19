'use client'

// ── WhoAreWeText.tsx ─────────────────────────────────────────
// "Who Are We?" title + description — slides up 10px and fades
// in once scrolled into view
//
// data:  none — static copy, mirrors what used to live inline in app/page.tsx
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'

export default function WhoAreWeText() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setVisible(true)
      observer.disconnect()
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full flex flex-col">
      <h2
        className="font-display font-black text-[37px] md:text-[54px] text-white leading-none tracking-[-3.2px] mb-6 lg:mb-8"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
        }}
      >
        WHO ARE{'\n'}WE?
      </h2>
      <p
        className="font-sans text-[16px] md:text-[20px] text-white/60 leading-relaxed"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
          transitionDelay: visible ? '180ms' : '0ms',
        }}
      >
        <strong className="font-bold text-white">UTD FSA</strong> is a student-led organization dedicated to{' '}
        <strong className="font-bold text-accent-green">building friendships, celebrating Filipino culture, and creating a welcoming community for everyone!</strong>{' '}
        As one of UTD&rsquo;s largest student organizations, we bring together students from all backgrounds through{' '}
        <strong className="font-bold text-accent-gold">social events, cultural traditions, sports, dance, and our close-knit Pamilya program.</strong>{' '}
        Whether you&rsquo;re new to UTD or simply interested in meeting new people and trying something new, you&rsquo;ll find plenty of opportunities to get involved, form meaningful connections, and{' '}
        <strong className="font-bold text-white">make UTD feel a little more like home.</strong>
      </p>
    </div>
  )
}
