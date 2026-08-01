// ── route.ts (stripe-webhook) ─────────────────────────────────────────────────
// receives stripe webhook events and fulfills orders (membership or event tickets).
//
// data:  members, event_registrations, registration_tickets, pending_registrations,
//        events, stripe_events (idempotency ledger)
// deps:  stripe (signature verification + event parsing, refunds), resend (confirmation emails),
//        qrcode (png buffer generation for ticket attachments)
// notes: CRITICAL — stripe calls this directly; do NOT add auth middleware here.
//        stripe.webhooks.constructEvent() is the security layer (STRIPE_WEBHOOK_SECRET).
//        two event types are handled:
//          checkout.session.completed → fulfill membership or ticket order + send email
//          checkout.session.expired  → drop the pending event-ticket cart, if any
//        email failures are caught and logged — they never fail the webhook response
//        because payment is already recorded before the email attempt.
//        idempotency: event.id is claimed in stripe_events before any fulfillment write —
//        a replayed/retried event no-ops on the duplicate-key insert. the claim is rolled
//        back before any 500 response so stripe's retry can claim it again.
//
//        event-ticket fulfillment: event_registrations is now paid-only. the cart lives in
//        pending_registrations, keyed by stripe_checkout_session_id (not by identity), so
//        concurrent checkouts for the same person never collide — see
//        app/api/events/register/route.ts and lib/events/fulfillment.ts for why. this route
//        materializes the real registration + tickets here, on checkout.session.completed,
//        then deletes the pending row. classifyFulfillment() decides fulfill/retry/refund
//        from the pending row's own stripe_checkout_session_id, so a stale/superseded
//        session (or one whose pending row was already pruned) auto-refunds instead of
//        silently fulfilling with the wrong cart.
//
//        TRANSITION: sessions created before this route's rewrite carry the old
//        metadata.registration_id shape (an event_registrations row created pre-payment).
//        those stay payable for up to 24h post-deploy, so the legacy branch below must stay
//        until 48h after deploy, then be deleted along with a follow-up migration purging any
//        leftover non-paid event_registrations rows. see
//        supabase/migrations/20260731190000_pending_registrations.sql.

// CRITICAL: this route handles all payment confirmations
// stripe sends events here after payment completes
// do not add auth middleware to this route — stripe calls it directly
// signature verification (stripe.webhooks.constructEvent) is the security mechanism
// do not reorder the event handlers — membership must update before email sends

import { stripe } from '@/lib/stripe'
import { getSettings } from '@/lib/settings'
import { createAdminClient } from '@/utils/supabase/server'
import { resend } from '@/lib/resend'
import { ticketEmailHtml } from '@/lib/email/ticket'
import { membershipEmailHtml } from '@/lib/email/membership'
import { classifyFulfillment } from '@/lib/events/fulfillment'
import QRCode from 'qrcode'
import { NextResponse } from 'next/server'
import { fail } from '@/lib/api-response'

// App Router reads the raw body via req.text() — no special config needed.
// Do NOT add bodyParser: false here (that's Pages Router only and is ignored in App Router).

// admin client threaded in explicitly rather than imported at module scope, since it's
// only ever used inside POST — matches how the rest of this file is structured
type AdminClient = ReturnType<typeof createAdminClient>

// ── ticket email sending ──────────────────────────────────────────────────────
// shared by both the new (pending-registration) and legacy fulfillment paths so a
// materialized registration and a legacy-flow registration send identical emails.
// Guard: env vars must be present, otherwise log and skip. never throws — payment is
// already recorded by the time this runs, emails can be re-sent manually if this fails.
async function sendTicketEmails(supabase: AdminClient, registrationId: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error(
      '[webhook] Skipping ticket emails — RESEND_API_KEY or RESEND_FROM_EMAIL is not set in environment variables.'
    )
    return
  }

  try {
    // Use two separate queries instead of a nested join.
    const [{ data: tickets }, { data: regRow }] = await Promise.all([
      supabase
        .from('registration_tickets')
        .select('id, qr_code, attendee_fname, attendee_lname, attendee_email')
        .eq('registration_id', registrationId),
      supabase
        .from('event_registrations')
        .select('event_id, member_id')
        .eq('id', registrationId)
        .single(),
    ])

    let eventInfo: { name: string; event_date: string | null; event_end: string | null; location: string | null } | null = null
    let memberContactEmail: string | null = null

    const [eventResult, memberResult] = await Promise.all([
      regRow?.event_id
        ? supabase.from('events').select('name, event_date, event_end, location').eq('id', regRow.event_id).single()
        : Promise.resolve({ data: null }),
      regRow?.member_id
        ? supabase.from('members').select('contact_email').eq('id', regRow.member_id).single()
        : Promise.resolve({ data: null }),
    ])

    eventInfo = eventResult.data
    memberContactEmail = memberResult.data?.contact_email ?? null

    console.log(
      `[webhook] registration ${registrationId}: tickets=${tickets?.length ?? 0}, eventInfo=${eventInfo?.name ?? 'NOT FOUND'}`
    )

    if (!tickets || tickets.length === 0) {
      console.error('[webhook] No tickets found for registration', registrationId)
      return
    }
    if (!eventInfo) {
      console.error('[webhook] Event info not found for registration', registrationId)
      return
    }

    await Promise.all(
      tickets
        .filter(t => t.attendee_email)
        .map(async (ticket) => {
          // PNG buffer — embedded as a CID inline attachment so Gmail/Apple Mail/Outlook render it.
          // data: URLs are blocked by most email clients.
          const qrBuffer = await QRCode.toBuffer(ticket.qr_code, {
            width: 256,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          })

          const attendeeName =
            [ticket.attendee_fname, ticket.attendee_lname].filter(Boolean).join(' ') ||
            'Attendee'

          // for members, prefer their stored contact_email over the attendee email on the ticket
          const recipientEmail = memberContactEmail ?? ticket.attendee_email!

          const { error: sendError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: recipientEmail,
            subject: `Your ticket for ${eventInfo!.name}`,
            html: ticketEmailHtml({
              attendeeName,
              eventName: eventInfo!.name,
              eventDate: eventInfo!.event_date,
              eventEnd: eventInfo!.event_end,
              location: eventInfo!.location,
              qrCid: 'ticket_qr',
            }),
            attachments: [{
              filename: 'ticket-qr.png',
              content: qrBuffer,
              contentId: 'ticket_qr',
              contentType: 'image/png',
            }],
          })

          if (sendError) {
            console.error('[webhook] Resend error for ticket', ticket.id, sendError)
          } else {
            console.log('[webhook] Email sent to', recipientEmail)
          }
        })
    )
  } catch (err) {
    // Don't fail the webhook — payment is recorded, emails can be re-sent manually
    console.error('[webhook] Unexpected error sending ticket emails for registration', registrationId, err)
  }
}

// ── auto-refund helper ──────────────────────────────────────────────────────────
// a session that can never be fulfilled (stale/superseded/already-registered) gets its
// charge refunded rather than left in limbo. no_payment_required (100%-off promo codes)
// has no payment_intent and nothing to refund.
async function refundUnfulfillable(session: { payment_intent: string | null | unknown; amount_total: number | null; id: string }, cause: string, ref: string) {
  if (session.payment_intent && (session.amount_total ?? 0) > 0) {
    try {
      await stripe.refunds.create({
        payment_intent: session.payment_intent as string,
        reason: 'duplicate',
        metadata: { cause, ref },
      })
    } catch (err) {
      console.error('[webhook] auto-refund failed', session.id, cause, ref, err)
    }
  }
}

export async function POST(req: Request) {
  // ── signature verification ────────────────────────────────────────────────

  // raw text required — stripe signature is computed over the exact request body bytes
  // ============================================================
  // DATA — do not modify this section
  // all database queries and auth checks live here
  // changing these will break functionality
  // ============================================================
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return fail('No signature', 400)
  }

  let event

  try {
    // uses STRIPE_WEBHOOK_SECRET env var to verify the event came from stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return fail('Invalid signature', 400)
  }

  // bypass rls — webhook has no user session; all writes are trusted server-side
  const supabase = createAdminClient()

  // ── idempotency claim ──────────────────────────────────────────────────────
  // claim this event id before any fulfillment write. a replayed/retried delivery
  // hits the primary-key unique_violation and no-ops (never re-sends emails or
  // re-stamps membership_expires_at). rolled back before any 500 return below so a
  // genuine transient failure lets stripe's retry claim the event again.
  const { error: claimError } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })

  if (claimError) {
    if (claimError.code === '23505') {
      console.log('[webhook] duplicate event, already processed', event.id)
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('[webhook] ledger claim failed', event.id, claimError)
    return fail('Ledger write failed', 500)
  }

  // ponytail: no pg_cron on this project, so retention runs inline instead of on a
  // schedule — ~1% of webhook calls prune rows past stripe's ~30-day replay window.
  // fire-and-forget: never blocks or fails the webhook response over a cleanup query.
  if (Math.random() < 0.01) {
    void supabase
      .from('stripe_events')
      .delete()
      .lt('processed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .then(({ error }) => {
        if (error) console.error('[webhook] stripe_events prune failed', error)
      })

    // same cadence — pending_registrations whose stripe session died without ever
    // firing (or whose checkout.session.expired delivery was itself dropped) past
    // their own expires_at. real expiry is enforced by classifyFulfillment() at
    // fulfillment time regardless; this just keeps the table from growing unbounded.
    void supabase
      .from('pending_registrations')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .then(({ error }) => {
        if (error) console.error('[webhook] pending_registrations prune failed', error)
      })
  }

  // release the claim on a transient DB failure so stripe's retry of this event
  // can claim it again — only call before a 500 return, never before a permanent
  // data-problem 4xx (e.g. missing metadata), which would just loop forever.
  const releaseClaim = async () => {
    const { error } = await supabase.from('stripe_events').delete().eq('id', event.id)
    if (error) console.error('[webhook] ledger release failed', event.id, error)
  }

  // ── event dispatch ────────────────────────────────────────────────────────

  // checkout.session.completed: payment succeeded — fulfill the order
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // payment_status gate: 'paid' covers normal card payments; 'no_payment_required'
    // covers 100%-off promotion codes (giveaways, officer fee-bypass — both legitimate
    // and intentionally still supported, see allow_promotion_codes on the checkout routes).
    // anything else (e.g. an async 'unpaid' completed event) is not a finished payment —
    // do not fulfill. checkout is card-only today so this path is defensive, not live.
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      console.warn('[webhook] completed event with non-final payment_status', session.id, session.payment_status)
      return NextResponse.json({ received: true })
    }

    // type and member_id are set in stripe checkout session metadata at creation time
    const { type, member_id } = session.metadata ?? {}

    // ── membership payment ─────────────────────────────────────────────────────
    if (type === 'membership' && member_id) {
      let settings
      try {
        settings = await getSettings()
      } catch (err) {
        console.error('[webhook] getSettings failed for membership activation, member', member_id, err)
        await releaseClaim()
        return fail('Settings unavailable', 500)
      }

      // updates membership_status to active — this is what unlocks member access
      // membership_expires_at is pulled from settings so all members share the same expiry date
      // .select().single() returns the activated row so the email is gated on a confirmed DB write
      const { data: activatedMember, error: activationError } = await supabase
        .from('members')
        .update({
          membership_status: 'active',
          amt_paid: session.amount_total,
          payment_verified_at: new Date().toISOString(),
          payment_provider: 'stripe',
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: (session.payment_intent as string) ?? null,
          stripe_customer_id: (session.customer as string) ?? null,
          membership_expires_at: settings.membershipExpiry.toISOString(),
          payment_method: session.payment_method_types?.[0] ?? 'card',
          payment_metadata: {
            amount_total: session.amount_total,
            currency: session.currency,
            customer_email: session.customer_email,
          },
        })
        .eq('id', member_id)
        .select('first_name, email, contact_email')
        .single()

      if (activationError || !activatedMember) {
        console.error('[webhook] membership activation DB write failed for member', member_id, activationError)
        await releaseClaim()
        return fail('DB write failed', 500)
      }

      // ── send membership confirmation email ────────────────────────────────────
      // only reachable after a confirmed DB write — email is gated on activation success
      // wrapped in try/catch so an email failure never fails the webhook response
      if (process.env.RESEND_FROM_EMAIL) {
        try {
          // prefer contact_email (member's preferred address) over the utd sso email
          const to = activatedMember.contact_email ?? activatedMember.email
          // format expiry date for display in the email body
          const expiryDate = settings.membershipExpiry.toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric',
          })

          // send membership confirmation email via resend to the member's preferred address
          const { error: sendError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to,
            subject: 'Welcome to UTD FSA — Membership Confirmed',
            html: membershipEmailHtml({
              firstName: activatedMember.first_name,
              membershipYear: settings.membershipYear,
              expiryDate,
            }),
          })

          if (sendError) {
            console.error('[webhook] membership email send error for member', member_id, sendError)
          } else {
            console.log('[webhook] membership confirmation email sent to', to)
          }
        } catch (err) {
          console.error('[webhook] unexpected error sending membership email for member', member_id, err)
        }
      }
    }

    // ── event ticket fulfillment ──────────────────────────────────────────────
    if (type === 'event_ticket') {
      const { pending_id, registration_id } = session.metadata ?? {}

      if (pending_id) {
        // ── current path: materialize from pending_registrations ─────────────────
        const { data: pending } = await supabase
          .from('pending_registrations')
          .select('id, event_id, member_id, attendees, num_tickets, amt_expected, guest_email, stripe_checkout_session_id')
          .eq('id', pending_id)
          .maybeSingle()

        const action = classifyFulfillment({ pending, sessionId: session.id })

        if (action === 'retry') {
          // distinguishes "register/route.ts's session-id write hasn't landed yet" (a
          // legitimate in-flight payment) from a genuinely stale session — must not be
          // refunded, just retried
          console.warn('[webhook] pending registration not yet bound to a session — retrying', { pending_id, sessionId: session.id })
          await releaseClaim()
          return fail('Pending registration not ready', 500)
        }

        if (action === 'refund') {
          console.warn('[webhook] pending/session mismatch — not fulfilling, refunding', { pending_id, sessionId: session.id })
          await refundUnfulfillable(session, 'superseded_or_missing_pending_registration', pending_id)
          return NextResponse.json({ received: true })
        }

        // action === 'fulfill' — classifyFulfillment only returns this when pending is
        // non-null, but narrow explicitly rather than asserting: a future edit to the
        // classifier shouldn't be able to silently reintroduce a null-pending fulfill
        // on the money path.
        if (!pending) {
          console.error('[webhook] unreachable: fulfill action with null pending row', { pending_id, sessionId: session.id })
          await releaseClaim()
          return fail('Internal error', 500)
        }

        // upsert on the stripe_checkout_session_id unique constraint so a replayed
        // delivery converges instead of duplicating; a member-already-registered race
        // (two paid sessions for the same member+event) or a same-email free-guest
        // duplicate surfaces as 23505 here rather than a silent double-insert
        const { data: registration, error: fulfillmentError } = await supabase
          .from('event_registrations')
          .upsert({
            member_id: pending.member_id,
            event_id: pending.event_id,
            payment_status: 'paid',
            num_tickets: pending.num_tickets,
            amt_expected: pending.amt_expected,
            amt_paid: session.amount_total,
            guest_fname: pending.attendees[0]?.fname ?? null,
            guest_lname: pending.attendees[0]?.lname ?? null,
            guest_email: pending.guest_email,
            payment_verified_at: new Date().toISOString(),
            payment_provider: 'stripe',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: (session.payment_intent as string) ?? null,
            payment_method: session.payment_method_types?.[0] ?? 'card',
            payment_metadata: {
              amount_total: session.amount_total,
              currency: session.currency,
              customer_email: session.customer_email,
            },
          }, { onConflict: 'stripe_checkout_session_id' })
          .select('id')
          .single()

        if (fulfillmentError) {
          if (fulfillmentError.code === '23505') {
            console.warn('[webhook] fulfillment conflict — already registered, refunding', { pending_id, sessionId: session.id })
            await refundUnfulfillable(session, 'already_registered', pending_id)
            await supabase.from('pending_registrations').delete().eq('id', pending_id)
            return NextResponse.json({ received: true })
          }
          console.error('[webhook] event_ticket DB write failed for pending registration', pending_id, fulfillmentError)
          await releaseClaim()
          return fail('DB write failed', 500)
        }

        // mint tickets only if none exist yet. a single array insert is atomic, so "no
        // tickets exist for this registration" unambiguously means "never inserted" —
        // retry-safe without a separate per-ticket idempotency column.
        const { count: existingTicketCount } = await supabase
          .from('registration_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('registration_id', registration.id)

        if (!existingTicketCount) {
          const ticketRows = pending.attendees.map((a: { fname: string; lname: string; email: string }) => ({
            registration_id: registration.id,
            qr_code: crypto.randomUUID(),
            attendee_fname: a.fname,
            attendee_lname: a.lname,
            attendee_email: a.email,
            checked_in: false,
          }))
          const { error: ticketInsertError } = await supabase.from('registration_tickets').insert(ticketRows)
          if (ticketInsertError) {
            console.error('[webhook] ticket insert failed for registration', registration.id, ticketInsertError)
            await releaseClaim()
            return fail('Ticket insert failed', 500)
          }
        }

        await supabase.from('pending_registrations').delete().eq('id', pending_id)

        await sendTicketEmails(supabase, registration.id)
      } else if (registration_id) {
        // ── TRANSITION (legacy path): pre-deploy session, old metadata shape ─────────
        // remove this branch + purge leftover non-paid event_registrations rows no
        // sooner than 48h after deploy (session default lifetime), once no old-format
        // session can still be in flight. see file header.
        //
        // mark registration as paid — fill all payment tracking fields
        // security: bound to stripe_checkout_session_id = session.id — a registration row
        // can be reused across multiple checkout attempts (see register/route.ts), so without
        // this the *first* session paid for a row could fulfill however many tickets a *later*
        // update raised num_tickets to. matching 0 rows means this session is stale/superseded
        // by a newer attempt on the same row — do not fulfill, do not email.
        const { data: fulfilledRows, error: fulfillmentError } = await supabase
          .from('event_registrations')
          .update({
            payment_status: 'paid',
            amt_paid: session.amount_total,
            payment_verified_at: new Date().toISOString(),
            payment_provider: 'stripe',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: (session.payment_intent as string) ?? null,
            payment_method: session.payment_method_types?.[0] ?? 'card',
            payment_metadata: {
              amount_total: session.amount_total,
              currency: session.currency,
              customer_email: session.customer_email,
            },
          })
          .eq('id', registration_id)
          .eq('stripe_checkout_session_id', session.id)
          .select('id')

        if (fulfillmentError) {
          console.error('[webhook] event_ticket DB write failed for registration', registration_id, fulfillmentError)
          await releaseClaim()
          return fail('DB write failed', 500)
        }

        if (!fulfilledRows || fulfilledRows.length === 0) {
          // distinguish "superseded by a later registration attempt" from "our own
          // stripe_checkout_session_id write in register/route.ts hasn't landed yet" — the
          // latter is a legitimate in-flight payment, not a stale session, and must not be refunded.
          const { data: row } = await supabase
            .from('event_registrations')
            .select('stripe_checkout_session_id')
            .eq('id', registration_id)
            .maybeSingle()

          if (row && row.stripe_checkout_session_id === null) {
            console.warn('[webhook] registration not yet bound to a session — retrying', { registration_id, sessionId: session.id })
            await releaseClaim()
            return fail('Registration not ready', 500)
          }

          console.warn('[webhook] session/registration mismatch — not fulfilling, refunding', { registration_id, sessionId: session.id })
          await refundUnfulfillable(session, 'superseded_checkout_session', registration_id)
          return NextResponse.json({ received: true })
        }

        await sendTicketEmails(supabase, registration_id)
      } else {
        console.error('[webhook] event_ticket missing pending_id/registration_id in session metadata', session.id)
        return fail('Missing registration reference', 400)
      }
    }
  }

  // checkout.session.expired: user abandoned checkout
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object
    const { type, pending_id, registration_id } = session.metadata ?? {}

    if (type === 'event_ticket') {
      if (pending_id) {
        // drop the cart — nothing was ever fulfilled from it. bound to session.id so a
        // delayed/duplicate expired event can't delete a pending row a later session is
        // still using (pending rows only ever bind to one session, but guard anyway)
        const { error: deleteError } = await supabase
          .from('pending_registrations')
          .delete()
          .eq('id', pending_id)
          .eq('stripe_checkout_session_id', session.id)

        if (deleteError) {
          console.error('[webhook] pending registration delete failed', pending_id, deleteError)
          await releaseClaim()
          return fail('DB write failed', 500)
        }
      } else if (registration_id) {
        // TRANSITION (legacy path) — see the completed-event branch above for removal timing.
        // security: bound to stripe_checkout_session_id = session.id + neq('payment_status','paid')
        // — a registration row is reused across attempts, so a stale expired-session event for an
        // earlier abandoned attempt must never be able to fail a row a *later* session already paid.
        const { error: expireError } = await supabase
          .from('event_registrations')
          .update({ payment_status: 'failed' })
          .eq('id', registration_id)
          .eq('stripe_checkout_session_id', session.id)
          .neq('payment_status', 'paid')

        if (expireError) {
          console.error('[webhook] checkout expiry DB write failed for registration', registration_id, expireError)
          await releaseClaim()
          return fail('DB write failed', 500)
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
