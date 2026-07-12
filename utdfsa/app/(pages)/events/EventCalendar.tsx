// ── EventCalendar.tsx ─────────────────────────────────────
// thin client wrapper around FullCalendar's month grid — receives
// pre-mapped CalEvent rows and forwards event clicks to the caller
//
// data:  props — events (CalEvent[]), onEventClickAction callback
// deps:  @fullcalendar/react (dayGrid + interaction plugins)
// notes: dynamically imported by EventsPageClient to keep FullCalendar
//        (~300KB) out of the initial bundle
// ──────────────────────────────────────────────────────────
'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'

const PLUGINS = [dayGridPlugin, interactionPlugin]
const HEADER = { left: 'title', center: '', right: 'prev,next' }

type CalEvent = {
  id: string
  title: string
  date: string
  allDay: boolean
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: { event: unknown }
}

export default function EventCalendar({
  events,
  onEventClickAction,
}: {
  events: CalEvent[]
  onEventClickAction: (info: EventClickArg) => void
}) {
  return (
    <FullCalendar
      plugins={PLUGINS}
      initialView="dayGridMonth"
      height="auto"
      headerToolbar={HEADER}
      dayMaxEvents={3}
      forceEventDuration={false}
      defaultAllDay={true}
      displayEventTime={false}
      events={events}
      eventClick={onEventClickAction}
    />
  )
}
