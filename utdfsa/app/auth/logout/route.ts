// ── route.ts (auth/logout) ────────────────────────────────────────────────────
// clears the supabase session and redirects to /login.
//
// deps:  supabase (auth.signOut clears the http-only session cookies)
// notes: any authenticated user can call this. signOut is fire-and-forget —
//        the redirect happens regardless of whether it errors.

// route: GET /auth/logout
// purpose: signs the user out and redirects to /login
// auth: any authenticated user
// calls: supabase (auth.signOut)

import { createUserClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// ── GET /auth/logout ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createUserClient()

  // global scope invalidates all sessions across all devices, not just this browser
  await supabase.auth.signOut({ scope: 'global' })

  const response = NextResponse.redirect(`${origin}/login`)
  return response
}