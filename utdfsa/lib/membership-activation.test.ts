// ── lib/membership-activation.test.ts ─────────────────────
// shouldActivateFromSession() — the onboarding race-condition fallback's gate for a
// stripe-webhook delivery that never landed. extracted from
// app/(pages)/onboarding/page.tsx. run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldActivateFromSession } from './membership-activation.ts'

const MEMBER_ID = 'member-1'

// a member who paid but whose webhook never fulfilled: nothing stamped yet
const UNFULFILLED = { id: MEMBER_ID, stripe_payment_intent_id: null, payment_verified_at: null }

// the same member after fulfillment
const FULFILLED = {
  id: MEMBER_ID,
  stripe_payment_intent_id: 'pi_1',
  payment_verified_at: '2026-09-14T01:00:58.000Z',
}

function session(overrides: Partial<Parameters<typeof shouldActivateFromSession>[0]> = {}) {
  return {
    payment_status: 'paid',
    metadata: { type: 'membership', member_id: MEMBER_ID },
    payment_intent: 'pi_1',
    ...overrides,
  }
}

test('paid session activates a member the webhook never fulfilled', () => {
  assert.equal(shouldActivateFromSession(session(), UNFULFILLED), true)
})

test('replay of the same payment is blocked once it has been fulfilled', () => {
  assert.equal(shouldActivateFromSession(session(), FULFILLED), false)
})

// the regression this function exists for: membership/checkout writes
// stripe_checkout_session_id at session creation, so a session-id comparison always
// matched and the fallback never fired. the payment intent is written only at fulfillment.
test('eagerly-recorded session id does not block activation (the dead-guard regression)', () => {
  const memberWithEagerSessionId = { ...UNFULFILLED, stripe_payment_intent_id: null }
  assert.equal(shouldActivateFromSession(session(), memberWithEagerSessionId), true)
})

test('a later unpaid retry does not block the earlier paid payment', () => {
  const afterRetry = { ...UNFULFILLED, stripe_payment_intent_id: null }
  assert.equal(shouldActivateFromSession(session({ payment_intent: 'pi_paid' }), afterRetry), true)
})

test('a different payment intent on an already-fulfilled member activates (genuine re-purchase)', () => {
  assert.equal(shouldActivateFromSession(session({ payment_intent: 'pi_2' }), FULFILLED), true)
})

test('unfinished payment never activates', () => {
  for (const status of ['unpaid', 'no_payment_required_typo', null]) {
    assert.equal(shouldActivateFromSession(session({ payment_status: status }), UNFULFILLED), false)
  }
})

test('a 100%-off promo session (no payment intent) activates a never-fulfilled member', () => {
  const free = session({ payment_status: 'no_payment_required', payment_intent: null })
  assert.equal(shouldActivateFromSession(free, UNFULFILLED), true)
})

test('a 100%-off promo session cannot re-activate an already-fulfilled member', () => {
  const free = session({ payment_status: 'no_payment_required', payment_intent: null })
  assert.equal(shouldActivateFromSession(free, FULFILLED), false)
})

// security: without the metadata checks any paid stripe session id activates membership
test('a guest event-ticket session cannot activate membership', () => {
  const ticket = session({ metadata: { type: 'event_ticket', member_id: MEMBER_ID } })
  assert.equal(shouldActivateFromSession(ticket, UNFULFILLED), false)
})

test('another member’s membership session cannot activate this member', () => {
  const someoneElse = session({ metadata: { type: 'membership', member_id: 'member-2' } })
  assert.equal(shouldActivateFromSession(someoneElse, UNFULFILLED), false)
})

test('a session with no metadata at all cannot activate', () => {
  assert.equal(shouldActivateFromSession(session({ metadata: null }), UNFULFILLED), false)
})

// security: stripe returns payment_intent as a bare id unless the caller expands it. an
// expanded object compared against a stored id string is never equal, which would disable
// the replay guard — both shapes must normalize to the same id.
test('an expanded payment_intent object is blocked exactly like its id string', () => {
  const expanded = session({ payment_intent: { id: 'pi_1' } })
  assert.equal(shouldActivateFromSession(expanded, FULFILLED), false)
  assert.equal(shouldActivateFromSession(session({ payment_intent: 'pi_1' }), FULFILLED), false)
})

test('an expanded payment_intent object still activates an unfulfilled member', () => {
  assert.equal(shouldActivateFromSession(session({ payment_intent: { id: 'pi_1' } }), UNFULFILLED), true)
})
