-- security fix (SECURITY_AUDIT.md L2): members has had a table-wide SELECT grant to
-- anon/authenticated since the baseline schema, so any authenticated member can read
-- their OWN row's stripe_customer_id / stripe_payment_intent_id / payment_metadata /
-- amt_paid / payment_verified_at / payment_provider / payment_method /
-- stripe_checkout_session_id via direct PostgREST — none of which any page actually
-- displays. self-only today, so bounded, but every new members column silently joins
-- the readable set, and this is the one table left without the column-allowlist
-- pattern events already uses (20260710182936_fix_events_column_grant_allowlist.sql).
--
-- this allowlist was built by enumerating every RLS-scoped (createUserClient /
-- requireUser / requireActiveMember) read of members across the entire app — the
-- union of every column any of those ~14 call sites actually selects. that union is
-- every column except the 8 payment-internal ones below, which no RLS-scoped query
-- anywhere touches (only the service-role admin client reads them, e.g. the stripe
-- webhook and onboarding race-condition patch — both unaffected, service_role
-- bypasses RLS/grants entirely).
--
-- excluded: amt_paid, payment_verified_at, payment_provider, stripe_checkout_session_id,
-- stripe_payment_intent_id, payment_method, payment_metadata, stripe_customer_id.

REVOKE SELECT ON TABLE "public"."members" FROM "anon";
REVOKE SELECT ON TABLE "public"."members" FROM "authenticated";

GRANT SELECT (
  "id", "created_at", "email", "first_name", "last_name", "role", "membership_status",
  "membership_expires_at", "points", "phone", "year", "major", "shirt_size", "pamilya",
  "avatar_url", "onboarding_complete", "contact_email", "member_type"
) ON TABLE "public"."members" TO "anon";

GRANT SELECT (
  "id", "created_at", "email", "first_name", "last_name", "role", "membership_status",
  "membership_expires_at", "points", "phone", "year", "major", "shirt_size", "pamilya",
  "avatar_url", "onboarding_complete", "contact_email", "member_type"
) ON TABLE "public"."members" TO "authenticated";
