// ── loading.tsx ───────────────────────────────────────────
// skeleton screen for the pamilyas page
//
// notes: mirrors the full section order of pamilyas/page.tsx:
//        hero, what-is bar, carousel, meet-pamilyas bar,
//        pamilya cards, sign-up bar, and form card grid
// ──────────────────────────────────────────────────────────

export default function Loading() {
  return (
    <main className="bg-section-bg overflow-x-hidden">

      {/* Hero skeleton */}
      <div className="h-[50vh] md:h-[870px] bg-gray-800 animate-pulse" />

      {/* What Is heading bar skeleton */}
      <div className="bg-brand-bg py-10 px-4 flex items-center justify-center">
        <div className="h-10 w-72 bg-gray-700 rounded animate-pulse" />
      </div>

      {/* What Is text skeleton */}
      <div className="bg-section-bg px-8 py-16">
        <div className="max-w-[1218px] mx-auto space-y-4">
          {[100, 90, 95, 85, 92, 80, 88].map((w, i) => (
            <div
              key={i}
              className="h-5 bg-gray-700 rounded animate-pulse mx-auto"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>

      {/* Carousel skeleton */}
      <div className="bg-section-bg px-8 py-12">
        <div className="h-[400px] md:h-[520px] bg-gray-800 rounded-2xl animate-pulse" />
        <div className="flex items-center justify-center gap-2.5 mt-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`rounded-full bg-gray-600 animate-pulse ${i === 0 ? 'w-4 h-4' : 'w-3 h-3 opacity-50'}`} />
          ))}
        </div>
      </div>

      {/* Meet the Pamilyas heading bar skeleton */}
      <div className="bg-brand-bg py-10 px-4 flex items-center justify-center">
        <div className="h-10 w-72 bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Meet the Pamilyas card skeleton */}
      <div className="bg-section-bg py-16 px-8">
        <div className="h-24 max-w-xl mx-auto bg-gray-300 rounded-3xl animate-pulse" />
      </div>

      {/* Where Do I Sign Up heading bar skeleton */}
      <div className="bg-brand-bg py-10 px-4 flex items-center justify-center">
        <div className="h-10 w-72 bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Form cards skeleton */}
      <div className="bg-section-bg px-8 py-12">
        <div className="h-6 w-96 bg-gray-700 rounded mx-auto mb-10 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[1218px] mx-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-gray-800 rounded-[27px] animate-pulse" />
          ))}
        </div>
      </div>

    </main>
  )
}
