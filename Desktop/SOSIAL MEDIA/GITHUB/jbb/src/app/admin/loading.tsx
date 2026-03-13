export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200" />
      {/* Banner */}
      <div className="h-40 bg-gray-200 animate-pulse" />
      <div className="max-w-3xl mx-auto px-4 -mt-8 space-y-4 pb-10">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}
