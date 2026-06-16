// ── lib/stripe.ts ─────────────────────────────────────────
// singleton stripe client — import { stripe } from '@/lib/stripe' wherever stripe is needed
//
// deps:  stripe (npm)
// notes: the api version is pinned — do not change without testing all stripe integrations;
//        STRIPE_SECRET_KEY is a server-only env var, never expose to the browser

import Stripe from 'stripe'

// ── exported client ───────────────────────────────────────

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // pinned api version — upgrading requires re-testing checkout, webhooks, and refunds
  apiVersion: '2026-05-27.dahlia',
})