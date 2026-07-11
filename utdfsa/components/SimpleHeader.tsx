// ── SimpleHeader.tsx ─────────────────────────────────────────
// stripped-down header for single-focus screens (application submitted) —
// logo + wordmark only, no nav links, no dropdowns
//
// notes: left-aligned with the same px-6/md:px-14 padding as Navbar so the
// logo lines up with it exactly, just without the rest of the nav
// ──────────────────────────────────────────────────────────

import Image from 'next/image'
import Link from 'next/link'

export default function SimpleHeader() {
  return (
    <header
      className="flex justify-start items-center px-6 md:px-14 bg-brand-bg h-20 sticky top-0 z-[60]"
      style={{ boxShadow: '0 2px 0 0 #0e0e0e' }}
    >
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <Image
          src="/logo-head.png"
          alt="UTD FSA Logo"
          width={43}
          height={43}
          priority
          className="rounded-full"
          style={{ width: '43px', height: '43px' }}
        />
        <span className="font-display font-black text-[26px] text-white leading-none tracking-wide">
          UTD FSA
        </span>
      </Link>
    </header>
  )
}
