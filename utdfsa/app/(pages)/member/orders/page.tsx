// ── page.tsx ─────────────────────────────────────────────────
// server component — fetches order history and passes it to OrdersClient
//
// data:  members (id, contact_email), event_registrations with registration_tickets, events lookup
// deps:  supabase admin client (bypass rls to read tickets and registrations)
// notes: events are fetched in a separate query because nested fk joins require
//        explicit constraints in the supabase schema; eventsData is passed as a
//        record keyed by id for O(1) lookups in the client component
import { createAdminClient } from '@/utils/supabase/server'
import { requireUser, assertActiveMember } from '@/lib/auth'
import { redirect } from 'next/navigation'
import OrdersClient from './OrdersClient'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  // ============================================================
  // DATA — do not modify this section
  // all database queries and auth checks live here
  // changing these will break functionality
  // ============================================================
  // ?success=true is appended by stripe on redirect after a completed checkout
  const { success } = await searchParams

  // respects rls — only used for the auth check; all data reads use the admin client below
  const ctx = await requireUser()
  if (!ctx) redirect('/login')
  const { user } = ctx

  // bypass rls — safe because every query below is scoped to this member's
  // own id/email; no other member's data is ever read here
  const admin = createAdminClient()

  // members table — fetch id, contact_email, and role/membership_status/membership_expires_at
  // so assertActiveMember() below can re-verify paid/officer status server-side
  // (defense-in-depth mirror of the middleware gate — see lib/auth.ts) without a
  // second members round-trip. contact_email is the preferred notification address;
  // falls back to Google login email
  const { data: member } = await admin
    .from('members')
    .select('id, contact_email, role, membership_status, membership_expires_at')
    .eq('email', user.email!)
    .maybeSingle()

  // redirect to /login if no member row (account not fully set up), /membership if unpaid
  assertActiveMember(member)

  // the email address that qr ticket confirmation was sent to
  const contactEmail = member.contact_email ?? user.email!

  // event_registrations table — all registrations for this member, newest first, with tickets inline.
  // paid-only by construction (see app/api/stripe-webhook/route.ts) — a checkout still
  // in flight lives in pending_registrations instead, fetched separately below, so a
  // member who just paid but hasn't been fulfilled yet (webhook race) still sees
  // something here rather than a success banner over an empty list.
  const { data: registrations } = await admin
    .from('event_registrations')
    .select(`
      id,
      created_at,
      num_tickets,
      amt_paid,
      amt_expected,
      event_id,
      registration_tickets (
        id,
        qr_code,
        attendee_fname,
        attendee_lname,
        attendee_email,
        checked_in,
        checked_in_at
      )
    `)
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })

  // pending_registrations — checkouts in flight, keyed by stripe session rather than
  // this member's identity, so this is deliberately a plain member_id lookup rather
  // than anything resembling "the" pending row (see lib/events/fulfillment.ts).
  // excludes expired sessions (dead, will never fulfill — only the webhook's
  // opportunistic prune or checkout.session.expired ever deletes these rows) and any
  // pending row for an event this member already has a paid registration for (an
  // abandoned/retried checkout — unique_member_event_registration means that pending
  // row can only ever resolve to a refund, never a second paid registration)
  const paidEventIds = new Set((registrations ?? []).map(r => r.event_id))
  const { data: pendingRegistrationsRaw } = await admin
    .from('pending_registrations')
    .select('id, event_id, num_tickets, created_at')
    .eq('member_id', member.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
  const pendingRegistrations = (pendingRegistrationsRaw ?? [])
    .filter(p => !p.event_id || !paidEventIds.has(p.event_id))

  // fetch event details separately — nested joins require fk constraints in supabase schema
  // collect unique event ids from both paid and pending rows, filtering out nulls
  const eventIds = [
    ...(registrations ?? []).map(r => r.event_id),
    ...pendingRegistrations.map(r => r.event_id),
  ].filter((id): id is string => Boolean(id))

  const eventsData: Record<string, {
    name: string
    event_date: string
    location: string | null
    cover_photo_url: string | null
  }> = {}

  if (eventIds.length > 0) {
    // events table — fetch display fields for all events referenced by this member's registrations
    const { data: events } = await admin
      .from('events')
      .select('id, name, event_date, location, cover_photo_url')
      .in('id', eventIds)

    // index by id so OrdersClient can do O(1) lookups per registration
    for (const e of events ?? []) eventsData[e.id] = e
  }

  // ============================================================
  // UI — rendered by OrdersClient (client component)
  // ============================================================
  return (
    <OrdersClient
      registrations={registrations ?? []}
      pendingRegistrations={pendingRegistrations}
      eventsData={eventsData}
      contactEmail={contactEmail}
      success={success}
    />
  )
}
