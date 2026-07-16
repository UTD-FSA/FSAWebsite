// ── lib/rate-limit.ts ─────────────────────────────────────
// shared in-memory sliding-window rate limiter for route handlers.
//
// ponytail: per-instance backstop only — resets on cold start, doesn't share
// state across serverless instances. the durable gate is an edge/firewall
// rate-limit rule (e.g. Vercel Firewall) on the same path; this just stops a
// single warm instance from being looped into unbounded writes/emails/stripe
// sessions between edge-rule evaluations. upgrade path: a shared store
// (Upstash/Redis) if per-instance state ever proves insufficient.

const hits = new Map<string, number[]>()

// crude bound on distinct-key growth (one entry per IP/user ever seen, never removed
// on its own since a key's own array can't detect its neighbors expiring). clearing
// the whole map is safe here — worst case is a handful of callers getting a fresh
// window slightly early, never a bypass of the limit itself.
const MAX_TRACKED_KEYS = 5000

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  if (hits.size > MAX_TRACKED_KEYS) hits.clear()

  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs)
  recent.push(now)
  hits.set(key, recent)

  return recent.length > limit
}
