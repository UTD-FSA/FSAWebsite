import { createUserClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: { token?: string }
}

export default async function AttendPage({ searchParams }: Props) {
  const token = searchParams.token

  if (!token) redirect('/')

  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/attend?token=${token}`)
  }

  // find the event by its attendance token
  const { data: event } = await supabase
    .from('events')
    .select('id, name, event_date, points, attend_qr_open, attend_qr_expires_at')
    .eq('attend_qr_token', token)
    .eq('is_active', true)
    .maybeSingle()

  if (!event) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600">Invalid QR Code</h1>
        <p className="text-gray-500 mt-2">This attendance code is not valid.</p>
      </main>
    )
  }

  // check if QR is open
  if (!event.attend_qr_open) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-yellow-600">Check-in Not Open</h1>
        <p className="text-gray-500 mt-2">The officer hasn't opened attendance yet.</p>
      </main>
    )
  }

  // check expiry
  if (event.attend_qr_expires_at && new Date(event.attend_qr_expires_at) < new Date()) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-yellow-600">Check-in Closed</h1>
        <p className="text-gray-500 mt-2">Attendance window has closed for this event.</p>
      </main>
    )
  }

  // get member id
  const { data: member } = await supabase
    .from('members')
    .select('id, points')
    .eq('email', user.email!)
    .maybeSingle()

  if (!member) redirect('/member/profile')

  // check if already attended
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', member.id)
    .eq('event_id', event.id)
    .maybeSingle()

  if (existing) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-yellow-600">Already Checked In</h1>
        <p className="text-gray-500">You already checked into {event.name}.</p>
      </main>
    )
  }

  // record attendance
  await supabase.from('attendance').insert({
    member_id: member.id,
    event_id: event.id,
  })

  // increment points
  if (event.points) {
    await supabase
      .from('members')
      .update({ points: (member.points ?? 0) + event.points })
      .eq('id', member.id)
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-6xl">✅</div>
      <h1 className="text-3xl font-bold text-green-600">Attendance Recorded!</h1>
      <p className="text-xl">{event.name}</p>
      {event.points ? (
        <p className="text-gray-500">+{event.points} points added to your account</p>
      ) : null}
    </main>
  )
}