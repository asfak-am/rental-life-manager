export default function ExpenseLoadingList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-surface-container-lowest p-4 rounded-3xl flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-surface-container rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-container rounded w-3/4" />
            <div className="h-3 bg-surface-container rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
