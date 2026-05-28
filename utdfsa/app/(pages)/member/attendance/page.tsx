import { createUserClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AttendancePage() {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('id, points')
    .eq('email', user.email!)
    .maybeSingle()

  if (!member) redirect('/login')

  const { data: records } = await supabase
    .from('attendance')
    .select('id, created_at, events(name, event_date, event_type, points)')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Attendance History</h1>
      <p className="text-gray-500 mb-6">
        Total points: <span className="font-bold text-black">{member.points ?? 0}</span>
      </p>

      {records && records.length > 0 ? (
        <div className="flex flex-col gap-3">
          {records.map((record) => {
            const event = record.events as any
            return (
              <div key={record.id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{event?.name ?? 'Unknown Event'}</p>
                  <p className="text-sm text-gray-500">
                    {event?.event_date
                      ? new Date(event.event_date).toLocaleDateString()
                      : 'No date'}
                  </p>
                </div>
                {event?.points ? (
                  <span className="text-green-600 font-semibold">+{event.points} pts</span>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-gray-500">No attendance records yet.</p>
      )}
    </main>
  )
}