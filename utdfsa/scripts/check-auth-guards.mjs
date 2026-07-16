#!/usr/bin/env node
// ── scripts/check-auth-guards.mjs ──────────────────────────
// static backstop for RLS bypass, two checks:
//
//   1. any API route that touches createAdminClient() (bypasses RLS — reads
//      AND writes) must call requireOfficer() or requireUser() somewhere in
//      the file. triggering on admin-client presence rather than only
//      insert/update/delete/upsert also catches an unguarded admin-client
//      READ (e.g. a leaked `.select('*')` over members) — a write-only
//      trigger passes that silently, which is the actual exfiltration case.
//   2. any route under app/api/officer/** must call requireOfficer()
//      specifically — requireUser() alone (a downgraded guard) is not
//      enough for an officer-tier route.
//
// this is a coarse, file-level heuristic — not real control-flow analysis —
// but it matches this codebase's actual convention (one guard call per
// handler, at the top, admin client sourced from ctx.admin) and is cheap
// enough to run on every change. run: npm run check:auth-guards
//
// ponytail: known ceilings, not fixed here — ADD PER-HANDLER SPLITTING if a
// route.ts ever exports a guarded GET alongside an unguarded POST/DELETE in
// the same file (file-level matching can't see that split). ADD page.tsx /
// server-action scanning if an admin-client write ever lands outside
// app/api/**/route.ts — today onboarding/page.tsx is the only example and
// it's already guarded. both need real data-flow analysis to avoid false-
// positiving on every public page that reads public data via the admin
// client with no auth requirement at all — disproportionate for a coarse
// backstop; upgrade if this script's coverage gap actually bites.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const API_DIR = path.join(ROOT, 'app', 'api')

// files that legitimately use an admin client with no requireOfficer/requireUser
// guard, and why — do not add to this list without a documented reason
const EXEMPTIONS = {
  'app/api/stripe-webhook/route.ts':
    'stripe webhook — signature verification (stripe.webhooks.constructEvent) is the security layer, not a session check',
  'app/api/events/register/route.ts':
    'public/guest ticket purchase — callers may be anonymous by design',
}

const ADMIN_CLIENT_PATTERN = /\bcreateAdminClient\s*\(/
const GUARD_PATTERN = /\b(requireOfficer|requireUser)\s*\(/
const OFFICER_GUARD_PATTERN = /\brequireOfficer\s*\(/

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, files)
    else if (entry === 'route.ts') files.push(full)
  }
  return files
}

const routeFiles = walk(API_DIR)
const failures = []

for (const file of routeFiles) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/')
  const content = readFileSync(file, 'utf8')
  const isOfficerRoute = rel.startsWith('app/api/officer/')

  if (isOfficerRoute) {
    // officer-tier routes need the officer-specific guard, not just any session
    if (OFFICER_GUARD_PATTERN.test(content)) continue
    if (EXEMPTIONS[rel]) continue
    failures.push({ rel, reason: 'under app/api/officer/ but no requireOfficer() call' })
    continue
  }

  if (!ADMIN_CLIENT_PATTERN.test(content)) continue // rls-bounded (user client only), nothing to guard
  if (GUARD_PATTERN.test(content)) continue // guarded
  if (EXEMPTIONS[rel]) continue // documented exception

  failures.push({ rel, reason: 'uses createAdminClient() but no requireOfficer()/requireUser() call' })
}

if (failures.length > 0) {
  console.error('✖ auth guard check failed:\n')
  for (const { rel, reason } of failures) console.error(`  - ${rel}: ${reason}`)
  console.error('\nIf a route is intentionally guard-free (e.g. a public write or a')
  console.error('signature-verified webhook), add it to EXEMPTIONS in scripts/check-auth-guards.mjs')
  console.error('with a one-line reason.')
  process.exit(1)
}

console.log(`✓ auth guard check passed — ${routeFiles.length} route files scanned, ${Object.keys(EXEMPTIONS).length} documented exemptions`)
