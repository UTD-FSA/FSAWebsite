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
    <div
      ref={ref}
      className="w-full flex flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
      }}
    >
      <h2 className="font-display font-black text-[37px] md:text-[54px] text-white leading-none tracking-[-3.2px] mb-6 lg:mb-8">
        WHO ARE{'\n'}WE?
      </h2>
      <p className="font-sans text-[16px] md:text-[20px] text-white/60 leading-relaxed">
        <span className="font-bold text-white">UTD FSA</span> is a student-led organization dedicated to bringing together students through{' '}
        <span className="font-bold text-accent-green">Filipino culture, community, and connection.</span>{' '}
        Whether through <span className="font-bold text-accent-gold">social events, cultural programs, sports, or service initiatives</span>, FSA provides a welcoming space for students to{' '}
        <span className="font-bold text-white">build friendships, celebrate their heritage, and create lasting memories.</span>
      </p>
    </div>
  )
}
