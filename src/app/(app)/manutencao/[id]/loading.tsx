export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F0EEE8] flex flex-col items-start justify-start px-4 py-8">
      <div className="w-full max-w-[430px] mx-auto bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="px-5 py-4 border-b border-[#E5E2DA]">
          <div className="h-5 w-48 bg-gray-200 rounded" />
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Field skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-3.5 w-24 bg-gray-200 rounded" />
              <div className="h-11 bg-gray-100 rounded-md" />
            </div>
          ))}
        </div>

        {/* Items section skeleton */}
        <div className="border-t border-[#E5E2DA] px-5 py-4 flex flex-col gap-3">
          <div className="h-3 w-12 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-100 rounded-md" />
        </div>

        {/* Footer skeleton */}
        <div className="border-t-2 border-[#E5E2DA] px-5 py-4">
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
