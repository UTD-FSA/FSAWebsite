'use client'

// ── MissionStatementSection.tsx ─────────────────────────────
// homepage mission statement — scroll-reveals the Baybayin divider
// and sweeps an animated underline under "service, leadership, and
// unity" once the section enters the viewport
//
// data:  none — static copy, mirrors what used to live inline in app/page.tsx
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import BaybayinRule from '@/components/BaybayinRule'

export default function MissionStatementSection() {
  const dividerRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const [dividerVisible, setDividerVisible] = useState(false)
  const [pillarsVisible, setPillarsVisible] = useState(false)

  useEffect(() => {
    const divider = dividerRef.current
    const copy = copyRef.current
    if (!divider || !copy) return

    const dividerObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setDividerVisible(true)
      dividerObserver.disconnect()
    }, { threshold: 0.3 })
    dividerObserver.observe(divider)

    const copyObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setPillarsVisible(true)
      copyObserver.disconnect()
    }, { threshold: 0.4 })
    copyObserver.observe(copy)

    return () => {
      dividerObserver.disconnect()
      copyObserver.disconnect()
    }
  }, [])

  return (
    <section className="bg-section-bg px-4 sm:px-8 lg:px-16 py-14 sm:py-20 lg:py-24 min-h-[400px] lg:min-h-[575px]">
      <div className="max-w-[1241px] mx-auto text-center">
        <h2 className="font-display font-black text-[36px] sm:text-[52px] lg:text-[64px] xl:text-[96px] text-white tracking-[-2px] sm:tracking-[-3px] lg:tracking-[-4.8px] leading-none mb-6 lg:mb-8">
          OUR MISSION
        </h2>

        <div ref={dividerRef}>
          <BaybayinRule word="ᜋᜒᜐ᜔ᜌᜓᜈ᜔" size="clamp(16px,2.6vw,40px)" reveal={dividerVisible} delayMs={140} draw />
        </div>

        <div ref={copyRef} className="font-sans text-[16px] sm:text-[18px] xl:text-[24px] text-white/60 leading-relaxed max-w-[1100px] mx-auto space-y-6 mt-10 lg:mt-16">
          <p>
            The <span className="font-bold text-accent-green">Filipino Student Association</span> at the{' '}
            <span className="font-bold text-accent-gold">University of Texas at Dallas</span> was founded in 2001,
            aiming to cultivate a community that empowers, uplifts student voices, and celebrates Filipino culture through{' '}
            <span
              className="relative z-0 inline-block font-bold text-white"
              style={{ paddingInline: '0.22em', marginInline: '-0.22em' }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '-0.06em 0',
                  zIndex: -1,
                  borderRadius: '4px',
                  background: 'rgba(117,186,120,0.32)',
                  transformOrigin: 'left center',
                  transform: pillarsVisible ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'transform 1200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: pillarsVisible ? '300ms' : '0ms',
                }}
              />
              service, leadership, and unity.
            </span>
          </p>
          <p>
            <span className="font-bold text-white">All students are welcomed</span>, regardless of race, ethnicity, sexual orientation, religion, or
            background. Through community outreach, social engagement, and cultural awareness, UTD FSA
            strives to ensure pride in Filipino identity, whilst offering a space for students to{' '}
            <span className="font-bold text-white">belong, grow, and lead</span> towards a brighter future.
          </p>
        </div>
      </div>
    </section>
  )
}
