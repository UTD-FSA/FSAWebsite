export default function EventsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-6" />

      <div className="flex gap-4 mb-10 overflow-hidden">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 w-64 bg-gray-200 rounded-full shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-lg overflow-hidden border border-gray-100">
            <div className="h-48 bg-gray-200 rounded-lg" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="h-96 w-full bg-gray-200 rounded-xl" />
    </div>
  )
}
