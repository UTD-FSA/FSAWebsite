// ── loading.tsx ───────────────────────────────────────────
// skeleton screen for the goodphil sports page
//
// notes: sport grid skeleton renders 9 cards (3×3) matching
//        the layout in sports/page.tsx; includes captain form
//        and booking section skeletons at the bottom
// ──────────────────────────────────────────────────────────

export default function SportsLoading() {
  return (
    <div className="bg-section-bg text-white overflow-x-hidden animate-pulse">

      {/* Hero skeleton */}
      <div className="w-full h-[600px] bg-gray-800" />

      {/* What Is section skeleton */}
      <div className="py-16 px-6 md:px-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
          <div className="h-8 w-72 bg-gray-700 rounded-lg" />
          <div className="h-5 w-full max-w-xl bg-gray-700 rounded" />
          <div className="h-5 w-full max-w-xl bg-gray-700 rounded" />
          <div className="h-5 w-3/4 bg-gray-700 rounded" />
        </div>
      </div>

      {/* Sports grid section skeleton */}
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-8 w-48 bg-gray-700 rounded-lg mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="aspect-video rounded-t-xl bg-gray-700 animate-pulse" />
                <div className="px-5 pt-[18px] pb-[22px] flex flex-col gap-3">
                  <div className="h-5 w-3/4 bg-gray-700 rounded" />
                  <div className="h-4 w-full bg-gray-700 rounded" />
                  <div className="h-4 w-2/3 bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Captain interest form skeleton */}
      <div className="pt-4 pb-8 px-6 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-[240px] rounded-[26px] bg-gray-800" />
        </div>
      </div>

      {/* Meeting booking skeleton */}
      <div className="pb-20 px-6 md:px-8">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6 pt-14">
          <div className="h-8 w-72 bg-gray-700 rounded-lg" />
          <div className="h-5 w-full max-w-md bg-gray-700 rounded" />
          <div className="h-5 w-2/3 max-w-sm bg-gray-700 rounded" />
          <div className="h-14 w-48 rounded-[13px] bg-gray-700" />
        </div>
      </div>

    </div>
  )
}
