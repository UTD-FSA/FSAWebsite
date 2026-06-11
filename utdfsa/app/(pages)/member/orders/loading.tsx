export default function OrdersLoading() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-8 animate-pulse">
      <div className="h-7 w-40 bg-gray-200 rounded mb-8" />

      <div className="flex flex-col gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-xl border border-gray-100 px-5 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
