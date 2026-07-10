// ── route.ts ─────────────────────────────────────────────
// GET /api/me — return the authenticated caller's full member profile
//
// data:  members
// notes: used by client hooks to hydrate global user state; returns 401 if unauthenticated
import { requireUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { fail } from '@/lib/api-response'

export async function GET() {
  // ── auth check ───────────────────────────────────────────
  // returns 401 if no valid session — all callers must be logged in
  const ctx = await requireUser()
  if (!ctx) return fail('Unauthorized', 401)
  const { supabase, user } = ctx

  // ── member lookup ─────────────────────────────────────────
  // respects rls — user client; row is accessible only if the caller owns it
  // look them up in members table using their email
  const { data: member, error: dbError } = await supabase
    .from('members')
    .select('id, email, first_name, last_name, phone, year, major, role, membership_status, onboarding_complete, member_type, points, avatar_url, pamilya, contact_email, membership_expires_at, created_at')
    .eq('email', user.email!)
    .single()

  if (dbError || !member) {
    return fail('Member not found', 404)
  }

  return NextResponse.json(member, {
    headers: { 'Cache-Control': 'no-store' },
  })
}