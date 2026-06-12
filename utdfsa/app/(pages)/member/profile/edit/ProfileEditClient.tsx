'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toTitleCase, formatPhone } from '@/lib/format'

interface MemberFields {
  first_name: string
  last_name: string
  phone: string | null
  year: string | null
  major: string | null
  contact_email: string | null
}

/**
 * Props — passed down from the ProfileEditPage server component (member/profile/edit/page.tsx)
 *   member     — current saved values for the editable profile fields
 *   loginEmail — the Google OAuth email address; read-only, cannot be changed here
 */
interface Props {
  member: MemberFields
  loginEmail: string
}

// ============================================================
// UI — safe to restyle everything below this line
// available data:
//   member — { first_name, last_name, phone, year, major, contact_email }
//   loginEmail — Google sign-in email (read-only, displayed but not editable)
//   form   — live form state mirroring member fields
//   loading (bool) — true while the save API call is in flight
//   error   (string | null) — API or validation error message
//   success (bool) — true after a successful save (triggers redirect)
// change classnames, layout, colors, and typography freely
// do not remove or rename the variables being rendered
// ============================================================
export default function ProfileEditClient({ member, loginEmail }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    first_name: member.first_name ?? '',
    last_name: member.last_name ?? '',
    phone: member.phone ?? '',
    year: member.year ?? '',
    major: member.major ?? '',
    contact_email: member.contact_email ?? '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // api: calls POST /api/member/update-profile — saves profile fields to the members table — do not change this endpoint
    const res = await fetch('/api/member/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    setSuccess(true)
    // route: /member/profile — member profile view page — do not change this path
    setTimeout(() => router.push('/member/profile'), 1200)
  }

  const fieldCls = 'w-full border border-white/30 rounded-lg p-2.5 text-sm text-white bg-brand-bg placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-accent-green focus:border-accent-green transition-colors'
  const labelCls = 'block font-display font-bold text-xs uppercase tracking-widest text-white/60 mb-1.5'

  return (
    <main className="bg-section-bg min-h-screen text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="font-display font-black text-[clamp(28px,4vw,48px)] text-white uppercase leading-none mb-6">
          Edit Profile
        </h1>

        {/* loginEmail is the Google OAuth address — shown read-only because it cannot be changed here */}
        <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-lg">
          <span className={labelCls}>Login email</span>
          <p className="font-sans text-sm text-white/70">{loginEmail}</p>
          <p className="font-sans text-xs text-white/40 mt-1">
            This is tied to your Google account and cannot be changed here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={labelCls}>First Name</label>
              <input
                type="text"
                value={form.first_name}
                onChange={e => set('first_name', toTitleCase(e.target.value))}
                className={fieldCls}
                required
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={e => set('last_name', toTitleCase(e.target.value))}
                className={fieldCls}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Contact Email
              <span className="text-white/30 font-normal normal-case tracking-normal ml-1">
                (for event tickets and notifications)
              </span>
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={e => set('contact_email', e.target.value)}
              className={fieldCls}
              placeholder={loginEmail}
            />
            <p className="font-sans text-xs text-white/40 mt-1">
              Leave blank to use your Google email for notifications.
            </p>
          </div>

          <div>
            <label className={labelCls}>Phone</label>
            <input
              type="tel"
              value={form.phone ?? ''}
              onChange={e => set('phone', formatPhone(e.target.value))}
              className={fieldCls}
              placeholder="(xxx) xxx-xxxx"
              maxLength={14}
            />
          </div>

          <div>
            <label className={labelCls}>Year</label>
            <select
              value={form.year ?? ''}
              onChange={e => set('year', e.target.value)}
              className={`${fieldCls} pr-8 text-gray-900`}
              style={{ colorScheme: 'light' }}
            >
              <option value="" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Select your year</option>
              <option value="Freshman" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Freshman</option>
              <option value="Sophomore" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Sophomore</option>
              <option value="Junior" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Junior</option>
              <option value="Senior" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Senior</option>
              <option value="Graduate" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Graduate</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Major</label>
            <input
              type="text"
              value={form.major ?? ''}
              onChange={e => set('major', toTitleCase(e.target.value))}
              className={fieldCls}
              placeholder="e.g. Computer Science"
            />
          </div>

          {/* only renders when the API returned a validation or server error — do not remove this condition */}
          {error && <p className="font-sans text-sm text-red-400">{error}</p>}

          {/* only renders for ~1.2 s after a successful save, before the router redirect fires — do not remove this condition */}
          {success && (
            <p className="font-sans text-sm text-green-400">
              Profile updated! Redirecting...
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-green text-[#0e0e0e] font-display font-black uppercase tracking-widest py-3.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
          >
            {/* only shows "Saving..." while the API call is in flight — do not remove this condition */}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/member/profile')}
            className="font-sans text-sm text-white/40 hover:text-white/60 text-center transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    </main>
  )
}
