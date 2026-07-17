# UTD Filipino Student Association Web Platform

The production web platform for the University of Texas at Dallas Filipino Student Association (FSA), built to support an expected 700–800 members. It handles the full member lifecycle — public recruitment pages, membership signup with payment, event registration and QR-based check-in, photo galleries, a "pamilya" (family-group) system, and a role-based officer administration panel.

> **Note:** This is an organization-owned, team-built project (a team of ~6–7 student developers). It is not a solo portfolio piece.

## What it does

- **Public recruitment site** — About, events, Goodphil, and pamilya pages designed to convert casual mobile visitors into members.
- **Membership & payments** — Stripe Checkout for paid membership, with a Stripe webhook that finalizes membership status server-side.
- **Event system** — Officers create and edit events (with cover images); members register and receive tickets.
- **QR ticketing** — Tickets are generated as QR codes and validated at the door via an in-browser scanner.
- **Officer admin** — Role-scoped panel for reviewing membership applications and officer applications (`kuya/ate` and `ading` tracks) and managing events.
- **Onboarding flow** — Multi-step onboarding that collects and validates member profile data.
- **Galleries** — Event photo galleries with image upload, compression, and S3 storage.
- **Transactional email** — Membership confirmations, ticket delivery, and application-status updates via Resend.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (Postgres, Row-Level Security, SSR auth) |
| Payments | Stripe (Checkout + webhooks) |
| Media storage | AWS S3 (`@aws-sdk/client-s3`), client-side image compression |
| Email | Resend |
| Validation | Zod |
| Calendar / QR | FullCalendar, `html5-qrcode`, `qrcode` |
| Hosting & Analytics | Vercel, Vercel Analytics + Speed Insights |

## Architecture notes

- **App Router with route groups.** Public and authenticated pages live under `app/(pages)`; server logic lives in `app/api/*` route handlers.
- **Auth via Supabase SSR.** Session handling runs through middleware (`utils/supabase/middleware.ts`) with separate server/client Supabase instances (`utils/supabase/server.ts`, `client.ts`).
- **Server-authoritative payments.** Membership status is confirmed by the Stripe webhook (`app/api/stripe-webhook`), not by the client redirect — so a member is only marked paid after Stripe verifies the event.
- **Validation at the boundary.** Incoming API payloads are validated with Zod schemas (`lib/schemas.ts`) before touching the database.
- **Typed database layer.** `types/database.ts` provides typed access to the Supabase schema.

## Project structure

```
utdfsa/
├── app/
│   ├── (pages)/        # Public + member-facing routes (about, events, membership, officer, onboarding, …)
│   ├── api/            # Route handlers: events, membership/checkout, stripe-webhook, scan-ticket, officer, onboarding
│   └── auth/           # OAuth callback + logout
├── components/         # Reusable UI
├── lib/                # Stripe, Resend, email templates, Zod schemas, constants, formatting
├── utils/              # Supabase clients, S3 helpers, image validation
├── types/              # Database types
└── public/             # Static assets
```

## Getting started

Requires Node.js and a `.env.local` with the credentials below.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` (values are examples — do not commit real secrets):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=


# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

> Confirm the exact variable names against `utils/`, `lib/stripe.ts`, `lib/resend.ts`, and `utils/s3.ts` before publishing — these reflect the integrations in use, but the exact keys should match your code.

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint
```

## License

See [LICENSE](./LICENSE).