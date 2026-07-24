// ── BasicInfoClient.tsx ───────────────────────────────────
// client form for collecting/updating a member's basic profile fields
//
// data:  props — initial (BasicInfoForm) pre-filled from the server component;
//        firstName + deadlineText for the post-submit confirmation screen
// deps:  POST /api/onboarding/update-basic-info
// notes: reached from the onboarding "not interested" path or as a standalone profile edit.
//        the api it calls (update-basic-info) stamps onboarding_complete = true on save.
//        submitting from the not-interested path shows an inline confirmation
//        instead of redirecting straight to /member/profile (see `submitted` state).

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toTitleCase, formatPhone } from '@/lib/format'
import SimpleHeader from '@/components/SimpleHeader'

interface BasicInfoForm {
  first_name: string
  last_name: string
  phone: string
  year: string
  major: string
  shirt_size: string
}

interface Props {
  initial: BasicInfoForm
  firstName: string
  // pre-formatted kuyate deadline (e.g. "March 14"), or null when kuyate is
  // closed / no deadline is configured — confirmation copy adapts to this
  deadlineText: string | null
}

export default function BasicInfoClient({ initial, firstName, deadlineText }: Props) {
  const router = useRouter()
  useEffect(() => { router.prefetch('/member/profile'); router.prefetch('/onboarding'); router.prefetch('/') }, [router])
  // all editable profile fields; seeded from pre-filled server data via props
  const [form, setForm] = useState<BasicInfoForm>(initial)
  // true while POST /api/onboarding/update-basic-info is in flight
  const [loading, setLoading] = useState(false)
  // validation or api error shown inline above the submit button
  const [error, setError] = useState<string | null>(null)
  // true once the form has saved successfully — swaps in the confirmation screen
  const [submitted, setSubmitted] = useState(false)

  function set<K extends keyof BasicInfoForm>(field: K, value: BasicInfoForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required')
      return
    }
    if (!form.phone?.trim()) {
      setError('Phone number is required')
      return
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit phone number — e.g. (214) 333-4444')
      return
    }
    if (!form.year) {
      setError('Please select your year')
      return
    }
    if (!form.major.trim()) {
      setError('Major is required')
      return
    }
    if (!form.shirt_size) {
      setError('Please select your t-shirt size')
      return
    }
    setLoading(true)
    setError(null)

    try {
      // api: POST /api/onboarding/update-basic-info — saves profile fields, does not touch onboarding_complete
      const res = await fetch('/api/onboarding/update-basic-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to save — please try again.')
        setLoading(false)
        return
      }

      // show the confirmation screen instead of redirecting straight to
      // /member/profile — reassures not-interested members the door stays open
      setSubmitted(true)
      setLoading(false)
    } catch {
      setError('Network error — please try again.')
      setLoading(false)
    }
  }

  // confirmation screen — shown after a successful save instead of redirecting;
  // mirrors the ading/kuyate "step === 'submitted'" screen in OnboardingClient.tsx
  // (same fsa-check-pop/fsa-ring keyframes, same card + CTA pattern)
  // available data:
  //   firstName (string) — greeting name from the member row
  //   deadlineText (string | null) — pre-formatted kuyate deadline, or null when
  //     kuyate is closed / no deadline is set — copy below adapts to both
  if (submitted) {
    const doorItems = [
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
        ),
        title: 'Applications Stay Open',
        body: deadlineText
          ? `Kuya/Ate applications remain open to everyone through ${deadlineText} — nothing closes because you passed this time. Ading applications are open throughout the year.`
          : 'You can reapply anytime from your profile while ading applications are open — nothing closes because you passed this time.',
      },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
        ),
        title: 'Change of Heart, No Penalty',
        body: "Just come back to the application (visible on profile page) whenever you're ready. There's no separate \"late\" pile — it's reviewed the same as any other.",
      },
      {
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.4 2.9-6 6.5-6s6.5 2.6 6.5 6" /><path d="M16.5 4.6a3.2 3.2 0 0 1 0 6.3" /><path d="M20 20c0-2.7-1.7-5-4-5.8" /></svg>
        ),
        title: 'Same Community Either Way',
        body: "You're still welcome at all parties, meetings, events, and Goodphil with or without a pamilya placement!",
      },
    ]

    return (
      <main className="bg-brand-bg min-h-screen text-white overflow-x-clip">
        <SimpleHeader />
        <div className="relative flex flex-col items-center text-center px-6 py-16 md:py-20 max-w-[660px] mx-auto">

          {/* radial glow */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(117,186,120,0.14) 0%, transparent 70%)' }}
          />

          {/* checkmark medallion */}
          <div className="relative z-10 w-[104px] h-[104px] flex items-center justify-center mb-8">
            <span
              className="absolute inset-0 rounded-full border-2 border-accent-green"
              style={{ animation: 'fsa-ring 2.4s ease-out infinite' }}
            />
            <div
              className="w-[104px] h-[104px] rounded-full bg-accent-green/[0.12] border border-accent-green/[0.34] flex items-center justify-center"
              style={{ animation: 'fsa-check-pop 0.55s cubic-bezier(0.2,0.8,0.2,1) both' }}
            >
              <span
                className="w-16 h-16 rounded-full bg-accent-green flex items-center justify-center"
                style={{ boxShadow: '0 12px 34px -10px rgba(117,186,120,0.5)' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#08130a" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
            </div>
          </div>

          {/* status pill */}
          <div className="relative z-10 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-accent-green/[0.12] border border-accent-green/[0.34] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
            <span className="font-display font-bold text-[11px] tracking-[0.12em] text-accent-green uppercase">You&rsquo;re a member</span>
          </div>

          {/* heading */}
          <h1 className="relative z-10 font-display font-black text-[clamp(42px,8vw,62px)] leading-[0.94] tracking-[-0.03em] text-white">
            WELCOME TO UTD FSA
          </h1>

          {/* subtext */}
          <p className="relative z-10 max-w-[480px] text-[17px] leading-[1.6] text-[#9a9a9a] font-medium mt-5">
            No pressure at all, {firstName}. We won&rsquo;t sign you up as an ading or kuya/ate this cycle, but the door stays wide open if you change your mind!
          </p>

          {/* door stays open */}
          <div className="relative z-10 w-full bg-[#0d0d0d] border border-white/[0.08] rounded-[20px] p-7 md:p-8 mt-9 text-left">
            <div className="flex items-center gap-3.5 mb-6">
              <span className="font-display font-bold text-[13px] text-white whitespace-nowrap">The door stays open</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>
            <div className="flex flex-col gap-0">
              {doorItems.map(({ icon, title, body }, i) => (
                <div key={title} className="flex gap-4 items-start py-0.5">
                  <div className="flex flex-col items-center self-stretch">
                    <span className="shrink-0 w-[34px] h-[34px] rounded-full bg-accent-green/[0.12] border border-accent-green/[0.34] flex items-center justify-center text-accent-green">
                      {icon}
                    </span>
                    {i < doorItems.length - 1 && (
                      <span className="w-px flex-1 min-h-[22px] bg-white/10 my-1.5" />
                    )}
                  </div>
                  <div className="pb-5">
                    <div className="text-[15px] font-bold text-white tracking-[-0.01em] mb-1">{title}</div>
                    <div className="text-[13.5px] leading-[1.55] text-[#8c8c8c] font-medium">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* redirect actions */}
          <div className="relative z-10 flex flex-col sm:flex-row gap-3.5 w-full mt-8">
            <button
              onClick={() => router.push('/member/profile')}
              className="flex-1 flex items-center justify-center gap-2.5 py-[17px] rounded-[14px] bg-accent-green text-[#08130a] font-display font-extrabold text-[15px] tracking-[0.02em] hover:brightness-[1.08] transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#08130a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              GO TO MY PROFILE
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 flex items-center justify-center gap-2.5 py-[17px] rounded-[14px] border border-white/[0.14] bg-[#141414] text-white font-display font-extrabold text-[15px] tracking-[0.02em] hover:border-white/30 hover:bg-[#191919] transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
              </svg>
              BACK TO HOMEPAGE
            </button>
          </div>

        </div>
      </main>
    )
  }

  // ============================================================
  // UI — safe to restyle everything below this line
  // available data:
  //   form — { first_name, last_name, phone, year, major }
  //   loading (bool) — true while the submit API call is in flight
  //   error (string | null) — validation or API error
  // change classnames, layout, colors, and typography freely
  // do not remove or rename the variables being rendered
  // ============================================================
  const fieldCls = 'w-full px-4 py-[14px] bg-[#141414] border border-white/10 rounded-xl text-white text-[15px] outline-none focus:border-accent-green focus:bg-[#171717] transition-colors placeholder:text-[#7a7a7a]'
  const labelCls = 'flex items-center gap-[5px] mb-[9px] text-[12px] font-bold tracking-[0.1em] text-[#9a9a9a] uppercase'

  return (
    <main className="bg-brand-bg min-h-screen text-white">
      <div className="max-w-[660px] mx-auto px-6 py-14">
        {/* badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/30 mb-6">
          <span className="w-[7px] h-[7px] rounded-full bg-accent-green shrink-0" />
          <span className="font-display font-bold text-[11px] tracking-[0.12em] text-accent-green uppercase">No pamilya — that&apos;s okay</span>
        </div>

        <h1 className="font-display font-black text-[clamp(36px,5vw,62px)] leading-[0.94] tracking-[-0.03em] text-white mb-5">
          Tell Us About Yourself
        </h1>

        <p className="font-sans text-[15px] text-[#9a9a9a] leading-[1.6] mb-10">
          You can still be a full member without joining a pamilya. This sets up your member profile so you don&apos;t miss a thing.
        </p>

        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-[20px] p-6 md:p-10">
          <div className="flex flex-col gap-5">
            <p className="font-sans text-[14px] text-[#7a7a7a] leading-[1.6]">
              This information will appear on your member profile.
            </p>
            <div className="h-px bg-white/[0.07]" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  First name <span className="text-[#e8654f]">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={e => set('first_name', toTitleCase(e.target.value))}
                  className={fieldCls}
                  placeholder="Your preferred name"
                />
              </div>
              <div>
                <label className={labelCls}>
                  Last name <span className="text-[#e8654f]">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={e => set('last_name', toTitleCase(e.target.value))}
                  className={fieldCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Phone Number <span className="text-[#e8654f]">*</span>
              </label>
              <input
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={e => set('phone', formatPhone(e.target.value))}
                className={fieldCls}
                placeholder="(xxx) xxx-xxxx"
                maxLength={14}
              />
            </div>

            <div>
              <label className={labelCls}>
                Year <span className="text-[#e8654f]">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.year}
                  onChange={e => set('year', e.target.value)}
                  className={`${fieldCls} appearance-none pr-10`}
                >
                  <option value="" style={{ color: '#ffffff', backgroundColor: '#141414' }}>Select Your Year</option>
                  <option value="Freshman" style={{ color: '#ffffff', backgroundColor: '#141414' }}>Freshman</option>
                  <option value="Sophomore" style={{ color: '#ffffff', backgroundColor: '#141414' }}>Sophomore</option>
                  <option value="Junior" style={{ color: '#ffffff', backgroundColor: '#141414' }}>Junior</option>
                  <option value="Senior" style={{ color: '#ffffff', backgroundColor: '#141414' }}>Senior</option>
                  <option value="Graduate" style={{ color: '#ffffff', backgroundColor: '#141414' }}>Graduate</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7a7a7a]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Major <span className="text-[#e8654f]">*</span>
              </label>
              <input
                type="text"
                value={form.major}
                onChange={e => set('major', toTitleCase(e.target.value))}
                className={fieldCls}
                placeholder="e.g. Computer Science"
              />
            </div>

            <div>
              <label className={labelCls}>
                T-Shirt Size <span className="text-[#e8654f]">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.shirt_size}
                  onChange={e => set('shirt_size', e.target.value)}
                  className={`${fieldCls} appearance-none pr-10`}
                >
                  <option value="" style={{ color: '#ffffff', backgroundColor: '#141414' }}>Select Your Size</option>
                  <option value="S" style={{ color: '#ffffff', backgroundColor: '#141414' }}>S</option>
                  <option value="M" style={{ color: '#ffffff', backgroundColor: '#141414' }}>M</option>
                  <option value="L" style={{ color: '#ffffff', backgroundColor: '#141414' }}>L</option>
                  <option value="XL" style={{ color: '#ffffff', backgroundColor: '#141414' }}>XL</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7a7a7a]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
            </div>

            {/* only renders when there is a validation or API error — do not remove this condition */}
            {error && (
              <p className="font-sans text-sm text-red-400">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-[14px] bg-accent-green text-[#08130a] font-display font-extrabold text-[15px] tracking-[0.02em] hover:brightness-[1.08] disabled:opacity-50 transition-all mt-2"
            >
              {/* only shows "saving..." while the API call is in flight — do not remove this condition */}
              {loading ? 'Saving…' : 'Save & Continue'}
            </button>

            <button
              onClick={() => router.push('/onboarding')}
              className="w-full text-center text-[#8e8e8e] text-[14px] font-semibold hover:text-[#cfcfcf] transition-colors"
            >
              ← Back to pamilya options
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
