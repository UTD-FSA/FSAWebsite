// ── SiteChrome.tsx ────────────────────────────────────────────
// route-based Navbar/Footer decision — single source of truth for pages
// that need reduced chrome (signup/onboarding flows shouldn't hand the
// visitor exit points while they're mid-conversion)
//
// data:  initialMember passed straight through to Navbar (see app/layout.tsx)
// ──────────────────────────────────────────────────────────

'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { Member } from '@/types/database'

interface SiteChromeProps {
  initialMember: Pick<Member, 'id' | 'first_name' | 'last_name' | 'avatar_url' | 'role'> | null
  children: React.ReactNode
}

export default function SiteChrome({ initialMember, children }: SiteChromeProps) {
  const pathname = usePathname()

  // login + membership + onboarding: no chrome at all — keep the visitor on task
  // officer/scan: fullscreen camera tool — sticky navbar (z-[60]) would sit on top
  // of the scan page's own fixed-position event picker/tally chip (z-30/z-40)
  if (
    pathname === '/login' ||
    pathname === '/membership' ||
    pathname.startsWith('/onboarding') ||
    pathname === '/officer/scan'
  ) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar initialMember={initialMember} />
      {children}
      <Footer />
    </>
  )
}
