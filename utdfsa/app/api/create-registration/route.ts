import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

function generatePaymentCode(prefix: string = 'EVT') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix}-${code}`
}

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json()

  const {
    event_id,
    member_id,
    guest_fname,
    guest_lname,
    guest_email,
    num_tickets = 1,
  } = body

  if (!event_id) {
    return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', event_id)
    .single()

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const isMember = !!member_id

  if (isMember && num_tickets > 1) {
    return NextResponse.json(
      { error: 'Members can only purchase 1 ticket' },
      { status: 400 }
    )
  }

  const now = new Date()
  const isEarly =
    event.eb_deadline &&
    new Date(event.eb_deadline) > now

  let pricePerTicket

  if (isMember) {
    pricePerTicket = isEarly
      ? event.eb_price_members ?? event.price_cents_members
      : event.price_cents_members
  } else {
    pricePerTicket = isEarly
      ? event.eb_price_nonmembers ?? event.price_cents_nonmembers
      : event.price_cents_nonmembers
  }

  const amt_expected = pricePerTicket * num_tickets

  const payment_code = generatePaymentCode('EVT')
  const qr_code = crypto.randomUUID()

  const { error } = await supabase.from('event_registrations').insert({
    event_id,
    member_id: isMember ? member_id : null,
    guest_fname,
    guest_lname,
    guest_email,
    num_tickets,
    payment_code,
    qr_code,
    payment_status: 'pending',
    amt_expected,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    payment_code,
    amt_expected,
  })
}