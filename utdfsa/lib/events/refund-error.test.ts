// ── lib/events/refund-error.test.ts ────────────────────────
// classifyRefundError() — settled/retry/stuck branches. extracted from
// app/api/stripe-webhook/route.ts. run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyRefundError } from './refund-error.ts'

test('charge already refunded — settled, money is already back', () => {
  assert.equal(classifyRefundError({ code: 'charge_already_refunded' }), 'settled')
})

test('StripeConnectionError — retry, transient', () => {
  assert.equal(classifyRefundError({ type: 'StripeConnectionError' }), 'retry')
})

test('StripeAPIError — retry, transient', () => {
  assert.equal(classifyRefundError({ type: 'StripeAPIError' }), 'retry')
})

test('StripeRateLimitError — retry, transient', () => {
  assert.equal(classifyRefundError({ type: 'StripeRateLimitError' }), 'retry')
})

test('charge_disputed — stuck, retrying will not fix a dispute', () => {
  assert.equal(classifyRefundError({ code: 'charge_disputed', type: 'StripeInvalidRequestError' }), 'stuck')
})

test('StripeAuthenticationError — stuck, retrying will not fix bad credentials', () => {
  assert.equal(classifyRefundError({ type: 'StripeAuthenticationError' }), 'stuck')
})

test('null error — stuck, nothing to classify', () => {
  assert.equal(classifyRefundError(null), 'stuck')
})

test('plain non-stripe Error — stuck, no type/code to match', () => {
  assert.equal(classifyRefundError(new Error('boom')), 'stuck')
})

test('charge_already_refunded wins even on a retryable-looking type', () => {
  assert.equal(
    classifyRefundError({ code: 'charge_already_refunded', type: 'StripeConnectionError' }),
    'settled'
  )
})
