// ── lib/membership.test.ts ────────────────────────────────
// isMembershipActive() is the single definition of "effectively active"
// membership — every access gate in the app depends on it, and the
// goodphil_eligibility DB view duplicates this predicate in SQL. run with:
//   npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isMembershipActive } from './membership.ts'

test('null member is not active', () => {
  assert.equal(isMembershipActive(null), false)
})

test('non-active status is not active, regardless of expiry', () => {
  assert.equal(isMembershipActive({ membership_status: 'inactive', membership_expires_at: null }), false)
  assert.equal(
    isMembershipActive({ membership_status: 'pending', membership_expires_at: '2999-01-01T00:00:00.000Z' }),
    false
  )
})

test('active status with no expiry (legacy row) stays active', () => {
  assert.equal(isMembershipActive({ membership_status: 'active', membership_expires_at: null }), true)
})

test('active status with a future expiry is active', () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  assert.equal(isMembershipActive({ membership_status: 'active', membership_expires_at: future }), true)
})

test('active status with a past expiry is not active', () => {
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  assert.equal(isMembershipActive({ membership_status: 'active', membership_expires_at: past }), false)
})

test('boundary: expiry exactly now is not active (strict greater-than)', () => {
  const now = new Date()
  assert.equal(
    isMembershipActive({ membership_status: 'active', membership_expires_at: now.toISOString() }),
    false
  )
})
