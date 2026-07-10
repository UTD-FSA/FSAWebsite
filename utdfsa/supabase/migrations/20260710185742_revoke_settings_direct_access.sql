-- security fix: settings table (including the internal staff address pam_chair_email) was
-- reachable directly by the anon role via app/(pages)/pamilyas/page.tsx's raw
-- supabase.from('settings') call on a public, unauthenticated page — the only non-admin-client
-- dependency on this table anywhere in the codebase (companion code fix removes that call in
-- the same deploy as this migration; every other consumer already uses lib/settings.ts's
-- getSettings(), which uses the admin client).
--
-- settings_public_read (USING true) and settings_admin_update RLS policies are left in place
-- but become fully inert once these grants are gone — consistent with this schema's
-- established pattern of grants gating reachability, RLS as a secondary backstop.

REVOKE ALL ON TABLE "public"."settings" FROM "anon";
REVOKE ALL ON TABLE "public"."settings" FROM "authenticated";
