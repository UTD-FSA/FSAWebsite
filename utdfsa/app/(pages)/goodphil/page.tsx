// ── page.tsx ──────────────────────────────────────────────
// /goodphil index — immediately redirects to /goodphil/about
// ──────────────────────────────────────────────────────────

import { permanentRedirect } from 'next/navigation'

export default function GoodphilPage() {
  // permanent (308) redirect — the bare /goodphil route always resolves to
  // /goodphil/about, so search engines should consolidate signals there
  permanentRedirect('/goodphil/about')
}
