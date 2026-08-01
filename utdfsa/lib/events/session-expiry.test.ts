// ── lib/events/session-expiry.test.ts ─────────────────────
// resolveSessionExpiry() — early-bird expires_at min/max clamp. extracted from
// app/api/events/register/route.ts. run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveSessionExpiry } from './session-expiry.ts'

test('non-early-bird — no expiry override', () => {
  const result = resolveSessionExpiry({
    isEarlyBird: false,
    ebDeadline: '2026-01-01T00:00:00.000Z',
  })
  assert.equal(result, undefined)
})

test('deadline comfortably within 30min-24h — used as-is', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')
  const deadline = new Date('2026-01-01T06:00:00.000Z') // 6h out
  const result = resolveSessionExpiry({ isEarlyBird: true, ebDeadline: deadline.toISOString(), now })
  assert.equal(result, Math.floor(deadline.getTime() / 1000))
})

test('deadline less than 30min out — floored to now + 30min', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')
  const deadline = new Date('2026-01-01T00:05:00.000Z') // 5min out
  const result = resolveSessionExpiry({ isEarlyBird: true, ebDeadline: deadline.toISOString(), now })
  assert.equal(result, Math.floor(now.getTime() / 1000) + 1800)
})

test('deadline more than 24h out — capped to now + 24h', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')
  const deadline = new Date('2026-01-05T00:00:00.000Z') // 4 days out
  const result = resolveSessionExpiry({ isEarlyBird: true, ebDeadline: deadline.toISOString(), now })
  assert.equal(result, Math.floor(now.getTime() / 1000) + 86400)
})

test('deadline already passed — still floored to now + 30min, never negative/past', () => {
  const now = new Date('2026-01-01T00:00:00.000Z')
  const deadline = new Date('2025-12-31T00:00:00.000Z') // 1 day in the past
  const result = resolveSessionExpiry({ isEarlyBird: true, ebDeadline: deadline.toISOString(), now })
  assert.equal(result, Math.floor(now.getTime() / 1000) + 1800)
})
