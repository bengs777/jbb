export default function BuyerLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200" />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
