export default function ExpenseFilterBar({ search, onSearchChange, onExport, onAdd }) {
  return (
    <div className="flex gap-3 mb-6">
      <div className="relative flex-1">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
        <input
          value={search}
          onChange={e => onSearchChange?.(e.target.value)}
          className="w-full bg-surface-container-high border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/60 transition-all duration-200"
          placeholder="Search transactions..."
        />
      </div>
      <button
        type="button"
        onClick={onExport}
        className="bg-surface-container-high p-3.5 rounded-2xl flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-95"
        aria-label="Export PDF"
      >
        <span className="material-symbols-outlined text-on-surface">download</span>
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="signature-gradient p-3.5 rounded-2xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/25 transition-transform active:scale-95"
        aria-label="Add expense"
      >
        <span className="material-symbols-outlined text-on-primary">add</span>
      </button>
    </div>
  )
}
