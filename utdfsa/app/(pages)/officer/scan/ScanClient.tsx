// ── ScanClient.tsx ────────────────────────────────────────
// officer qr ticket scanner — fullscreen camera view for event check-in.
//
// deps:  POST /api/scan-ticket, html5-qrcode (npm)
// notes: mobile-first — designed for phone use at events.
//        do not add a max-width container — full screen is intentional.
//        do not add navbar padding — scan overlay must cover full viewport.
//        auth/role check happens in page.tsx (server component) before this renders.
//        the officer must pick an event before scans are accepted — the scanner
//        callback ignores frames until selectedEvent is set, and every scan is
//        validated against that event server-side (WRONG_EVENT rejection).
//        a request that fails or times out shows SCAN AGAIN (yellow), never INVALID TICKET —
//        at the 2026-09-13 party every database timeout read as a fake ticket. the rescan
//        of that same ticket may find its own write already committed; isRecoveredCheckIn()
//        turns that into a green instead of ALREADY CHECKED IN.
'use client'

import { useEffect, useRef, useState } from 'react'
import Modal from '@/components/Modal'
import { Html5Qrcode } from 'html5-qrcode'
import { isRecoveredCheckIn, type FailedScan } from '@/lib/events/scan-retry'

// the route makes several database calls, each able to stall ~5s on a throttled instance —
// long enough to ride out one stall, short enough not to freeze the door
const SCAN_TIMEOUT_MS = 10_000

export type ScannableEvent = {
  id: string
  name: string
  event_date: string
  event_type: string
  checked_in_count: number
  total_paid: number
}

type ScanResult =
  | { valid: true; attendee_name: string; event_name: string; reason: 'SUCCESS'; checked_in_count?: number; total_paid?: number }
  | { valid: false; reason: 'ALREADY_CHECKED_IN'; message: string; checked_in_at?: string | null; checked_in_by_you?: boolean; attendee_name: string; checked_in_count?: number; total_paid?: number }
  | { valid: false; reason: 'WRONG_EVENT'; message: string; attendee_name: string; ticket_event_name: string }
  | { valid: false; reason: 'NOT_PAID' | 'INVALID_TICKET'; message: string }
  // client-side outcomes — the request never produced a verdict
  | { valid: false; reason: 'RETRY' | 'SIGNED_OUT'; message: string }
  | null

// turns a non-verdict http response into what the officer should do next. only a 200
// carries a verdict; 400 is a qr code that isn't a ticket at all, 401/403 a lost session,
// and anything else (503 from a database timeout, 500 from an auth outage) is worth a rescan
async function readScanResponse(res: Response): Promise<NonNullable<ScanResult>> {
  if (res.ok) return res.json()
  if (res.status === 400) return { valid: false, reason: 'INVALID_TICKET', message: 'Not a ticket' }
  if (res.status === 401 || res.status === 403) return { valid: false, reason: 'SIGNED_OUT', message: 'Signed out' }
  return { valid: false, reason: 'RETRY', message: 'Server unavailable' }
}

function fmtEventDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZone: 'America/Chicago',
  })
}

// ============================================================
// UI — safe to restyle everything below this line
// available data:
//   events (ScannableEvent[]) — active events for the picker, soonest first
//   selectedEvent (ScannableEvent | null) — null until the officer picks one
//   tally ({ checked_in_count, total_paid } | null) — live door count
//   checking (boolean) — true while a scanned code is being verified
//   result (ScanResult | null) — set after each QR scan; null between scans
//     if valid: { attendee_name, event_name, reason: 'SUCCESS' }
//     if invalid: { reason: 'ALREADY_CHECKED_IN' | 'WRONG_EVENT' | 'NOT_PAID' | 'INVALID_TICKET' | 'RETRY' | 'SIGNED_OUT', message, ... }
//   cameraError (string | null) — set when the camera fails to start
// change classnames, layout, colors, and typography freely
// do not remove or rename the variables being rendered
// ============================================================
export default function ScanClient({ events }: { events: ScannableEvent[] }) {
  // result of the most recent scan — null between scans, set for 2.5 s after each
  const [result, setResult] = useState<ScanResult>(null)
  // true from the moment a code is decoded until its result arrives — without it a slow
  // request looks like the camera never read the code
  const [checking, setChecking] = useState(false)
  // set when the camera fails to start (permission denied, no camera, etc.)
  const [cameraError, setCameraError] = useState<string | null>(null)
  // the event the officer is working the door for — scans are ignored until set
  const [selectedEvent, setSelectedEvent] = useState<ScannableEvent | null>(null)
  // live door count for the selected event — seeded from props, refreshed per scan response
  const [tally, setTally] = useState<{ checked_in_count: number; total_paid: number } | null>(null)
  // prevents the scanner callback from firing again while the result overlay is visible
  const processingRef = useRef(false)
  // ref mirror of selectedEvent — the scanner callback closes over mount-time state,
  // so it must read the current selection through a ref, not the stale closure
  const selectedEventRef = useRef<ScannableEvent | null>(null)
  // holds the Html5Qrcode instance so the cleanup function can stop it
  const scannerRef = useRef<Html5Qrcode | null>(null)
  // tracks whether start() resolved successfully — stop() must not be called if start() never resolved
  const startedRef = useRef(false)
  // the most recent scan that never got an answer — its rescan may find its own write committed
  const lastFailedRef = useRef<FailedScan | null>(null)

  function pickEvent(ev: ScannableEvent) {
    selectedEventRef.current = ev
    setSelectedEvent(ev)
    setTally({ checked_in_count: ev.checked_in_count, total_paid: ev.total_paid })
  }

  function switchEvent() {
    selectedEventRef.current = null
    setSelectedEvent(null)
    setTally(null)
  }

  // effect: starts the camera scanner on mount, runs continuously, cleans up on unmount — do not remove or reorder
  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        // no event picked yet — ignore frames; the picker overlay is covering the screen
        const event = selectedEventRef.current
        if (!event) return
        // debounce: ignore while result overlay is showing
        if (processingRef.current) return
        processingRef.current = true
        setChecking(true)
        const startedAt = Date.now()

        let scanResult: NonNullable<ScanResult>

        try {
          // api: calls POST /api/scan-ticket — validates QR code against the selected
          // event and marks the ticket as checked in — do not change this endpoint
          const res = await fetch('/api/scan-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_code: decodedText, event_id: event.id }),
            signal: AbortSignal.timeout(SCAN_TIMEOUT_MS),
          })
          scanResult = await readScanResponse(res)
        } catch {
          // network drop or timeout — the write may still land server-side
          scanResult = { valid: false, reason: 'RETRY', message: 'Server unavailable' }
        }

        const lastFailed = lastFailedRef.current
        if (scanResult.reason === 'RETRY') {
          lastFailedRef.current = { qrCode: decodedText, startedAt }
        } else if (lastFailed?.qrCode === decodedText) {
          // the answer to a ticket whose last attempt failed — consumed either way, so a
          // screenshot of the same ticket scanned later can't ride this recovery
          lastFailedRef.current = null
          if (
            scanResult.reason === 'ALREADY_CHECKED_IN' &&
            isRecoveredCheckIn(
              {
                qrCode: decodedText,
                checkedInByYou: scanResult.checked_in_by_you ?? false,
                checkedInAt: scanResult.checked_in_at ?? null,
              },
              lastFailed,
              Date.now()
            )
          ) {
            scanResult = {
              valid: true,
              reason: 'SUCCESS',
              attendee_name: scanResult.attendee_name,
              event_name: event.name,
              checked_in_count: scanResult.checked_in_count,
              total_paid: scanResult.total_paid,
            }
          }
        }

        setChecking(false)
        setResult(scanResult)

        // refresh the door tally when the response carries updated counts
        if (scanResult && 'checked_in_count' in scanResult && scanResult.checked_in_count != null) {
          setTally({
            checked_in_count: scanResult.checked_in_count,
            total_paid: scanResult.total_paid ?? 0,
          })
        }

        // clear overlay and re-arm for next scan after 2.5 seconds
        // 2.5 s gives the officer enough time to read the result before the camera resumes
        setTimeout(() => {
          setResult(null)
          processingRef.current = false
        }, 2500)
      },
      () => {} // ignore per-frame errors
    ).then(() => {
      startedRef.current = true
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
        setCameraError('Camera access was denied. Please allow camera access in your browser settings and reload the page.')
      } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no camera') || msg.toLowerCase().includes('could not start')) {
        setCameraError('No camera was detected on this device. Connect a camera or use a mobile device to scan tickets.')
      } else {
        setCameraError(`Camera could not be started: ${msg}`)
      }
    })

    // only call stop() if start() succeeded — calling stop on a never-started scanner throws
    return () => {
      if (startedRef.current) scanner.stop().catch(() => {})
    }
  }, []) // scanner starts once and stays running — no stop/restart cycle

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">

      {/* only renders when the camera fails to initialize (no camera, permission denied, etc.) — do not remove this condition */}
      {cameraError && (
        <Modal onClose={() => setCameraError(null)} size="sm">
          <div className="bg-white rounded-2xl shadow-xl w-full p-6 text-center">
            <div className="text-5xl mb-4">📷</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Camera Not Available</h2>
            <p className="text-sm text-gray-600 mb-6">{cameraError}</p>
            <button
              onClick={() => setCameraError(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm active:scale-[0.98] transition-all"
            >
              Dismiss
            </button>
          </div>
        </Modal>
      )}

      {/* event picker — covers the screen until the officer picks which door they're working; do not remove this condition */}
      {!selectedEvent && !cameraError && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#070707] px-5">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-[7px] h-[7px] rounded-full bg-[#9747FF]" />
              <h1 className="font-display font-bold text-[19px] tracking-[-0.01em]">Select Event</h1>
            </div>
            <p className="text-sm text-[#8c8c8c] mb-6">Tickets for any other event will be rejected at this door.</p>

            {events.length === 0 ? (
              <p className="text-[#5e5e5e] text-sm py-8 text-center border border-white/10 rounded-2xl">
                No active events to scan for right now.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto">
                {events.map(ev => (
                  <li key={ev.id}>
                    <button
                      onClick={() => pickEvent(ev)}
                      className="w-full text-left px-4 py-3.5 rounded-2xl bg-[#141414] border border-white/10 hover:border-[#9747FF] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span className="block font-semibold text-[15px] text-white">{ev.name}</span>
                      <span className="flex items-center justify-between mt-1">
                        <span className="text-[13px] text-[#8c8c8c]">{fmtEventDate(ev.event_date)}</span>
                        <span className="text-[13px] font-medium text-[#cfcfcf] tabular-nums">
                          {ev.checked_in_count}/{ev.total_paid} checked in
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* only renders while a scanned code is being verified — do not remove this condition */}
      {checking && !result && (
        <div
          role="status"
          className="fixed inset-0 flex flex-col items-center justify-center text-center z-50 bg-[#070707]/90"
        >
          <p className="text-3xl font-black">CHECKING…</p>
          <p className="mt-3 text-[#8c8c8c] text-sm">Hold the ticket steady</p>
        </div>
      )}

      {/* only renders for 2.5 s after each QR scan to display the pass/fail result — do not remove this condition */}
      {result && (
        <div
          role="alert"
          className={`fixed inset-0 flex flex-col items-center justify-center text-center z-50
          ${result.valid ? 'bg-green-600' : result.reason === 'RETRY' ? 'bg-yellow-400 text-black' : 'bg-red-600'}`}
        >
          <div className="text-8xl mb-6">
            {result.valid ? '✅' : result.reason === 'RETRY' ? '🔄' : '❌'}
          </div>

          {/* only renders for a successful, first-time check-in — do not remove this condition */}
          {result.valid ? (
            <>
              <h1 className="text-4xl font-black mb-2">VALID TICKET</h1>
              <p className="text-2xl">{result.attendee_name}</p>
              <p className="text-lg opacity-75 mt-1">{result.event_name}</p>
            </>
          ) : result.reason === 'ALREADY_CHECKED_IN' ? (
            // only renders when the ticket was already scanned — do not remove this condition
            <>
              <h1 className="text-4xl font-black mb-2">ALREADY CHECKED IN</h1>
              <p className="text-2xl">{result.attendee_name}</p>
              {result.checked_in_at && (
                <p className="text-lg opacity-75 mt-1">
                  at {new Date(result.checked_in_at).toLocaleTimeString('en-US', { timeZone: 'America/Chicago' })}
                </p>
              )}
            </>
          ) : result.reason === 'WRONG_EVENT' ? (
            // only renders when the ticket belongs to a different event — do not remove this condition
            <>
              <h1 className="text-4xl font-black mb-2">WRONG EVENT</h1>
              <p className="text-2xl">{result.attendee_name}</p>
              <p className="text-lg opacity-75 mt-1">Ticket is for: {result.ticket_event_name}</p>
            </>
          ) : result.reason === 'RETRY' ? (
            // only renders when the request failed or timed out — no verdict, not a bad ticket; do not remove this condition
            <>
              <h1 className="text-4xl font-black mb-2">SCAN AGAIN</h1>
              <p className="text-lg">Couldn’t reach the server — this doesn’t mean the ticket is bad</p>
            </>
          ) : result.reason === 'SIGNED_OUT' ? (
            // only renders when the officer's session is gone — do not remove this condition
            <>
              <h1 className="text-4xl font-black mb-2">SIGNED OUT</h1>
              <p className="text-lg">Reload the page and sign in again</p>
            </>
          ) : result.reason === 'NOT_PAID' ? (
            // only renders when the ticket's payment is not confirmed — do not remove this condition
            <h1 className="text-4xl font-black">PAYMENT NOT VERIFIED</h1>
          ) : (
            <h1 className="text-4xl font-black">INVALID TICKET</h1>
          )}

          <p className="mt-8 opacity-50 text-sm">Resetting in 2.5 seconds...</p>
        </div>
      )}

      {/* header chip — selected event + live door tally; only renders once an event is picked */}
      {selectedEvent && (
        <div className="fixed top-0 inset-x-0 z-30 flex items-center justify-between gap-3 px-4 py-3 bg-[#070707]/90 border-b border-white/10">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{selectedEvent.name}</p>
            <p className="text-[13px] text-[#8c8c8c] tabular-nums">
              {tally ? `${tally.checked_in_count}/${tally.total_paid} checked in` : '—'}
            </p>
          </div>
          <button
            onClick={switchEvent}
            className="flex-shrink-0 px-3.5 py-2 rounded-[10px] bg-white/6 hover:bg-white/12 border border-white/10 text-[13px] font-semibold text-[#cfcfcf] active:scale-95 transition-all cursor-pointer"
          >
            Switch event
          </button>
        </div>
      )}

      {/* camera view — Html5Qrcode mounts its video feed into this div via the 'qr-reader' id — do not rename or remove */}
      <div id="qr-reader" className="w-full max-w-sm" />
      <p className="mt-4 text-gray-400 text-sm">Point camera at ticket QR code</p>

    </main>
  )
}
