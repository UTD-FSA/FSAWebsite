// ── page.tsx ──────────────────────────────────────────────
// server component — officer gallery management page.
//
// data:  galleries table (all columns, all rows including unpublished)
//        members table (role check only)
// notes: uses admin client for both the role check and gallery fetch;
//        officers see all galleries regardless of is_published status.
import { redirect } from 'next/navigation'
import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import OfficerGalleryClient from './OfficerGalleryClient'
import type { Gallery } from '@/types/database'

export default async function OfficerGalleryPage() {
  // ============================================================
  // DATA — do not modify this section
  // all database queries and auth checks live here
  // changing these will break functionality
  // ============================================================
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  // route: /login — redirects unauthenticated users to sign in — do not change this path
  if (!user) redirect('/login?next=/officer/gallery')

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('members')
    .select('role')
    .eq('email', user.email!)
    .single()

  // only officers and admins can access this page — do not remove this check
  if (!member || (member.role !== 'officer' && member.role !== 'admin')) {
    // route: /member/profile — redirects unauthorized members away from officer pages — do not change this path
    redirect('/member/profile?error=unauthorized')
  }

  // fetches ALL galleries (published + drafts) — officers see everything
  // ponytail: safety ceiling, add cursor pagination if lists ever exceed 1000
  const { data: galleries } = await admin
    .from('galleries')
    .select('*')
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000)

  // ============================================================
  // UI — safe to restyle everything below this line
  // available data:
  //   galleries (Gallery[]) — all archives including unpublished,
  //     sorted by year desc then created_at desc
  // change classnames, layout, colors, and typography freely
  // do not remove or rename the variables being rendered
  // ============================================================
  return (
    <OfficerGalleryClient galleries={(galleries ?? []) as Gallery[]} />
  )
}
