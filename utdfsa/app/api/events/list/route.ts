import { NextResponse } from 'next/server'
import { createUserClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createUserClient()

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

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('event_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = new Date()

  const formatted = events.map((event) => {
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

    return {
      ...event,
      price_display: price,
      is_early_bird: !!isEarly,
    }
  })

  return NextResponse.json(formatted)
}