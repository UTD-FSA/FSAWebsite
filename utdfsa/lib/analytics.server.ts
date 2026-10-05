// ── analytics.server.ts ──────────────────────────────────────
// typed wrapper around vercel web analytics custom events (server side).
//
// deps:  @vercel/analytics/server
// notes: ServerEventMap is the single list of server event names → property shapes, so a
//        typo'd name or a wrong property is a compile error. vercel pro allows at most
//        2 properties per event, each string | number | boolean | null and ≤ 255 chars.
//        never put PII in a property (no names, emails, member ids, stripe ids).
//        trackServerEvent NEVER throws and never returns an error — it is called from the
//        stripe webhook, where a thrown error would become a non-2xx and trigger a
//        redelivery. always call it last: after the DB write is confirmed and after email.
//        the await is capped at TRACK_TIMEOUT_MS so a slow analytics endpoint can't hold
//        the response open.

import { track } from '@vercel/analytics/server'

type ServerEventMap = {
  'Tickets Purchased': { type: 'paid' | 'free'; tickets: number }
  'Membership Paid': { comp: boolean }
}

const TRACK_TIMEOUT_MS = 1500

export async function trackServerEvent<K extends keyof ServerEventMap>(
  name: K,
  props: ServerEventMap[K],
  req: Request
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      track(name, props, { request: req }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${TRACK_TIMEOUT_MS}ms`)), TRACK_TIMEOUT_MS)
      }),
    ])
  } catch (err) {
    console.error('[analytics] server event failed', name, err)
  } finally {
    clearTimeout(timer)
  }
}
