// ── page.tsx ─────────────────────────────────────────────────
// home page — hero, marquee, mission statement, and upcoming events
//
// data:  next 4 upcoming visible events fetched server-side for SSR
// notes: z-10 overlay and z-20 logo/text layer the hero; marquee duplicates
//        8 items so the looping seam is never visible at any viewport width.
//        the hero is sized to the viewport *minus* the 5rem navbar — that navbar
//        is sticky and sits above this page in flow rather than overlaying it, so
//        a plain 100vh hero always pushed its own bottom 80px off-screen and took
//        the CTAs with it on any laptop under ~780px tall. svh, not vh, so the ios
//        url bar can't resize the hero mid-scroll. HeroSection shrinks its logo to
//        fit whatever height is left, so nothing there can be clipped.
//        the events query itself is cached via getCachedVisibleEvents (see
//        lib/data/events.ts) — there is no route-segment `revalidate` export
//        here because auth.getUser() below reads cookies() unconditionally,
//        which forces this whole page to render dynamically per request
//        regardless of that export; unstable_cache is the real cache boundary.
//        the sitewide Organization JSON-LD lives here (not the root layout) —
//        one instance is enough per Google's guidance, and reading x-nonce for
//        it is what used to force every route in the app to render dynamically;
//        this page is already dynamic (cookies() below), so it's a free home.
//        UpcomingEvents is its own async component wrapped in Suspense — it's
//        the only part of the page that needs auth/member/registration data,
//        so the hero/marquee/mission-statement stream immediately instead of
//        waiting on those Supabase round trips (see UpcomingEventsSkeleton
//        below for the loading placeholder).
// ─────────────────────────────────────────────────────────────

import type { Metadata } from "next"
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

import { Suspense } from "react"
import { headers } from "next/headers"
import SmoothImage from "@/components/SmoothImage"
import HeroSection from "@/components/HeroSection"
import UpcomingEventsSection from "@/components/UpcomingEventsSection"
import MissionStatementSection from "@/components/MissionStatementSection"
import WhoAreWeText from "@/components/WhoAreWeText"
import { createAdminClient, createUserClient } from "@/utils/supabase/server"
import { getCachedVisibleEvents } from "@/lib/data/events"
import { isMembershipActive } from "@/lib/membership"

const SITE_URL = "https://www.utdfsa.org"
const SITE_DESCRIPTION = "The Filipino Student Association at The University of Texas at Dallas. Join events, become a member, explore pamilyas, cultural programs, and connect with the Filipino-American community at UTD."

// sitewide Organization structured data — one instance is enough for the whole
// site per Google's guidance, so it lives on the home page rather than per-page
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "UTD FSA — Filipino Student Association at UT Dallas",
  alternateName: "UTD FSA",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-head.png`,
  description: SITE_DESCRIPTION,
  sameAs: [
    "https://instagram.com/fsautd",
    "https://youtube.com/@fsautd",
    "https://tiktok.com/@utdfsa",
    "https://discord.gg/uVRmuF3BT",
  ],
}

// ── upcoming events — isolated async boundary ─────────────────
// resolves caller server-side — same pattern as app/(pages)/events/page.tsx — so the
// Register/Already-registered button state is correct on first paint instead of
// popping in after a client-side auth/registration waterfall.
// events + auth are independent, so they're fetched in parallel; member and
// registration lookups stay sequential since each depends on the previous result.
async function UpcomingEvents() {
  const admin = createAdminClient()
  const supabase = await createUserClient()

  const [visibleEvents, { data: { user } }] = await Promise.all([
    getCachedVisibleEvents(),
    supabase.auth.getUser(),
  ])

  // filtered/sliced live (not baked into the cached query) so "upcoming" stays
  // correct as events start, without needing a separate cache entry per window
  const now = new Date()
  const upcomingEvents = visibleEvents
    .filter(e => new Date(e.event_date) >= now)
    .slice(0, 4)

  let member: {
    id: string
    membership_status: string
    membership_expires_at: string | null
    first_name: string
    last_name: string
    email: string
    contact_email: string | null
  } | null = null
  let registeredEventIds = new Set<string>()

  if (user?.email) {
    const { data } = await admin
      .from('members')
      .select('id, membership_status, membership_expires_at, first_name, last_name, email, contact_email')
      .eq('email', user.email)
      .maybeSingle()
    member = data

    if (member && isMembershipActive(member)) {
      const { data: regs } = await admin
        .from('event_registrations')
        .select('event_id')
        .eq('member_id', member.id)
        .eq('payment_status', 'paid')
      registeredEventIds = new Set(
        (regs ?? []).map(r => r.event_id).filter(Boolean) as string[]
      )
    }
  }

  const isMember = isMembershipActive(member)

  return (
    <UpcomingEventsSection
      events={upcomingEvents}
      isMember={isMember}
      member={member}
      registeredEventIds={[...registeredEventIds]}
    />
  )
}

// loading placeholder shown while UpcomingEvents resolves — mirrors the real
// section's container/heading so there's no large layout jump on swap-in
function UpcomingEventsSkeleton() {
  return (
    <section className="bg-brand-bg px-4 sm:px-8 lg:px-16 py-14 sm:py-20 lg:py-24">
      <div className="max-w-[1241px] mx-auto">
        <div className="flex items-center gap-5 mb-10 lg:mb-14 justify-center sm:justify-start">
          <h2 className="font-display font-black text-[29px] sm:text-[42px] lg:text-[51px] text-white tracking-[-1.5px] sm:tracking-[-2.5px] lg:tracking-[-3px] leading-none flex-none">
            UPCOMING EVENTS
          </h2>
          <div className="hidden sm:block flex-1 h-px mt-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div className="flex gap-4 overflow-hidden pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-none rounded-2xl animate-pulse"
              style={{ width: '240px', height: '108px', background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default async function Home() {
  // nonce set per-request by proxy.ts — required for the inline JSON-LD script below
  // to run under a nonce-based CSP (script-src no longer allows 'unsafe-inline')
  const nonce = (await headers()).get('x-nonce')

  return (
    <main className="bg-brand-bg text-white overflow-x-clip">
      <script
        type="application/ld+json"
        nonce={nonce ?? undefined}
        // browsers zero out the nonce attribute in the DOM after parsing (CSP
        // hardening, prevents nonce exfiltration) — React sees that as a hydration
        // mismatch even though the script already ran fine server-side
        suppressHydrationWarning
        // static, no user input — safe to inline
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
      />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative h-[50svh] sm:h-[70svh] md:h-[calc(100svh-5rem)] w-full overflow-hidden">
        <h1 className="sr-only">UTD FSA — Filipino Student Association at The University of Texas at Dallas</h1>
        {/* Background photo — object-top keeps faces in frame */}
        <SmoothImage
          src="/hero-officers.jpg"
          alt="FSA Officers"
          fill
          className="object-cover object-top"
          preload
          sizes="100vw"
          quality={90}
        />

        {/* Dark overlay so text reads clearly over the busy photo */}
        {/* z-10 sits above the hero image but below the logo (z-20) */}
        <div className="absolute inset-0 bg-black/20 z-10" />

        <HeroSection />
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────── */}
      <div className="bg-brand-bg h-[42px] sm:h-[52px] md:h-[59px] flex items-center overflow-hidden" aria-hidden="true">
        {/* 8 copies so the loop seam is never visible — animation slides to -50% */}
        <div className="flex gap-[34px] whitespace-nowrap w-max animate-marquee">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="inline-flex items-center gap-[34px] font-display font-bold text-[15px] sm:text-[22px] md:text-[32px] shrink-0 tracking-wide">
              <span className="text-white">PARA SA KULTURA.</span>
              <span className="text-accent-green">FOR THE CULTURE.</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── WHO ARE WE? ───────────────────────────────────────────── */}
      <section className="bg-section-bg px-4 sm:px-8 lg:px-16 py-12 lg:py-20">
        <div className="max-w-[1241px] mx-auto flex flex-col gap-8">
          <WhoAreWeText />
        </div>
      </section>

      {/* ── PHOTO MOSAIC — static, no scroll-reveal ─────────────────── */}
      <div className="bg-section-bg px-4 sm:px-8 lg:px-16 pb-4 lg:pb-6">
        <div className="max-w-[1241px] mx-auto grid md:grid-cols-[2fr_1fr] gap-4">
          <div className="relative h-[255px] md:h-[400px] w-full overflow-hidden rounded-xl">
            <SmoothImage src="/home-mosaic-main.jpg" alt="FSA Event" fill className="object-cover object-[center_55%]" sizes="(max-width: 768px) 100vw, 66vw" />
          </div>
          <div className="hidden md:grid grid-rows-2 gap-4 h-[400px]">
            <div className="relative w-full h-full overflow-hidden rounded-xl">
              <SmoothImage src="/home-mosaic-top.jpg" alt="FSA members" fill className="object-cover" sizes="33vw" />
            </div>
            <div className="relative w-full h-full overflow-hidden rounded-xl">
              <SmoothImage src="/home-mosaic-bottom.jpg" alt="FSA members" fill className="object-cover" sizes="33vw" />
            </div>
          </div>
        </div>
      </div>

      {/* ── MISSION STATEMENT ─────────────────────────────────────── */}
      <MissionStatementSection />

      {/* ── UPCOMING EVENTS ───────────────────────────────────────── */}
      <Suspense fallback={<UpcomingEventsSkeleton />}>
        <UpcomingEvents />
      </Suspense>

      {/* ── SECOND FULL-BLEED PHOTO — static, no scroll-reveal ──────── */}
      <div className="relative h-[255px] md:h-[383px] lg:h-[510px] w-full overflow-hidden">
        <SmoothImage src="/home-closing-photo.jpg" alt="FSA Event" fill className="object-cover" sizes="100vw" />
      </div>

    </main>
  )
}
