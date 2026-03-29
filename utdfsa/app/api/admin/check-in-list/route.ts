import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { event_id } = body

  const { data, error } = await supabase
    .from('event_registrations')
    .select('checked_in')
    .eq('event_id', event_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = data.length
  const checked_in = data.filter((r) => r.checked_in).length

  return NextResponse.json({
    total,
    checked_in,
    pending: total - checked_in,
  })
}