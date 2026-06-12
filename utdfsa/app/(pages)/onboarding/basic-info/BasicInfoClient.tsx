'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toTitleCase, formatPhone } from '@/lib/format'

interface BasicInfoForm {
  first_name: string
  last_name: string
  phone: string
  year: string
  major: string
}

interface Props {
  initial: BasicInfoForm
}

export default function BasicInfoClient({ initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<BasicInfoForm>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof BasicInfoForm>(field: K, value: BasicInfoForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('first and last name are required')
      return
    }

    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) {
      setError('a valid phone number is required')
      return
    }
    setLoading(true)
    setError(null)

    // api: POST /api/onboarding/update-basic-info — saves profile fields, does not touch onboarding_complete
    const res = await fetch('/api/onboarding/update-basic-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'something went wrong, please try again')
      setLoading(false)
      return
    }

    // route: /member/profile — final destination after basic info is saved
    router.push('/member/profile')
  }

  // ============================================================
  // UI — safe to restyle everything below this line
  // available data:
  //   form — { first_name, last_name, phone, year, major, pamilya }
  //   loading (bool) — true while the submit API call is in flight
  //   error (string | null) — validation or API error
  // change classnames, layout, colors, and typography freely
  // do not remove or rename the variables being rendered
  // ============================================================
  const fieldCls = 'w-full border border-white/30 rounded-lg p-2.5 text-sm text-white bg-brand-bg placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-colors'
  const labelCls = 'block font-display font-bold text-xs uppercase tracking-widest text-white/60 mb-1.5'

  return (
    <main className="bg-section-bg min-h-screen text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="font-display font-black text-[clamp(28px,4vw,48px)] text-white uppercase leading-none mb-6">
          Tell Us About Yourself
        </h1>
        <p className="font-sans text-sm text-white/50 mb-6">
          This information helps us get to know you better.
        </p>

        <div className="flex flex-col gap-5">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelCls}>
                First name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={e => set('first_name', toTitleCase(e.target.value))}
                className={fieldCls}
                placeholder="Your preferred first name"
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>
                Last name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={e => set('last_name', toTitleCase(e.target.value))}
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => set('phone', formatPhone(e.target.value))}
              className={fieldCls}
              placeholder="(xxx) xxx-xxxx"
              maxLength={14}
              required
            />
          </div>

          <div>
            <label className={labelCls}>Year</label>
            <select
              value={form.year}
              onChange={e => set('year', e.target.value)}
              className={`${fieldCls} pr-8`}
              style={{ colorScheme: 'light' }}
            >
              <option value="" style={{ color: '#ffffff', backgroundColor: '#0e0e0e' }}>Select Your Year</option>
              <option value="Freshman" style={{ color: '#ffffff', backgroundColor: '#0e0e0e' }}>Freshman</option>
              <option value="Sophomore" style={{ color: '#ffffff', backgroundColor: '#0e0e0e' }}>Sophomore</option>
              <option value="Junior" style={{ color: '#ffffff', backgroundColor: '#0e0e0e' }}>Junior</option>
              <option value="Senior" style={{ color: '#ffffff', backgroundColor: '#0e0e0e' }}>Senior</option>
              <option value="Graduate" style={{ color: '#ffffff', backgroundColor: '#0e0e0e' }}>Graduate</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Major</label>
            <input
              type="text"
              value={form.major}
              onChange={e => set('major', toTitleCase(e.target.value))}
              className={fieldCls}
              placeholder="e.g. Computer Science"
            />
          </div>

          {/* only renders when there is a validation or API error — do not remove this condition */}
          {error && (
            <p className="font-sans text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-accent-green text-[#0e0e0e] font-display font-black uppercase tracking-widest py-3.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
          >
            {/* only shows "saving..." while the API call is in flight — do not remove this condition */}
            {loading ? 'Saving…' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </main>
  )
}
