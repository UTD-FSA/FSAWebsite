// ── lib/membership-expiry.test.ts ─────────────────────────
// computeMembershipExpiry() — year-rollover + chicago end-of-day arithmetic.
// extracted from lib/settings.ts. run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeMembershipExpiry } from './membership-expiry.ts'

test('CDT (daylight saving) — end of day is 04:59:59 UTC the next day', () => {
  // may 31 is CDT (UTC-5) — 23:59:59 Central = 04:59:59 UTC on june 1
  const now = new Date('2027-01-15T00:00:00.000Z')
  const result = computeMembershipExpiry(now, 5, 31)
  assert.equal(result.toISOString(), '2027-06-01T04:59:59.000Z')
})

test('CST (standard time) — end of day is 05:59:59 UTC the next day', () => {
  // december 15 is CST (UTC-6) — 23:59:59 Central = 05:59:59 UTC the next day
  const now = new Date('2026-10-01T00:00:00.000Z')
  const result = computeMembershipExpiry(now, 12, 15)
  assert.equal(result.toISOString(), '2026-12-16T05:59:59.000Z')
})

test('current month before expiry month — expiry lands this year', () => {
  const now = new Date('2026-08-01T00:00:00.000Z') // august, chicago time
  const result = computeMembershipExpiry(now, 9, 22) // september 22
  assert.equal(result.toISOString(), '2026-09-23T04:59:59.000Z')
})

test('current month after expiry month — expiry rolls to next year', () => {
  const now = new Date('2026-11-01T00:00:00.000Z') // november, chicago time
  const result = computeMembershipExpiry(now, 9, 22) // september 22 already passed
  assert.equal(result.toISOString(), '2027-09-23T04:59:59.000Z')
})

test('utc date near midnight rolls back a day in chicago — year rollover uses chicago calendar, not utc', () => {
  // 2026-10-01T04:00:00Z is still 2026-09-30 11:00pm in chicago (CDT, UTC-5) —
  // must NOT be treated as october when deciding whether the expiry month passed
  const now = new Date('2026-10-01T04:00:00.000Z')
  const result = computeMembershipExpiry(now, 9, 22) // september — not yet passed in chicago
  assert.equal(result.toISOString(), '2026-09-23T04:59:59.000Z')
})
