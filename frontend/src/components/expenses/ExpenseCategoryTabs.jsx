export default function ExpenseCategoryTabs({ categories = [], activeTab = 'All', onChangeTab }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {categories.map(cat => (
        <button
          key={cat}
          type="button"
          onClick={() => onChangeTab?.(cat)}
          className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
            activeTab === cat
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
