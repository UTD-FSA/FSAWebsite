// ── lib/events/fulfillment.test.ts ────────────────────────
// classifyFulfillment() — fulfill/retry/refund branches. extracted from
// app/api/stripe-webhook/route.ts. run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyFulfillment } from './fulfillment.ts'

test('no pending row — refund, nothing left to fulfill', () => {
  assert.equal(classifyFulfillment({ pending: null, sessionId: 'sess_a' }), 'refund')
})

test('pending row not yet bound to a session — retry, write is still in flight', () => {
  assert.equal(
    classifyFulfillment({ pending: { stripe_checkout_session_id: null }, sessionId: 'sess_a' }),
    'retry'
  )
})

test('pending row bound to this exact session — fulfill', () => {
  assert.equal(
    classifyFulfillment({ pending: { stripe_checkout_session_id: 'sess_a' }, sessionId: 'sess_a' }),
    'fulfill'
  )
})

test('pending row bound to a different session — refund, this session is stale', () => {
  assert.equal(
    classifyFulfillment({ pending: { stripe_checkout_session_id: 'sess_b' }, sessionId: 'sess_a' }),
    'refund'
  )
})
