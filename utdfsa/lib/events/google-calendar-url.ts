// ── lib/events/google-calendar-url.ts ─────────────────────
// buildGoogleCalendarUrl() — the prefilled "add to google calendar" link shown in the
// event detail modal. a plain url template, no google api or oauth involved.
//
// notes: google wants utc timestamps as YYYYMMDDTHHMMSSZ, joined start/end with a slash.
//        event_end is nullable, so an event without one gets DEFAULT_DURATION_MS.
//        the link is a one-time copy — later edits to the event on the site do not
//        reach a calendar entry someone already saved.

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000

// 2026-10-07T23:00:00.000Z → 20261007T230000Z
function toGoogleTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function buildGoogleCalendarUrl(event: {
  name: string
  event_date: string
  event_end: string | null
  location: string | null
  description: string | null
}): string {
  const start = new Date(event.event_date)
  const end = event.event_end ? new Date(event.event_end) : new Date(start.getTime() + DEFAULT_DURATION_MS)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${toGoogleTimestamp(start)}/${toGoogleTimestamp(end)}`,
  })
  if (event.location) params.set('location', event.location)
  if (event.description) params.set('details', event.description)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
