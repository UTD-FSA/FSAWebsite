-- the idempotency ledger (20260716080000) treated "a claim row exists" as "this event was
-- fulfilled". that held only while every failure path could reliably delete its own claim.
-- it can't: the supabase data api returns 504 at ~5s under cpu throttling, and the killed
-- statement still commits afterwards. observed in production 2026-09-14 06:00:46Z — a
-- membership activation PATCH 504'd, releaseClaim()'s DELETE 504'd, stripe's retry 27s later
-- hit the surviving claim row and no-op'd with {"duplicate": true}, and the DELETE landed
-- only after that. stripe recorded a 200, never retried again, and a paid $30 membership was
-- never activated. a second event the same week (evt_1UFMqV..., 2026-09-13 23:30:03Z) hit the
-- same shape and self-healed only by luck of ordering.
--
-- fulfilled_at splits "claimed" from "done", turning the claim into a time-bounded lease:
-- the webhook's duplicate branch may now take over a claim that is unfulfilled AND stale,
-- instead of assuming another worker finished the job. the lease window must stay longer
-- than the function's max execution (observed worst case 11.6s) so two workers can never
-- fulfill concurrently — it lives in app/api/stripe-webhook/route.ts as LEASE_STALE_MS.
-- releaseClaim() is deleted outright by that change: nothing rolls the claim back anymore,
-- so there is no late-committing delete left to race.
--
-- session_id/metadata exist for reconciliation. when the 2026-09-14 event dropped, the
-- ledger could not say which member it belonged to — it had to be rebuilt by hand from the
-- stripe dashboard. recording both at claim time lets the CRITICAL logs and
-- scripts/reconcile-stripe.mjs join against this table instead of guessing.

ALTER TABLE "public"."stripe_events"
  ADD COLUMN "fulfilled_at" timestamp with time zone,
  ADD COLUMN "session_id" text,
  ADD COLUMN "metadata" jsonb;

-- every row that predates this migration was written by the old code path, which only ever
-- inserted a claim after deciding to fulfill and never rolled one back on success. treat
-- them as fulfilled so a redelivery of an old event can't be taken over and re-run.
UPDATE "public"."stripe_events" SET "fulfilled_at" = "processed_at" WHERE "fulfilled_at" IS NULL;

-- supports the takeover probe: WHERE id = $1 AND fulfilled_at IS NULL AND processed_at < $2.
-- partial, because the fulfilled rows it excludes are the overwhelming majority.
CREATE INDEX "idx_stripe_events_unfulfilled"
  ON "public"."stripe_events" USING "btree" ("processed_at")
  WHERE ("fulfilled_at" IS NULL);
