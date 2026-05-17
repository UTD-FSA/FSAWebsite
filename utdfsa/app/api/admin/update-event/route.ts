import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}