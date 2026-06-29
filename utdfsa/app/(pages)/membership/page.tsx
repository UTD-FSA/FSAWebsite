// ── page.tsx ─────────────────────────────────────────────────
// server component — computes pricing and early-bird status, passes to MembershipClient
//
// data:  settings table (via getSettings): membershipPriceCents, earlyBirdPriceCents,
//        earlyBirdDeadline, membershipYear
// notes: early-bird check compares server-side now vs. earlyBirdDeadline (a Date object);
//        all prices in cents to avoid floating-point issues
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Become a Member' }

import { getSettings } from '@/lib/settings'
import MembershipClient from './MembershipClient'

export default async function MembershipPage() {
  // ============================================================
  // DATA — do not modify this section
  // reads the settings table via getSettings() for:
  //   membershipPriceCents, earlyBirdPriceCents, earlyBirdDeadline, membershipYear
  // computes isEarlyBird by comparing now vs. earlyBirdDeadline
  // all values are forwarded as props to MembershipClient
  // ============================================================

  // fetch prices from the settings table
  const settings = await getSettings()

  // compare current server time to the deadline; true = show early-bird price
  const now = new Date()
  const isEarlyBird = now < settings.earlyBirdDeadline

  // displayPrice is the price the member actually pays; regularPrice is shown crossed out during early bird
  const displayPrice = isEarlyBird
    ? settings.earlyBirdPriceCents
    : settings.membershipPriceCents

  const regularPrice = settings.membershipPriceCents

  // ============================================================
  // UI — safe to restyle everything below this line
  // all styling lives in MembershipClient — edit that file
  // ============================================================
  return (
    <MembershipClient
      displayPrice={displayPrice}
      regularPrice={regularPrice}
      isEarlyBird={isEarlyBird}
      earlyBirdDeadline={settings.earlyBirdDeadline.toISOString()}
      membershipYear={settings.membershipYear}
    />
  )
}