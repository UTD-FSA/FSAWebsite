'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const INTERESTS = ['Cultural', 'Sports', 'Community Service', 'Arts', 'Academic']
const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate']

export default function QuestionnairePage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [year, setYear] = useState('')
  const [major, setMajor] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [pamPreference, setPamPreference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login')
      else setEmail(data.user.email ?? '')
    })
  }, [])

  function toggleInterest(interest: string) {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/register-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        year,
        major,
        interests,
        pam_preference: pamPreference,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    sessionStorage.setItem('payment_code', data.payment_code)
    router.push('/onboarding/payment')
  }

  return (
    <div className="min-h-screen bg-[#051005] flex items-center justify-center px-4 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
        <h1 className="text-white text-2xl font-bold tracking-tight text-center mb-2">
          Join FSA
        </h1>
        <p className="text-white/40 text-sm text-center mb-2">
          Tell us about yourself
        </p>

        <div className="flex gap-3">
          <input
            required
            placeholder="First name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-400/50"
          />
          <input
            required
            placeholder="Last name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-400/50"
          />
        </div>

        <input
          placeholder="Phone number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-400/50"
        />

        <select
          required
          value={year}
          onChange={e => setYear(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-[#051005] border border-white/10 text-white text-sm focus:outline-none focus:border-orange-400/50"
        >
          <option value="" disabled>Year</option>
          {YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <input
          required
          placeholder="Major"
          value={major}
          onChange={e => setMajor(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-400/50"
        />

        <div>
          <p className="text-white/50 text-xs mb-2 tracking-wide uppercase">Interests</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-150 ${
                  interests.includes(interest)
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/50 hover:border-orange-400/50 hover:text-orange-400'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <input
          placeholder="PAM preference (optional)"
          value={pamPreference}
          onChange={e => setPamPreference(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-400/50"
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 active:scale-95 active:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium tracking-wide transition-all duration-150 shadow-lg shadow-orange-500/20 mt-2"
        >
          {loading ? 'Submitting...' : 'Continue to Payment'}
        </button>
      </form>
    </div>
  )
}
