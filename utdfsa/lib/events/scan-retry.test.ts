// ── lib/events/scan-retry.test.ts ─────────────────────────
// isRecoveredCheckIn() — the ticket scanner's recovery for a check-in write that committed
// after its request timed out. extracted from app/(pages)/officer/scan/ScanClient.tsx.
// run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isRecoveredCheckIn, RESCAN_WINDOW_MS, CLOCK_SKEW_MS } from './scan-retry.ts'

const QR = '82af551e-2cf3-482a-961d-d7613606f394'
const STARTED_AT = Date.parse('2026-09-13T04:11:02.000Z')
const FAILED = { qrCode: QR, startedAt: STARTED_AT }

// the 2026-09-13 party case: the write stamped checked_in_at when the timed-out request ran
function rescan(overrides: Partial<Parameters<typeof isRecoveredCheckIn>[0]> = {}) {
  return {
    qrCode: QR,
    checkedInByYou: true,
    checkedInAt: '2026-09-13T04:11:02.300Z',
    ...overrides,
  }
}

const TEN_SECONDS_LATER = STARTED_AT + 10_000

test('rescan finds the officer’s own late-committed write and recovers it', () => {
  assert.equal(isRecoveredCheckIn(rescan(), FAILED, TEN_SECONDS_LATER), true)
})

test('no failed attempt means a genuine already-checked-in stays red', () => {
  assert.equal(isRecoveredCheckIn(rescan(), null, TEN_SECONDS_LATER), false)
})

test('a different ticket than the one that failed is not recovered', () => {
  assert.equal(isRecoveredCheckIn(rescan({ qrCode: 'other-qr' }), FAILED, TEN_SECONDS_LATER), false)
})

test('a ticket another officer checked in is not recovered', () => {
  assert.equal(isRecoveredCheckIn(rescan({ checkedInByYou: false }), FAILED, TEN_SECONDS_LATER), false)
})

test('a missing check-in time is not recovered', () => {
  assert.equal(isRecoveredCheckIn(rescan({ checkedInAt: null }), FAILED, TEN_SECONDS_LATER), false)
})

// security: the screenshot case. a ticket that scanned green long ago is presented again,
// that attempt happens to time out, and the rescan must not turn it green
test('a ticket checked in well before the failed attempt stays red', () => {
  const longAgo = rescan({ checkedInAt: '2026-09-13T04:01:00.000Z' })
  assert.equal(isRecoveredCheckIn(longAgo, FAILED, TEN_SECONDS_LATER), false)
})

test('a server clock slightly behind the phone is tolerated', () => {
  const skewed = rescan({ checkedInAt: new Date(STARTED_AT - CLOCK_SKEW_MS + 1000).toISOString() })
  assert.equal(isRecoveredCheckIn(skewed, FAILED, TEN_SECONDS_LATER), true)
})

test('a rescan after the window has closed is not recovered', () => {
  assert.equal(isRecoveredCheckIn(rescan(), FAILED, STARTED_AT + RESCAN_WINDOW_MS + 1), false)
})
