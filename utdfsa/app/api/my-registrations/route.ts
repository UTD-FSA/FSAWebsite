import { NextResponse } from 'next/server'
import { createUserClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createUserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!member) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      events (*)
    `)
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}