-- security fix: guest (member_id IS NULL) event registrations had no dedup constraint —
-- postgres unique constraints treat NULL as distinct, so unique_member_event_registration's
-- WHERE member_id IS NOT NULL clause never applied to guest rows. one person could resubmit
-- the free-registration form repeatedly with the same guest email and mint unlimited
-- tickets/check-ins for a capacity-limited free event.
--
-- lower(guest_email) matches the app-level dedup lookup added in
-- app/api/events/register/route.ts; lib/schemas.ts now trims the email before it reaches
-- the db too, so whitespace-only variants collide against this index as well.

CREATE UNIQUE INDEX "unique_guest_event_registration"
  ON "public"."event_registrations" USING "btree" ("event_id", "lower"("guest_email"))
  WHERE ("member_id" IS NULL);
