export default function GoodphilAboutLoading() {
  return (
    <div className="bg-section-bg text-white overflow-x-hidden">

      {/* Hero skeleton */}
      <div className="w-full min-h-[70vh] bg-gray-800 animate-pulse" />

      {/* What Is Goodphil skeleton */}
      <div className="bg-section-bg px-8 py-16 max-w-[1218px] mx-auto space-y-4">
        <div className="h-24 bg-gray-700 rounded animate-pulse w-3/4" />
        <div className="h-6 bg-gray-700 rounded animate-pulse" />
        <div className="h-6 bg-gray-700 rounded animate-pulse w-5/6" />
        <div className="h-6 bg-gray-700 rounded animate-pulse w-4/6" />
      </div>

      {/* How Can I Participate skeleton */}
      <div className="bg-brand-bg h-24 animate-pulse" />
      <div className="bg-section-bg px-8 py-16 max-w-[1218px] mx-auto space-y-4">
        <div className="h-6 bg-gray-700 rounded animate-pulse" />
        <div className="h-6 bg-gray-700 rounded animate-pulse w-5/6" />
        <div className="h-48 bg-gray-700 rounded-[27px] animate-pulse mt-8" />
        <div className="h-6 bg-gray-700 rounded animate-pulse w-4/6 mt-8" />
      </div>

      {/* All Competing Teams skeleton */}
      <div className="bg-brand-bg h-24 animate-pulse" />
      <div className="bg-section-bg px-8 py-12">
        <div className="grid grid-cols-2 gap-6 max-w-[1400px] mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

    </div>
  )
}
