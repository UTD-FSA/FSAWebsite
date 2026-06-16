// ── page.tsx ──────────────────────────────────────────────
// pamilyas page — server component that resolves member state
// and application status, then delegates all rendering to
// PamilyasClient
//
// data:  members, ading_applications, kuyate_applications,
//        settings (kuyate_applications_open flag)
// deps:  supabase (user client + admin client)
// ──────────────────────────────────────────────────────────

// ── data fetching ─────────────────────────────────────────
import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import PamilyasClient, { type MemberState } from './PamilyasClient'

export default async function PamilyasPage() {
  // user client for session-scoped reads (auth + settings)
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberState: MemberState = {
    isLoggedIn: false,
    isMember: false,
    memberType: null,
    hasAdingApp: false,
    hasKuyateApp: false,
    onboardingComplete: false,
  }

  if (user) {
    memberState.isLoggedIn = true
    const admin = createAdminClient()

    // query members table by email to get membership status and type
    const { data: member } = await admin
      .from('members')
      .select('id, membership_status, onboarding_complete, member_type')
      .eq('email', user.email!)
      .maybeSingle()

    if (member) {
      memberState.isMember = member.membership_status === 'active'
      memberState.memberType = member.member_type ?? null
      memberState.onboardingComplete = member.onboarding_complete ?? false

      if (memberState.isMember) {
        // check both application tables in parallel to avoid waterfall
        const [adingRes, kuyateRes] = await Promise.all([
          admin.from('ading_applications').select('id').eq('member_id', member.id).maybeSingle(),
          admin.from('kuyate_applications').select('id').eq('member_id', member.id).maybeSingle(),
        ])
        memberState.hasAdingApp = !!adingRes.data
        memberState.hasKuyateApp = !!kuyateRes.data
      }
    }
  }

  // read settings table for the kuyate application open/closed flag
  const { data: kuyateOpenSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'kuyate_applications_open')
    .maybeSingle()
  const isKuyateOpen = kuyateOpenSetting?.value === 'true'

  // ── render ────────────────────────────────────────────────
  // pass resolved state to client component; no markup here
  return <PamilyasClient memberState={memberState} isKuyateOpen={isKuyateOpen} />
}
