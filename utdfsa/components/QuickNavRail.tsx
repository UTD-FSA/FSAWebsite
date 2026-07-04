'use client'
// ── QuickNavRail.tsx ──────────────────────────────────────
// two responsive variants of the same quick-nav, sharing one set of state:
//   - desktop/tablet (>=md): fixed right-edge dot rail, hover-revealed labels
//   - mobile (<md): fixed bottom-right FAB that expands into a row list
// Both share 'pages' vs 'sections' mode:
//   'pages'    — items are routes (Goodphil sibling pages); active = current pathname
//   'sections' — items are in-page anchors; active tracked via scrollspy IntersectionObserver
//
// z-40: FAB button + dot rail, above page content (z-20). z-45: FAB backdrop
// + expanded menu — above content, below the navbar mobile drawer (z-50),
// navbar itself (z-[60]), and Modal (z-[300]) — see Navbar.tsx / Modal.tsx
// comments for the rest of the site's z-index scale.
//
// Hover-revealed labels don't work on touch, so the dot rail is desktop/
// tablet-only and the FAB covers mobile — mutually exclusive at every width.

import { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export type QuickNavItem = {
  label: string
  href: string // '/goodphil/spirit' for mode="pages", '#officers' for mode="sections"
}

export default function QuickNavRail({
  items,
  mode,
  ariaLabel,
}: {
  items: QuickNavItem[]
  mode: 'pages' | 'sections'
  ariaLabel: string
}) {
  const pathname = usePathname()
  const [activeHash, setActiveHash] = useState(items[0]?.href ?? '')
  const [fabOpen, setFabOpen] = useState(false)
  const fabButtonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  // scrollspy — only needed in 'sections' mode
  useEffect(() => {
    if (mode !== 'sections') return
    const targets = items
      .map(({ href }) => document.querySelector(href))
      .filter((el): el is Element => el !== null)
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // pick the entry closest to the top of the "active band" that's intersecting
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length === 0) return
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        setActiveHash(`#${top.target.id}`)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    )
    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [items, mode])

  const prefersReducedMotion = useRef(false)
  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Escape closes the FAB menu and returns focus to the button that opened it
  useEffect(() => {
    if (!fabOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setFabOpen(false)
      fabButtonRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [fabOpen])

  function closeFab() {
    setFabOpen(false)
    fabButtonRef.current?.focus()
  }

  function handleSectionClick(e: React.MouseEvent, href: string, fromFab = false) {
    e.preventDefault()
    const el = document.querySelector(href)
    if (!el) return
    el.scrollIntoView({ behavior: prefersReducedMotion.current ? 'auto' : 'smooth', block: 'start' })
    setActiveHash(href)
    if (fromFab) setFabOpen(false)
  }

  function isItemActive(item: QuickNavItem) {
    return mode === 'pages' ? pathname === item.href : activeHash === item.href
  }

  return (
    <>
    <nav
      aria-label={ariaLabel}
      className="hidden md:flex fixed right-3 lg:right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-4"
    >
      {items.map((item) => {
        const isActive = isItemActive(item)
        const dot = (
          <span
            aria-hidden="true"
            className={`block w-2.5 h-2.5 rounded-full border transition-all duration-300 ease-out shadow-[0_1px_4px_rgba(0,0,0,0.5)] ${
              isActive
                ? 'bg-accent-green border-accent-green scale-125'
                : 'bg-transparent border-white/35 group-hover:border-white/70 group-focus-visible:border-white/70'
            }`}
          />
        )
        const label = (
          <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#141414] px-2.5 py-1 text-xs font-sans font-medium text-white opacity-0 translate-x-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0">
            {item.label}
          </span>
        )

        return mode === 'pages' ? (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            className="group relative flex items-center p-1.5 -m-1.5"
          >
            {label}
            {dot}
          </Link>
        ) : (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => handleSectionClick(e, item.href)}
            aria-current={isActive ? 'true' : undefined}
            aria-label={item.label}
            className="group relative flex items-center p-1.5 -m-1.5"
          >
            {label}
            {dot}
          </a>
        )
      })}
    </nav>

    {/* Mobile FAB — md:hidden, mutually exclusive with the dot rail above */}
    <div className="md:hidden">
      {/* backdrop — tap outside closes the menu; inert when closed */}
      <div
        aria-hidden="true"
        onClick={closeFab}
        className={`fixed inset-0 z-[45] bg-black/40 transition-opacity duration-200 ease-out ${
          fabOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* expanded row menu */}
      <div
        id={menuId}
        role="menu"
        aria-label={ariaLabel}
        className={`fixed z-[45] flex flex-col rounded-2xl border border-white/10 bg-[#141414] shadow-xl overflow-hidden origin-bottom-right transition-all duration-200 ease-out ${
          fabOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
        style={{
          right: 'max(20px, env(safe-area-inset-right))',
          bottom: 'calc(max(20px, env(safe-area-inset-bottom)) + 68px)',
          minWidth: '190px',
        }}
      >
        {items.map((item) => {
          const isActive = isItemActive(item)
          const rowDot = (
            <span
              aria-hidden="true"
              className={`block w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-accent-green' : 'bg-white/25'}`}
            />
          )
          return mode === 'pages' ? (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              aria-current={isActive ? 'page' : undefined}
              onClick={closeFab}
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-sans font-medium text-white hover:bg-white/5 transition-colors"
            >
              {rowDot}
              {item.label}
            </Link>
          ) : (
            <a
              key={item.href}
              href={item.href}
              role="menuitem"
              aria-current={isActive ? 'true' : undefined}
              onClick={(e) => handleSectionClick(e, item.href, true)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm font-sans font-medium text-white hover:bg-white/5 transition-colors"
            >
              {rowDot}
              {item.label}
            </a>
          )
        })}
      </div>

      {/* FAB button — dot-stack icon morphs to an X when open, echoing the rail's own dot language */}
      <button
        ref={fabButtonRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={fabOpen}
        aria-controls={menuId}
        onClick={() => setFabOpen(prev => !prev)}
        className="fixed z-40 flex items-center justify-center rounded-full bg-accent-green text-[#08130a] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] active:scale-95 transition-transform duration-200 ease-out"
        style={{
          right: 'max(20px, env(safe-area-inset-right))',
          bottom: 'max(20px, env(safe-area-inset-bottom))',
          width: '52px',
          height: '52px',
        }}
      >
        <span className="relative block w-5 h-5" aria-hidden="true">
          {[-6, 0, 6].map((offset, i) => (
            <span
              key={offset}
              className="absolute left-1/2 top-1/2 w-[5px] h-[5px] rounded-full bg-current transition-all duration-300 ease-out"
              style={{
                transform: fabOpen
                  ? i === 1
                    ? 'translate(-50%, -50%) scale(0)'
                    : `translate(-50%, -50%) rotate(${i === 0 ? 45 : -45}deg) scaleX(2.4)`
                  : `translate(-50%, calc(-50% + ${offset}px))`,
                opacity: fabOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </span>
      </button>
    </div>
    </>
  )
}
