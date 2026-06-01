import { createUserClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditClient from './ProfileEditClient'

export default async function ProfileEditPage() {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('first_name, last_name, phone, year, major, contact_email')
    .eq('email', user.email!)
    .maybeSingle()

  if (!member) redirect('/login')

  // ============================================================
  // UI — safe to restyle everything below this line
  // ============================================================
  return <ProfileEditClient member={member} loginEmail={user.email!} />
}