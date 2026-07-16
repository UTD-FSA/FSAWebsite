-- security fix (SECURITY_AUDIT.md H3): stripe webhook had no idempotency guard beyond the
-- signature check. a replayed/retried checkout.session.completed re-ran the full handler —
-- duplicate confirmation/ticket emails, and membership_expires_at silently re-stamped from
-- *current* settings on every redelivery. this ledger lets the webhook claim each stripe
-- event.id exactly once before doing any fulfillment write; a duplicate delivery hits the
-- primary-key unique_violation and no-ops. see app/api/stripe-webhook/route.ts.
--
-- follows the settings-table pattern (20260710185742): RLS enabled AND grants revoked from
-- anon/authenticated, so a future ALTER DEFAULT PRIVILEGES-granted table (see M5 in the audit)
-- doesn't accidentally expose this to clients. only the service-role webhook writes/reads it.

CREATE TABLE "public"."stripe_events" (
    "id" text NOT NULL,
    "type" text NOT NULL,
    "processed_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."stripe_events" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."stripe_events" FROM "anon";
REVOKE ALL ON TABLE "public"."stripe_events" FROM "authenticated";
