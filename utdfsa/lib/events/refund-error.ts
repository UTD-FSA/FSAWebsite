// ── lib/events/refund-error.ts ─────────────────────────────
// classifyRefundError() — decides what a stripe-webhook auto-refund failure means:
// settle as-is (money already back), retry (transient, redelivery may succeed), or stuck
// (permanent, needs a human). extracted from app/api/stripe-webhook/route.ts so the
// decision is unit-testable without spinning up the route.
//
// data:  none — caller passes the caught error
// notes: reads only err.type / err.code, both plain strings on stripe's error classes, so
//        this file never imports the stripe sdk. verified against the installed sdk:
//        StripeError.type is set to the error class name at runtime
//        (node_modules/stripe/cjs/Error.js), and .code carries the api error code.

export type RefundOutcome = 'settled' | 'retry' | 'stuck'

// transient by nature — the same call can succeed on stripe's next delivery. deliberately
// narrow: anything permanent retried here would 500 on every redelivery for stripe's full
// ~72h retry window, and sustained failures are how a webhook endpoint gets disabled —
// which would take membership fulfillment down with it.
const RETRYABLE_TYPES = new Set(['StripeConnectionError', 'StripeAPIError', 'StripeRateLimitError'])

export function classifyRefundError(err: unknown): RefundOutcome {
  const { type, code } = (err ?? {}) as { type?: unknown; code?: unknown }

  // already fully refunded — an earlier delivery beat us past the 24h idempotency-key
  // window, or an officer refunded by hand. money is back either way. checked before type
  // so this wins even if stripe ever attaches it to a retryable-looking error class.
  if (code === 'charge_already_refunded') return 'settled'

  if (typeof type === 'string' && RETRYABLE_TYPES.has(type)) return 'retry'

  // charge_disputed, balance_insufficient, auth/permission errors, non-stripe throws —
  // retrying fixes none of them. log loudly, let a human reconcile in stripe.
  return 'stuck'
}
