// ── page.tsx ─────────────────────────────────────────────────
// archives server component — fetches published galleries and passes to client
//
// data:  galleries table — published only, sorted year desc then created_at desc
// deps:  lib/data/galleries.ts (getCachedPublishedGalleries — shared with /api/galleries GET)
// notes: this page has no user session and reads no cookies, so it prerenders as
//        static; freshness comes from the shared unstable_cache boundary in
//        lib/data/galleries.ts (revalidate: 3600), not a route-segment export
// ─────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Archives',
  description: 'Browse photo archives from past UTD FSA events, socials, and Goodphil competitions, the Filipino Student Association at UT Dallas.',
  alternates: { canonical: '/archives' },
}

import { getCachedPublishedGalleries } from '@/lib/data/galleries'
import ArchivesClient from './ArchivesClient'

export default async function ArchivesPage() {
  const galleries = await getCachedPublishedGalleries()

  // ============================================================
  // UI — safe to restyle everything below this line
  // available data:
  //   galleries (Gallery[]) — published archives only,
  //     sorted by year desc then created_at desc
  // change classnames, layout, colors, and typography freely
  // do not remove or rename the variables being rendered
  // ============================================================
  return (
    <ArchivesClient
      galleries={galleries}
    />
  )
}
