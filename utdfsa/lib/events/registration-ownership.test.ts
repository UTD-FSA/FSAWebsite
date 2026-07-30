// ── lib/events/registration-ownership.test.ts ─────────────
// shouldUseMemberPath() — guards check_member_single_ticket (event_registrations:
// member_id IS NULL OR num_tickets = 1). extracted from
// app/api/events/register/route.ts. run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldUseMemberPath } from './registration-ownership.ts'

const MEMBER = { id: 'member-1' }

test('guest (no member) always uses the guest path', () => {
  assert.equal(shouldUseMemberPath(null, 1), false)
  assert.equal(shouldUseMemberPath(null, 5), false)
})

test('member buying exactly 1 ticket uses the member path', () => {
  assert.equal(shouldUseMemberPath(MEMBER, 1), true)
})

test('member buying 2+ tickets (expired/inactive member case) falls back to the guest path', () => {
  assert.equal(shouldUseMemberPath(MEMBER, 2), false)
  assert.equal(shouldUseMemberPath(MEMBER, 10), false)
})
