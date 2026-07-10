-- corrects the previous migration (revoke_qr_token_column_and_tighten_events_visibility):
-- a column-level REVOKE does not restrict a role that already holds a
-- table-level SELECT grant — column privileges are additive on top of table
-- privileges in postgres, never subtractive. anon/authenticated still had
-- table-wide SELECT from the original baseline grant, so attend_qr_token
-- remained fully readable despite the earlier REVOKE SELECT (attend_qr_token).
--
-- the correct pattern: revoke table-wide SELECT, then re-grant SELECT on an
-- explicit column allowlist. this list matches lib/constants.ts
-- PUBLIC_EVENT_COLUMNS exactly (every events column except attend_qr_token).

REVOKE SELECT ON TABLE "public"."events" FROM "anon";
REVOKE SELECT ON TABLE "public"."events" FROM "authenticated";

GRANT SELECT (
  "id", "created_at", "name", "description", "event_type", "event_date", "event_end",
  "location", "points", "attend_qr_open", "attend_qr_expires_at",
  "price_cents_members", "price_cents_nonmembers", "eb_price_members", "eb_price_nonmembers",
  "eb_deadline", "is_active", "is_visible", "cover_photo_url", "registration_closes_at"
) ON TABLE "public"."events" TO "anon";

GRANT SELECT (
  "id", "created_at", "name", "description", "event_type", "event_date", "event_end",
  "location", "points", "attend_qr_open", "attend_qr_expires_at",
  "price_cents_members", "price_cents_nonmembers", "eb_price_members", "eb_price_nonmembers",
  "eb_deadline", "is_active", "is_visible", "cover_photo_url", "registration_closes_at"
) ON TABLE "public"."events" TO "authenticated";
