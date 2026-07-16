-- security fix (SECURITY_AUDIT.md M5): the baseline schema (20260710095244) left
-- ALTER DEFAULT PRIVILEGES grants in place for role "postgres" in schema "public",
-- so every table/function/sequence created from here on is BORN with full CRUD
-- granted to anon and authenticated. every table today has RLS enabled, so a grant
-- alone isn't currently exploitable — but the failure mode is one migration away:
-- a future table that forgets ENABLE ROW LEVEL SECURITY is immediately world-
-- readable/writable via PostgREST, and a future SECURITY DEFINER function is
-- immediately EXECUTE-able by anon.
--
-- this revokes those default privileges going forward. it does NOT touch existing
-- objects or their current grants — only objects created AFTER this migration runs.
--
-- consequence for future migrations: a new client-facing table no longer inherits
-- access. it must explicitly GRANT the columns it wants anon/authenticated to see,
-- same as the events column-allowlist pattern (20260710182936_fix_events_column_
-- grant_allowlist.sql). "forgot to grant" now fails closed (403/empty result);
-- "forgot to revoke" (today's failure mode) can no longer happen by omission.

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon", "authenticated";
