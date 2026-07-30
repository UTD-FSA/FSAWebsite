// ── lib/events/pricing.ts ─────────────────────────────────
// pure event-ticket pricing resolution — extracted from
// app/api/events/register/route.ts so the early-bird / member-tier logic can
// be unit tested without spinning up the route.
//
// data:  none — caller passes the relevant `events` row fields in
// notes: this only prices a ticket; it does not enforce the member ticket cap
//        (see lib/events/registration-ownership.ts for that rule)

export interface EventPricingInput {
  priceCentsMembers: number
  priceCentsNonmembers: number
  ebPriceMembers: number | null
  ebPriceNonmembers: number | null
  ebDeadline: string | null
  isMember: boolean
  ticketCount: number
  // injectable for tests; defaults to the real current time
  now?: Date
}

export interface EventPricingResult {
  isEarlyBird: boolean
  pricePerTicket: number
  totalAmount: number
}

export function resolveEventPricing(input: EventPricingInput): EventPricingResult {
  const now = input.now ?? new Date()

  // early bird applies only when a deadline and both early-bird prices are set,
  // and the current server time is before that deadline
  const isEarlyBird =
    input.ebDeadline != null &&
    input.ebPriceMembers != null &&
    input.ebPriceNonmembers != null &&
    now < new Date(input.ebDeadline)

  // select the correct price tier based on membership and early-bird status; values are already in cents
  const pricePerTicket = isEarlyBird
    ? (input.isMember ? input.ebPriceMembers! : input.ebPriceNonmembers!)
    : (input.isMember ? input.priceCentsMembers : input.priceCentsNonmembers)

  // total is price per ticket multiplied by ticket count
  const totalAmount = pricePerTicket * input.ticketCount

  return { isEarlyBird, pricePerTicket, totalAmount }
}
