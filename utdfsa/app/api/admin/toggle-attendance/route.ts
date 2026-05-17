import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { event_id, is_open } = body

  const { error } = await supabase
    .from('events')
    .update({ attend_qr_open: is_open })
    .eq('id', event_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}