// ── lib/format.ts ─────────────────────────────────────────
// string formatting utilities used across forms and display components

// ── text case helpers ─────────────────────────────────────

// capitalizes first letter of each word — "john doe" → "John Doe"
export function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map(word => {
      if (!word) return ''
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

// ── oauth name helper ──────────────────────────────────────

// derives first/last name from google oauth metadata — shared by the first-sign-in
// member provisioning (app/auth/callback/route.ts) and the navbar's session-painted
// fallback (components/Navbar.tsx), so the two can't drift apart
// 50-char cap matches the limit enforced on member-edited names elsewhere (update-profile)
export function splitOAuthName(meta: Record<string, unknown> | undefined): { firstName: string; lastName: string } {
  const fullName = typeof meta?.full_name === 'string' ? meta.full_name : ''
  const firstName = (typeof meta?.given_name === 'string' ? meta.given_name : fullName.split(' ')[0] ?? '').slice(0, 50)
  const lastName = (typeof meta?.family_name === 'string' ? meta.family_name : fullName.split(' ').slice(1).join(' ')).slice(0, 50)
  return { firstName, lastName }
}

// ── date/time helpers ─────────────────────────────────────

// formats an abbreviated month + day in Central time — e.g. "Sep. 3"
// May has no true abbreviation (it's already 3 letters), so it gets no period
export function fmtDateShort(iso: string): string {
  const d = new Date(iso)
  const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/Chicago' })
  const day = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/Chicago' })
  return `${month === 'May' ? month : month + '.'} ${day}`
}

// formats a start–end time range in Central time; falls back to start-only when no end
// e.g. fmtTimeRange(start) → "7:00 PM"; fmtTimeRange(start, end) → "7:00 PM – 9:00 PM"
export function fmtTimeRange(startISO: string, endISO?: string | null): string {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' }
  const start = new Date(startISO).toLocaleTimeString('en-US', opts)
  if (!endISO) return start
  return `${start} – ${new Date(endISO).toLocaleTimeString('en-US', opts)}`
}

// ── phone formatter ───────────────────────────────────────

// formats a raw phone input to (xxx) xxx-xxxx
// strips all non-digits first, then applies the mask
export function formatPhone(value: string): string {
  // cap at 10 digits — us phone numbers only
  const digits = value.replace(/\D/g, '').slice(0, 10)

  // return partial masks as the user types
  if (digits.length < 4) return digits
  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}