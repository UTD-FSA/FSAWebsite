-- security fix: attend_qr_token was readable by anyone with the public anon
-- key via a direct PostgREST call (column-level privilege, not row-level —
-- events_select_public only restricted rows, not columns), letting a remote
-- caller self-award attendance without ever scanning the physical QR code.
-- also tightens events_select_public to respect is_visible, which the app's
-- own public queries always filtered on but RLS never enforced — draft/
-- unpublished events were fully readable via direct REST before this.
--
-- app/(pages)/attend/page.tsx is the only anon/authenticated-role caller that
-- reads events by attend_qr_token; it must use the admin (service-role)
-- client going forward since the user client no longer has SELECT on this
-- column (Postgres requires column privilege to reference a column in a
-- WHERE clause, not just to return it).

-- ── column-level revoke: attend_qr_token ──────────────────────────────────

REVOKE SELECT ("attend_qr_token") ON TABLE "public"."events" FROM "anon";
REVOKE SELECT ("attend_qr_token") ON TABLE "public"."events" FROM "authenticated";

-- ── tighten events_select_public to also require is_visible ──────────────
-- officer/admin tooling is unaffected — app/api/officer/events/** always
-- reads through the admin client, which bypasses RLS entirely.

ALTER POLICY "events_select_public" ON "public"."events"
  USING ((("is_active" = true) AND ("is_visible" = true)));
