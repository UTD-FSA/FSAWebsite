// ── DeleteEventModal.tsx ──────────────────────────────────
// confirmation modal requiring the officer to type the event name before deletion.
//
// deps:  DELETE /api/officer/events/[id]
// notes: destructive — deletes all tickets and attendance records for the event.
//        the type-to-confirm pattern prevents accidental deletion.
'use client'

import { useState } from 'react'
import Modal from '@/components/Modal'

export default function DeleteEventModal({
  eventName,
  eventId,
  onClose,
  onDeleted,
}: {
  eventName: string
  eventId: string
  onClose: () => void
  onDeleted: () => void
}) {
  // tracks what the officer has typed into the confirmation input
  const [typedValue, setTypedValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // delete button is only enabled when the typed text exactly matches the event name
  const isMatch = typedValue === eventName

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/officer/events/${eventId}`, { method: 'DELETE' })
      if (res.ok) {
        onDeleted()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to delete event.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose} size="sm" scrollable={false}>
      <div
        className="bg-[#141414] border border-white/10 rounded-[18px] w-full p-7 shadow-modal"
        style={{ animation: 'modalIn 0.18s ease-out' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef6f6f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h2 className="text-[16px] font-bold text-white">Delete Event</h2>
        </div>
        <p className="text-[14px] text-[#8c8c8c] font-medium mb-2 leading-relaxed">
          This will permanently delete <strong className="text-white">{eventName}</strong> and all associated registration tickets and attendance records. Paid ticket holders will lose their ticket records.
        </p>
        <p className="text-[13px] text-text-muted font-medium mb-5 leading-relaxed">
          This action cannot be undone.
        </p>
        <p className="text-[11px] font-bold tracking-[0.07em] uppercase text-[#7e7e7e] mb-1">
          Type the event name to confirm
        </p>
        <p className="text-[12px] text-text-muted font-medium mb-2">&ldquo;{eventName}&rdquo;</p>
        <input
          type="text"
          value={typedValue}
          onChange={e => setTypedValue(e.target.value)}
          placeholder="Type event name here"
          autoFocus
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0d0d0d] border border-white/10 text-[14px] text-white placeholder:text-text-muted focus:outline-none focus:border-[#ef6f6f] focus:shadow-[0_0_0_3px_rgba(239,111,111,0.12)] transition-[border-color,box-shadow] font-[inherit] mb-4"
        />
        {error && (
          <p role="alert" className="text-[13px] text-[#ef6f6f] mb-3">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#cfcfcf] border border-white/16 bg-transparent rounded-xl hover:border-white/30 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isMatch || loading}
            onClick={handleDelete}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-[#cf4d4d] hover:bg-[#e05555] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl border-none transition-colors"
          >
            {loading ? 'Deleting…' : 'Delete Event'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
