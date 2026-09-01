// ── lib/settings.ts ───────────────────────────────────────
// reads business configuration from the settings table in supabase
// all prices, deadlines, and toggles should live here not in env vars
// throws an error if required keys are missing — check the settings table if this throws
//
// data:  settings (key, value)
// deps:  createAdminClient (bypasses rls — settings table is officer-managed)
// notes: the key/value fetch is cached (unstable_cache, tag 'settings') — the
//        expiry-date arithmetic below it stays outside the cache since it depends
//        on the current date, not on the settings themselves. if an officer-facing
//        settings editor is ever added, its write route must call
//        revalidateTag('settings', { expire: 0 }) or edits won't show up for
//        up to the revalidate window below.

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { computeMembershipExpiry } from '@/lib/membership-expiry'

// ── cached key/value fetch ─────────────────────────────────

const getSettingsMap = unstable_cache(
  async (): Promise<Record<string, string>> => {
    // bypass rls — client roles have no direct read access to settings
    // (migration: revoke_settings_direct_access), so the admin client is required
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('settings')
      .select('key, value')

    if (error || !data) {
      throw new Error('failed to load settings')
    }

    return Object.fromEntries(data.map(row => [row.key, row.value]))
  },
  ['settings-map'],
  { revalidate: 300, tags: ['settings'] }
)

// ── settings loader ───────────────────────────────────────

export async function getSettings() {
  const map = await getSettingsMap()

  // required keys — throw explicitly so a misconfigured db surfaces immediately
  if (!map.membership_price_cents) throw new Error('settings: membership_price_cents not found in database')
  if (!map.membership_early_bird_price_cents) throw new Error('settings: membership_early_bird_price_cents not found in database')
  if (!map.membership_early_bird_deadline) throw new Error('settings: membership_early_bird_deadline not found in database')
  if (!map.membership_year) throw new Error('settings: membership_year not found in database')

  // ── membership expiry date arithmetic ──────────────────

  // calculate membership expiry based on stored month/day — anchored to america/chicago
  // (not the server process's own timezone) and set to end-of-day so the full day counts
  // as valid; see lib/membership-expiry.ts
  const now = new Date()
  const expiryMonth = parseInt(map.membership_expiry_month ?? '6')
  const expiryDay = parseInt(map.membership_expiry_day ?? '30')
  const membershipExpiry = computeMembershipExpiry(now, expiryMonth, expiryDay)

  return {
    membershipPriceCents: parseInt(map.membership_price_cents),
    earlyBirdPriceCents: parseInt(map.membership_early_bird_price_cents),
    earlyBirdDeadline: new Date(map.membership_early_bird_deadline),
    membershipYear: map.membership_year,
    membershipExpiry,
    kuyateDeadline: map.kuyate_deadline ? new Date(map.kuyate_deadline) : null,
    // kuyate applications flag — false if the flag is 'false' OR the deadline has already passed
    kuyateApplicationsOpen: (map.kuyate_applications_open === 'true') &&
      (!map.kuyate_deadline || new Date() < new Date(map.kuyate_deadline)),
    // false if key is missing — safe default hides pamilya until explicitly revealed
    pamilyaRevealActive: (map.pamilya_reveal_active ?? 'false') === 'true',
  }
}