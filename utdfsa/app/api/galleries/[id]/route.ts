// ── route.ts ─────────────────────────────────────────────
// DELETE /api/galleries/[id] — hard-delete a gallery by id
//
// data:  galleries, members (role check)
// notes: restricted to officer and admin roles; no soft-delete
import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ============================================================
  // DATA — do not modify this section
  // all database queries and auth checks live here
  // changing these will break functionality
  // ============================================================

  // ── auth check ───────────────────────────────────────────
  // returns 401 if no valid session — unauthenticated callers cannot delete
  const { id } = await params

  const supabase = await createUserClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // bypass rls — officer action; admin client needed to read member role
  const admin = createAdminClient()

  // only officers and admins may delete galleries — do not remove this check
  // fetch the caller's role from the members table to enforce access control
  const { data: member } = await admin
    .from('members')
    .select('role')
    .eq('email', user.email!)
    .single()

  if (!member || (member.role !== 'officer' && member.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // bypass rls — hard-delete the gallery row from the galleries table
  const { error } = await admin
    .from('galleries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[galleries] delete error:', error)
    return NextResponse.json({ error: 'Failed to delete gallery' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
