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
import SimpleHeader from '@/components/SimpleHeader'
import type { Member } from '@/types/database'

interface SiteChromeProps {
  initialMember: Pick<Member, 'id' | 'first_name' | 'last_name' | 'avatar_url' | 'role'> | null
  children: React.ReactNode
}

export default function SiteChrome({ initialMember, children }: SiteChromeProps) {
  const pathname = usePathname()

  // membership + onboarding: no chrome at all — keep the visitor on task
  if (pathname === '/membership' || pathname.startsWith('/onboarding')) {
    return <>{children}</>
  }

  // login: simplified header, no footer
  if (pathname === '/login') {
    return (
      <>
        <SimpleHeader />
        {children}
      </>
    )
  }

  return (
    <>
      <Navbar initialMember={initialMember} />
      {children}
      <Footer />
    </>
  )
}
