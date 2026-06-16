// ── page.tsx ─────────────────────────────────────────────────
// server component — fetches the current member profile and passes it to ProfileEditClient
//
// data:  members (first_name, last_name, phone, year, major, contact_email)
// deps:  supabase (respects rls — user client)
// notes: loginEmail is the google oauth email; it is passed read-only and cannot
//        be changed by the user — only contact_email is editable
import { createUserClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditClient from './ProfileEditClient'

export default async function ProfileEditPage() {
  // respects rls — only returns rows the caller owns
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  // redirect to /login if no session found
  if (!user) redirect('/login')

  // members table — fetch only the editable profile fields
  const { data: member } = await supabase
    .from('members')
    .select('first_name, last_name, phone, year, major, contact_email')
    .eq('email', user.email!)
    .maybeSingle()

  // redirect to /login if member row doesn't exist yet
  if (!member) redirect('/login')

  // ============================================================
  // UI — safe to restyle everything below this line
  // ============================================================
  return <ProfileEditClient member={member} loginEmail={user.email!} />
}