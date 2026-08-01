-- pending event-ticket checkouts, keyed by stripe session rather than by identity.
-- event_registrations previously held a 'pending' row created before payment, unique per
-- (event_id, member_id) / (event_id, lower(guest_email)). that made a second checkout attempt
-- overwrite the first, so a stale session could fulfill a later attempt's ticket count, and a
-- guest who closed the checkout tab was 409'd out of re-registering until stripe expired the
-- session (up to 24h; 30min on early-bird, where they also silently lost the eb price).
-- keying pending state by session id lets concurrent checkouts coexist and makes
-- event_registrations paid-only. see app/api/events/register/route.ts + stripe-webhook/route.ts.
--
-- follows the stripe_events pattern (20260716080000): RLS enabled AND grants revoked from
-- anon/authenticated. this table holds attendee PII (names + emails) before payment, so only
-- the service-role webhook and register route may read it.

CREATE TABLE "public"."pending_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "member_id" "uuid",
    "stripe_checkout_session_id" "text",
    "attendees" "jsonb" NOT NULL,
    "num_tickets" integer NOT NULL,
    "amt_expected" integer NOT NULL,
    "guest_email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pending_registrations_session_key" UNIQUE ("stripe_checkout_session_id"),
    CONSTRAINT "pending_registrations_num_tickets_check" CHECK ("num_tickets" > 0),
    CONSTRAINT "pending_registrations_attendees_len_check"
      CHECK ("jsonb_array_length"("attendees") = "num_tickets")
);

ALTER TABLE ONLY "public"."pending_registrations"
  ADD CONSTRAINT "pending_registrations_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."pending_registrations"
  ADD CONSTRAINT "pending_registrations_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE CASCADE;

-- supports the inline expiry prune in the webhook
CREATE INDEX "idx_pending_registrations_expires_at"
  ON "public"."pending_registrations" USING "btree" ("expires_at");

ALTER TABLE "public"."pending_registrations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."pending_registrations" FROM "anon";
REVOKE ALL ON TABLE "public"."pending_registrations" FROM "authenticated";

-- guest dedup now applies to FREE registrations only. its original purpose
-- (20260710185702) was stopping repeated free-form submissions minting unlimited tickets —
-- still needed. for paid rows it would instead forbid a guest from ever placing a second
-- (genuinely paid) order, which is normal ecommerce behavior and is now allowed.
-- members are deliberately NOT relaxed: unique_member_event_registration and
-- check_member_single_ticket both stay, so the member auto-discount remains one per person.
DROP INDEX IF EXISTS "public"."unique_guest_event_registration";

CREATE UNIQUE INDEX "unique_free_guest_event_registration"
  ON "public"."event_registrations" USING "btree" ("event_id", "lower"("guest_email"))
  WHERE ("member_id" IS NULL AND "amt_expected" = 0);
