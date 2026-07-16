-- security fix (SECURITY_AUDIT.md L1): "members can update own row" and
-- "attendance_insert_own" are RLS policies with no column restriction, but neither
-- has EVER been reachable — the baseline schema (20260710095244) never granted
-- UPDATE on members or INSERT on attendance to anon/authenticated, and the later
-- privilege-revoke migration (20260710185817) only stripped REFERENCES/TRIGGER/
-- TRUNCATE/MAINTAIN, leaving that fact unchanged. all writes to both tables go
-- exclusively through the service-role admin client by design.
--
-- the risk isn't that these policies do anything today — it's that they SIT LOADED:
-- if a future migration (or the ALTER DEFAULT PRIVILEGES footgun closed in
-- 20260716090000) ever re-grants UPDATE/INSERT to authenticated, "members can update
-- own row" has no WITH CHECK and no column list, so a member could self-set
-- role='admin', points, membership_status, amt_paid in one request — full privilege
-- escalation with zero API involved. same shape for attendance_insert_own inflating
-- goodphil_eligibility counts.
--
-- dropping them (rather than rewriting with a column-restricted WITH CHECK) means a
-- future accidental re-grant fails CLOSED: RLS default-denies a command with no
-- matching policy, so the failure mode becomes "nothing happens" instead of "silent
-- privilege escalation." if member-initiated self-updates are ever wanted, a new
-- policy should be written deliberately with an explicit column allowlist.

DROP POLICY IF EXISTS "members can update own row" ON "public"."members";
DROP POLICY IF EXISTS "attendance_insert_own" ON "public"."attendance";
