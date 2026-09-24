// ── page.tsx ──────────────────────────────────────────────
// pamilyas page — server component that resolves member state
// and application status, then delegates all rendering to
// PamilyasClient
//
// data:  members (+ embedded ading_applications / kuyate_applications,
//        one round trip), settings (kuyate_applications_open flag, via
//        lib/settings.ts — fetched in parallel with the member lookup)
// deps:  supabase (user client + admin client)
// notes: the session is verified with getClaims() (local jwt check), not
//        getUser() — middleware (utils/supabase/middleware.ts) already ran
//        the server-side getUser() and any refresh on this same request, so
//        a second auth-server round trip here only added latency
// ──────────────────────────────────────────────────────────

import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Pamilyas',
  description: "Learn about UTD FSA's pamilya program, small mentorship families that connect new members with upperclassmen kuyas and ates for support and friendship.",
  alternates: { canonical: '/pamilyas' },
  openGraph: { images: [{ url: '/og/pamilyas.jpg', width: 1200, height: 630 }] },
}

// ── data fetching ─────────────────────────────────────────
import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import { getSettings } from '@/lib/settings'
import { isMembershipActive } from '@/lib/membership'
import PamilyasClient, { type MemberState } from './PamilyasClient'

async function resolveMemberState(): Promise<MemberState> {
  const memberState: MemberState = {
    isLoggedIn: false,
    isMember: false,
    memberType: null,
    hasAdingApp: false,
    hasKuyateApp: false,
    onboardingComplete: false,
  }

  const supabase = await createUserClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  // an auth outage is not a signed-out visitor — surface it (same rule as lib/auth.ts)
  if (isAuthRetryableFetchError(claimsError)) throw claimsError
  if (!claimsData) return memberState

  memberState.isLoggedIn = true
  const email = claimsData.claims.email
  if (!email) return memberState

  // bypass rls — read-only, scoped to the caller's own verified email.
  // application tables are embedded to save a round trip; the fk hint is required
  // because both also reference members via reviewed_by
  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select(`
      id, membership_status, membership_expires_at, onboarding_complete, member_type,
      ading_applications!ading_applications_member_id_fkey(id),
      kuyate_applications!kuyate_applications_member_id_fkey(id)
    `)
    .eq('email', email)
    .maybeSingle()

  if (member) {
    memberState.isMember = isMembershipActive(member)
    memberState.memberType = member.member_type ?? null
    memberState.onboardingComplete = member.onboarding_complete ?? false

    // application state only matters for active members (same as before the embed)
    if (memberState.isMember) {
      memberState.hasAdingApp = member.ading_applications.length > 0
      memberState.hasKuyateApp = member.kuyate_applications.length > 0
    }
  }

  return memberState
}

export default async function PamilyasPage() {
  // settings don't depend on the viewer — fetch alongside the member lookup.
  // kuyate applications open/closed flag also accounts for the kuyate_deadline cutoff
  // (settings table is admin/service-role-only; the anon/authenticated roles have no
  // direct read access, so this must go through getSettings() rather than a raw query)
  const [memberState, { kuyateApplicationsOpen: isKuyateOpen }] = await Promise.all([
    resolveMemberState(),
    getSettings(),
  ])

  // ── render ────────────────────────────────────────────────
  // pass resolved state to client component; no markup here
  return <PamilyasClient memberState={memberState} isKuyateOpen={isKuyateOpen} />
}
