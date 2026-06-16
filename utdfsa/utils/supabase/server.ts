// ── utils/supabase/server.ts ──────────────────────────────
// server-side supabase client factories for use in server
// components, route handlers, and server actions.
//
// deps:  supabase/ssr, next/headers
// notes: two clients exported — user (rls enforced) and admin (rls bypassed).
//        never import createAdminClient in client components.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ── user client ───────────────────────────────────────────

// createUserClient — for server components and api routes acting on behalf of the signed-in user
// reads/writes session cookies; row-level security policies apply
export async function createUserClient() {
  const cookieStore = await cookies()

  // respects rls — only returns rows the caller owns (anon key + session cookie)
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // anon key is safe here; rls enforces per-user access on the db side
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options)
            } catch (e) {
              // next.js throws if you try to set cookies in a server component render pass;
              // this is safe to swallow — the middleware handles the cookie refresh
              console.error('[server.ts] failed to set cookie:', name, e)
            }
          })
        },
      },
    }
  )
}

// ── admin client ──────────────────────────────────────────

// createAdminClient — for server-side operations that must bypass RLS (seeding, officer management)
// uses the service role key; never expose this client or its key to the browser
export function createAdminClient() {
  // bypass rls — officer action, user client would be blocked
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // service role key grants full db access — server-only, never sent to the browser
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      // no cookie store needed — admin client is stateless and never tied to a user session
      cookies: { getAll: () => [], setAll: () => {} },
    }
  )
}