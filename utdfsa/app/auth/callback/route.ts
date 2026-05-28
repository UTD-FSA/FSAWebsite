import { NextResponse } from 'next/server'
import { createUserClient, createAdminClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/member/profile'

  console.log('[callback] hit, code present:', !!code)

  if (!code) {
    console.log('[callback] no code, redirecting to error')
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const supabase = await createUserClient()

  console.log('[callback] calling exchangeCodeForSession')
  const { error, data } = await supabase.auth.exchangeCodeForSession(code)

  console.log('[callback] exchange error:', error?.message ?? 'none')
  console.log('[callback] user email:', data?.user?.email ?? 'no user')
  const allCookies = await (await import('next/headers')).cookies()
  console.log('[callback] cookies after exchange:', allCookies.getAll().map(c => c.name))

  if (error || !data.user) {
    console.log('[callback] exchange failed')
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const adminSupabase = createAdminClient()

  const { data: existingMember } = await adminSupabase
  .from('members')
  .select('id')
  .eq('email', data.user.email!)
  .maybeSingle()

  console.log('[callback] existing member:', !!existingMember)

  if (!existingMember) {
    const firstName = data.user.user_metadata?.given_name
      ?? data.user.user_metadata?.full_name?.split(' ')[0]
      ?? ''
    const lastName = data.user.user_metadata?.family_name
      ?? data.user.user_metadata?.full_name?.split(' ').slice(1).join(' ')
      ?? ''

    const { error: insertError } = await adminSupabase.from('members').insert({
      email: data.user.email!,
      first_name: firstName,
      last_name: lastName,
      role: 'member',
      membership_status: 'pending',
      avatar_url: data.user.user_metadata?.avatar_url ?? null,
    })

    console.log('[callback] insert error:', insertError?.message ?? 'none')
  }

  return NextResponse.redirect(`${origin}${next}`)
}