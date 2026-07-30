// ── lib/events/pricing.test.ts ────────────────────────────
// resolveEventPricing() — early-bird window, member vs non-member tier, and
// total. extracted from app/api/events/register/route.ts. run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveEventPricing } from './pricing.ts'

const BASE = {
  priceCentsMembers: 500,
  priceCentsNonmembers: 1000,
  ebPriceMembers: 300,
  ebPriceNonmembers: 800,
  ebDeadline: '2026-01-01T00:00:00.000Z',
}

test('member, regular pricing (after the early-bird deadline), single ticket', () => {
  const result = resolveEventPricing({
    ...BASE,
    isMember: true,
    ticketCount: 1,
    now: new Date('2026-06-01T00:00:00.000Z'),
  })
  assert.equal(result.isEarlyBird, false)
  assert.equal(result.pricePerTicket, 500)
  assert.equal(result.totalAmount, 500)
})

test('non-member, regular pricing, multiple tickets multiplies the total', () => {
  const result = resolveEventPricing({
    ...BASE,
    isMember: false,
    ticketCount: 3,
    now: new Date('2026-06-01T00:00:00.000Z'),
  })
  assert.equal(result.isEarlyBird, false)
  assert.equal(result.pricePerTicket, 1000)
  assert.equal(result.totalAmount, 3000)
})

test('member, before the early-bird deadline, gets the early-bird member price', () => {
  const result = resolveEventPricing({
    ...BASE,
    isMember: true,
    ticketCount: 1,
    now: new Date('2025-12-01T00:00:00.000Z'),
  })
  assert.equal(result.isEarlyBird, true)
  assert.equal(result.pricePerTicket, 300)
  assert.equal(result.totalAmount, 300)
})

test('non-member, before the early-bird deadline, gets the early-bird non-member price', () => {
  const result = resolveEventPricing({
    ...BASE,
    isMember: false,
    ticketCount: 2,
    now: new Date('2025-12-01T00:00:00.000Z'),
  })
  assert.equal(result.isEarlyBird, true)
  assert.equal(result.pricePerTicket, 800)
  assert.equal(result.totalAmount, 1600)
})

test('missing early-bird fields disable early-bird pricing even before a deadline', () => {
  const result = resolveEventPricing({
    priceCentsMembers: 500,
    priceCentsNonmembers: 1000,
    ebPriceMembers: null,
    ebPriceNonmembers: null,
    ebDeadline: null,
    isMember: true,
    ticketCount: 1,
    now: new Date('2025-12-01T00:00:00.000Z'),
  })
  assert.equal(result.isEarlyBird, false)
  assert.equal(result.pricePerTicket, 500)
})

test('defaults `now` to the real current time when omitted', () => {
  const result = resolveEventPricing({
    priceCentsMembers: 500,
    priceCentsNonmembers: 1000,
    ebPriceMembers: 300,
    ebPriceNonmembers: 800,
    ebDeadline: '1970-01-01T00:00:00.000Z', // long past — early bird never applies
    isMember: true,
    ticketCount: 1,
  })
  assert.equal(result.isEarlyBird, false)
  assert.equal(result.pricePerTicket, 500)
})
