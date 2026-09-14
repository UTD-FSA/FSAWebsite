// ── lib/membership-activation.ts ──────────────────────────
// pure decision: may a stripe checkout session, retrieved directly from stripe,
// activate this member's membership? extracted from app/(pages)/onboarding/page.tsx,
// which runs it as the race-condition fallback for a stripe-webhook delivery that
// never landed (payment taken, membership_status still 'pending').
//
// notes: the replay fingerprint is the PAYMENT INTENT, not the checkout session id.
//        app/api/membership/checkout/route.ts writes stripe_checkout_session_id
//        eagerly at session *creation*, so that column always already equals the
//        session the member just paid on — comparing it can never tell "fulfilled"
//        from "not fulfilled", and made this whole fallback unreachable. the payment
//        intent is written only at fulfillment (stripe-webhook, or this fallback), so
//        a match means this exact payment already activated them.
//        the metadata.type/member_id checks are load-bearing, not redundant with the
//        replay check: without them any paid session id activates membership — a guest
//        event-ticket session id (handed back in the /events success url), or another
//        member's membership session shared between friends.
//        free sessions (100%-off promo codes) carry no payment intent, so they fall
//        back to "this member has never been fulfilled at all". that deliberately
//        won't rescue a previously-paid member whose *renewal* is a free promo — the
//        webhook stays the primary path; this is only the safety net.

export type CheckoutSessionFacts = {
  payment_status: string | null
  metadata: { type?: string; member_id?: string } | null
  // stripe returns a bare id string unless the caller expands it. accepting both shapes
  // here (rather than casting at the call site) keeps an expanded session from silently
  // comparing an object against a stored id string — that comparison is never equal, which
  // would disable the replay guard entirely.
  payment_intent: string | { id: string } | null
}

export type MemberActivationFacts = {
  id: string
  stripe_payment_intent_id: string | null
  payment_verified_at: string | null
}

export function shouldActivateFromSession(
  session: CheckoutSessionFacts,
  member: MemberActivationFacts
): boolean {
  // payment_status: 'paid' covers normal card payments; 'no_payment_required' covers
  // 100%-off promotion codes (giveaways, officer fee-bypass — legitimate, intentionally
  // still supported here). anything else is not a finished payment.
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
    return false
  }

  if (session.metadata?.type !== 'membership') return false
  if (session.metadata?.member_id !== member.id) return false

  // replay guard — an expired member re-visiting their old success url must not
  // re-activate without paying again
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  if (paymentIntentId) {
    return paymentIntentId !== member.stripe_payment_intent_id
  }

  return member.payment_verified_at == null
}
