// ── loading.tsx ──────────────────────────────────────────────
// archives page skeleton — mirrors header, filter pills, and grid layout
//
// notes: pill widths vary to mimic real semester label lengths;
//        10 grid skeletons (cover + two caption lines) fill two rows at xl
// ─────────────────────────────────────────────────────────────
export default function ArchivesLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-12 pt-14 lg:pt-[72px] pb-24">
        {/* Page header skeleton */}
        <div className="flex flex-col gap-4">
          <div className="h-3 w-44 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-12 w-64 rounded bg-white/[0.08] animate-pulse" />
          <div className="h-5 w-32 rounded bg-white/[0.05] animate-pulse" />
        </div>

        {/* Filter pills skeleton */}
        <div className="pt-9 flex items-center gap-2.5 flex-wrap">
          {[56, 96, 104, 92, 100].map((w, i) => (
            <div
              key={i}
              className="h-9 rounded-full bg-white/[0.06] animate-pulse"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>

        {/* Grid skeleton */}
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-[18px] gap-y-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <div className="aspect-square rounded-[10px] bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-2.5 w-1/3 rounded bg-white/[0.04] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
