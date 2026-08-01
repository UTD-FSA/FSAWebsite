# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

The public website for UTD FSA (Filipino Student Association at UT Dallas): marketing/recruitment pages, an events system with paid registration, a paid membership flow (Stripe), a member portal (profile, attendance, orders), and an officer admin area (events, applications, gallery, QR ticket scanning, Goodphil scoring). See PRODUCT.md for brand/audience intent and DESIGN.md for the visual design system — both are authoritative for copy tone and UI styling decisions.

## Commands

- `npm run dev` — start the dev server (Next.js)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- `npm run check:auth-guards` — static check that every `app/api/**/route.ts` using `createAdminClient()` calls a `requireOfficer()`/`requireUser()` guard, and that everything under `app/api/officer/**` specifically calls `requireOfficer()`. Run this after touching any API route. Exemptions are hardcoded in `scripts/check-auth-guards.mjs` with a documented reason — don't add to that list without one.
- `npm test` — Node's built-in runner (`node --test`, no test framework dependency) over `lib/**/*.test.ts`. 29 tests across 6 files covering the pure business logic that gates money and access: `lib/membership.ts` (`isMembershipActive` status×expiry matrix), `lib/events/pricing.ts` (early-bird window, member/guest tiers), `lib/events/registration-ownership.ts` (`shouldUseMemberPath`), `lib/events/fulfillment.ts` (`classifyFulfillment` fulfill/retry/refund decision), `lib/events/session-expiry.ts` (`resolveSessionExpiry` early-bird min/max clamp), `lib/format.ts` (`splitOAuthName`). Coverage is deliberately narrow — there are no component, route, or integration tests, so a regression in a client component or an API route's control flow is caught by lint + the manual critical-flow checklist, not by CI. Logic extracted for testability should be a pure function in `lib/`, matching the six above. For local webhook testing (`stripe listen --forward-to localhost:3000/api/stripe-webhook`), see `.env.example`.

## Architecture

**Next.js App Router**, route groups under `app/(pages)/` for public/member/officer pages, `app/api/**/route.ts` for API routes. Each page with client interactivity pairs `page.tsx` (server) with a co-located `*Client.tsx` component.

### Auth & authorization (three layers, all must stay consistent)
1. **`proxy.ts`** — the actual middleware entry point (this Next.js version renamed `middleware.ts` → `proxy.ts`/`export function proxy`; see AGENTS.md). Generates a per-request CSP nonce and delegates to `updateSession`.
2. **`utils/supabase/middleware.ts`** (`updateSession`) — refreshes the Supabase session on every non-static request and redirect-gates `/member/**` (must be logged in + active membership) and `/officer/**` + `/api/officer/**` (must be `officer`/`admin` role). This is the only place able to persist a refreshed session cookie, so it always runs `auth.getUser()` even on public pages — don't gate that call behind route checks (regression covered in `docs/performance-bloat-audit.md`).
3. **`lib/auth.ts`** — in-route/in-page guards: `requireUser()` (session only, caller picks the failure response), `requireOfficer()` (adds role check), `requireActiveMember()` (page-only, redirects itself — defense-in-depth mirror of the middleware gate), `assertActiveMember()` (shared predicate for pages that already fetched their own member row).

`lib/membership.ts`'s `isMembershipActive()` is the single definition of "effectively active" membership (status **and** unexpired) — every access gate must use it; the `goodphil_eligibility` DB view duplicates this predicate in SQL, so update both if the rule changes.

Any new `app/api/**/route.ts` that calls `createAdminClient()` (bypasses RLS) needs a guard or a documented exemption — `npm run check:auth-guards` enforces this.

### Data access
- `utils/supabase/client.ts` / `server.ts` — browser vs. server Supabase clients (RLS-respecting, user-scoped).
- `createAdminClient()` (in `utils/supabase/server.ts`) bypasses RLS — only use it behind an auth guard (see above), and prefer scoping queries narrowly even when using it.
- `lib/constants.ts` → `PUBLIC_EVENT_COLUMNS` is the explicit column allowlist for events on public pages — deliberately excludes `attend_qr_token` (the in-person check-in secret). Never `select('*')` on `events` from a public-facing query.
- `types/database.ts` — generated/maintained Supabase schema types.
- `supabase/migrations/` — chronologically-named SQL migrations (`YYYYMMDDHHMMSS_description.sql`); treat as append-only history, not editable in place.

### Payments
`lib/stripe.ts` + `app/api/membership/checkout/route.ts` + `app/api/stripe-webhook/route.ts` handle paid membership. The webhook route is exempted from the auth-guard check (signature verification via `stripe.webhooks.constructEvent` is its security boundary, not a session check). `app/api/events/register/route.ts` (paid event tickets) is also exempted — guest/anonymous checkout is by design. Both exemptions in `scripts/check-auth-guards.mjs` are hardcoded literal paths — moving or splitting either route file silently drops it from the exemption list.

Paid event tickets use a **pending-cart architecture**, not a pre-payment `event_registrations` row: `app/api/events/register/route.ts` writes the cart to `pending_registrations` (keyed by `stripe_checkout_session_id`, not by identity — see the file's header comment for why), creates the Stripe session, and binds the two together. `app/api/stripe-webhook/route.ts` materializes the real `event_registrations` row + `registration_tickets` only on `checkout.session.completed`, via `lib/events/fulfillment.ts`'s `classifyFulfillment()` (fulfill/retry/refund). `event_registrations` is paid-only for events created under this model — free events still write it directly and immediately as `'paid'` (no payment to wait on, so no pending state). Members are capped at one paid ticket per event (`unique_member_event_registration` + `check_member_single_ticket`, enforcing the membership discount); guests may place multiple paid orders for the same event — that's normal ecommerce behavior, not a bug. **Transition note:** `stripe-webhook/route.ts` still carries a legacy branch (dispatched on `metadata.registration_id` instead of `metadata.pending_id`) for sessions created before this model shipped; remove it, and purge any leftover non-paid `event_registrations` rows, no sooner than 48h after that deploy.

### Security headers
CSP is split: static headers live in `next.config.ts` (`headers()`); the per-request nonce'd `script-src` (needed for inline JSON-LD) is generated in `proxy.ts` and threaded through `updateSession` so Server Components can read it via `x-nonce`. Image responses get a maximally restrictive fallback CSP in `next.config.ts` since the middleware matcher skips image extensions for performance. `next.config.ts`'s `images.remotePatterns` is pinned to exact hostnames (not wildcarded) — deliberate, to avoid turning `next/image` into an open proxy.

### Other structure
- `lib/data/events.ts` — shared event query/shaping logic.
- `lib/email/` — transactional email templates/senders (Resend).
- `lib/schemas.ts` — Zod validation schemas.
- `utils/s3.ts` — S3 upload helpers for event cover photos / gallery images (bucket pinned in both `next.config.ts` and here — keep in sync).
- `utils/eventTypes.ts` — event-type → color/label mapping used by the badge component across the events system.
- `docs/performance-bloat-audit.md` — postmortems/history of perf issues found and fixed; check before re-introducing a pattern that was previously removed for performance reasons.

## Project conventions

- **Read-first, report-then-act**: before making any code change in this repo, read the relevant files, report findings (what you found, root cause, proposed fix options), and wait for explicit authorization before implementing — don't assume the obvious fix is wanted. (Enforced via the `read-first-report` skill.)
- Comment blocks use DATA/UI-style headers, lowercase text (see the `── file.ts ──` header + lowercase notes style already used throughout `lib/`, `utils/supabase/`, `proxy.ts`).
- Frontend copy is sentence-case, casual/warm tone per PRODUCT.md (never institutional or corporate-SaaS-sounding — see PRODUCT.md's anti-references).
- No orange. No purple glow/ring effects.
- CSV exports stay wired to status-filter arrays, never search-filtered arrays.
- Design tokens (colors, type scale, spacing, component styles) come from DESIGN.md — Banig Green is the only solid-fill CTA color; don't introduce a second one.
