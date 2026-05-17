import { NextResponse } from 'next/server'
import { createUserClient } from '@/utils/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createUserClient()

  const { id: event_id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let member = null
  if (user) {
    const res = await supabase
      .from('members')
      .select('*')
      .eq('email', user.email)
      .single()
    member = res.data
  }

  const isMember = !!member && member.membership_status === 'active'

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', event_id)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const now = new Date()
  const isEarly =
    event.eb_deadline &&
    new Date(event.eb_deadline) > now

  let price

  if (isMember) {
    price = isEarly
      ? event.eb_price_members ?? event.price_cents_members
      : event.price_cents_members
  } else {
    price = isEarly
      ? event.eb_price_nonmembers ?? event.price_cents_nonmembers
      : event.price_cents_nonmembers
  }

  let alreadyRegistered = false

  if (member) {
    const { data } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('member_id', member.id)
      .maybeSingle()

    alreadyRegistered = !!data
  }

  return NextResponse.json({
    ...event,
    price_display: price,
    is_early_bird: !!isEarly,
    alreadyRegistered,
  })
}