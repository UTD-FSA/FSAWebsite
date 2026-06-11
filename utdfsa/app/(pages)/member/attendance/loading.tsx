export default function AttendanceLoading() {
  return (
    <div className="max-w-2xl mx-auto px-8 py-8 animate-pulse">
      <div className="h-12 w-24 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-48 bg-gray-200 rounded mt-2 mb-8" />

      <div className="flex flex-col divide-y divide-gray-100 border rounded-lg overflow-hidden">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 px-4 flex flex-col justify-center gap-2">
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="h-3 w-1/3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
