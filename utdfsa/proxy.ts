// ── proxy.ts ──────────────────────────────────────────────
// next.js middleware entry point — delegates all auth/session
// handling to updateSession; also exports the matcher config
// that tells next.js which routes to run middleware on.
//
// deps: utils/supabase/middleware (updateSession)
// notes: static assets and images are excluded from the matcher
//        so middleware never runs on them (performance)

import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // exclude next.js internals and all static file extensions from middleware
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}