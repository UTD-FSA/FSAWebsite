// ── register.js ─────────────────────────────────────────────
// k6 load test for app/api/events/register/route.ts's paid, guest/anonymous
// path — the endpoint behind the campus-NAT rate-limit risk (30 req/60s,
// keyed on x-forwarded-for's first entry, lib/rate-limit.ts). k6 running from
// one machine sends every request from the same real IP by construction,
// which naturally reproduces "many attendees, one shared campus egress IP" —
// no header spoofing needed or possible (Vercel's edge sets the real client
// IP, a client can't override it through x-forwarded-for).
//
// single instant-spike scenario sized to PEAK_VUS (default 100) — matches a
// live-demo "everyone clicks register at once" burst, not a slow ramp.
// see loadtest/README.md for setup, run, and how to read results.
import http from 'k6/http'
import exec from 'k6/execution'
import { Counter, Rate, Trend } from 'k6/metrics'
import { assertNotProd, bypassHeaders } from './lib.js'

const TARGET_URL = __ENV.REGISTER_URL
const RUN = __ENV.RUN_ID
const PEAK_VUS = Number(__ENV.PEAK_VUS || 100)
// seeded by loadtest/seed.sql — one paid, active, staging-only event
const EVENT_ID = __ENV.EVENT_ID || '00000000-0000-4000-9000-000000000001'

if (!TARGET_URL || !RUN) {
  throw new Error('set -e REGISTER_URL=... -e RUN_ID=... (see loadtest/README.md)')
}

const cOk = new Counter('fulfilled_200')
const c400 = new Counter('validation_400')
const c403 = new Counter('unexpected_403') // vercel firewall rule, not our route's own limiter
const c409 = new Counter('conflict_409')
const c429 = new Counter('rate_limited_429')
const c401 = new Counter('deployment_protection_401')
const c500 = new Counter('errors_500') // may be supabase OR stripe rejecting session creation — see README
const c503 = new Counter('errors_503')
const c504 = new Counter('timeouts_504')
const errs = new Rate('register_error_rate')
const ttfb = new Trend('register_ttfb', true)

export const options = {
  scenarios: {
    rush: {
      executor: 'per-vu-iterations',
      vus: PEAK_VUS,
      iterations: 1,
      maxDuration: '2m',
    },
  },
  thresholds: {
    register_error_rate: ['rate<0.01'],
    timeouts_504: ['count==0'],
  },
}

export function setup() {
  assertNotProd(TARGET_URL)
}

export default function registerLoadTest() {
  const uniq = `${RUN}_${exec.vu.idInTest}_${exec.vu.iterationInInstance}`

  const body = JSON.stringify({
    event_id: EVENT_ID,
    tickets: [{
      fname: 'Load',
      lname: `Test${exec.vu.idInTest}`,
      email: `loadtest-register+${uniq}@example.invalid`,
    }],
    // hp (honeypot) intentionally omitted — lib/schemas.ts:33 requires empty/absent
  })

  const res = http.post(TARGET_URL, body, {
    headers: {
      'Content-Type': 'application/json',
      ...bypassHeaders(),
    },
    timeout: '70s', // must exceed the function's real timeout to distinguish a 504 from a client abort
  })

  ttfb.add(res.timings.waiting)
  errs.add(res.status !== 200)

  if (res.status === 401) c401.add(1)
  else if (res.status === 403) c403.add(1)
  else if (res.status === 400) c400.add(1)
  else if (res.status === 409) c409.add(1)
  else if (res.status === 429) c429.add(1)
  else if (res.status === 500) c500.add(1)
  else if (res.status === 503) c503.add(1)
  else if (res.status === 504) c504.add(1)
  else if (res.status === 200) cOk.add(1)

  if (res.status >= 500 || res.status === 400 || res.status === 401 || res.status === 403) {
    console.error(`[rush] ${res.status} ${Math.round(res.timings.duration)}ms ${res.body}`)
  }
}

export function handleSummary(data) {
  const m = data.metrics
  const get = (name, stat) => m[name]?.values?.[stat] ?? 0
  const lines = [
    '',
    `── loadtest/register.js summary (run ${RUN}, PEAK_VUS=${PEAK_VUS}) ──`,
    `fulfilled 200s:              ${get('fulfilled_200', 'count')}`,
    `rate-limited 429s:           ${get('rate_limited_429', 'count')}`,
    `unexpected vercel 403s:      ${get('unexpected_403', 'count')}`,
    `deployment protection 401s:  ${get('deployment_protection_401', 'count')}`,
    `validation 400s:             ${get('validation_400', 'count')}`,
    `conflict 409s:               ${get('conflict_409', 'count')}`,
    `server 500s:                 ${get('errors_500', 'count')}`,
    `server 503s:                 ${get('errors_503', 'count')}`,
    `gateway 504s:                ${get('timeouts_504', 'count')}`,
    `error rate:                  ${(get('register_error_rate', 'rate') * 100).toFixed(2)}%`,
    `ttfb p50/p95/p99 (ms):       ${get('register_ttfb', 'med').toFixed(0)} / ${get('register_ttfb', 'p(95)').toFixed(0)} / ${get('register_ttfb', 'p(99)').toFixed(0)}`,
    '',
  ].join('\n')

  return {
    stdout: lines,
    [`loadtest/results-register-${RUN}.json`]: JSON.stringify(data, null, 2),
  }
}
