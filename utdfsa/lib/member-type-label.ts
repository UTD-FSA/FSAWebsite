// ── lib/member-type-label.ts ──────────────────────────────
// derives the display label for a member's ading/kuyate track on the profile page.
//
// notes: member_type is written once at onboarding submit (app/api/onboarding/submit/route.ts)
//        and never updated by officer review — a rejected applicant would otherwise read
//        'kuyate' forever. this helper cross-checks member_type against the applicant's own
//        application status so a rejected/withdrawn application hides the row instead of
//        showing a title they weren't given.
//        pam head has no dedicated column — it's derived as accepted + wants_to_be_pam_head,
//        the applicant's own request at onboarding. officers accepting a kuyate application
//        implicitly grant headship if it was requested; there's no separate officer toggle.
//        applicationStatus is untyped ('text', no db check constraint) — treat anything
//        other than 'accepted'/'rejected' as pending, don't assume the union in types/database.ts.

import type { Member } from '@/types/database'

export function memberTypeLabel(
  memberType: Member['member_type'],
  applicationStatus: string | null,
  wantsToBePamHead: boolean,
): string | null {
  if (memberType !== 'ading' && memberType !== 'kuyate') return null
  if (applicationStatus === 'rejected') return null

  const trackLabel = memberType === 'kuyate' ? 'Kuyate' : 'Ading'

  if (applicationStatus !== 'accepted') return `${trackLabel} (pending)`
  if (memberType === 'kuyate' && wantsToBePamHead) return 'Kuyate (Pam Head)'
  return trackLabel
}
