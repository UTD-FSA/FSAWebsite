import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createUserClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const supabase = await createUserClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const baseUrl = isLocalEnv ? origin : forwardedHost ? `https://${forwardedHost}` : origin

      const email = sessionData.user?.email
      if (email) {
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        if (!member) {
          return NextResponse.redirect(`${baseUrl}/onboarding/questionnaire`)
        }
      }

      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}