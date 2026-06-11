export default function ApplicationsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
      <div className="flex gap-3 mb-6">
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
        <div className="h-10 w-32 bg-gray-200 rounded-lg" />
      </div>

      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl p-5 flex flex-col justify-end gap-2">
            <div className="h-4 w-3/4 bg-gray-300 rounded" />
            <div className="h-3 w-1/2 bg-gray-300 rounded" />
            <div className="h-3 w-1/3 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
