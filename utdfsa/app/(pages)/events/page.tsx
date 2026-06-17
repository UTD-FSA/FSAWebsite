import { createAdminClient, createUserClient } from '@/utils/supabase/server'
import EventsPageClient from './EventsPageClient'
import type { Event } from '@/types/database'

// ── page ──────────────────────────────────────────────────────────────────────

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  // ============================================================
  // DATA — do not modify this section
  // all database queries and auth checks live here
  // changing these will break functionality
  // ============================================================
  const { success } = await searchParams
  const admin = createAdminClient()

  // visible events — base order ascending; client re-sorts into upcoming/past
  const { data: allEvents } = await admin
    .from('events')
    .select('*')
    .eq('is_visible', true)
    .order('event_date', { ascending: true })

  // resolve caller (page is public — members get different display)
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  let member: {
    id: string
    membership_status: string
    first_name: string
    last_name: string
    email: string
    contact_email: string | null
  } | null = null
  let registeredEventIds = new Set<string>()

  if (user?.email) {
    const { data } = await admin
      .from('members')
      .select('id, membership_status, first_name, last_name, email, contact_email')
      .eq('email', user.email)
      .maybeSingle()
    member = data

    // only fetch existing registrations for active (paid) members
    if (member?.membership_status === 'active') {
      const { data: regs } = await admin
        .from('event_registrations')
        .select('event_id')
        .eq('member_id', member.id)
        .neq('payment_status', 'failed')
      registeredEventIds = new Set(
        (regs ?? []).map(r => r.event_id).filter(Boolean) as string[]
      )
    }
  }

  const isMember = member?.membership_status === 'active'

  // ============================================================
  // UI — safe to restyle everything below this line
  // available data:
  //   events (Event[]) — visible events in base ascending order; client sorts into upcoming/past
  //   member — { id, membership_status, first_name, last_name, email, contact_email } | null
  //   isMember (bool) — true when the logged-in user has an active membership
  //   registeredEventIds (Set<string>) — event IDs the member already paid for
  //   success — query param set by Stripe redirect or free-event confirmation
  // ============================================================
  return (
    <EventsPageClient
      events={(allEvents ?? []) as Event[]}
      isMember={isMember}
      member={member}
      registeredEventIds={[...registeredEventIds]}
      success={success}
    />
  )
}
