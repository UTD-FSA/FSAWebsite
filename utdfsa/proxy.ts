// ── proxy.ts ──────────────────────────────────────────────
// next.js middleware entry point — delegates auth/session handling to
// updateSession, and generates a per-request CSP nonce so inline JSON-LD
// <script> tags can run without 'unsafe-inline' in script-src.
//
// deps: utils/supabase/middleware (updateSession, matchesPrefix)
// notes: static assets and images are excluded from the matcher
//        so middleware never runs on them (performance)

import { type NextRequest } from 'next/server'
import { updateSession, matchesPrefix } from '@/utils/supabase/middleware'

// routes that read request-time session/auth state (cookies()/headers(), requireUser(),
// requireOfficer(), createUserClient()) and therefore render dynamically — these can
// safely carry a per-request nonce. everything else defaults to a static-safe CSP
// ('unsafe-inline', no nonce) instead of the reverse (an allowlist of static routes),
// because predicting which pages will actually prerender as static is fragile: a first
// pass at that allowlist missed /login and /membership (both turned out static — neither
// reads a request-time API — confirmed only by reading `npm run build`'s route table),
// and next's catch-all not-found page is served for literally any unmatched path, which
// can't be enumerated by prefix at all. a static page can't carry a per-request nonce —
// next stamps the nonce into its inline flight scripts at render time, and a build-time
// render can't know a future request's nonce — so serving a nonce'd CSP to one just
// blocks its own scripts. the list below is small and stable; if a new page is added,
// verify its row in `npm run build`'s route table (ƒ = dynamic) matches whether it's in
// this list, since drift here breaks the page rather than just weakening its CSP.
const DYNAMIC_CSP_ROUTES = ['/', '/events', '/attend', '/onboarding', '/member', '/officer', '/pamilyas', '/auth', '/api']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isStatic = !DYNAMIC_CSP_ROUTES.some(r => matchesPrefix(pathname, r))

  // fresh nonce per request — required for the nonce + strict-dynamic CSP pattern.
  // unused on static routes, but still generated so updateSession's request/response
  // plumbing (and its x-nonce header) stays identical on every path.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  // dev mode needs 'unsafe-eval' on both branches — react's dev-only debugging
  // tooling (callstack reconstruction) uses eval() regardless of which script-src
  // policy is in effect; never used in production
  const scriptSrc = isStatic
    ? `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};`
  const cspHeader = `
    default-src 'self';
    ${scriptSrc}
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
  // exclude next.js internals, well-known static routes, and static file extensions
  // from middleware — /api/** stays covered (it gates /api/officer/**);
  // note: next.js still invokes proxy on _next/data routes even when excluded here,
  // by design, so page and data routes can't drift apart in protection
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2|txt|xml|webmanifest)$).*)',
  ],
}
