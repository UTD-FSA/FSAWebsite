#!/usr/bin/env node
// ── scripts/reconcile-stripe.mjs ───────────────────────────
// finds payments stripe took that this app never fulfilled, and (with --fix) applies the
// write the webhook would have made.
//
// why this exists: on 2026-09-14 a $30 membership was paid, the webhook's fulfillment write
// 504'd, and stripe's retry collided with a claim row that hadn't been released yet. stripe
// recorded a 200 and never retried. the member sat at membership_status 'pending' with no
// signal anywhere in the app. the fulfillment lease
// (supabase/migrations/20260914180000_stripe_events_fulfillment_lease.sql) stops that
// happening again, but it can't see payments that predate it, and it can't recover an event
// stripe has already given up redelivering. this can.
//
// three sources are swept:
//   1. stripe_events rows with fulfilled_at IS NULL — a delivery that claimed the event and
//      never finished. strongest signal, but only exists for events after the lease migration.
//   2. members with a stripe_checkout_session_id and no active membership. mostly ordinary
//      abandoned checkouts (membership/checkout writes that column eagerly at session
//      creation, not at payment), so stripe has to be asked which ones were actually paid.
//   3. pending_registrations still sitting there with a bound session id — a paid event
//      ticket whose registration + QR codes were never materialized.
//
// a fully refunded order is skipped: the checkout session reports payment_status 'paid'
// forever, so refund state has to be read off the charge or every past refund keeps
// resurfacing as stranded. a DISPUTED charge is still reported, labelled — the money is
// being clawed back but the order may still need a human decision.
//
// usage:
//   node scripts/reconcile-stripe.mjs           # report only, writes nothing
//   node scripts/reconcile-stripe.mjs --fix     # apply the missing membership fulfillment
//
// needs STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. note that
// .env.local may hold a TEST-mode stripe key — live sessions 404 under it, which this script
// reports rather than silently treating as unpaid.
//
// ponytail: memberships only for --fix. a stranded event ticket needs registration rows,
// per-attendee QR tokens and emails — that logic lives in the webhook and is not worth
// duplicating here until a real one shows up; the report names the order to fix by hand (or
// by resending the stripe event, which the lease now lets through).

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const APPLY = process.argv.includes('--fix')

// ── env ───────────────────────────────────────────────────
// read .env.local directly; this is a one-off operator script, not part of the next runtime
function loadEnv() {
  const env = { ...process.env }
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      if (!line.includes('=') || line.trim().startsWith('#')) continue
      const i = line.indexOf('=')
      const key = line.slice(0, i).trim()
      if (env[key]) continue
      env[key] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    // no .env.local — rely on the real environment
  }
  return env
}

const env = loadEnv()
for (const key of ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!env[key]) {
    console.error(`missing ${key} — set it in .env.local or the environment`)
    process.exit(1)
  }
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const liveMode = env.STRIPE_SECRET_KEY.startsWith('sk_live')

// ── helpers ───────────────────────────────────────────────

// mirrors lib/membership.ts — status alone is not authoritative, expiry counts too
function isMembershipActive(m) {
  if (!m || m.membership_status !== 'active') return false
  if (!m.membership_expires_at) return true
  return new Date(m.membership_expires_at) > new Date()
}

// mirrors lib/membership-expiry.ts + lib/settings.ts so a repaired row lands on exactly the
// same expiry instant as every member the webhook activated this cycle
function chicagoEndOfDay(year, month, day) {
  const guess = Date.UTC(year, month, day, 23, 59, 59)
  const asUtc = new Date(new Date(guess).toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
  const asChicago = new Date(new Date(guess).toLocaleString('en-US', { timeZone: 'America/Chicago' })).getTime()
  return new Date(guess - (asChicago - asUtc))
}

async function membershipExpiry() {
  const { data } = await db.from('settings').select('key, value')
  const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value]))
  const expiryMonth = parseInt(map.membership_expiry_month ?? '6') - 1
  const expiryDay = parseInt(map.membership_expiry_day ?? '30')
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', year: 'numeric', month: 'numeric',
  }).formatToParts(new Date())
  const year = parseInt(parts.find(p => p.type === 'year').value)
  const month = parseInt(parts.find(p => p.type === 'month').value) - 1
  return chicagoEndOfDay(month > expiryMonth ? year + 1 : year, expiryMonth, expiryDay)
}

function paymentIntentId(session) {
  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null
}

function customerId(session) {
  return typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
}

// returns { __error } rather than throwing — a session we cannot read is reported, never
// silently assumed unpaid
async function retrieveSession(id) {
  try {
    return await stripe.checkout.sessions.retrieve(id)
  } catch (err) {
    return { __error: err.raw?.message ?? err.message }
  }
}

function isPaid(session) {
  return session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
}

// a refunded order is settled, not stranded — but the checkout session still reports
// payment_status 'paid' forever, so isPaid() alone can't tell them apart. refund state lives
// on the charge, one level down. costs an extra api call, but only for the handful of
// candidates that already looked paid-and-unfulfilled.
// a DISPUTED charge is deliberately not treated as settled: the money is being clawed back
// but the order may still need a decision, so it stays in the report, labelled.
async function settlement(session) {
  const intentId = paymentIntentId(session)
  if (!intentId) return { settled: false }

  try {
    const pi = await stripe.paymentIntents.retrieve(intentId, { expand: ['latest_charge'] })
    const charge = pi.latest_charge
    if (charge?.disputed) return { settled: false, note: 'DISPUTED' }
    if (charge?.refunded) return { settled: true }
    // a partial refund still leaves something owed — report it with the shortfall visible
    if (charge?.amount_refunded > 0) {
      return { settled: false, note: `partially refunded $${(charge.amount_refunded / 100).toFixed(2)}` }
    }
    return { settled: false }
  } catch {
    // can't read the intent — report it rather than assume either way
    return { settled: false, note: 'refund status unknown' }
  }
}

// ── sweep ─────────────────────────────────────────────────

const stranded = []
const unreadable = []

// 1. unfulfilled leases
const { data: openLeases } = await db
  .from('stripe_events')
  .select('id, type, session_id, metadata, processed_at')
  .is('fulfilled_at', null)
  .order('processed_at')

for (const row of openLeases ?? []) {
  if (!row.session_id) {
    unreadable.push({ source: 'lease', ref: row.id, why: 'no session_id recorded' })
    continue
  }
  const session = await retrieveSession(row.session_id)
  if (session.__error) {
    unreadable.push({ source: 'lease', ref: row.id, why: session.__error })
    continue
  }
  if (!isPaid(session)) continue
  const { settled, note } = await settlement(session)
  if (settled) continue
  stranded.push({
    source: 'unfulfilled lease',
    kind: row.metadata?.type ?? row.type,
    memberId: row.metadata?.member_id || null,
    note,
    session,
  })
}

// 2. members carrying a session id with no effective membership
const { data: candidates } = await db
  .from('members')
  .select('id, email, membership_status, membership_expires_at, stripe_checkout_session_id, stripe_payment_intent_id')
  .not('stripe_checkout_session_id', 'is', null)

for (const member of candidates ?? []) {
  if (isMembershipActive(member)) continue
  const session = await retrieveSession(member.stripe_checkout_session_id)
  if (session.__error) {
    unreadable.push({ source: 'member', ref: member.email, why: session.__error })
    continue
  }
  if (!isPaid(session)) continue
  // already fulfilled under this exact payment — reconciled by hand, or expired since
  if (paymentIntentId(session) && paymentIntentId(session) === member.stripe_payment_intent_id) continue
  const { settled, note } = await settlement(session)
  if (settled) continue
  stranded.push({ source: 'member row', kind: 'membership', memberId: member.id, email: member.email, note, session })
}

// 3. pending carts bound to a session
const { data: carts } = await db
  .from('pending_registrations')
  .select('id, event_id, guest_email, num_tickets, stripe_checkout_session_id, created_at')
  .not('stripe_checkout_session_id', 'is', null)

for (const cart of carts ?? []) {
  const session = await retrieveSession(cart.stripe_checkout_session_id)
  if (session.__error) {
    unreadable.push({ source: 'cart', ref: cart.id, why: session.__error })
    continue
  }
  if (!isPaid(session)) continue
  const { settled, note } = await settlement(session)
  if (settled) continue
  stranded.push({ source: 'pending cart', kind: 'event_ticket', cartId: cart.id, email: cart.guest_email, note, session })
}

// ── report ────────────────────────────────────────────────

console.log(`\nstripe mode: ${liveMode ? 'LIVE' : 'TEST'}`)
console.log(
  `swept ${openLeases?.length ?? 0} open lease(s), ` +
  `${candidates?.length ?? 0} member candidate(s), ${carts?.length ?? 0} bound cart(s)`
)

if (unreadable.length) {
  console.log(`\n${unreadable.length} session(s) could not be read from stripe:`)
  for (const u of unreadable) console.log(`  [${u.source}] ${u.ref} — ${u.why}`)
  if (!liveMode) console.log('  (a TEST-mode key cannot read live sessions — rerun with the live key)')
}

if (!stranded.length) {
  console.log('\nno stranded payments found.\n')
  process.exit(0)
}

console.log(`\n${stranded.length} PAID but unfulfilled:`)
for (const s of stranded) {
  const who = s.email ?? s.memberId ?? s.cartId
  const amount = ((s.session.amount_total ?? 0) / 100).toFixed(2)
  console.log(`  [${s.source}] ${s.kind} — ${who}${s.note ? `   (${s.note})` : ''}`)
  console.log(`      session ${s.session.id}`)
  console.log(`      intent  ${paymentIntentId(s.session) ?? '(none)'}   $${amount}`)
}

if (!APPLY) {
  console.log('\nreport only. rerun with --fix to apply membership repairs.\n')
  process.exit(0)
}

// ── fix ───────────────────────────────────────────────────

const expiry = await membershipExpiry()
let fixed = 0

for (const s of stranded) {
  if (s.kind !== 'membership' || !s.memberId) {
    console.log(`  skipped ${s.session.id} — ${s.kind} must be fulfilled by the webhook (resend the stripe event)`)
    continue
  }

  const { error } = await db
    .from('members')
    .update({
      membership_status: 'active',
      membership_expires_at: expiry.toISOString(),
      amt_paid: s.session.amount_total,
      // the real payment instant, not the repair time — keeps reporting honest
      payment_verified_at: new Date(s.session.created * 1000).toISOString(),
      payment_provider: 'stripe',
      payment_method: s.session.payment_method_types?.[0] ?? 'card',
      stripe_checkout_session_id: s.session.id,
      stripe_payment_intent_id: paymentIntentId(s.session),
      stripe_customer_id: customerId(s.session),
      payment_metadata: {
        amount_total: s.session.amount_total,
        currency: s.session.currency,
        customer_email: s.session.customer_email,
        reconciled_manually: true,
        reconciled_by: 'scripts/reconcile-stripe.mjs',
        reconciled_on: new Date().toISOString().slice(0, 10),
      },
    })
    .eq('id', s.memberId)

  if (error) {
    console.error(`  FAILED ${s.email ?? s.memberId}: ${error.message}`)
  } else {
    console.log(`  fixed ${s.email ?? s.memberId}`)
    fixed++
  }
}

console.log(`\n${fixed} membership(s) repaired. no confirmation emails were sent — notify them directly.\n`)
