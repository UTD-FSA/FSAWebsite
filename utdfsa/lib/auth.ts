// ── lib/auth.ts ────────────────────────────────────────────
// shared auth guards for route handlers and server pages.
//
// data:  members (role lookup)
// notes: requireUser() only confirms a valid session — callers decide the
//        failure action (401 json for routes, redirect for pages).
//        requireOfficer() layers a role check on top; returns null for both
//        "not logged in" and "wrong role" — callers respond with one status.
import { createUserClient, createAdminClient } from '@/utils/supabase/server'
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
