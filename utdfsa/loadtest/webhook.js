// ── webhook.js ──────────────────────────────────────────────
// k6 load test for app/api/stripe-webhook/route.ts's membership branch.
// forges signed stripe checkout.session.completed events against a
// STAGING preview deployment to find the endpoint's concurrency breaking
// point. see loadtest/README.md for setup, run, and how to read results.
//
// three scenarios, run back-to-back with gaps so failures stay attributable
// to one scenario. b_ramp and c_spike scale with PEAK_VUS (default 100) so
// escalating across runs (300 -> 500 -> 1000) doesn't need script edits:
//   A (0:00-0:30)   spaced-out stream — steady 20 req/s for 30s
//   B (0:45-1:45)   ramping load     — 0 -> PEAK_VUS concurrent VUs over 1m
//   C (2:15-~2:16)  worst-case spike — PEAK_VUS VUs firing in the same instant
import http from 'k6/http'
import crypto from 'k6/crypto'
import exec from 'k6/execution'
import { Counter, Rate, Trend } from 'k6/metrics'
import { assertNotProd, bypassHeaders } from './lib.js'

const TARGET_URL = __ENV.WEBHOOK_URL
const SECRET = __ENV.STRIPE_WEBHOOK_SECRET
const RUN = __ENV.RUN_ID
const POOL = Number(__ENV.MEMBER_POOL || 200)
const PEAK_VUS = Number(__ENV.PEAK_VUS || 100)

if (!TARGET_URL || !SECRET || !RUN) {
  throw new Error(
    'set -e WEBHOOK_URL=... -e STRIPE_WEBHOOK_SECRET=... -e RUN_ID=... (see loadtest/README.md)'
  )
}

const c500 = new Counter('errors_500')
const c503 = new Counter('errors_503')
const c504 = new Counter('timeouts_504')
const c429 = new Counter('rate_limited_429')
const c401 = new Counter('deployment_protection_401')
const cSig = new Counter('signature_rejects_400')
const cDup = new Counter('idempotency_duplicates')
const cOk = new Counter('fulfilled_200')
const errs = new Rate('webhook_error_rate')
const ttfb = new Trend('webhook_ttfb', true)

export const options = {
  scenarios: {
    a_stream: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 40,
      maxVUs: 120,
      startTime: '0s',
      tags: { scenario: 'A' },
    },
    b_ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [{ duration: '1m', target: PEAK_VUS }],
      startTime: '45s',
      gracefulRampDown: '15s',
      tags: { scenario: 'B' },
    },
    c_spike: {
      executor: 'per-vu-iterations',
      vus: PEAK_VUS,
      iterations: 1,
      maxDuration: '1m',
      startTime: '2m15s',
      tags: { scenario: 'C' },
    },
  },
  thresholds: {
    webhook_error_rate: ['rate<0.01'],
    'http_req_duration{scenario:A}': ['p(95)<1500'],
    timeouts_504: ['count==0'],
  },
}

// setup() runs once before any VU, so this fails the whole test fast.
export function setup() {
  assertNotProd(TARGET_URL)
}

function sign(body, ts) {
  return `t=${ts},v1=${crypto.hmac('sha256', SECRET, `${ts}.${body}`, 'hex')}`
}

export default function webhookLoadTest() {
  const uniq = `${RUN}_${exec.scenario.name}_${exec.vu.idInTest}_${exec.vu.iterationInInstance}`
  const memberId = `00000000-0000-4000-8000-${String((exec.vu.idInTest % POOL) + 1).padStart(12, '0')}`

  const body = JSON.stringify({
    id: `evt_loadtest_${uniq}`,
    object: 'event',
    type: 'checkout.session.completed',
    api_version: '2026-07-29.dahlia',
    data: {
      object: {
        id: `cs_test_loadtest_${uniq}`,
        object: 'checkout.session',
        payment_status: 'paid', // route.ts:318 gate — anything else 200s without a db write
        amount_total: 2500,
        currency: 'usd',
        customer: `cus_loadtest_${uniq}`,
        customer_email: `loadtest+${uniq}@example.invalid`,
        payment_intent: `pi_loadtest_${uniq}`,
        payment_method_types: ['card'],
        metadata: { type: 'membership', member_id: memberId }, // route.ts:327 requires both
      },
    },
  })

  const ts = Math.floor(Date.now() / 1000)
  const headers = {
    'Content-Type': 'application/json',
    'Stripe-Signature': sign(body, ts),
    ...bypassHeaders(),
  }

  const res = http.post(TARGET_URL, body, {
    headers,
    timeout: '70s', // must exceed the function's real timeout to distinguish a 504 from a client abort
  })

  ttfb.add(res.timings.waiting)
  errs.add(res.status !== 200)

  if (res.status === 401) c401.add(1)
  else if (res.status === 400) cSig.add(1)
  else if (res.status === 429) c429.add(1)
  else if (res.status === 500) c500.add(1)
  else if (res.status === 503) c503.add(1)
  else if (res.status === 504) c504.add(1)
  else if (res.status === 200) {
    if (res.body && res.body.includes('"duplicate":true')) cDup.add(1)
    else cOk.add(1)
  }

  if (res.status >= 500 || res.status === 400 || res.status === 401) {
    console.error(`[${exec.scenario.name}] ${res.status} ${Math.round(res.timings.duration)}ms ${res.body}`)
  }
}

export function handleSummary(data) {
  const m = data.metrics
  const get = (name, stat) => m[name]?.values?.[stat] ?? 0
  const lines = [
    '',
    `── loadtest/webhook.js summary (run ${RUN}) ──`,
    `fulfilled 200s:        ${get('fulfilled_200', 'count')}`,
    `idempotency duplicates: ${get('idempotency_duplicates', 'count')}`,
    `deployment protection 401s: ${get('deployment_protection_401', 'count')}`,
    `signature 400s:        ${get('signature_rejects_400', 'count')}`,
    `rate-limited 429s:     ${get('rate_limited_429', 'count')}`,
    `server 500s:           ${get('errors_500', 'count')}`,
    `server 503s:           ${get('errors_503', 'count')}`,
    `gateway 504s:          ${get('timeouts_504', 'count')}`,
    `error rate:            ${(get('webhook_error_rate', 'rate') * 100).toFixed(2)}%`,
    `ttfb p50/p95/p99 (ms): ${get('webhook_ttfb', 'med').toFixed(0)} / ${get('webhook_ttfb', 'p(95)').toFixed(0)} / ${get('webhook_ttfb', 'p(99)').toFixed(0)}`,
    '',
  ].join('\n')

  return {
    stdout: lines,
    [`loadtest/results-${RUN}.json`]: JSON.stringify(data, null, 2),
  }
}
