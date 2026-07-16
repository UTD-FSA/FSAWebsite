// ── route.ts ─────────────────────────────────────────────
// PATCH /api/officer/applications/ading/[id] — update ading application status and/or pamilya assignment
//
// data:  ading_applications, members (pamilya field)
// notes: pamilya is stored on the member row, not the application; officer-only
import { requireOfficer } from '@/lib/auth'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { fail, failValidation } from '@/lib/api-response'

const PAMILYA_VALUES = ['Shiballers', 'Gutom Gang', 'Sushi Cuchi', 'Hanobe', 'Moganda', 'SDIYBT', 'Arigyattos'] as const

const patchSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
  pamilya: z.enum(PAMILYA_VALUES).nullable().optional(),
}).refine(
  data => data.status !== undefined || data.pamilya !== undefined,
  { message: 'at least one field (status or pamilya) must be provided' }
)

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: RouteContext) {
  const ctx = await requireOfficer()
  if (!ctx) return fail('Forbidden', 403)

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return failValidation(parsed.error)
  }

  const { status, pamilya } = parsed.data

  // ── status update ─────────────────────────────────────────
  if (status !== undefined) {
    // fetch current status first so the update can be optimistically locked against it
    // bypass rls — officer action; reads ading_applications for the lock check
    const { data: currentApp, error: fetchError } = await ctx.admin
      .from('ading_applications')
      .select('status')
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !currentApp) {
      console.error('[ading/[id]] application not found:', fetchError)
      return fail('Application not found.', 404)
    }

    // no-op: requested status already matches — skip the write
    if (currentApp.status !== status) {
      // bypass rls — officer action; updates ading_applications.status
      // reviewed_by and reviewed_at are derived from the authenticated session — never client-supplied
      // .eq('status', currentApp.status) is an optimistic lock: if another officer changed the status
      // concurrently, 0 rows match and updatedRow is null — we return 409 with reviewer context
      const { data: updatedRow, error } = await ctx.admin
        .from('ading_applications')
        .update({ status, reviewed_by: ctx.member.id, reviewed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', currentApp.status)
        .select('id')
        .maybeSingle()

      if (error) {
        console.error('[ading/[id]] status update error:', error)
        return fail('Failed to update application status.', 500)
      }

      if (!updatedRow) {
        // optimistic lock failed: another officer changed the status between our read and this write.
        // security: message is role-neutral — no reviewer identity lookup/exposure (even
        // officer-to-officer, PII doesn't belong in a conflict-response string)
        const { data: conflictRow } = await ctx.admin
          .from('ading_applications')
          .select('status')
          .eq('id', id)
          .maybeSingle()

        return fail('conflict', 409, {
          message: `This application was already reviewed as ${conflictRow?.status ?? 'unknown'}.`,
          currentStatus: conflictRow?.status ?? null,
        })
      }
    }
  }

  // ── pamilya assignment ────────────────────────────────────
  if (pamilya !== undefined) {
    // resolve the member_id for this ading application
    // bypass rls — reads ading_applications to get the linked member_id
    const { data: appRow, error: appError } = await ctx.admin
      .from('ading_applications')
      .select('member_id')
      .eq('id', id)
      .maybeSingle()

    if (appError || !appRow) {
      console.error('[ading/[id]] application not found:', appError)
      return fail('Application not found.', 404)
    }

    // update members.pamilya directly — pamilya lives on the member, not the application
    // bypass rls — officer action; writes to members table on behalf of an officer
    const { error: memberError } = await ctx.admin
      .from('members')
      .update({ pamilya })
      .eq('id', appRow.member_id)

    if (memberError) {
      console.error('[ading/[id]] pamilya update error:', memberError)
      return fail('Failed to update pamilya assignment.', 500)
    }
  }

  return NextResponse.json({ success: true })
}
