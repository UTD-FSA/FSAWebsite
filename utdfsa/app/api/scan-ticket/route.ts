import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // verify officer role
  const { data: officer } = await supabase
    .from('members')
    .select('id, role')
    .eq('email', user.email!)
    .maybeSingle()

  if (!officer || (officer.role !== 'officer' && officer.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { qr_code } = await req.json()

  if (!qr_code) {
    return NextResponse.json({ error: 'No QR code provided' }, { status: 400 })
  }

  const admin = createAdminClient()

  // find the ticket
  const { data: ticket } = await admin
    .from('registration_tickets')
    .select(`
      id,
      attendee_fname,
      attendee_lname,
      attendee_email,
      checked_in,
      checked_in_at,
      registration_id,
      event_registrations (
        payment_status,
        event_id,
        events (
          name
        )
      )
    `)
    .eq('qr_code', qr_code)
    .maybeSingle()

  if (!ticket) {
    return NextResponse.json({
      valid: false,
      reason: 'INVALID_TICKET',
      message: 'Ticket not found',
    })
  }

  const registration = ticket.event_registrations as any

  if (registration?.payment_status !== 'paid') {
    return NextResponse.json({
      valid: false,
      reason: 'NOT_PAID',
      message: 'Payment not verified',
    })
  }

  if (ticket.checked_in) {
    return NextResponse.json({
      valid: false,
      reason: 'ALREADY_CHECKED_IN',
      message: 'Already checked in',
      checked_in_at: ticket.checked_in_at,
      attendee_name: `${ticket.attendee_fname} ${ticket.attendee_lname}`,
    })
  }

  // mark as checked in
  await admin
    .from('registration_tickets')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: officer.id,
    })
    .eq('id', ticket.id)

  return NextResponse.json({
    valid: true,
    reason: 'SUCCESS',
    message: 'Check in successful',
    attendee_name: `${ticket.attendee_fname} ${ticket.attendee_lname}`,
    event_name: registration?.events?.name,
  })
}