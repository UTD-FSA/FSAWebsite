// ── route.ts (photos) ─────────────────────────────────────────────────────────
// unfinished stub — implementation not complete.
//
// deps:  googleapis (google oauth2 client initialized but not used yet)
// notes: NEXT_CLIENT_ID, NEXT_CLIENT_SECRET, and REFRESH_TOKEN env vars are
//        referenced but no handlers are exported. do not call this route.

import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const client = new google.auth.OAuth2(
    process.env.NEXT_CLIENT_ID,
    process.env.NEXT_CLIENT_SECRET
)

client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

