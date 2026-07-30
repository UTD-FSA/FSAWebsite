// ── lib/events/registration-ownership.ts ──────────────────
// pure decision: does an event registration attempt use the member_id path
// (attributed to a signed-in member) or the guest path (member_id null)?
// extracted from app/api/events/register/route.ts.
//
// notes: event_registrations has a DB CHECK (check_member_single_ticket:
//        member_id IS NULL OR num_tickets = 1). an active member is already
//        capped to 1 ticket by the route before this runs, so this only changes
//        behavior for an expired/inactive member buying 2+ tickets — they're
//        routed to the guest path instead of violating that constraint. buying
//        exactly 1 ticket still keeps their member_id either way.

// generic type predicate (member is T, not just boolean) so callers keep the same
// null-narrowing on `member` inside the `if` block that a plain `if (member)` gave them
export function shouldUseMemberPath<T extends { id: string }>(
  member: T | null,
  ticketCount: number
): member is T {
  return member != null && ticketCount === 1
}
