-- ── teardown.sql ────────────────────────────────────────────
-- removes everything loadtest/seed.sql + loadtest/webhook.js + loadtest/register.js wrote.
-- run against the STAGING project only — see loadtest/README.md.
delete from public.members where email like 'loadtest+%@example.invalid';
delete from public.stripe_events where id like 'evt_loadtest_%';
-- pending_registrations_event_id_fkey is ON DELETE CASCADE, so deleting the
-- test event also removes every pending_registrations row register.js created
-- against it — no separate delete needed.
delete from public.events where id = '00000000-0000-4000-9000-000000000001';
