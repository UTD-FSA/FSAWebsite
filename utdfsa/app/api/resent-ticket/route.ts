import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { registration_id } = body

  if (!registration_id) {
    return NextResponse.json({ error: 'Missing registration_id' }, { status: 400 })
  }

  const { data: registration, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('id', registration_id)
    .single()

  if (error || !registration) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  // Placeholder for email logic (Resend, etc.)
  // sendEmail(registration.guest_email, registration.qr_code)

  return NextResponse.json({
    success: true,
    message: 'Ticket resent (email logic not implemented here)',
  })
}