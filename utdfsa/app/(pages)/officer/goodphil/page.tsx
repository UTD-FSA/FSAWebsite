import { createAdminClient } from '@/utils/supabase/server'
import type { GoodphilEligibility } from '@/types/database'
import GoodphilClient from './GoodphilClient'

export default async function GoodphilPage() {
  // ============================================================
  // DATA — do not modify this section
  // queries the goodphil_eligibility view for eligibility data;
  // phone is not included in the view so it is fetched separately
  // from the members table and merged by email before passing down.
  // officer-only access is enforced by middleware on /officer routes.
  // ============================================================
  const admin = createAdminClient()

  const { data: eligibility } = await admin
    .from('goodphil_eligibility')
    .select('*')
    .order('last_name', { ascending: true })

  // fetch phone separately — the view is derived from members but
  // does not expose phone; pull it directly and join by email
  const { data: phoneRows } = await admin
    .from('members')
    .select('email, phone')

  const phoneByEmail = new Map(
    (phoneRows ?? []).map(r => [r.email as string, r.phone as string | null])
  )

  const members: GoodphilEligibility[] = (eligibility ?? []).map(m => ({
    ...(m as GoodphilEligibility),
    phone: phoneByEmail.get(m.email) ?? null,
  }))

  // ============================================================
  // UI — data is passed to the client component below
  // all search filtering, pagination, and CSV export happen client-side
  // ============================================================
  return <GoodphilClient members={members} />
}
