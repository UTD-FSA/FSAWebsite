// ── page.tsx ──────────────────────────────────────────────
// server shell — exports metadata, then mounts LoginClient.
// metadata can't be exported from a 'use client' file, and this
// route has no unique content worth indexing, so it's noindexed.
// ──────────────────────────────────────────────────────────

import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Log In',
  robots: { index: false, follow: true },
}

import LoginClient from './LoginClient'

export default function LoginPage() {
  return <LoginClient />
}
