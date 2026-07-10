// ── page.tsx ──────────────────────────────────────────────
// server component — officer qr ticket scanner auth guard.
//
// data:  members (role check only)
// notes: defense-in-depth auth check — middleware also protects this route
//        but we verify role explicitly here in case middleware is misconfigured.
//        all camera/scanner logic lives in ScanClient (client component).
import { createUserClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ScanClient from './ScanClient'

export default async function ScanPage() {
  // redirect to /login if no session found
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // table: members — role check; redirects non-officers to their profile with error flag
  const { data: roleRow } = await supabase
    .from('members')
    .select('role')
    .eq('email', user.email!)
    .maybeSingle()

  if (roleRow?.role !== 'officer' && roleRow?.role !== 'admin') {
    redirect('/member/profile?error=unauthorized')
  }

  return <ScanClient />
}
