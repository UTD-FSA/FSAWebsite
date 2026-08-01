// ── lib/events/session-expiry.ts ──────────────────────────
// resolveSessionExpiry() — the stripe checkout `expires_at` clamp for early-bird events.
// extracted from app/api/events/register/route.ts so the min/max clamp is unit-testable.
//
// notes: early-bird checkout sessions die at the deadline so a stale open tab can't pay
//        the old price after it stops being offered. stripe clamps expires_at to
//        30min-24h from creation, so this is a min/max clamp, not an exact deadline
//        match — a deadline under 30min out gets pushed to the 30min floor, and one
//        more than 24h out gets pulled back to the 24h ceiling.

export function resolveSessionExpiry(input: {
  isEarlyBird: boolean
  ebDeadline: string | null
  now?: Date
}): number | undefined {
  if (!input.isEarlyBird) return undefined

  const now = input.now ?? new Date()
  const nowSec = Math.floor(now.getTime() / 1000)

  return Math.min(
    Math.max(Math.floor(new Date(input.ebDeadline!).getTime() / 1000), nowSec + 1800),
    nowSec + 86400
  )
}
