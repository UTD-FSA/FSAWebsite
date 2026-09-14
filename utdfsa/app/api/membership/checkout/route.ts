// ── route.ts ─────────────────────────────────────────────
// POST /api/membership/checkout — create a Stripe checkout session for membership purchase
//
// data:  members, settings (earlyBirdDeadline, membershipPriceCents, membershipYear)
// deps:  stripe (checkout session)
// notes: early-bird pricing is applied when current time is before settings.earlyBirdDeadline;
//        price and expiry are read from the db at request time — never hardcoded.
//        stripe_checkout_session_id is written eagerly at session creation (not at
//        fulfillment), so nothing may treat that column as proof of payment — see
//        lib/membership-activation.ts.
//        expiring the prior session logs CRITICAL when that session was paid but never
//        fulfilled: a member back here after paying means a dropped webhook.
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe'
import { getSettings } from '@/lib/settings'
import { isMembershipActive } from '@/lib/membership'
import { NextResponse, after } from 'next/server'
import { fail } from '@/lib/api-response'
import { isRateLimited } from '@/lib/rate-limit'

// ponytail: in-memory rate limit — per-instance backstop only, same pattern as
// events/register. real gate should be a matching Vercel Firewall rule on this path.
// keyed by user email (authenticated route) rather than IP.
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

export async function POST() {
  // ============================================================
  // DATA — do not modify this section
  // all database queries and auth checks live here
  // changing these will break functionality
  // ============================================================

  // ── auth check ───────────────────────────────────────────
  // returns 401 if no valid session — must be logged in to purchase
  const ctx = await requireUser()
  if (!ctx) return fail('Unauthorized', 401)
  const { supabase, user } = ctx

  // ── rate limiting ─────────────────────────────────────────
  // authenticated but otherwise unthrottled — loopable to create unbounded stripe
  // checkout sessions without this
  if (isRateLimited(`membership-checkout:${user.email}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    console.warn('[security] rate-limit hit', { route: '/api/membership/checkout', email: user.email, ts: new Date().toISOString() })
    return fail('Too many requests', 429)
  }

  // ── member lookup ─────────────────────────────────────────
  // respects rls — user client; verifies effective membership (status + expiry) before proceeding.
  // stripe_checkout_session_id is a payment-internal column excluded from the authenticated
  // grant (see migration: restrict_members_column_grant) — fetched separately via the
  // admin client below, once we know we're actually about to create a session
  const { data: member } = await supabase
    .from('members')
    .select('id, membership_status, membership_expires_at, email, first_name, last_name')
    .eq('email', user.email!)
    .maybeSingle()

  if (!member) {
    return fail('Member not found', 404)
  }

  // block duplicate purchases — but only while the membership is effectively active;
  // an expired-by-date member must be able to re-purchase (the webhook re-stamps
  // status and a fresh expiry, which is what makes expiry self-healing)
  if (isMembershipActive(member)) {
    return fail('Already a member', 400)
  }

  // bypass rls — needed for stripe_checkout_session_id (see note above) and to write
  // the new session id below; the member's own user client can't touch that column
  const admin = createAdminClient()
  const { data: sessionRow } = await admin
    .from('members')
    .select('stripe_checkout_session_id, stripe_payment_intent_id')
    .eq('id', member.id)
    .maybeSingle()
  const priorSessionId = sessionRow?.stripe_checkout_session_id ?? null
  const priorPaymentIntentId = sessionRow?.stripe_payment_intent_id ?? null

  // ── pricing ─────────────────────────────────────────────
  // fetch prices dynamically from the database
  let settings
  try {
    settings = await getSettings()
  } catch (err) {
    console.error('[membership/checkout] getSettings failed:', err)
    return fail('Unable to load pricing. Please try again later.', 500)
  }
  // compare current server time against the early-bird deadline stored in settings
  const now = new Date()
  const isEarlyBird = now < settings.earlyBirdDeadline

  // select the correct price in cents based on early-bird eligibility
  const price = isEarlyBird
    ? settings.earlyBirdPriceCents
    : settings.membershipPriceCents

  const label = isEarlyBird
    ? `UTD FSA Membership ${settings.membershipYear} — Early Bird`
    : `UTD FSA Membership ${settings.membershipYear}`

  // early-bird sessions die at the deadline so a stale open tab can't pay the old price
  // after it stops being offered. stripe clamps expires_at to 30min-24h from creation, so
  // this is a min/max clamp, not an exact deadline match. same fix as events/register/route.ts.
  const nowSec = Math.floor(now.getTime() / 1000)
  const ebExpiresAt = isEarlyBird
    ? Math.min(
        Math.max(Math.floor(settings.earlyBirdDeadline.getTime() / 1000), nowSec + 1800),
        nowSec + 86400
      )
    : undefined

  // ── stripe checkout ───────────────────────────────────────
  // creates a hosted checkout session; returns url to redirect the browser to
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: user.email!,
    customer_creation: 'always',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: label,
          description: isEarlyBird
            ? 'UTD FSA Membership: Early Bird Rate — Thank you for signing up early!'
            : 'UTD FSA Membership for the current academic year',
        },
        unit_amount: price,
      },
      quantity: 1,
    }],
    mode: 'payment',
    allow_promotion_codes: true,
    // NEXT_PUBLIC_SITE_URL is the canonical origin (e.g. https://utdfsa.com)
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/membership`,
    // early-bird sessions die at the deadline so a stale open tab can't pay the old price
    // once it stops being offered; omitted entirely outside early-bird (defaults to 24h)
    ...(ebExpiresAt ? { expires_at: ebExpiresAt } : {}),
    metadata: {
      // stripe-webhook uses type + member_id to route the completed payment and update membership_status
      member_id: member.id,
      type: 'membership',
      is_early_bird: isEarlyBird.toString(),
    },
  })

  // save the new session id immediately, and expire whatever session it replaces —
  // membership fulfillment in stripe-webhook is keyed on member_id (not session id), so a
  // stale open session left alive could still be paid and fulfilled later, at whatever
  // price/terms it was created under (e.g. a pre-deadline early-bird rate). eagerly
  // recording the id here (rather than only on the webhook's post-payment write) is what
  // lets the *next* checkout attempt find and expire *this* one if it's abandoned too.
  const { error: sessionIdError } = await admin
    .from('members')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', member.id)

  if (sessionIdError) {
    // best-effort — doesn't block checkout (fulfillment doesn't depend on this column),
    // it only means the *next* abandoned-session cleanup below has stale info to work with
    console.warn('[membership/checkout] session id write failed', member.id, sessionIdError)
  }

  // best-effort: stripe throws if the prior session is already paid/expired/completed,
  // which is the common case and fine to ignore — same pattern as events/register/route.ts.
  //
  // deferred with after() so none of it blocks the member's redirect. the expire call throws
  // on every terminal prior session (the usual outcome for anyone who abandoned a checkout
  // once), and the diagnosis below then costs a second stripe round-trip — together ~0.2-1s
  // of latency on the response that hands them their payment link. nothing here affects the
  // session that was just created.
  if (priorSessionId && priorSessionId !== session.id) {
    after(async () => {
      try {
        await stripe.checkout.sessions.expire(priorSessionId)
      } catch (err) {
        // stripe rejects expiring any non-open session, and the two terminal reasons mean
        // very different things. 'expired' is the ordinary abandoned-checkout case. 'complete'
        // means the prior session was PAID and this member is nonetheless back here buying
        // again — which for anyone but a renewing member is the fingerprint of a fulfillment
        // that never landed. a renewal is excluded by matching the prior session's payment
        // intent against the one already recorded on their row (written only at fulfillment).
        const prior = await stripe.checkout.sessions.retrieve(priorSessionId).catch(() => null)
        const priorWasPaid = prior?.payment_status === 'paid' || prior?.payment_status === 'no_payment_required'
        const priorPaidIntentId =
          typeof prior?.payment_intent === 'string'
            ? prior.payment_intent
            : prior?.payment_intent?.id ?? null
        const priorWasFulfilled = priorPaidIntentId
          ? priorPaidIntentId === priorPaymentIntentId
          : priorPaymentIntentId !== null

        if (priorWasPaid && !priorWasFulfilled) {
          console.error(
            '[membership/checkout] CRITICAL member re-entering checkout after an unfulfilled paid session — reconcile manually',
            member.id, priorSessionId
          )
        } else {
          console.warn('[membership/checkout] prior session expire failed (likely already terminal)', priorSessionId, err)
        }
      }
    })
  }

  return NextResponse.json({ url: session.url })
}