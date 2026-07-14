// ── loading.tsx ───────────────────────────────────────────
// skeleton shown by next.js while officer/gallery/page.tsx fetches gallery rows.
// mirrors OfficerGalleryClient's layout: page header + button, "existing
// galleries" divider row, then horizontal list rows (thumb · info · badge/edit).

export default function OfficerGalleryLoading() {
  return (
    <main className="min-h-screen bg-[#070707] px-6 md:px-10 py-10">
      <div className="max-w-5xl mx-auto animate-pulse">

        {/* page header — title + subtitle left, New Archive button right */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <div className="h-8 w-64 bg-white/[0.08] rounded mb-3" />
            <div className="h-4 w-56 bg-white/[0.05] rounded" />
          </div>
          <div className="h-11 w-36 bg-white/[0.08] rounded-[13px] sm:flex-shrink-0" />
        </div>

        {/* existing galleries divider row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-4 w-32 bg-white/[0.08] rounded" />
          <span className="h-px flex-1 bg-white/7" />
          <div className="h-3.5 w-16 bg-white/[0.05] rounded" />
        </div>

        {/* gallery list rows */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-3 sm:gap-5 bg-[#121212] border border-white/8 rounded-2xl p-4"
            >
              {/* cover thumbnail */}
              <div className="w-[72px] h-[72px] rounded-[13px] flex-shrink-0 bg-white/[0.07] sm:self-center" />

              {/* info */}
              <div className="flex-1 min-w-0 sm:self-center flex flex-col gap-2">
                <div className="h-4 w-44 bg-white/[0.08] rounded" />
                <div className="h-3 w-24 bg-white/[0.05] rounded" />
              </div>

              {/* badge + edit */}
              <div className="flex sm:flex-col sm:justify-between sm:items-end gap-2 sm:flex-shrink-0 sm:self-stretch">
                <div className="h-6 w-24 bg-white/[0.06] rounded-full" />
                <div className="h-4 w-8 bg-white/[0.05] rounded" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
