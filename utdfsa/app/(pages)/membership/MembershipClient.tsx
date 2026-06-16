// ── MembershipClient.tsx ─────────────────────────────────────
// client component — membership purchase page with stripe checkout
//
// data:  props from MembershipPage (prices in cents, early-bird flag and deadline, membership year)
// deps:  POST /api/membership/checkout (creates a stripe checkout session)
// notes: all prices are stored and passed in cents; formatPrice converts to display dollars;
//        early-bird pricing is determined server-side by comparing now vs. earlyBirdDeadline
'use client'

import { useState } from 'react'

interface Props {
  displayPrice: number
  regularPrice: number
  isEarlyBird: boolean
  earlyBirdDeadline: string
  membershipYear: string
}

// formats cents to a dollar string
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

// ============================================================
// UI — safe to restyle everything below this line
// available data (props from MembershipPage):
//   displayPrice (number, cents) — price to show (early bird or regular)
//   regularPrice (number, cents) — full regular price (for strikethrough)
//   isEarlyBird (bool) — true when early bird pricing is active
//   earlyBirdDeadline (ISO string) — when early bird ends
//   membershipYear (string) — e.g. "2024–2025"
// handlePayment: do not modify — POSTs to /api/membership/checkout
//   and redirects to the Stripe checkout URL
// change classnames, layout, colors, and typography freely
// do not remove or rename the variables being rendered
// ============================================================
// ── component ─────────────────────────────────────────────────
export default function MembershipClient({
  displayPrice,
  regularPrice,
  isEarlyBird,
  earlyBirdDeadline,
  membershipYear,
}: Props) {
  // true while the POST /api/membership/checkout request is in flight
  const [loading, setLoading] = useState(false)
  // holds the error message from the checkout api or null when no error
  const [error, setError] = useState<string | null>(null)

  // ── handlePayment ────────────────────────────────────────────
  // opens the stripe checkout page; on success stripe redirects back with ?success=true
  async function handlePayment() {
    setLoading(true)
    setError(null)

    // api: calls POST /api/membership/checkout — creates a stripe checkout session and returns the redirect URL — do not change this endpoint
    const res = await fetch('/api/membership/checkout', {
      method: 'POST',
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error ?? 'something went wrong, please try again')
      setLoading(false)
    }
  }

  return (
    <main className="bg-brand-bg min-h-screen text-white">
      <div className="max-w-lg mx-auto px-6 py-12">

        <h1 className="font-display font-black text-[clamp(36px,5vw,64px)] text-white uppercase leading-none tracking-tight mb-2">
          Become a Member
        </h1>
        <p className="font-sans text-sm text-white/50 mb-10">
          Join UTD FSA and get access to all events, pamilya placement, and more!
        </p>

        <div className="border border-white/[7%] rounded-2xl p-8 mb-6 bg-[#1a1a1a]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-display font-black text-base text-white uppercase tracking-wide">UTD FSA Membership</h2>
              <p className="font-sans text-xs text-white/50 mt-1">{membershipYear}</p>
            </div>

            <div className="text-right">
              {/* show early bird pricing block when deadline hasn't passed, else show regular price */}
              {isEarlyBird ? (
                <>
                  {/* show discounted price prominently, crossed out regular price */}
                  <p className="font-display font-black text-2xl text-accent-green">
                    {formatPrice(displayPrice)}
                  </p>
                  <p className="hidden sm:block font-sans text-sm text-white/30 line-through">
                    {formatPrice(regularPrice)}
                  </p>
                  <p className="font-display font-bold text-xs text-accent-green uppercase tracking-wide mt-0.5">
                    Early Bird
                  </p>
                  <p className="hidden sm:block font-sans text-xs text-white/40 mt-1">
                    {/* format iso deadline to "Month Day" for the "ends ..." label */}
                    ends {new Date(earlyBirdDeadline).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </>
              ) : (
                <p className="font-display font-black text-2xl text-white">{formatPrice(displayPrice)}</p>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-5 mb-6">
            <ul className="flex flex-col gap-2.5">
              <li className="flex items-center gap-2.5 font-sans text-sm text-white">
                <span className="text-accent-green font-bold shrink-0">✓</span>
                Member pricing on all events
              </li>
              <li className="flex items-center gap-2.5 font-sans text-sm text-white">
                <span className="text-accent-green font-bold shrink-0">✓</span>
                Pamilya placement
              </li>
              <li className="flex items-center gap-2.5 font-sans text-sm text-white">
                <span className="text-accent-green font-bold shrink-0">✓</span>
                Points tracking and attendance history
              </li>
              <li className="flex items-center gap-2.5 font-sans text-sm text-white">
                <span className="text-accent-green font-bold shrink-0">✓</span>
                Access to member-only content
              </li>
            </ul>
          </div>

          {error && (
            <p className="font-sans text-sm text-red-400 mb-4">{error}</p>
          )}

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-accent-green text-[#0e0e0e] font-display font-black uppercase tracking-widest py-3.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Redirecting to payment...' : `Pay ${formatPrice(displayPrice)}`}
          </button>
        </div>

        <p className="font-sans text-xs text-white/50 text-center">
          Secure payment powered by Stripe. Have an officer code? You can enter it on the next page.
        </p>

      </div>
    </main>
  )
}
