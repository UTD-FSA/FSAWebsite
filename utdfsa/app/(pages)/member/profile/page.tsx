import { createUserClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('email', user.email!)
    .maybeSingle()

  if (!member) redirect('/login')

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {/* Avatar and name */}
      <div className="flex items-center gap-4 mb-8">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt="profile"
            className="w-16 h-16 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-400 flex items-center justify-center text-white text-2xl font-bold">
            {member.first_name?.[0]}{member.last_name?.[0]}
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">
            {member.first_name} {member.last_name}
          </h2>
          <p className="text-gray-500">{member.email}</p>
        </div>
      </div>

      {/* Membership status */}
      <section className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Membership</h3>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className={
              member.membership_status === 'active'
                ? 'text-green-600 font-medium'
                : 'text-yellow-600 font-medium'
            }>
              {member.membership_status ?? 'Pending'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Role</span>
            <span className="capitalize">{member.role}</span>
          </div>
          {member.pamilya && (
            <div className="flex justify-between">
              <span className="text-gray-500">Pamilya</span>
              <span>{member.pamilya}</span>
            </div>
          )}
          {member.membership_expires_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Expires</span>
              <span>
                {new Date(member.membership_expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Points */}
      <section className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Points</h3>
        <p className="text-4xl font-black">{member.points ?? 0}</p>
        <p className="text-sm text-gray-500 mt-1">
          Earned from meetings and events
        </p>
      </section>

      {/* Personal info */}
      <section className="mb-6 p-4 border rounded-lg">
        <h3 className="font-semibold mb-3">Personal Info</h3>
        <div className="flex flex-col gap-2 text-sm">
          {member.phone && (
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span>{member.phone}</span>
            </div>
          )}
          {member.year && (
            <div className="flex justify-between">
              <span className="text-gray-500">Year</span>
              <span>{member.year}</span>
            </div>
          )}
          {member.major && (
            <div className="flex justify-between">
              <span className="text-gray-500">Major</span>
              <span>{member.major}</span>
            </div>
          )}
        </div>
      </section>

      {/* edit profile button — safe to restyle, keep the href */}
      <a href="/member/profile/edit" className="inline-block mt-4 text-sm text-blue-600 underline hover:text-blue-800">
        Edit Profile
      </a>

      {/* Unpaid membership banner */}
      {member.membership_status !== 'active' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Your membership is not yet active.{' '}
          <a href="/membership" className="underline font-medium">
            Complete payment to activate.
          </a>
        </div>
      )}
    </main>
  )
}