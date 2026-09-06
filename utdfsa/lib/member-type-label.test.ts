// ── lib/member-type-label.test.ts ─────────────────────────
// memberTypeLabel() drives the "Type" row on the member profile page — the matrix
// covers every member_type × application status × pam-head combination. run with:
//   npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { memberTypeLabel } from './member-type-label.ts'

test('not_interested has no label', () => {
  assert.equal(memberTypeLabel('not_interested', null, false), null)
})

test('null member_type has no label', () => {
  assert.equal(memberTypeLabel(null, null, false), null)
})

test('accepted ading', () => {
  assert.equal(memberTypeLabel('ading', 'accepted', false), 'Ading')
})

test('pending ading (null status)', () => {
  assert.equal(memberTypeLabel('ading', null, false), 'Ading (pending)')
})

test('pending ading (explicit pending status)', () => {
  assert.equal(memberTypeLabel('ading', 'pending', false), 'Ading (pending)')
})

test('rejected ading has no label', () => {
  assert.equal(memberTypeLabel('ading', 'rejected', false), null)
})

test('accepted kuyate without pam head request', () => {
  assert.equal(memberTypeLabel('kuyate', 'accepted', false), 'Kuyate')
})

test('accepted kuyate with pam head request', () => {
  assert.equal(memberTypeLabel('kuyate', 'accepted', true), 'Kuyate (Pam Head)')
})

test('pending kuyate with pam head request stays pending (not yet accepted)', () => {
  assert.equal(memberTypeLabel('kuyate', 'pending', true), 'Kuyate (pending)')
})

test('rejected kuyate has no label even if pam head was requested', () => {
  assert.equal(memberTypeLabel('kuyate', 'rejected', true), null)
})

test('unrecognized application status is treated as pending', () => {
  assert.equal(memberTypeLabel('kuyate', 'withdrawn', false), 'Kuyate (pending)')
})
