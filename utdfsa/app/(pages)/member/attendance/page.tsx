// ── page.tsx ─────────────────────────────────────────────────
// server component — fetches attendance data and passes it to AttendanceClient
//
// data:  members (id, points), attendance joined with events, meeting/risk management counts
// deps:  supabase (respects rls — user client)
// notes: meetingCount and riskMgmtCount are computed via subqueries because
//        supabase doesn't support aggregate filters on joined tables directly
import { createUserClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceClient from './AttendanceClient'

export default async function AttendancePage() {
  // ============================================================
  // DATA — do not modify this section
  // authenticates the user and queries:
  //   members — for id and current point total
  //   attendance (joined with events) — full attendance history,
  //     newest first; events fields: id, name, event_date, event_type, points
  //   meetingCount — total General Meeting + Risk Management sessions attended
  //   riskMgmtCount — Risk Management sessions attended specifically
  // ============================================================
  // respects rls — only returns rows the caller owns
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  // redirect to /login if no session found
  if (!user) redirect('/login')

  // members table — fetch id and current point total for this user
  const { data: member } = await supabase
    .from('members')
    .select('id, points')
    .eq('email', user.email!)
    .maybeSingle()

  // redirect to /login if no member row exists (e.g. account not set up yet)
  if (!member) redirect('/login')

  // attendance table — full history with event details, newest first
  const { data: attendanceRecords } = await supabase
    .from('attendance')
    .select(`
      id,
      created_at,
      events (
        id,
        name,
        event_type,
        event_date,
        points
      )
    `)
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })

  // count total meetings (General Meeting + Risk Management)
  const { count: meetingCount } = await supabase
    .from('attendance')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', member.id)
    .in('event_id',
      (await supabase
        .from('events')
        .select('id')
        .in('event_type', ['General Meeting', 'Risk Management'])
      ).data?.map(e => e.id) ?? []
    )

  // check risk management specifically
  const { count: riskMgmtCount } = await supabase
    .from('attendance')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', member.id)
    .in('event_id',
      (await supabase
        .from('events')
        .select('id')
        .eq('event_type', 'Risk Management')
      ).data?.map(e => e.id) ?? []
    )

  // ============================================================
  // UI — rendered by AttendanceClient (client component)
  // ============================================================
  return (
    <AttendanceClient
      member={{ points: member.points ?? 0 }}
      attendanceRecords={attendanceRecords ?? []}
      meetingCount={meetingCount ?? 0}
      riskMgmtCount={riskMgmtCount ?? 0}
    />
  )
}
