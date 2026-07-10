-- defense-in-depth: anon/authenticated never need REFERENCES, TRIGGER, TRUNCATE, or
-- MAINTAIN on any application table — these NOLOGIN, PostgREST-only roles only ever
-- read or write through this project's admin/service-role client or the
-- record_attendance RPC (also called via admin client). every write path was
-- exhaustively confirmed to go through the admin client; no code path anywhere issues
-- a direct insert/update/delete via the browser/user client on these 9 objects.
--
-- SELECT grants are left completely untouched everywhere — including events' existing
-- column-restricted SELECT allowlist (20260710182936_fix_events_column_grant_allowlist.sql)
-- and the ading/kuyate RLS-scoped "select own row" access. REVOKE of one privilege type
-- can never affect a different privilege type's grant (independent ACL entries per
-- privilege in postgres), so this is safe without re-granting SELECT anywhere.
--
-- settings is intentionally omitted here — see revoke_settings_direct_access.sql, which
-- already revokes ALL (including SELECT) on that table.

REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE "public"."ading_applications" FROM "anon", "authenticated";
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE "public"."attendance" FROM "anon", "authenticated";
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE "public"."event_registrations" FROM "anon", "authenticated";
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE "public"."events" FROM "anon", "authenticated";
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE "public"."galleries" FROM "anon", "authenticated";
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE "public"."members" FROM "anon", "authenticated";
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE "public"."kuyate_applications" FROM "anon", "authenticated";
REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE "public"."registration_tickets" FROM "anon", "authenticated";

-- goodphil_eligibility: non-updatable view (LEFT JOIN LATERAL, no INSTEAD OF trigger) — writes
-- are already rejected by postgres regardless of grants, but GRANT ALL leaves INSERT/UPDATE/
-- DELETE/REFERENCES/TRIGGER/TRUNCATE/MAINTAIN granted for no reason. keep SELECT only.
REVOKE INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE, MAINTAIN
  ON TABLE "public"."goodphil_eligibility" FROM "anon", "authenticated";
