// shared event type badge styles and color helpers
// consumed by UpcomingEventsSection, EventsPageClient, and AttendanceClient

export type EventTypeBadge = {
  text: string; bg: string; border: string; dot: string; label: string
}

const EVENT_TYPE_STYLES: Record<string, EventTypeBadge> = {
  'party':           { text: '#ff84b0', bg: 'rgba(255,92,150,0.13)',  border: 'rgba(255,120,170,0.34)', dot: '#ff5e9c', label: 'Party' },
  'general meeting': { text: '#79acff', bg: 'rgba(82,150,255,0.13)',  border: 'rgba(115,168,255,0.34)', dot: '#5a96ff', label: 'General Meeting' },
  'gp event':        { text: '#bb9eff', bg: 'rgba(151,113,255,0.15)', border: 'rgba(172,138,255,0.36)', dot: '#9b7bff', label: 'GP Event' },
  'risk management': { text: '#ffd166', bg: 'rgba(255,209,102,0.12)', border: 'rgba(255,209,102,0.32)', dot: '#ffd166', label: 'Risk Management' },
  'regular event':   { text: '#75ba78', bg: 'rgba(117,186,120,0.13)', border: 'rgba(117,186,120,0.34)', dot: '#75ba78', label: 'Regular Event' },
  'other':           { text: '#63dbc9', bg: 'rgba(82,210,190,0.12)',  border: 'rgba(112,222,205,0.32)', dot: '#4fd0bd', label: 'Other' },
}

export function getBadge(type: string): EventTypeBadge {
  return EVENT_TYPE_STYLES[type.toLowerCase()] ?? {
    text: '#a9c4ab', bg: 'rgba(143,174,145,0.10)', border: 'rgba(160,190,162,0.28)', dot: '#8fae91', label: type,
  }
}

export function getEventTypeColor(type: string): string {
  return EVENT_TYPE_STYLES[type.toLowerCase()]?.dot ?? '#9a9a9a'
}
