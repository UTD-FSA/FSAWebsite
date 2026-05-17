import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { qr_code } = body

  if (!qr_code) {
    return NextResponse.json({ error: 'Missing qr_code' }, { status: 400 })
  }

  const { data: registration, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('qr_code', qr_code)
    .single()

  if (error || !registration) {
    return NextResponse.json({ error: 'Invalid ticket' }, { status: 404 })
  }

  if (registration.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 400 })
  }

  if (registration.checked_in) {
    return NextResponse.json({ error: 'Already checked in' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('event_registrations')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    })
    .eq('id', registration.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Check-in successful',
  })
}