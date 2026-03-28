// app/login/page.tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function SignUpPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function signUpNewUser() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      
    })
    if (error) console.error(error.message)
  }

  return (
    <div className="min-h-screen bg-[#051005] flex items-center justify-center">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-white text-2xl font-bold tracking-tight text-center mb-2">Sign Up</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-400/50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-400/50"
        />
        <button
          onClick={signUpNewUser}
          className="w-full px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 active:scale-95 active:bg-orange-600 text-white text-sm font-medium tracking-wide transition-all duration-150 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
        >
          Sign Up
        </button>
      </div>
    </div>
  )
}
