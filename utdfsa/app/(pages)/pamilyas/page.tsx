// ============================================================
// DATA — do not modify this section
// checks auth and application status to determine
// which state to pass to PamilyasClient
// ============================================================

import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import PamilyasClient, { type MemberState } from './PamilyasClient'

export default async function PamilyasPage() {
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
        const [adingRes, kuyateRes] = await Promise.all([
          admin.from('ading_applications').select('id').eq('member_id', member.id).maybeSingle(),
          admin.from('kuyate_applications').select('id').eq('member_id', member.id).maybeSingle(),
        ])
        memberState.hasAdingApp = !!adingRes.data
        memberState.hasKuyateApp = !!kuyateRes.data
      }
    }
  }

  const { data: kuyateOpenSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'kuyate_applications_open')
    .maybeSingle()
  const isKuyateOpen = kuyateOpenSetting?.value === 'true'

  // ============================================================
  // UI — passes data to PamilyasClient, no rendering here
  // ============================================================
  return <PamilyasClient memberState={memberState} isKuyateOpen={isKuyateOpen} />
}
