// ── lib/events/google-calendar-url.test.ts ────────────────
// buildGoogleCalendarUrl() — prefilled google calendar link for the event detail modal.
// run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGoogleCalendarUrl } from './google-calendar-url.ts'

const baseEvent = {
  name: 'General Meeting #2',
  event_date: '2026-10-08T00:00:00.000Z',
  event_end: '2026-10-08T01:30:00.000Z',
  location: 'SSA 14.265',
  description: 'Food & games — bring a friend!',
}

test('start and end — utc timestamps joined with a slash', () => {
  const params = new URL(buildGoogleCalendarUrl(baseEvent)).searchParams
  assert.equal(params.get('action'), 'TEMPLATE')
  assert.equal(params.get('dates'), '20261008T000000Z/20261008T013000Z')
})

test('no event_end — defaults to two hours after start', () => {
  const params = new URL(buildGoogleCalendarUrl({ ...baseEvent, event_end: null })).searchParams
  assert.equal(params.get('dates'), '20261008T000000Z/20261008T020000Z')
})

test('name, location, description — survive url encoding intact', () => {
  const params = new URL(buildGoogleCalendarUrl(baseEvent)).searchParams
  assert.equal(params.get('text'), 'General Meeting #2')
  assert.equal(params.get('location'), 'SSA 14.265')
  assert.equal(params.get('details'), 'Food & games — bring a friend!')
})

test('no location or description — params omitted, not sent empty', () => {
  const params = new URL(buildGoogleCalendarUrl({ ...baseEvent, location: null, description: null })).searchParams
  assert.equal(params.has('location'), false)
  assert.equal(params.has('details'), false)
})
