// ── lib/auth.ts ────────────────────────────────────────────
// shared auth guards for route handlers and server pages.
//
// data:  members (role lookup)
// notes: requireUser() only confirms a valid session — callers decide the
//        failure action (401 json for routes, redirect for pages).
//        requireOfficer() layers a role check on top; returns null for both
//        "not logged in" and "wrong role" — callers respond with one status.
//        requireActiveMember() is a PAGE-ONLY helper (calls redirect() itself,
//        doesn't return a status) — defense-in-depth mirror of the middleware
//        paid-membership gate (utils/supabase/middleware.ts), same pattern the
//        officer pages already use for the role gate. never call from a route
//        handler. member pages that already fetch their own display row (profile,
//        profile/edit, orders, attendance) call assertActiveMember() directly on
//        that row instead, to avoid a second members round-trip just for the gate.
import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import { isMembershipActive } from '@/lib/membership'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

type UserClient = Awaited<ReturnType<typeof createUserClient>>

export async function requireUser(): Promise<{ supabase: UserClient; user: User } | null> {
  // respects rls — user client; only returns a user if a valid session exists
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return { supabase, user }
}

export async function requireOfficer(): Promise<{
  admin: ReturnType<typeof createAdminClient>
  user: User
  member: { id: string; role: string }
} | null> {
  const ctx = await requireUser()
  if (!ctx) return null

  // bypass rls — needed to read role from members table before the caller is
  // verified as officer/admin; read-only, scoped to the caller's own email
  const admin = createAdminClient()
  const { data: member } = await admin
    .from('members')
    .select('id, role')
    .eq('email', ctx.user.email!)
    .maybeSingle()

  if (!member || (member.role !== 'officer' && member.role !== 'admin')) return null
  return { admin, user: ctx.user, member }
}

// shared gate logic for requireActiveMember() below AND for pages that already
// fetch their own display row (which includes these same 3 columns) — lets
// those pages re-verify paid status without a second members round-trip.
// same rule as the middleware gate: officers/admins are exempt, they don't pay dues.
// generic + `asserts member is T` so callers get member narrowed to non-null
// afterward (matches the old `if (!member) redirect(...)` narrowing they had before)
export function assertActiveMember<
  T extends { role: string; membership_status: string; membership_expires_at: string | null }
>(member: T | null): asserts member is T {
  if (!member) redirect('/login')
  const isOfficer = member.role === 'officer' || member.role === 'admin'
  if (!isMembershipActive(member) && !isOfficer) redirect('/membership')
}

export async function requireActiveMember(): Promise<{ supabase: UserClient; user: User }> {
  const ctx = await requireUser()
  if (!ctx) redirect('/login')
  const { supabase, user } = ctx

  // respects rls — only returns the row matching the caller's own email
  const { data: member } = await supabase
    .from('members')
    .select('role, membership_status, membership_expires_at')
    .eq('email', user.email!)
    .maybeSingle()

  assertActiveMember(member)

  return { supabase, user }
}
