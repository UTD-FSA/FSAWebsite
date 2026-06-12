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
export default function MembershipClient({
  displayPrice,
  regularPrice,
  isEarlyBird,
  earlyBirdDeadline,
  membershipYear,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <main className="bg-section-bg min-h-screen text-white">
      <div className="max-w-lg mx-auto px-6 py-12">

        <h1 className="font-display font-black text-[clamp(36px,5vw,64px)] text-white uppercase leading-none tracking-tight mb-2">
          Become a Member
        </h1>
        <p className="font-sans text-sm text-white/50 mb-10">
          Join UTD FSA and get access to all events, pamilya placement, and more!
        </p>

        <div className="border-2 border-white/20 rounded-[27px] p-8 mb-6 bg-brand-bg">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-display font-black text-base text-white uppercase tracking-wide">UTD FSA Membership</h2>
              <p className="font-sans text-xs text-white/50 mt-1">{membershipYear}</p>
            </div>

            <div className="text-right">
              {isEarlyBird ? (
                <>
                  {/* show discounted price prominently, crossed out regular price */}
                  <p className="font-display font-black text-2xl text-accent-green">
                    {formatPrice(displayPrice)}
                  </p>
                  <p className="font-sans text-sm text-white/30 line-through">
                    {formatPrice(regularPrice)}
                  </p>
                  <p className="font-display font-bold text-xs text-accent-green uppercase tracking-wide mt-0.5">
                    Early Bird
                  </p>
                  <p className="font-sans text-xs text-white/40 mt-1">
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

        <p className="font-sans text-xs text-white/30 text-center">
          Secure payment powered by Stripe. Have an officer code? You can enter it on the next page.
        </p>

      </div>
    </main>
  )
}
