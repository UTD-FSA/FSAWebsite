'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CheckUserButton() {
  const [user, setUser] = useState<string | null>(null)

  async function checkUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user ? user.email ?? user.id : 'No user logged in')
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={checkUser}
        className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-400 active:scale-95 text-white text-sm font-medium tracking-wide transition-all duration-150"
      >
        Check Logged In User
      </button>
      {user && <p className="text-white/70 text-sm">{user}</p>}
    </div>
  )
}
