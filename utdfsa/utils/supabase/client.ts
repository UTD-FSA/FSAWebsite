// ── utils/supabase/client.ts ──────────────────────────────
// browser-only supabase client — use in 'use client' components
// do not use in server components or api routes — use createUserClient instead
//
// deps:  supabase/ssr (createBrowserClient)
// notes: respects rls — the anon key is public and safe to expose in the browser

import { createBrowserClient } from '@supabase/ssr'

// ── exported client factory ───────────────────────────────

export function createClient() {
  // respects rls — only returns rows the caller owns (anon key, browser context)
  return createBrowserClient(
    // NEXT_PUBLIC_ prefix makes these available to the browser bundle
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}