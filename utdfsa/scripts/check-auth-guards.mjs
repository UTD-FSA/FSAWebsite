#!/usr/bin/env node
// ── scripts/check-auth-guards.mjs ──────────────────────────
// static backstop for RLS bypass: every API route that writes via the
// admin/service-role client (insert/update/delete/upsert) must call
// requireOfficer() or requireUser() somewhere in the file.
//
// this is a coarse, file-level heuristic — not real control-flow analysis —
// but it matches this codebase's actual convention (one guard call per
// handler, at the top, admin client sourced from ctx.admin) and is cheap
// enough to run on every change. run: npm run check:auth-guards

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const API_DIR = path.join(ROOT, 'app', 'api')

// files that legitimately write via an admin client with no requireOfficer/requireUser
// guard, and why — do not add to this list without a documented reason
const EXEMPTIONS = {
  'app/api/stripe-webhook/route.ts':
    'stripe webhook — signature verification (stripe.webhooks.constructEvent) is the security layer, not a session check',
  'app/api/events/register/route.ts':
    'public/guest ticket purchase — callers may be anonymous by design',
}

const WRITE_PATTERN = /\.(insert|update|delete|upsert)\s*\(/
const GUARD_PATTERN = /\b(requireOfficer|requireUser)\s*\(/

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

  if (!WRITE_PATTERN.test(content)) continue // read-only route, nothing to guard
  if (GUARD_PATTERN.test(content)) continue // guarded
  if (EXEMPTIONS[rel]) continue // documented exception

  failures.push(rel)
}

if (failures.length > 0) {
  console.error('✖ auth guard check failed — these routes write via an admin/service-role')
  console.error('  client but never call requireOfficer() or requireUser():\n')
  for (const f of failures) console.error(`  - ${f}`)
  console.error('\nIf this route is intentionally guard-free (e.g. a public write or a')
  console.error('signature-verified webhook), add it to EXEMPTIONS in scripts/check-auth-guards.mjs')
  console.error('with a one-line reason.')
  process.exit(1)
}

console.log(`✓ auth guard check passed — ${routeFiles.length} route files scanned, ${Object.keys(EXEMPTIONS).length} documented exemptions`)
