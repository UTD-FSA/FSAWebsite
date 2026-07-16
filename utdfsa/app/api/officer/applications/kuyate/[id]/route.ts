// ── route.ts ─────────────────────────────────────────────
// PATCH /api/officer/applications/kuyate/[id] — update kuyate application status and send notification email
//
// data:  kuyate_applications, members
// deps:  resend (kuyate status email)
// notes: email is sent only when transitioning to a final status (accepted/rejected) and
//        only once per application — status_email_sent_at guards against duplicate sends
import { requireOfficer } from '@/lib/auth'
import { kuyateStatusEmailHtml } from '@/lib/email/kuyate-status'
import { resend } from '@/lib/resend'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { fail, failValidation } from '@/lib/api-response'

const patchSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected']),
})

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

  const { status } = parsed.data

  // ── fetch application ─────────────────────────────────────
  // fetch application first — need member_id, pamilya_name, status, and status_email_sent_at
  // bypass rls — officer action; reads kuyate_applications to get data needed for the email and lock check
  const { data: appRow, error: fetchError } = await ctx.admin
    .from('kuyate_applications')
    .select('id, member_id, pamilya_name, status, status_email_sent_at')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !appRow) {
    console.error('[kuyate/[id]] application not found:', fetchError)
    return fail('Application not found.', 404)
  }

  // no-op: requested status already matches — skip write and email
  if (appRow.status === status) {
    return NextResponse.json({ success: true })
  }

  // ── status update ─────────────────────────────────────────
  // bypass rls — officer action; updates kuyate_applications.status
  // reviewed_by and reviewed_at are derived from the authenticated session — never client-supplied
  // .eq('status', appRow.status) is an optimistic lock: if another officer changed the status
  // concurrently, 0 rows match and updatedRow is null — we return 409 with reviewer context
  const { data: updatedRow, error: updateError } = await ctx.admin
    .from('kuyate_applications')
    .update({ status, reviewed_by: ctx.member.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', appRow.status)
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('[kuyate/[id]] status update error:', updateError)
    return fail('Failed to update application status.', 500)
  }

  if (!updatedRow) {
    // optimistic lock failed: another officer changed the status between our read and this write.
    // security: message is role-neutral — no reviewer identity lookup/exposure (even
    // officer-to-officer, PII doesn't belong in a conflict-response string)
    const { data: currentRow } = await ctx.admin
      .from('kuyate_applications')
      .select('status')
      .eq('id', id)
      .maybeSingle()

    return fail('conflict', 409, {
      message: `This application was already reviewed as ${currentRow?.status ?? 'unknown'}.`,
      currentStatus: currentRow?.status ?? null,
    })
  }

  // ── status notification email ─────────────────────────────
  // send status notification email when transitioning to a final status,
  // but only if no email has been sent yet for this application. claim the
  // send with a conditional update first — .is('status_email_sent_at', null)
  // makes this atomic, so if two requests race, only one gets a row back
  // and sends the email; the loser sees zero rows and skips.
  if (status === 'accepted' || status === 'rejected') {
    const { data: claimedRow } = await ctx.admin
      .from('kuyate_applications')
      .update({ status_email_sent_at: new Date().toISOString() })
      .eq('id', id)
      .is('status_email_sent_at', null)
      .select('id')
      .maybeSingle()

    if (claimedRow) {
      try {
        // bypass rls — fetch the applicant's name and contact email to address the notification
        const { data: memberRow } = await ctx.admin
          .from('members')
          .select('first_name, email, contact_email')
          .eq('id', appRow.member_id)
          .maybeSingle()

        // RESEND_FROM_EMAIL must be set in env for emails to send — skip silently if absent
        if (memberRow && process.env.RESEND_FROM_EMAIL) {
          // prefer contact_email over login email so member gets mail at their preferred address
          const to = memberRow.contact_email ?? memberRow.email
          const { subject, html } = kuyateStatusEmailHtml({
            firstName: memberRow.first_name,
            status,
            pamilyaName: appRow.pamilya_name ?? undefined,
          })

          // sends a kuyate application status email (accepted or rejected) to the applicant
          const { error: emailError } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to,
            subject,
            html,
          })

          if (emailError) {
            console.error('[kuyate/[id]] resend error for application', id, emailError)
            // release the claim so a future status transition can retry the send —
            // only concurrent *simultaneous* requests should be blocked, not real failures
            await ctx.admin
              .from('kuyate_applications')
              .update({ status_email_sent_at: null })
              .eq('id', id)
          }
        }
      } catch (err) {
        console.error('[kuyate/[id]] unexpected error sending status email:', err)
        // same as above — don't let a thrown error permanently block a resend
        await ctx.admin
          .from('kuyate_applications')
          .update({ status_email_sent_at: null })
          .eq('id', id)
      }
    }
  }

  return NextResponse.json({ success: true })
}
