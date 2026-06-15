'use client'

import { useState } from 'react'
import Modal from '@/components/Modal'

interface Ticket { fname: string; lname: string; email: string }

/**
 * Props — passed down from EventsPage server component (events/page.tsx)
 *   event      — shape of the event being registered for (id, name, date, location, prices, early-bird flag)
 *   isMember   — true when the logged-in user has an active membership; controls pricing and ticket limits
 *   memberInfo — pre-filled name + contact_email for the first ticket slot; null for non-members / unauthenticated
 */
interface Props {
  event: {
    id: string
    name: string
    event_date: string
    location: string | null
    price_cents_members: number
    price_cents_nonmembers: number
    is_early_bird: boolean
  }
  isMember: boolean
  memberInfo: { fname: string; lname: string; email: string } | null
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

const blank = (): Ticket => ({ fname: '', lname: '', email: '' })

// ============================================================
// UI — safe to restyle everything below this line
// available data:
//   event       — id, name, event_date, location, price_cents_members,
//                 price_cents_nonmembers, is_early_bird
//   isMember    — bool; true = member pricing + 1-ticket limit
//   memberInfo  — { fname, lname, email } | null; pre-fills the first ticket row
//   tickets     — array of { fname, lname, email } being registered
//   pricePerTicket — computed from isMember + event prices (cents)
//   total       — pricePerTicket * tickets.length (cents)
//   loading     — true while the checkout API call is in flight
//   error       — string | null; validation or API error
//   open        — bool; controls modal visibility
// change classnames, layout, colors, and typography freely
// do not remove or rename the variables being rendered
// ============================================================
export default function RegisterModal({ event, isMember, memberInfo }: Props) {
  const [open, setOpen] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([
    memberInfo
      ? { fname: memberInfo.fname, lname: memberInfo.lname, email: memberInfo.email }
      : blank(),
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pricePerTicket = isMember ? event.price_cents_members : event.price_cents_nonmembers
  const total = pricePerTicket * tickets.length

  function updateTicket(i: number, field: keyof Ticket, value: string) {
    setTickets(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t))
  }

  function addTicket() {
    if (tickets.length < 10) setTickets(prev => [...prev, blank()])
  }

  function removeTicket(i: number) {
    setTickets(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // api: calls POST /api/events/register — creates registration + Stripe checkout session — do not change this endpoint
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, tickets }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }

      // redirect to Stripe checkout (or success page for free events)
      window.location.href = data.url
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fieldCls = [
    'w-full rounded-lg px-3 py-2 text-sm transition-colors',
    'focus:outline-none focus:ring-1',
    'text-white bg-[#1e1e1e] border border-white/[0.12]',
    'placeholder:text-white/30 focus:ring-[#9747FF] focus:border-[#9747FF]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ')

  const labelCls = 'block font-display font-bold text-[10px] uppercase tracking-widest mb-1.5'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-[13px] text-white font-bold text-[15px] tracking-[0.01em] transition-all"
        style={{
          padding: '16px',
          background: '#9747FF',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = '#a85eff'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 14px 34px -12px rgba(151,71,255,0.75)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = '#9747FF'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
        }}
      >
        Get Tickets
      </button>

      {/* only renders when the user has clicked the Get Tickets button — do not remove this condition */}
      {open && (
        <Modal onClose={() => setOpen(false)} size="md">
          <div
            className="rounded-[22px]"
            style={{
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 50px 100px -30px rgba(0,0,0,0.85)',
            }}
          >
            {/* header */}
            <div className="flex items-start justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h2 className="text-lg font-bold text-white">{event.name}</h2>
                <p className="text-sm font-medium mt-0.5" style={{ color: '#8c8c8c' }}>
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                  })}
                  {event.location && ` · ${event.location}`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-full ml-4 flex-none transition-colors"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#9a9a9a',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

              {/* pricing notice */}
              <div className="rounded-[14px] p-3.5 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* only renders the member-rate label when the user is an active member — do not remove this condition */}
                {isMember ? (
                  <p className="font-semibold" style={{ color: '#bb9eff' }}>
                    Member rate · {fmt(pricePerTicket)}/ticket
                    {event.is_early_bird && ' (Early Bird)'}
                  </p>
                ) : (
                  <p style={{ color: '#a8a8a8' }}>
                    General admission · {fmt(pricePerTicket)}/ticket
                    {event.is_early_bird && ' (Early Bird)'}
                  </p>
                )}
                {/* only renders the 1-ticket limit notice for members — do not remove this condition */}
                {isMember && (
                  <p className="text-xs mt-1" style={{ color: '#6f6f6f' }}>
                    Members are limited to one ticket per event.
                  </p>
                )}
              </div>

              {/* ticket fields */}
              {tickets.map((ticket, i) => (
                <div key={i} className="rounded-[14px] p-4 flex flex-col gap-3" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      {i === 0 ? 'Your info' : `Attendee ${i + 1}`}
                    </p>
                    {/* only renders the Remove button for non-member extra attendees (not the first slot) — do not remove this condition */}
                    {!isMember && i > 0 && (
                      <button
                        type="button"
                        onClick={() => removeTicket(i)}
                        className="text-xs font-medium transition-colors"
                        style={{ color: '#ff84b0' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} style={{ color: '#7a7a7a' }}>First Name</label>
                      {/* disabled for the member's own first ticket — their name comes from memberInfo — do not remove disabled */}
                      <input
                        required
                        value={ticket.fname}
                        onChange={e => updateTicket(i, 'fname', e.target.value)}
                        disabled={isMember && i === 0}
                        className={fieldCls}
                        placeholder="First"
                      />
                    </div>
                    <div>
                      <label className={labelCls} style={{ color: '#7a7a7a' }}>Last Name</label>
                      {/* disabled for the member's own first ticket — their name comes from memberInfo — do not remove disabled */}
                      <input
                        required
                        value={ticket.lname}
                        onChange={e => updateTicket(i, 'lname', e.target.value)}
                        disabled={isMember && i === 0}
                        className={fieldCls}
                        placeholder="Last"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls} style={{ color: '#7a7a7a' }}>Email</label>
                    {/* disabled for the member's own first ticket — their contact_email comes from memberInfo — do not remove disabled */}
                    <input
                      required
                      type="email"
                      value={ticket.email}
                      onChange={e => updateTicket(i, 'email', e.target.value)}
                      disabled={isMember && i === 0}
                      className={fieldCls}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              ))}

              {/* only renders the add-attendee button for non-members who haven't hit the 10-ticket cap — do not remove this condition */}
              {!isMember && tickets.length < 10 && (
                <button
                  type="button"
                  onClick={addTicket}
                  className="w-full rounded-[14px] py-3 text-sm font-medium transition-colors"
                  style={{
                    border: '1px dashed rgba(255,255,255,0.14)',
                    color: '#6f6f6f',
                  }}
                >
                  + Add another attendee
                </button>
              )}

              {/* total */}
              <div className="flex justify-between items-center pt-1 text-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: '#9a9a9a' }}>
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                </span>
                <span className="font-bold text-base text-white">
                  {total === 0 ? 'Free' : fmt(total)}
                </span>
              </div>

              {/* only renders when the API or network returned an error — do not remove this condition */}
              {error && (
                <p className="text-sm rounded-[14px] px-3 py-2.5" style={{ color: '#ff84b0', background: 'rgba(255,92,150,0.08)', border: '1px solid rgba(255,120,170,0.2)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-4 rounded-[13px] text-[15px] tracking-[0.01em] transition-opacity disabled:opacity-60"
                style={{ background: '#9747FF' }}
              >
                {/* only shows "Processing…" while the checkout API call is in flight — do not remove this condition */}
                {loading
                  ? 'Processing…'
                  : total === 0
                    ? 'Confirm Registration'
                    : `Continue to Payment · ${fmt(total)}`}
              </button>
            </form>
          </div>
        </Modal>
      )}
    </>
  )
}
