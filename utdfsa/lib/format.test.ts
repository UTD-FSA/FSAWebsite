// ── lib/format.test.ts ────────────────────────────────────
// splitOAuthName() — shared by app/auth/callback/route.ts (first-sign-in member
// provisioning) and components/Navbar.tsx (session-painted navbar fallback).
// run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitOAuthName } from './format.ts'

test('given_name/family_name present — used directly', () => {
  assert.deepEqual(
    splitOAuthName({ given_name: 'Juan', family_name: 'Dela Cruz', full_name: 'ignored ignored' }),
    { firstName: 'Juan', lastName: 'Dela Cruz' }
  )
})

test('only full_name present — split on first space', () => {
  assert.deepEqual(
    splitOAuthName({ full_name: 'Maria Clara Santos' }),
    { firstName: 'Maria', lastName: 'Clara Santos' }
  )
})

test('single-word full_name — last name is empty', () => {
  assert.deepEqual(splitOAuthName({ full_name: 'Cher' }), { firstName: 'Cher', lastName: '' })
})

test('missing metadata — both fields empty, does not throw', () => {
  assert.deepEqual(splitOAuthName(undefined), { firstName: '', lastName: '' })
  assert.deepEqual(splitOAuthName({}), { firstName: '', lastName: '' })
})

test('names over 50 chars are truncated', () => {
  const long = 'a'.repeat(60)
  const result = splitOAuthName({ given_name: long, family_name: long })
  assert.equal(result.firstName.length, 50)
  assert.equal(result.lastName.length, 50)
})
