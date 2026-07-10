// ── route.ts ─────────────────────────────────────────────
// DELETE /api/officer/applications/[id]?type=ading|kuyate
//
// deletes an ading or kuyate application row and resets the member's
// onboarding state so they can go through onboarding again from scratch.
//
// data:  ading_applications, kuyate_applications, members
// notes: officer-only; type must be passed as a query param
import { requireOfficer } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { fail } from '@/lib/api-response'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(req: Request, { params }: RouteContext) {
  const ctx = await requireOfficer()
  if (!ctx) return fail('Forbidden', 403)

  const { id: applicationId } = await params

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  // allowlist check — type must resolve to one of the two known tables below,
  // never interpolated directly into the query
  if (!type || !['ading', 'kuyate'].includes(type)) {
    return fail('Invalid application type', 400)
  }

  const table = type === 'ading' ? 'ading_applications' : 'kuyate_applications'

  // fetch application first to get member_id for the onboarding reset
  const { data: application, error: fetchError } = await ctx.admin
    .from(table)
    .select('id, member_id')
    .eq('id', applicationId)
    .maybeSingle()

  if (fetchError || !application) {
    console.error('[delete application] fetch error:', fetchError)
    return fail('Application not found', 404)
  }

  // delete the application row
  const { error: deleteError } = await ctx.admin
    .from(table)
    .delete()
    .eq('id', applicationId)

  if (deleteError) {
    console.error('[delete application] delete error:', deleteError)
    return fail('Failed to delete application', 500)
  }

  // reset member onboarding so they can reapply from scratch
  const { error: resetError } = await ctx.admin
    .from('members')
    .update({ onboarding_complete: false, member_type: null })
    .eq('id', application.member_id)

  if (resetError) {
    console.error('[delete application] member reset error:', resetError)
    // application was already deleted — surface this as a failure (not 200) so the
    // caller doesn't mistake a partial write for full success
    return fail('Application deleted, but member onboarding reset failed — check Supabase manually', 500)
  }

  return NextResponse.json({ success: true })
}
