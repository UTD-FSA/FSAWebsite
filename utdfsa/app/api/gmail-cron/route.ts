import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

function extractAmount(text: string) {
  const match = text.match(/\$([0-9]+(\.[0-9]{2})?)/)
  return match ? Math.round(parseFloat(match[1]) * 100) : null
}

function extractTransactionId(text: string) {
  const match = text.match(/Transaction\s+ID[:\s]+(\d{19})/i)
  return match ? match[1] : null
}

export async function POST(req: Request) {
  const supabase = createAdminClient()
  const { emails } = await req.json() as { emails: string[] }

  for (const body of emails) {
    const transaction_id = extractTransactionId(body)
    if (!transaction_id) continue

    const amount_cents = extractAmount(body)

    await supabase
      .from('venmo_transactions')
      .upsert({ transaction_id, amount_cents }, { onConflict: 'transaction_id', ignoreDuplicates: true })

    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('confirmation_id', transaction_id)
      .eq('membership_status', 'pending')
      .single()

    if (member) {
      await supabase
        .from('members')
        .update({
          membership_status: 'active',
          amt_paid: amount_cents,
          payment_verified_at: new Date().toISOString(),
        })
        .eq('id', member.id)
    }
  }

  return NextResponse.json({ success: true })
}