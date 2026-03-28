import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

function generatePaymentCode(prefix: string = 'FSA') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix}-${code}`
}

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const body = await req.json()

  const { email, first_name, last_name } = body

  if (!email || !first_name || !last_name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const payment_code = generatePaymentCode('FSA')

  const { error } = await supabase
    .from('members')
    .upsert({
      email,
      first_name,
      last_name,
      membership_status: 'pending',
      payment_code,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ payment_code })
}