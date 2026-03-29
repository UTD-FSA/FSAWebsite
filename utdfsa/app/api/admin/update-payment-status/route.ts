import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { registration_id, member_id, status } = body

  if (!status) {
    return NextResponse.json({ error: 'Missing status' }, { status: 400 })
  }

  if (registration_id) {
    await supabase
      .from('event_registrations')
      .update({
        payment_status: status,
        payment_verified_at: new Date().toISOString(),
      })
      .eq('id', registration_id)
  }

  if (member_id) {
    await supabase
      .from('members')
      .update({
        membership_status: status === 'paid' ? 'active' : 'pending',
        payment_verified_at: new Date().toISOString(),
      })
      .eq('id', member_id)
  }

  return NextResponse.json({ success: true })
}