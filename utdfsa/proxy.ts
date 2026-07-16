// ── proxy.ts ──────────────────────────────────────────────
// next.js middleware entry point — delegates auth/session handling to
// updateSession, and generates a per-request CSP nonce so the two inline
// JSON-LD <script> tags can run without 'unsafe-inline' in script-src.
//
// deps: utils/supabase/middleware (updateSession)
// notes: static assets and images are excluded from the matcher
//        so middleware never runs on them (performance)

import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  // fresh nonce per request — required for the nonce + strict-dynamic CSP pattern
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://lh3.googleusercontent.com https://cover-photos-gal.s3.us-east-2.amazonaws.com;
    font-src 'self';
    connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} https://api.stripe.com;
    frame-src https://www.youtube-nocookie.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `
  const csp = cspHeader.replace(/\s{2,}/g, ' ').trim()

  // updateSession threads {nonce, csp} into its own NextResponse.next({request}) calls
  // so Server Components downstream can read x-nonce via headers()
  const response = await updateSession(request, { nonce, csp })

  // set on the actual outgoing response too — redirect or pass-through, doesn't matter:
  // harmless on redirects (no page body is rendered so the nonce is moot there), and
  // keeps the header present uniformly across every return path of updateSession
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  // exclude next.js internals and all static file extensions from middleware
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
