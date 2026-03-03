export default function KatalogLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar skeleton */}
      <div className="h-16 bg-white border-b border-gray-200" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search skeleton */}
        <div className="h-11 bg-gray-200 rounded-xl animate-pulse mb-4" />

        {/* Category tabs skeleton */}
        <div className="flex gap-2 mb-6 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-full animate-pulse shrink-0" />
          ))}
        </div>

        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
