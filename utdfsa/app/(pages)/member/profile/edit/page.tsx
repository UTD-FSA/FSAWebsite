// ── page.tsx ─────────────────────────────────────────────────
// server component — fetches the current member profile and passes it to ProfileEditClient
//
// data:  members (first_name, last_name, phone, year, major, shirt_size, contact_email)
// deps:  supabase (respects rls — user client)
// notes: loginEmail is the google oauth email; it is passed read-only and cannot
//        be changed by the user — only contact_email is editable
import { requireUser, assertActiveMember } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProfileEditClient from './ProfileEditClient'

export default async function ProfileEditPage() {
  // respects rls — only returns rows the caller owns
  const ctx = await requireUser()
  if (!ctx) redirect('/login')
  const { supabase, user } = ctx

  // members table — fetch the editable profile fields plus role/membership_status/
  // membership_expires_at so assertActiveMember() below can re-verify paid/officer
  // status server-side (defense-in-depth mirror of the middleware gate — see
  // lib/auth.ts) without a second members round-trip
  const { data: member } = await supabase
    .from('members')
    .select('first_name, last_name, phone, year, major, shirt_size, contact_email, role, membership_status, membership_expires_at')
    .eq('email', user.email!)
    .maybeSingle()

  // redirect to /login if member row doesn't exist yet, /membership if unpaid
  assertActiveMember(member)

  // ============================================================
  // UI — safe to restyle everything below this line
  // ============================================================
  return <ProfileEditClient member={member} loginEmail={user.email!} />
}