// ── route.ts (scan-ticket) ────────────────────────────────────────────────────
// validates a ticket qr code and checks the attendee in at the door.
//
// data:  members (role check), registration_tickets, event_registrations, events
// deps:  none (supabase only)
// notes: returns structured { valid, reason, message } so the scan ui can display
//        a clear pass/fail screen. four explicit failure reasons are defined:
//        INVALID_TICKET, WRONG_EVENT, NOT_PAID, ALREADY_CHECKED_IN.
//        the caller supplies event_id (picked on the scan page) — tickets for any
//        other event are rejected without consuming their check-in.
//        success and already-checked-in responses include the event's door tally
//        (checked_in_count / total_paid) so the scanner ui stays current.
//        checked_in_by is recorded for audit purposes.
//        a failed database call returns 503, never a verdict — at the 2026-09-13 party a
//        ticket lookup that timed out reported "Ticket not found" and a check-in write
//        that timed out reported "already checked in". already-checked-in responses carry
//        checked_in_by_you so the scanner can recognize its own timed-out write that
//        committed late (lib/events/scan-retry.ts).
//        auth: officer or admin only (requireOfficer, verified from token claims).

import { requireOfficer } from '@/lib/auth'
import { scanTicketSchema } from '@/lib/schemas'
import { NextResponse } from 'next/server'
import { fail } from '@/lib/api-response'

// ── door tally ────────────────────────────────────────────────────────────────

// checked-in vs total paid tickets for one event — returned with every scan so
// the scanner ui can show a live door count without polling a separate endpoint.
// ponytail: tally only refreshes per scan response; two officers scanning at
// once drift between scans — acceptable, next scan corrects it.
type AdminClient = NonNullable<Awaited<ReturnType<typeof requireOfficer>>>['admin']

// counts on the database instead of pulling every row and counting in JS —
// head: true skips the row payload entirely, only the count comes back.
async function eventTally(admin: AdminClient, eventId: string) {
  const base = () =>
    admin
      .from('registration_tickets')
      .select('id, event_registrations!inner(event_id, payment_status)', { count: 'exact', head: true })
      .eq('event_registrations.event_id', eventId)
      .eq('event_registrations.payment_status', 'paid')

  const [paid, checkedIn] = await Promise.all([
    base(),
    base().eq('checked_in', true),
  ])

  // a failed count must not show 0/0 at the door — omit the tally and the scanner
  // keeps its last one
  if (paid.error || checkedIn.error) return {}

  return {
    checked_in_count: checkedIn.count ?? 0,
    total_paid: paid.count ?? 0,
  }
}

const DB_UNAVAILABLE = 'Could not reach the database, scan again'

// ── POST /api/scan-ticket ─────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── auth check ────────────────────────────────────────────────────────────

  // verify: 'claims' — no auth-server round trip per scan; auth-server timeouts were
  // 11 of the 17 failed calls at the 2026-09-13 party (see lib/auth.ts)
  const ctx = await requireOfficer({ verify: 'claims' })
  if (!ctx) return fail('Forbidden', 403)
  const { admin, member: officer } = ctx

  const body = await req.json().catch(() => null)
  const parsed = scanTicketSchema.safeParse(body)

  if (!parsed.success) {
    return fail('Invalid QR code format', 400)
  }

  const { qr_code, event_id } = parsed.data

  // ── ticket lookup ─────────────────────────────────────────────────────────

  // find the ticket by qr_code and join payment status + event name in one query
  const { data: ticket, error: lookupError } = await admin
    .from('registration_tickets')
    .select(`
      id,
      attendee_fname,
      attendee_lname,
      attendee_email,
      checked_in,
      checked_in_at,
      checked_in_by,
      registration_id,
      event_registrations (
        payment_status,
        event_id,
        events (
          name
        )
      )
    `)
    .eq('qr_code', qr_code)
    .maybeSingle()

  if (lookupError) {
    console.error('[scan-ticket] ticket lookup failed', lookupError)
    return fail(DB_UNAVAILABLE, 503)
  }

  if (!ticket) {
    return NextResponse.json({
      valid: false,
      reason: 'INVALID_TICKET',
      message: 'Ticket not found',
    })
  }

  // ── validation ────────────────────────────────────────────────────────────

  // supabase's generated types model this one-to-one join loosely, so the shape
  // is narrowed here rather than left as `any` — a typo in event_id or
  // payment_status below would otherwise compile silently, and those two fields
  // are the whole reason a wrong-event or unpaid ticket doesn't scan green
  type ScannedRegistration = {
    event_id: string | null
    payment_status: string | null
    events: { name: string | null } | null
  } | null

  const registration = ticket.event_registrations as unknown as ScannedRegistration

  // reject tickets that belong to a different event — a valid paid ticket for
  // next week's party must not scan green at tonight's door (and must not
  // consume its own check-in). ticket_event_name tells the officer which event
  // the ticket is actually for so they can redirect the attendee.
  if (registration?.event_id !== event_id) {
    return NextResponse.json({
      valid: false,
      reason: 'WRONG_EVENT',
      message: 'Ticket is for a different event',
      attendee_name: `${ticket.attendee_fname} ${ticket.attendee_lname}`,
      ticket_event_name: registration?.events?.name ?? 'Unknown event',
    })
  }

  // reject if payment has not been confirmed — covers 'pending' and 'failed' statuses
  if (registration?.payment_status !== 'paid') {
    return NextResponse.json({
      valid: false,
      reason: 'NOT_PAID',
      message: 'Payment not verified',
    })
  }

  if (ticket.checked_in) {
    return NextResponse.json({
      valid: false,
      reason: 'ALREADY_CHECKED_IN',
      message: 'Already checked in',
      checked_in_at: ticket.checked_in_at,
      checked_in_by_you: ticket.checked_in_by === officer.id,
      attendee_name: `${ticket.attendee_fname} ${ticket.attendee_lname}`,
      ...(await eventTally(admin, event_id)),
    })
  }

  // ── check-in write ────────────────────────────────────────────────────────

  // mark as checked in — records timestamp and officer who scanned for audit trail.
  // .eq('checked_in', false) makes this atomic: if two near-simultaneous scans race,
  // only the first write matches a row; the loser gets zero rows back and is treated
  // as already checked in below, closing the TOCTOU gap between the read above and this write.
  const { data: updatedTickets, error: writeError } = await admin
    .from('registration_tickets')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: officer.id,
    })
    .eq('id', ticket.id)
    .eq('checked_in', false)
    .select('id')

  // the write may still commit after this error — the rescan that follows is what
  // sorts that out (see checked_in_by_you below)
  if (writeError) {
    console.error('[scan-ticket] check-in write failed', ticket.id, writeError)
    return fail(DB_UNAVAILABLE, 503)
  }

  if (!updatedTickets || updatedTickets.length === 0) {
    // lost the race — possibly to this officer's own earlier attempt, whose write timed
    // out and committed late while this one waited on the row. re-read who won so the
    // scanner can tell. a failed re-read falls back to a plain already-checked-in.
    const { data: winner } = await admin
      .from('registration_tickets')
      .select('checked_in_at, checked_in_by')
      .eq('id', ticket.id)
      .maybeSingle()

    return NextResponse.json({
      valid: false,
      reason: 'ALREADY_CHECKED_IN',
      message: 'Already checked in',
      checked_in_at: winner?.checked_in_at ?? null,
      checked_in_by_you: winner?.checked_in_by === officer.id,
      attendee_name: `${ticket.attendee_fname} ${ticket.attendee_lname}`,
      ...(await eventTally(admin, event_id)),
    })
  }

  return NextResponse.json({
    valid: true,
    reason: 'SUCCESS',
    message: 'Check in successful',
    attendee_name: `${ticket.attendee_fname} ${ticket.attendee_lname}`,
    event_name: registration?.events?.name,
    ...(await eventTally(admin, event_id)),
  })
}