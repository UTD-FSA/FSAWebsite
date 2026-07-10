// ── lib/data/events.ts ─────────────────────────────────────
// cached read for the public events listing — shared by the homepage and /events
//
// data:  events
// notes: unstable_cache persists the query result independent of the calling
//        route's render mode. both callers unconditionally read cookies() (via
//        auth.getUser(), to resolve the signed-in viewer), which forces per-request
//        dynamic rendering under this project's caching model — so a route-segment
//        `revalidate` export alone has no effect on either page. this is the actual
//        cache boundary. officer event writes must call revalidateTag('events')
//        (see app/api/officer/events/**) or edits won't show up publicly until
//        the revalidate window below lapses.

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { PUBLIC_EVENT_COLUMNS } from '@/lib/constants'
import type { Event } from '@/types/database'

export const getCachedVisibleEvents = unstable_cache(
  async (): Promise<Event[]> => {
    // explicit columns — never select('*') here; that would leak attend_qr_token to the public
    const admin = createAdminClient()
    const { data } = await admin
      .from('events')
      .select(PUBLIC_EVENT_COLUMNS)
      .eq('is_visible', true)
      .order('event_date', { ascending: true })
    return (data ?? []) as unknown as Event[]
  },
  ['visible-events'],
  { revalidate: 3600, tags: ['events'] }
)
