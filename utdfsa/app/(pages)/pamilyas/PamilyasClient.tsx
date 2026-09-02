// ── PamilyasClient.tsx ────────────────────────────────────
// client component — pamilyas page: intro, photo band, sign-up form
// cards (ading / kuya-ate / protection form), and state-driven popups
//
// data:  memberState prop from pamilyas/page.tsx (login, membership,
//        application, and onboarding state)
// notes: each card's cta routes by member state — login, membership,
//        onboarding, reapply, or a blocking popup (see the prop helpers).
//        the fan carousel that used to sit between the intro and "meet
//        the pamilyas" is gone — the PhotoBand under the intro carries
//        the photos now.
// ──────────────────────────────────────────────────────────
'use client'

import { useState, useRef } from 'react'
import Modal from '@/components/Modal'
import SmoothImage from '@/components/SmoothImage'
import Link from 'next/link'
import QuickNavRail from '@/components/QuickNavRail'
import SectionHeader from '@/components/SectionHeader'
import PageHero from '@/components/PageHero'
import PhotoBand from '@/components/PhotoBand'
import { useRevealOnScroll, useStaggeredReveal } from '@/lib/useRevealOnScroll'

const PAMILYAS_NAV_ITEMS = [
  { label: 'What Is a Pamilya', href: '#what-is-a-pamilya' },
  { label: 'Meet',              href: '#meet' },
  { label: 'Sign Up',           href: '#signup' },
]

export type MemberState = {
  isLoggedIn: boolean
  isMember: boolean
  memberType: string | null
  hasAdingApp: boolean
  hasKuyateApp: boolean
  onboardingComplete: boolean
}

// ── Form Card ─────────────────────────────────────────────────────────────────

function FormCard({
  photo,
  title,
  caption,
  href,
  externalHref,
  onClick,
}: {
  photo: string
  title: string
  caption: string
  href?: string
  externalHref?: string
  onClick?: () => void
}) {
  const inner = (
    <>
      <SmoothImage
        src={photo}
        alt=""
        fill
        className="object-cover object-top"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        quality={85}
      />
      <div className="absolute inset-0 bg-black/40" />
      <span className="absolute inset-0 flex items-center justify-center text-center text-white font-display font-black text-xl uppercase tracking-wide px-4">
        {title}
      </span>
      {/* delight: arrow nudges in on hover/focus — reads as an invitation, not just a label */}
      <span
        aria-hidden="true"
        className="absolute bottom-5 right-5 flex items-center justify-center w-9 h-9 rounded-full bg-accent-green/90 text-[#0e0e0e] opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all duration-200 ease-out"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </>
  )

  const cls = 'group relative aspect-[4/5] rounded-3xl overflow-hidden block hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] transition-all duration-200 cursor-pointer bg-transparent border-0 p-0 w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue focus-visible:outline-offset-2'

  // eligibility caption — surfaces who each form is for at the decision point itself,
  // instead of requiring visitors to scroll back and recall role definitions
  const captionEl = (
    <p className="font-sans text-[#e8e4dd]/60 text-[13px] sm:text-sm leading-snug text-center mt-3">
      {caption}
    </p>
  )

  // external link (protection form) opens in new tab
  if (externalHref) {
    return (
      <div>
        <a href={externalHref} target="_blank" rel="noopener noreferrer" className={cls}>
          {inner}
        </a>
        {captionEl}
      </div>
    )
  }
  if (href) {
    return (
      <div>
        <Link href={href} className={cls}>{inner}</Link>
        {captionEl}
      </div>
    )
  }
  // popup trigger — card is always clickable
  return (
    <div>
      <button type="button" className={cls} onClick={onClick}>
        {inner}
      </button>
      {captionEl}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PamilyasClient({
  memberState,
  isKuyateOpen,
}: {
  memberState: MemberState
  isKuyateOpen: boolean
}) {
  // blocking popup content; null = no popup open
  const [popup, setPopup] = useState<{ title: string; message: string } | null>(null)

  // "Meet the Pamilyas" coming-soon line — scroll reveal
  const comingSoonRef = useRef<HTMLParagraphElement>(null)
  const comingSoonVisible = useRevealOnScroll(comingSoonRef)

  // sign-up FormCards — staggered entrance
  const formGridRef = useRef<HTMLDivElement>(null)
  useStaggeredReveal(
    () => Array.from(formGridRef.current?.querySelectorAll<HTMLElement>('[data-formcard]') ?? []),
    (card, cards) => {
      const i = cards.indexOf(card)
      card.style.animation = `fadeUp 0.55s var(--ease-smooth) ${i * 100}ms both`
    },
  )

  // ── Card prop helpers ────────────────────────────────────────────────────────

  function kuyateCardProps(): { href?: string; onClick?: () => void } {
    // not logged in → login with redirect
    if (!memberState.isLoggedIn)
      return { href: '/login?next=/pamilyas' }

    // logged in but not a paid member → membership page
    if (!memberState.isMember)
      return { href: '/membership' }

    // already submitted a kuyate app → already submitted popup
    if (memberState.memberType === 'kuyate' && memberState.hasKuyateApp)
      return { onClick: () => setPopup({
        title: 'Application Submitted',
        message: 'You have already submitted your Kuya/Ate application. The pam chair will be in touch after the sorting process.',
      })}

    // already submitted an ading app → cross-apply block popup
    if (memberState.memberType === 'ading' && memberState.hasAdingApp)
      return { onClick: () => setPopup({
        title: 'Already Applied as Ading',
        message: 'You have already submitted an Ading application. You cannot apply as both Ading and Kuya/Ate.',
      })}

    // kuyate applications are closed → closed popup
    if (!isKuyateOpen)
      return { onClick: () => setPopup({
        title: 'Applications Closed',
        message: 'Kuya/Ate applications have closed for this semester.',
      })}

    // not_interested member → reapply flow with type param
    if (memberState.memberType === 'not_interested')
      return { href: '/onboarding?reapply=true&type=kuyate' }

    // member with no type yet → normal onboarding
    return { href: '/onboarding' }
  }

  function adingCardProps(): { href?: string; onClick?: () => void } {
    // not logged in → login with redirect
    if (!memberState.isLoggedIn)
      return { href: '/login?next=/pamilyas' }

    // logged in but not a paid member → membership page
    if (!memberState.isMember)
      return { href: '/membership' }

    // already submitted an ading app → already submitted popup
    if (memberState.memberType === 'ading' && memberState.hasAdingApp)
      return { onClick: () => setPopup({
        title: 'Application Submitted',
        message: 'You have already submitted your Ading application. The pam chair will be in touch after the sorting process.',
      })}

    // already submitted a kuyate app → cross-apply block popup
    if (memberState.memberType === 'kuyate' && memberState.hasKuyateApp)
      return { onClick: () => setPopup({
        title: 'Already Applied as Kuya/Ate',
        message: 'You have already submitted a Kuya/Ate application. You cannot apply as both Kuya/Ate and Ading.',
      })}

    // not_interested member → reapply flow with type param
    if (memberState.memberType === 'not_interested')
      return { href: '/onboarding?reapply=true&type=ading' }

    // member with no type yet → normal onboarding
    return { href: '/onboarding' }
  }

  function protectionCardProps(): { href?: string; externalHref?: string } {
    if (!memberState.isLoggedIn) return { href: '/login?next=/pamilyas' }
    if (!memberState.isMember) return { href: '/membership' }
    // protection form is an external google form — opens in new tab
    return {
      externalHref: 'https://docs.google.com/forms/d/e/1FAIpQLSdlewwrMBLXLK_4oRI_J7bb2fh-uR11_G4asmzaa26LUXes2Q/viewform?usp=dialog',
    }
  }

  const kuyate = kuyateCardProps()
  const ading = adingCardProps()
  const protection = protectionCardProps()

  return (
    <main className="bg-section-bg text-white overflow-x-clip">
      <QuickNavRail mode="sections" ariaLabel="Pamilyas page sections" items={PAMILYAS_NAV_ITEMS} />

      {/* popup modal — renders when popup is not null */}
      {popup && (
        <Modal onClose={() => setPopup(null)} size="sm">
          <div className="bg-[#262626] rounded-2xl p-6 text-center shadow-2xl">
            <h3 className="font-display font-black text-white text-lg mb-3">
              {popup.title}
            </h3>
            <p className="font-sans text-[#e8e4dd]/60 text-sm leading-relaxed mb-6">
              {popup.message}
            </p>
            <button
              onClick={() => setPopup(null)}
              className="w-full bg-accent-green text-[#0e0e0e] font-display font-black uppercase tracking-widest py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Got it
            </button>
          </div>
        </Modal>
      )}

      {/* ── SECTION 1 — HERO ──────────────────────────────────────── */}
      <PageHero
        src="/pamilyas-hero.jpg"
        alt="Pamilyas"
        eyebrow="MEMBERS ONLY"
        title="Pamilyas"
        baybayin="ᜉᜋᜒᜎ᜔ᜌ"
        objectPosition="object-[43%_35%]"
        right={
          <span className="font-sans text-[16px] leading-relaxed">
            Find the pam that&rsquo;s right for you.
          </span>
        }
      />

      {/* ── SECTION 2 — WHAT IS A PAMILYA? ───────────────────────── */}
      <section id="what-is-a-pamilya" className="scroll-mt-20 bg-brand-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="01" title="What Is a Pamilya?" baybayin="ᜉᜋᜒᜎ᜔ᜌ" />

          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 pt-8">
            <div className="flex flex-col gap-5">
              <p className="font-sans text-[20px] md:text-[23px] leading-snug text-white">
                Pamilyas (&lsquo;pam&rsquo; for short), the Tagalog word for family, are smaller
                groups within UTD FSA where members{' '}
                <strong className="font-normal text-accent-green">create memories that last well beyond college.</strong>
              </p>
              <p className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60">
                Each pam consists of <strong className="font-semibold text-white">Kuyas</strong> (older brothers),{' '}
                <strong className="font-semibold text-white">Ates</strong> (older sisters), and{' '}
                <strong className="font-semibold text-white">Adings</strong> (younger siblings). Built on the idea
                that family goes beyond blood, pamilyas create lifelong bonds through shared experiences,
                traditions, and support.
              </p>
            </div>

            <div className="flex flex-col gap-5 pt-1">
              <p className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60">
                Every pamilya has its own mix of hobbies and interests. The Pamilya Chair and the Officer Board
                carefully match each ading with a pamilya where they can feel comfortable, get involved, and make
                the most of their time in UTD FSA.
              </p>
              <a
                href="#signup"
                className="group rounded-xl border border-accent-green/40 bg-accent-green/[0.08] px-5 py-4 text-left transition-colors hover:bg-accent-green/[0.14]"
              >
                <p className="font-sans text-[14px] leading-relaxed text-white">
                  The pamilya system is exclusive to UTD FSA members. Please pay your dues before filling out
                  the{' '}
                  <span className="relative inline-block font-semibold">
                    Kuya/Ate or Ading form
                    <span
                      aria-hidden="true"
                      className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-accent-green transition-all duration-300 ease-out group-hover:w-full"
                    />
                  </span>.
                </p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — PHOTO BAND ───────────────────────────────── */}
      <PhotoBand
        photos={[
          { src: '/pamilyas-photo-1.jpg', alt: 'Pamilya' },
          { src: '/pamilyas-photo-2.jpg', alt: 'Pamilya' },
          { src: '/pamilyas-photo-3.jpg', alt: 'Pamilya' },
        ]}
      />

      {/* ── SECTION 4 — MEET THE PAMILYAS (coming soon) ──────────── */}
      <section id="meet" className="scroll-mt-20 bg-brand-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader index="02" title="Meet the Pamilyas" />

          <p
            ref={comingSoonRef}
            className="font-sans text-[16px] leading-relaxed text-[#e8e4dd]/60 max-w-xl pt-8"
            style={{
              opacity: comingSoonVisible ? 1 : 0,
              transform: comingSoonVisible ? 'none' : 'translateY(20px)',
              transition: 'opacity 700ms var(--ease-smooth), transform 700ms var(--ease-smooth)',
            }}
          >
            Pamilyas will be revealed at the 2nd General Meeting. Check back soon!
          </p>
        </div>
      </section>

      {/* ── SECTION 5 — WHERE DO I SIGN UP? ──────────────────────── */}
      {/* centered masthead sits on the same lighter panel as its subtext and
          cards, not stranded on the dark band above — not a numbered
          SectionHeader: this is the page's closing ask, not another read-through */}
      <section id="signup" className="scroll-mt-20 bg-section-bg py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            className="font-display font-black text-white text-center mb-5"
            style={{ fontSize: 'clamp(17.6px, 2.2vw, 32px)', letterSpacing: '0.02em' }}
          >
            Where Do I Sign Up?
          </h2>
          <p className="font-sans font-normal text-[clamp(16px,1.5vw,22px)] text-[#e8e4dd]/70 text-center mb-10">
            Select the form that best fits the role you&rsquo;ll play in your UTD FSA pamilya experience!
          </p>

          <div ref={formGridRef} className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <div data-formcard>
              <FormCard
                photo="/kuyate-form.png"
                title="KUYA/ATE FORM"
                caption="Ready to lead a pamilya? Start here."
                href={kuyate.href}
                onClick={kuyate.onClick}
              />
            </div>

            <div data-formcard>
              <FormCard
                photo="/ading-form.png"
                title="ADING FORM"
                caption="Looking for a Pamilya? Start here."
                href={ading.href}
                onClick={ading.onClick}
              />
            </div>

            <div data-formcard>
              <FormCard
                photo="/pamilya-protection-form.png"
                title="PAMILYA PROTECTION FORM"
                caption="Have a Pamilya concern? We're here to help."
                href={protection.href}
                externalHref={protection.externalHref}
              />
            </div>

          </div>
        </div>

      </section>

    </main>
  )
}
