// ── lib/api-response.ts ────────────────────────────────────
// shared error-response helper for API routes — standardizes wording/casing
// and the validation-error shape across the API surface.
//
// notes: success-response shapes are deliberately left alone here. some routes
// return bare arrays/objects consumed directly by client hooks (e.g. GET /api/me),
// so unifying those would require updating every client call site in lockstep —
// a separate, larger change. this only touches the error envelope, which every
// route already agrees on ({ error, ...extra }) and every client already reads
// the same way (data.error, with a hardcoded fallback string).

import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

// standard error envelope. `extra` lets a route attach additional fields
// (e.g. the kuyate status-conflict response's message/currentStatus) without
// breaking the { error, ... } shape every client already expects.
export function fail(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

// standard shape for zod validation failures — .flatten() is the project
// convention (used by the majority of routes prior to this helper existing)
export function failValidation(error: ZodError, message = 'Invalid data.') {
  return fail(message, 400, { details: error.flatten() })
}
