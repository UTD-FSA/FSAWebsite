import { NextResponse } from 'next/server'
import { createUserClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createUserClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null, member: null, isMember: false })
  }

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('email', user.email)
    .single()

  return NextResponse.json({
    user,
    member,
    isMember: !!member && member.membership_status === 'active',
  })
}