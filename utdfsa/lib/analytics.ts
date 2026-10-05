// ── analytics.ts ─────────────────────────────────────────────
// typed wrapper around vercel web analytics custom events (client side).
//
// deps:  @vercel/analytics (<Analytics /> is mounted in app/layout.tsx)
// notes: EventMap is the single list of client event names → property shapes, so a
//        typo'd name or a wrong property is a compile error. vercel pro allows at most
//        2 properties per event, each string | number | boolean | null and ≤ 255 chars.
//        never put PII in a property (no names, emails, member ids, stripe ids).
//        fire-and-forget: trackEvent never throws and never blocks the caller.
//        server-confirmed events (purchases, activations) live in analytics.server.ts —
//        never fire a "paid" event from the client.

'use client'

import { track } from '@vercel/analytics'

type EventMap = {
  'Register Opened': { event: string }
  'Registration Submitted': { event: string; tickets: number }
  'Membership Checkout Started': undefined
  'Onboarding Submitted': { memberType: string }
}

export function trackEvent<K extends keyof EventMap>(
  name: K,
  ...args: EventMap[K] extends undefined ? [] : [props: EventMap[K]]
): void {
  try {
    track(name, args[0])
  } catch {
    // analytics must never break the flow it is measuring
  }
}
