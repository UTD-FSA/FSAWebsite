import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

function extractPaymentCode(text: string) {
  const match = text.match(/(FSA|EVT)-[A-Z0-9]{8}/)
  return match ? match[0] : null
}

function extractAmount(text: string) {
  const match = text.match(/\$([0-9]+(\.[0-9]{2})?)/)
  return match ? Math.round(parseFloat(match[1]) * 100) : null
}

export async function POST() {
  const supabase = createAdminClient()

  // Placeholder: replace with real Gmail API fetch
  const emails = [] as { body: string }[]

  for (const email of emails) {
    const code = extractPaymentCode(email.body)
    const amt_paid = extractAmount(email.body)

    if (!code || !amt_paid) continue

    // Try event registrations first
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('payment_code', code)
      .single()

    if (registration) {
      const isValid = amt_paid >= registration.amt_expected

      await supabase
        .from('event_registrations')
        .update({
          payment_status: isValid ? 'paid' : 'failed',
          amt_paid,
          payment_verified_at: new Date().toISOString(),
        })
        .eq('id', registration.id)

      continue
    }

    // Try membership
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('payment_code', code)
      .single()

    if (member) {
      await supabase
        .from('members')
        .update({
          membership_status: 'active',
          amt_paid,
          payment_verified_at: new Date().toISOString(),
        })
        .eq('id', member.id)
    }
  }

  return NextResponse.json({ success: true })
}