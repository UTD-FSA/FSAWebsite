// ── route.ts ─────────────────────────────────────────────
// POST /api/events/register — for free events, creates a paid registration + tickets
// directly. for paid events, creates a pending_registrations row and redirects to
// Stripe checkout; the stripe-webhook route materializes the real registration + tickets
// once checkout.session.completed fires (see lib/events/fulfillment.ts).
//
// data:  events, event_registrations, registration_tickets (free path only),
//        pending_registrations (paid path only), members (identity lookup)
// deps:  stripe (checkout session)
// notes: caller may be anonymous; member detection is best-effort via auth cookie.
//        pending state is keyed by stripe_checkout_session_id, not by identity — a
//        person can have any number of concurrent checkouts in flight, so closing the
//        tab and registering again never blocks on a stale row. only a *paid* row is
//        ever checked for collisions: members are capped at one paid registration per
//        event by unique_member_event_registration + check_member_single_ticket (the
//        discount is per-person, enforced by the db); guests may place multiple paid
//        orders (normal ecommerce behavior — no refund case results from it). free
//        events skip Stripe and pending state entirely — a free row is written 'paid'
//        immediately, so unique_free_guest_event_registration still guards against one
//        guest resubmitting the free form to mint unlimited tickets.
import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe'
import { isMembershipActive } from '@/lib/membership'
import { eventRegisterSchema } from '@/lib/schemas'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { fail, failValidation } from '@/lib/api-response'
import { isRateLimited } from '@/lib/rate-limit'
import { resolveEventPricing } from '@/lib/events/pricing'
import { resolveSessionExpiry } from '@/lib/events/session-expiry'
import { shouldUseMemberPath } from '@/lib/events/registration-ownership'

// ponytail: in-memory rate limit — per-instance backstop only. the real gate is the
// Vercel Firewall rate-limit rule on this path (global, runs at the edge). kept generous
// so shared campus-NAT bursts (many attendees, one egress IP) aren't throttled.
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

export async function POST(req: Request) {
  // ── rate limiting ─────────────────────────────────────────
  const headerStore = await headers()
  const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(`register:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    console.warn('[security] rate-limit hit', { route: '/api/events/register', ip, ts: new Date().toISOString() })
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': '60' },
    })
  }

  // ============================================================
  // DATA — do not modify this section
  // all database queries and auth checks live here
  // changing these will break functionality
  // ============================================================

  // ── request validation ────────────────────────────────────
  const body = await req.json().catch(() => null)
  const parsed = eventRegisterSchema.safeParse(body)

  if (!parsed.success) {
    return failValidation(parsed.error)
  }

  const { event_id, tickets } = parsed.data
  const admin = createAdminClient()

  // ── resolve caller identity (optional — non-members don't need to be logged in) ──
  // respects rls — only returns session for the authenticated caller
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  let member: { id: string; membership_status: string; membership_expires_at: string | null; first_name: string; last_name: string; contact_email: string | null } | null = null

  if (user?.email) {
    // bypass rls — needed to look up the member row regardless of their auth state
    const { data } = await admin
      .from('members')
      .select('id, membership_status, membership_expires_at, first_name, last_name, contact_email')
      .eq('email', user.email)
      .maybeSingle()
    member = data
  }

  // effective active membership (status + expiry) gates member pricing and restrictions
  const isMember = isMembershipActive(member)

  // active members are capped at one ticket per event; an expired/inactive member buying
  // 2+ tickets falls through to the guest path below instead of violating
  // check_member_single_ticket (see shouldUseMemberPath)
  if (isMember && tickets.length > 1) {
    return fail('Members may only purchase one ticket per event.', 400)
  }

  // ── fetch event ─────────────────────────────────────────────────────────────
  // bypass rls — admin client; only returns the event if is_active is true
  const { data: event } = await admin
    .from('events')
    .select('id, name, price_cents_members, price_cents_nonmembers, eb_price_members, eb_price_nonmembers, eb_deadline, is_active, registration_closes_at')
    .eq('id', event_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!event) {
    return fail('Event not found or not available.', 404)
  }

  if (event.registration_closes_at && new Date() > new Date(event.registration_closes_at)) {
    return fail('Registration has closed for this event.', 400)
  }

  // ── pricing ─────────────────────────────────────────────────────────────────
  // see lib/events/pricing.ts (resolveEventPricing) for the early-bird / member-tier
  // logic and its unit tests
  const { isEarlyBird, pricePerTicket, totalAmount } = resolveEventPricing({
    priceCentsMembers: event.price_cents_members,
    priceCentsNonmembers: event.price_cents_nonmembers,
    ebPriceMembers: event.eb_price_members,
    ebPriceNonmembers: event.eb_price_nonmembers,
    ebDeadline: event.eb_deadline,
    isMember,
    ticketCount: tickets.length,
  })

  // see lib/events/session-expiry.ts (resolveSessionExpiry) for the min/max clamp
  const ebExpiresAt = resolveSessionExpiry({ isEarlyBird, ebDeadline: event.eb_deadline })

  const isMemberPath = shouldUseMemberPath(member, tickets.length)

  // ── block a second paid registration ────────────────────────────────────────
  // members: any existing PAID row for this (member, event) blocks a retry — this is
  // the per-person discount cap, enforced here for a friendly error and by
  // unique_member_event_registration in the db as the real backstop. applies
  // regardless of current membership status (a lapsed member's past paid ticket still
  // counts) — deliberately broader than the old isMember-only check, which let an
  // expired member with an existing paid row slip past to an insert that would 500 on
  // the unique constraint instead of a clean 409.
  // guests: no check — multiple paid orders per email are allowed (see file header).
  if (isMemberPath) {
    const { data: existingPaid } = await admin
      .from('event_registrations')
      .select('id')
      .eq('member_id', member!.id)
      .eq('event_id', event_id)
      .eq('payment_status', 'paid')
      .maybeSingle()

    if (existingPaid) {
      return fail('You are already registered for this event.', 409)
    }
  }

  const guestEmail = tickets[0].email

  // ── free events skip Stripe and pending state entirely ──────────────────────
  if (totalAmount === 0) {
    if (!isMemberPath) {
      // exact-match lookup first (cheap, handles the common case); the partial unique
      // index (unique_free_guest_event_registration) is the authoritative backstop for
      // case-variant emails or races, caught via 23505 below
      const { data: existingFreeRow } = await admin
        .from('event_registrations')
        .select('id')
        .eq('event_id', event_id)
        .is('member_id', null)
        .eq('guest_email', guestEmail)
        .maybeSingle()

      if (existingFreeRow) {
        return fail('This email already has a registration for this event.', 409)
      }
    }

    const { data: registration, error: insertError } = await admin
      .from('event_registrations')
      .insert({
        member_id: isMemberPath ? member!.id : null,
        event_id,
        payment_status: 'paid',
        num_tickets: tickets.length,
        amt_expected: totalAmount,
        guest_fname: tickets[0].fname,
        guest_lname: tickets[0].lname,
        guest_email: guestEmail,
      })
      .select('id')
      .single()

    if (insertError || !registration) {
      // 23505 = unique_violation — a case-variant email or a race slipped past the
      // exact-match lookup above and hit unique_free_guest_event_registration (or, for
      // a member, unique_member_event_registration)
      if (insertError?.code === '23505') {
        return fail('This email already has a registration for this event.', 409)
      }
      console.error('Registration insert error:', insertError)
      return fail('Failed to create registration.', 500)
    }

    const ticketRows = tickets.map(t => ({
      registration_id: registration.id,
      qr_code: crypto.randomUUID(),
      attendee_fname: t.fname,
      attendee_lname: t.lname,
      attendee_email: t.email,
      checked_in: false,
    }))

    const { error: ticketError } = await admin.from('registration_tickets').insert(ticketRows)

    if (ticketError) {
      // fresh insert — safe to roll back rather than leave an orphaned ticketless row
      await admin.from('event_registrations').delete().eq('id', registration.id)
      console.error('Ticket insert error:', ticketError)
      return fail('Failed to create tickets.', 500)
    }

    // members land on /member/orders after payment; guests land on /events
    const freeSuccessUrl = isMember
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/member/orders?success=true`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/events?success=true`
    return NextResponse.json({ url: freeSuccessUrl })
  }

  // ── paid events: stash the cart, then create Stripe checkout ────────────────
  // bypass rls — admin client; pending_registrations has no RLS grants for
  // anon/authenticated, only service-role reads/writes it
  const { data: pending, error: pendingInsertError } = await admin
    .from('pending_registrations')
    .insert({
      event_id,
      member_id: isMemberPath ? member!.id : null,
      attendees: tickets,
      num_tickets: tickets.length,
      amt_expected: totalAmount,
      guest_email: guestEmail,
      // stripe's own session lifetime is the source of truth for when this checkout
      // dies; mirrored here (same clamp as ebExpiresAt, or stripe's 24h default) so the
      // webhook's expiry prune doesn't need to ask stripe
      expires_at: new Date((ebExpiresAt ?? Math.floor(Date.now() / 1000) + 86400) * 1000).toISOString(),
    })
    .select('id')
    .single()

  if (pendingInsertError || !pending) {
    console.error('Pending registration insert error:', pendingInsertError)
    return fail('Failed to start checkout.', 500)
  }

  // ── create Stripe checkout ─────────────────────────────────────────────────
  // prefer stored contact_email over login email so members use their preferred address
  const customerEmail = member?.contact_email ?? user?.email ?? guestEmail
  // members land on /member/orders after payment; guests land on /events
  // {CHECKOUT_SESSION_ID} is a stripe template literal — stripe substitutes the real session id at redirect
  // time; do not replace this string manually. the events page resolves tickets from it after payment.
  const successUrl = isMember
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/member/orders?success=true`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/events?success=true&sid={CHECKOUT_SESSION_ID}`

  // creates a hosted checkout session; returns a url to redirect the browser to
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: customerEmail,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: isEarlyBird ? `${event.name} — Early Bird` : event.name,
          description: isMember ? 'Member rate' : 'General admission',
        },
        unit_amount: pricePerTicket,
      },
      quantity: tickets.length,
    }],
    mode: 'payment',
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/events`,
    // early-bird sessions die at the deadline so a stale open tab can't pay the old price
    // once it stops being offered; omitted entirely outside early-bird (defaults to 24h)
    ...(ebExpiresAt ? { expires_at: ebExpiresAt } : {}),
    metadata: {
      // stripe-webhook dispatches on pending_id — see lib/events/fulfillment.ts
      type: 'event_ticket',
      member_id: isMemberPath ? member!.id : '',
      pending_id: pending.id,
    },
  })

  // bind the pending row to this session so the webhook can tell "fulfill" from "stale"
  // (see lib/events/fulfillment.ts). must succeed and block the redirect — an unbound
  // pending row can never be fulfilled.
  const { error: sessionIdError } = await admin
    .from('pending_registrations')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', pending.id)

  if (sessionIdError) {
    console.error('[register] stripe_checkout_session_id write failed for pending registration', pending.id, sessionIdError)
    // cancel the now-orphaned stripe session and drop the pending row so neither can
    // later be paid/fulfilled in an inconsistent state
    await admin.from('pending_registrations').delete().eq('id', pending.id)
    await stripe.checkout.sessions.expire(session.id).catch(err =>
      console.error('[register] failed to expire orphaned session', session.id, err)
    )
    return fail('Failed to prepare checkout. Please try again.', 500)
  }

  return NextResponse.json({ url: session.url })
}
