-- self-audit finding: stripe_events (see 20260716080000_add_stripe_events_ledger.sql) has
-- no retention — one row per stripe webhook event, forever. stripe only replays events for
-- ~30 days, so nothing past that is useful. pg_cron isn't installed on this project, so
-- pruning happens inline in the webhook route (app/api/stripe-webhook/route.ts) instead of
-- a scheduled job — this index is what makes that delete's WHERE clause cheap.
create index if not exists stripe_events_processed_at_idx
  on public.stripe_events (processed_at);
