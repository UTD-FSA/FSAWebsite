import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const { payment_code, confirmation_id } = await req.json()

  if (!payment_code || !confirmation_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { error } = await supabase
    .from('members')
    .update({ confirmation_id })
    .eq('payment_code', payment_code)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: tx } = await supabase
    .from('venmo_transactions')
    .select('amount_cents')
    .eq('transaction_id', confirmation_id)
    .single()

  if (tx) {
    await supabase
      .from('members')
      .update({
        membership_status: 'active',
        amt_paid: tx.amount_cents,
        payment_verified_at: new Date().toISOString(),
      })
      .eq('payment_code', payment_code)
  }

  return NextResponse.json({ success: true, verified: !!tx })
}
