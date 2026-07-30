// ── lib/data/galleries.ts ────────────────────────────────────
// cached read for the public gallery listing — shared by /archives and /api/galleries
//
// data:  galleries
// notes: unstable_cache persists the query result independent of the calling
//        route's render mode — mirrors lib/data/events.ts's getCachedVisibleEvents.
//        officer gallery writes (create/update/delete) must call
//        revalidateTag('galleries', { expire: 0 }) or edits won't show up publicly
//        until the revalidate window below lapses.

import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import type { Gallery } from '@/types/database'

export const getCachedPublishedGalleries = unstable_cache(
  async (): Promise<Gallery[]> => {
    // explicit columns — excludes created_by (officer uuid) from the public response
    const admin = createAdminClient()
    const { data } = await admin
      .from('galleries')
      .select('id, title, cover_photo_url, google_photos_url, description, semester, year, is_published, created_at')
      .eq('is_published', true)
      .order('year', { ascending: false })
      .order('created_at', { ascending: false })
    return (data ?? []) as unknown as Gallery[]
  },
  ['published-galleries'],
  { revalidate: 3600, tags: ['galleries'] }
)
