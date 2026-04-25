'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AMOUNT = 35
const ZELLE_HANDLE = '[PLACEHOLDER - TBD]'
const VENMO_HANDLE = '@UTD-FSA'

export default function PaymentPage() {
  const router = useRouter()
  const [paymentCode, setPaymentCode] = useState('')
  const [confirmationId, setConfirmationId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [payLater, setPayLater] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // useEffect(() => {
  //   const code = sessionStorage.getItem('payment_code')
  //   if (!code) router.push('/onboarding/questionnaire')
  //   else setPaymentCode(code)
  // }, [])

  async function copyCode() {
    await navigator.clipboard.writeText(paymentCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmitConfirmation(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/submit-payment-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_code: paymentCode, confirmation_id: confirmationId }),
    })
    setLoading(false)
    setSubmitted(true)
  }

  if (payLater) {
    return (
      <div className="min-h-screen bg-[#051005] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center flex flex-col gap-4">
          <h2 className="text-white text-xl font-bold tracking-tight">You're registered!</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Come back and submit your confirmation once you've paid. Your membership will be activated after we verify payment.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Your payment code</p>
            <span className="text-orange-400 font-mono text-lg font-semibold tracking-widest">{paymentCode}</span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-2.5 rounded-full border border-white/15 text-white/60 hover:border-orange-400/50 hover:text-orange-400 text-sm font-medium tracking-wide transition-colors duration-200"
          >
            Go to home
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#051005] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center flex flex-col gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold tracking-tight">Confirmation submitted!</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            We'll verify your payment and activate your membership within 24 hours.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white text-sm font-medium tracking-wide transition-all duration-150 shadow-lg shadow-orange-500/20"
          >
            Go to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#051005] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold tracking-tight mb-1">Complete Payment</h1>
          <p className="text-white/40 text-sm">Membership fee: ${AMOUNT}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-2">
          <p className="text-white/40 text-xs uppercase tracking-wide">Your payment code</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-orange-400 font-mono text-lg font-semibold tracking-widest">{paymentCode}</span>
            <button
              onClick={copyCode}
              className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/50 hover:border-orange-400/50 hover:text-orange-400 transition-colors duration-200"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
            <p className="text-white/60 text-sm font-medium">Pay via Zelle or Venmo</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Zelle</span>
                <span className="text-white/70 font-medium">{ZELLE_HANDLE}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Venmo</span>
                <span className="text-white/70 font-medium">{VENMO_HANDLE}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Amount</span>
                <span className="text-white/70 font-medium">${AMOUNT}</span>
              </div>
            </div>
            <p className="text-white/30 text-xs">
              Include code <span className="font-mono text-white/50">{paymentCode}</span> in the memo.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitConfirmation} className="flex flex-col gap-3">
          <p className="text-white/50 text-sm">After paying, enter your confirmation / transaction ID:</p>
          <input
            required
            placeholder="Confirmation or transaction ID"
            value={confirmationId}
            onChange={e => setConfirmationId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-400/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 active:scale-95 active:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium tracking-wide transition-all duration-150 shadow-lg shadow-orange-500/20"
          >
            {loading ? 'Submitting...' : 'Submit confirmation'}
          </button>
        </form>

        <button
          onClick={() => setPayLater(true)}
          className="text-white/30 hover:text-white/50 text-sm text-center transition-colors duration-200"
        >
          I'll pay later
        </button>
      </div>
    </div>
  )
}
