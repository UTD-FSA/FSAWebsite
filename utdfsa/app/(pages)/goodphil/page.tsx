// ── page.tsx ──────────────────────────────────────────────
// /goodphil index — immediately redirects to /goodphil/about
// ──────────────────────────────────────────────────────────

import { redirect } from 'next/navigation'

export default function GoodphilPage() {
  // redirect the bare /goodphil route to the about sub-page
  redirect('/goodphil/about')
}
