// ── lib/events/fulfillment.ts ─────────────────────────────
// classifyFulfillment() — decides what a checkout.session.completed webhook event
// should do with a pending_registrations row, given the stripe session that just paid.
// extracted from app/api/stripe-webhook/route.ts so the decision is unit-testable
// without spinning up the route.
//
// data:  none — caller passes the pending row (or null) and the paid session id in
// notes: pending_registrations is keyed by stripe_checkout_session_id (unique). the
//        pending row is written in two steps by register/route.ts — inserted first,
//        then updated with the session id once stripe confirms the session — so a
//        narrow window exists where the row exists but its session id is still null.
//        that window must retry, not refund: the payment is real and in-flight, just
//        not bound to a row yet.

export type FulfillmentAction = 'fulfill' | 'retry' | 'refund'

export interface FulfillmentInput {
  pending: { stripe_checkout_session_id: string | null } | null
  sessionId: string
}

export function classifyFulfillment({ pending, sessionId }: FulfillmentInput): FulfillmentAction {
  // no pending row at all — pruned by expiry, or this session's metadata pointed at a
  // pending_id that never existed. either way this payment can never be fulfilled.
  if (pending === null) return 'refund'

  // row exists but hasn't been bound to a session yet — register/route.ts's write is
  // still in flight. not a stale session; ask stripe to retry the webhook shortly.
  if (pending.stripe_checkout_session_id === null) return 'retry'

  // bound to a different session — this session is stale/superseded, or a replay of an
  // event whose row has since been consumed and re-pointed. cannot fulfill; refund.
  if (pending.stripe_checkout_session_id !== sessionId) return 'refund'

  return 'fulfill'
}
