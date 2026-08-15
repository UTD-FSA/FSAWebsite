# Webhook load test

Finds the concurrency breaking point of `app/api/stripe-webhook/route.ts`'s membership branch
(`checkout.session.completed` → `stripe_events` claim → `members` update → email). Run this against
a **staging** deploy only — never production. See `C:\Users\Ariog\.claude\plans\can-this-website-support-jaunty-hammock.md`
for the full capacity analysis this was built to answer.

## 1. Install k6

```powershell
winget install k6 --source winget
# or: choco install k6
k6 version
```

## 2. Set up staging (once)

1. New free Supabase project, separate from prod `ncdldkjwsuufzkvkxbfo` — staging is
   `mqlpmieguafcosdtqrux` (`UTD FSA — staging`, `us-west-1`), already created and migrated via
   `mcp__supabase__apply_migration`, no Supabase CLI login required.
2. `loadtest/seed.sql` already applied to staging via `mcp__supabase__execute_sql` — 6 `settings` rows
   + 200 throwaway members.
3. Vercel → Project Settings → Environment Variables. For each of `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: uncheck **Preview** on the existing var (becomes
   Production-only), then add a new var with the same key, **Preview only**, staging/test value.
   Add `STRIPE_WEBHOOK_SECRET` fresh for Preview (any string — the route only HMACs against it
   locally, `route.ts:231`, real Stripe is never involved). Split `RESEND_FROM_EMAIL` too and leave
   the Preview value **blank** — otherwise every fulfilled request sends a real email.
4. Deployments list → the deployment to test → **Redeploy** → choose **Preview** in the environment
   dropdown. This builds current code under the Preview env vars, on its own per-deployment URL —
   not aliased to the production domain. Use that unique URL (the one with a random hash, e.g.
   `fsa-website-<hash>-<team>.vercel.app`), **not** the `-git-<branch>-` alias — that alias tracks the
   Production Branch's latest *Production* deployment and can point somewhere you don't expect.
5. This project has Vercel **Deployment Protection** on, which 401s anonymous requests (k6 included) —
   confirmed by a probe request that hit the SSO wall before ever reaching the route, so nothing
   touched any database. Project Settings → Deployment Protection → **Protection Bypass for
   Automation** → generate a secret. Pass it to k6 as `VERCEL_PROTECTION_BYPASS` (below); it's sent
   as an `x-vercel-protection-bypass` header, bypassing the wall for just that request while leaving
   protection on for everyone else.

## 3. Run

```powershell
$env:WEBHOOK_URL = "https://fsa-website-<hash>-<team>.vercel.app/api/stripe-webhook"
$env:STRIPE_WEBHOOK_SECRET = "<the value you put in Vercel's Preview env>"
$env:VERCEL_PROTECTION_BYPASS = "<the Protection Bypass for Automation secret>"

# smoke test first — 1 request, confirm it fulfills
k6 run --vus 1 --iterations 1 -e WEBHOOK_URL=$env:WEBHOOK_URL -e STRIPE_WEBHOOK_SECRET=$env:STRIPE_WEBHOOK_SECRET -e VERCEL_PROTECTION_BYPASS=$env:VERCEL_PROTECTION_BYPASS -e RUN_ID=smoke1 loadtest/webhook.js
```

Check staging: member `00000000-0000-4000-8000-000000000001` should now have `membership_status='active'`,
`amt_paid=2500`. Re-run with the same `RUN_ID=smoke1` — this time expect `idempotency_duplicates: 1`
instead of a second `fulfilled_200`, proving the ledger works and that a unique `RUN_ID` is what drives
real fulfillment.

Full three-scenario run (~3m15s):

```powershell
k6 run -e WEBHOOK_URL=$env:WEBHOOK_URL -e STRIPE_WEBHOOK_SECRET=$env:STRIPE_WEBHOOK_SECRET -e VERCEL_PROTECTION_BYPASS=$env:VERCEL_PROTECTION_BYPASS -e RUN_ID=run1 loadtest/webhook.js
```

While it runs, watch Vercel's function logs and the Supabase dashboard's Reports → Database / API
panes for the same time window — the k6 output tells you *what* failed, the platform dashboards tell
you *why*.

## 4. Scenarios

| | Scenario | Shape |
|---|---|---|
| A | Spaced-out stream | steady 20 req/s for 30s (open model — doesn't back off if the server slows down) |
| B | Ramping load | 0 → 100 concurrent VUs over 1 minute |
| C | Worst-case spike | 100 VUs firing in the same instant, 1 request each |

They run back-to-back with gaps (`startTime`), not overlapping, so a failure is attributable to one
scenario. Scenario C is a deliberate stress probe, not a realistic forecast — Stripe paces webhook
delivery itself; the endpoint that actually sees 100 simultaneous humans is `/api/events/register`,
which is a separate, unbuilt scenario (see the plan's "out of scope" section).

## 5. Reading the output

The summary prints counts for `fulfilled_200`, `idempotency_duplicates`, `deployment_protection_401`,
`signature_rejects_400`, `rate_limited_429`, `errors_500`, `errors_503`, `timeouts_504`, plus TTFB
p50/p95/p99. Full data lands in `loadtest/results-<RUN_ID>.json` (gitignored).

Read top-down — the first three rule out a broken harness before blaming the platform:

| See | Means | Do |
|---|---|---|
| `deployment_protection_401 > 0` | missing/wrong `VERCEL_PROTECTION_BYPASS` | fix and re-run — these never reached the route at all |
| `signature_rejects_400 > 0` | wrong `STRIPE_WEBHOOK_SECRET` | fix and re-run before reading anything else |
| `idempotency_duplicates` high, `fulfilled_200` low | `RUN_ID` reused across runs | use a fresh `RUN_ID` |
| `errors_500` even during Scenario A's mild 20 req/s | seed data missing, or a UNIQUE collision on `stripe_checkout_session_id`/`stripe_payment_intent_id`/`stripe_customer_id` | re-run `seed.sql`; confirm `RUN_ID` is fresh |
| `errors_500` climbing with concurrency (B/C), Vercel logs show PostgREST/fetch errors | **Supabase is the ceiling** | Supabase Pro first |
| `timeouts_504`, Vercel logs show the function still running | **function duration is the ceiling** — note the repo currently sets no `maxDuration` anywhere in `app/api/**` | try setting `export const maxDuration` before paying for Pro |
| `errors_503`, or requests with no matching Vercel log line at all | Vercel shed the request before it ran | Vercel Pro first |

**Any `errors_500` matters more than the count suggests: Stripe retries every 500 it sees.** Under real
load that turns a brief spike into a retry storm. If 500s show up at all, that's the number to fix
first regardless of what the raw ceiling turns out to be.

## 6. Clean up

Run `loadtest/teardown.sql` against **staging** (Supabase SQL editor, or `mcp__supabase__execute_sql`
scoped to the staging project id). Then confirm prod `members` row count is unchanged (8 as of this
writing) — cheap sanity check that nothing leaked into the wrong project.
