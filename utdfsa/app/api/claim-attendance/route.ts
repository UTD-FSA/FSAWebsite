import { NextResponse } from 'next/server'
import { createUserClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = await createUserClient()
  const body = await req.json()

  const { event_id } = body

  if (!event_id) {
    return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })
  }

  const { data: { user }, } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const { error } = await supabase.from('attendance').insert({
    member_id: member.id,
    event_id,
  })

  if (error) {
    return NextResponse.json({ error: 'Already claimed or failed' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}