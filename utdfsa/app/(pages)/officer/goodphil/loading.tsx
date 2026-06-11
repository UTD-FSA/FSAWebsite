const HEADER_WIDTHS = ['w-32', 'w-48', 'w-16', 'w-24', 'w-24', 'w-28']
const ROW_WIDTHS    = ['w-28', 'w-40', 'w-12', 'w-20', 'w-20', 'w-24']

export default function GoodphilLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
      <div className="h-7 w-64 bg-gray-200 rounded mb-6" />
      <div className="h-10 w-80 bg-gray-200 rounded-lg mb-8" />

      <div className="border rounded-lg overflow-hidden">
        <div className="flex gap-6 px-4 py-3 bg-gray-50 border-b">
          {HEADER_WIDTHS.map((w, i) => (
            <div key={i} className={`h-4 ${w} bg-gray-300 rounded`} />
          ))}
        </div>

        <div className="divide-y divide-gray-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-6 px-4 py-3">
              {ROW_WIDTHS.map((w, j) => (
                <div key={j} className={`h-4 ${w} bg-gray-200 rounded`} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
