// ── page.tsx ─────────────────────────────────────────────────
// server component — fetches attendance data and passes it to AttendanceClient
//
// data:  members (id, points), attendance joined with events, meeting/risk management counts
// deps:  supabase (respects rls — user client)
// notes: meetingCount and riskMgmtCount are derived in js from attendanceRecords (already
//        fetched below) instead of two extra count queries — same events embed, one less round trip
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

  // attendance history — events embed already carries event_type, so meeting/risk-mgmt
  // counts are derived from this one result below instead of two extra count queries
  const { data: attendanceRecords } = await supabase.from('attendance').select(`
      id,
      created_at,
      events (
        id,
        name,
        event_type,
        event_date,
        points
      )
    `).eq('member_id', member.id).order('created_at', { ascending: false })

  // supabase returns the joined row as an object or a single-element array depending on
  // relation cardinality — normalize the same way AttendanceClient's resolveEvent does
  const resolveEventType = (raw: unknown): string | undefined => {
    const e = Array.isArray(raw) ? raw[0] : raw
    return (e as { event_type?: string } | null | undefined)?.event_type
  }

  const meetingCount = (attendanceRecords ?? []).filter(r => {
    const type = resolveEventType(r.events)
    return type === 'General Meeting' || type === 'Risk Management'
  }).length
  const riskMgmtCount = (attendanceRecords ?? []).filter(r => resolveEventType(r.events) === 'Risk Management').length

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
