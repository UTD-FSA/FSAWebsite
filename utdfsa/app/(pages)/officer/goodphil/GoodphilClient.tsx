'use client'

import { useState, useMemo, useEffect } from 'react'
import type { GoodphilEligibility } from '@/types/database'

// ── helpers ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25

function PassFail({ pass, label }: { pass: boolean; label?: string }) {
  return (
    <span className={`font-semibold ${pass ? 'text-green-600' : 'text-red-500'}`}>
      {label !== undefined && <span className="mr-1 font-normal text-gray-900">{label}</span>}
      {pass ? '✓' : '✗'}
    </span>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function GoodphilClient({ members }: { members: GoodphilEligibility[] }) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  // ============================================================
  // UI — safe to restyle everything below this line
  // available data:
  //   members (GoodphilEligibility[]) — all active members from the view,
  //     each has: id, first_name, last_name, email, phone, pamilya, points,
  //     dues_paid, attended_risk_mgmt, total_meetings_attended,
  //     meets_points_requirement, automated_requirements_met
  //   query (string) — current search input, filters by first or last name
  //   filtered (GoodphilEligibility[]) — members after applying query filter
  //   page (number) — current 0-indexed page; resets to 0 when query changes
  //   paginated (GoodphilEligibility[]) — the current page's slice of filtered
  // change classnames, layout, colors, and typography freely
  // do not remove or rename the variables being rendered
  // ============================================================

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return members
    return members.filter(m =>
      m.first_name.toLowerCase().includes(q) ||
      m.last_name.toLowerCase().includes(q)
    )
  }, [members, query])

  // reset to page 0 whenever the search query changes
  useEffect(() => { setPage(0) }, [query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * PAGE_SIZE                       // 0-indexed
  const end = Math.min(start + PAGE_SIZE, filtered.length) // exclusive
  const paginated = filtered.slice(start, end)

  function exportCSV() {
    const header = [
      'Last Name', 'First Name', 'Email', 'Phone',
      'Total Meetings', 'Risk Mgmt Attended', 'Points', 'Meets Requirements',
    ]
    const rows = filtered.map(m => [
      m.last_name,
      m.first_name,
      m.email,
      m.phone ?? '',
      String(m.total_meetings_attended),
      m.attended_risk_mgmt ? 'YES' : 'NO',
      String(m.points ?? 0),
      m.automated_requirements_met ? 'YES' : 'NO',
    ])
    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'goodphil-eligibility.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goodphil Eligibility</h1>
          <p className="text-sm text-gray-700 mt-1">
            Requirements: 3 total meetings (including Risk Management) + 6 points
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="shrink-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg"
        >
          Export CSV
        </button>
      </div>

      {/* search + pagination controls */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            {filtered.length} member{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Gmail-style pagination indicator — only renders when there is more than one page */}
        {/* do not remove this condition */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-700 shrink-0">
            <span>
              {start + 1}–{end} of {filtered.length}
            </span>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              ‹
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-900">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-900">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-900">Phone</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-900">Meetings ≥ 3</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-900">Risk Mgmt</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-900">Points ≥ 6</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-900">Eligible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* only renders empty state when no rows match — do not remove this condition */}
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-sm">
                  <span className="text-gray-600">{query ? 'No members match your search.' : 'No members found.'}</span>
                </td>
              </tr>
            ) : (
              paginated.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {m.last_name}, {m.first_name}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{m.email}</td>
                  <td className="px-4 py-3 text-gray-800">{m.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <PassFail pass={m.total_meetings_attended >= 3} label={String(m.total_meetings_attended)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PassFail pass={m.attended_risk_mgmt} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {/* meets_points_requirement is the db-computed flag (points >= 6) */}
                    <PassFail pass={m.meets_points_requirement} label={String(m.points ?? 0)} />
                  </td>
                  {/* automated_requirements_met is the most important column — styled larger */}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xl font-black ${m.automated_requirements_met ? 'text-green-600' : 'text-red-500'}`}>
                      {m.automated_requirements_met ? '✓' : '✗'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
