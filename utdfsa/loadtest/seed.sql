-- ── seed.sql ────────────────────────────────────────────────
-- settings + 200 throwaway members for load-testing the stripe webhook's
-- membership branch. members.id has no fk to auth.users, so plain inserts
-- work — these rows never need a real supabase auth user behind them.
--
-- deterministic member ids so loadtest/webhook.js can compute a member id
-- from a vu index without a lookup query. run against the STAGING project
-- only — see loadtest/README.md.

-- getSettings() (lib/settings.ts:46-49) throws if any of these 4 are missing,
-- which the webhook turns into a 500 (route.ts:330-334) — a fresh project's
-- settings table starts empty, so every load-test request would 500 without
-- this. values are placeholders, not meant to mirror prod.
insert into public.settings (key, value) values
  ('membership_price_cents', '2500'),
  ('membership_early_bird_price_cents', '2000'),
  ('membership_early_bird_deadline', '2026-12-31T23:59:59Z'),
  ('membership_year', '2026-2027'),
  ('membership_expiry_month', '6'),
  ('membership_expiry_day', '30')
on conflict (key) do nothing;

insert into public.members (id, email, first_name, last_name, membership_status, onboarding_complete)
select
  ('00000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  'loadtest+' || i || '@example.invalid',
  'Load', 'Test ' || i, 'pending', false
from generate_series(1, 200) as i
on conflict (id) do nothing;

-- one paid, active event for loadtest/register.js's rush scenario against
-- POST /api/events/register (the guest/anonymous, paid path — always
-- nonmember pricing since these requests carry no auth cookie). deterministic
-- id (9000 prefix, distinct from members' 8000 prefix) so the script doesn't
-- need a lookup. is_visible=false keeps it off any staging events listing —
-- register.ts never checks that column, so this has no effect on the test.
insert into public.events (
  id, name, event_type, event_date, price_cents_members, price_cents_nonmembers,
  is_active, is_visible, registration_closes_at
) values (
  '00000000-0000-4000-9000-000000000001', 'Loadtest Gala', 'Social',
  '2026-12-01T18:00:00Z', 1500, 2000, true, false, null
)
on conflict (id) do nothing;
