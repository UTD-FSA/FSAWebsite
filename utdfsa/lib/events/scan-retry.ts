// ── lib/events/scan-retry.ts ─────────────────────────────
// isRecoveredCheckIn() — decides whether an "already checked in" on a rescan is really
// the officer's own earlier attempt, whose check-in write committed after the request
// timed out.
//
// notes: a write can outlive its 504 and commit seconds later, so the rescan that follows
//        a "scan again" screen finds the ticket already checked in. without this the
//        attendee at the door gets a red screen for a ticket that was never used.
//        deliberately narrow — same qr code, checked in by this officer, no earlier than
//        the failed attempt, and only within a short window. a ticket that already scanned
//        green minutes ago (a shared screenshot) still scans red, even if its latest
//        attempt timed out.

// the attempt that never got an answer — startedAt is the scanner's clock when it sent it
export type FailedScan = { qrCode: string; startedAt: number }

export type AlreadyCheckedInScan = {
  qrCode: string
  checkedInByYou: boolean
  checkedInAt: string | null
}

// how long after a failed attempt its rescan may still claim it
export const RESCAN_WINDOW_MS = 2 * 60 * 1000

// checked_in_at is stamped by the server's clock, startedAt by the phone's —
// tolerate the two disagreeing by this much
export const CLOCK_SKEW_MS = 60 * 1000

export function isRecoveredCheckIn(
  scan: AlreadyCheckedInScan,
  lastFailed: FailedScan | null,
  now: number
): boolean {
  if (!lastFailed || lastFailed.qrCode !== scan.qrCode) return false
  if (!scan.checkedInByYou || !scan.checkedInAt) return false
  if (now - lastFailed.startedAt > RESCAN_WINDOW_MS) return false

  const checkedInAt = new Date(scan.checkedInAt).getTime()
  return checkedInAt >= lastFailed.startedAt - CLOCK_SKEW_MS
}
