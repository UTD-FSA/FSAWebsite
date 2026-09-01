// ── lib/membership-expiry.ts ────────────────────────────────
// computeMembershipExpiry() — pure year-rollover + end-of-day arithmetic behind
// lib/settings.ts's membershipExpiry, extracted so it's unit-testable without
// hitting the db. all date math is anchored to america/chicago regardless of
// the server process's own timezone (Node defaults to the host's, e.g. utc on
// most deploy platforms) — officers set the expiry month/day expecting it to
// mean 11:59:59pm Central, not whatever the server thinks midnight is.

const CHICAGO_TZ = 'America/Chicago'

// [year, month(0-indexed)] for `instant` as displayed in america/chicago
function chicagoYearMonth(instant: Date): [number, number] {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ, year: 'numeric', month: 'numeric',
  }).formatToParts(instant)
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1
  return [year, month]
}

// the utc instant for 23:59:59 america/chicago on the given calendar date — computed
// via Intl instead of a hardcoded utc offset so cdt/cst daylight-saving stays correct
function chicagoEndOfDay(year: number, month: number, day: number): Date {
  const guessUtcMs = Date.UTC(year, month, day, 23, 59, 59)
  const asUtc = new Date(new Date(guessUtcMs).toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
  const asChicago = new Date(new Date(guessUtcMs).toLocaleString('en-US', { timeZone: CHICAGO_TZ })).getTime()
  return new Date(guessUtcMs - (asChicago - asUtc))
}

// expiryMonth is 1-indexed, matching the settings table's membership_expiry_month column
export function computeMembershipExpiry(now: Date, expiryMonth: number, expiryDay: number): Date {
  const [currentYear, currentMonth] = chicagoYearMonth(now)
  const expiryMonthIdx = expiryMonth - 1
  // if we're already past the expiry month this year (in Chicago terms), push to next year
  const expiryYear = currentMonth > expiryMonthIdx ? currentYear + 1 : currentYear
  return chicagoEndOfDay(expiryYear, expiryMonthIdx, expiryDay)
}
