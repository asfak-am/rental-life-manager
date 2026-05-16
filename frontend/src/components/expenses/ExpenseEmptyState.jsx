export default function ExpenseEmptyState({ icon = 'receipt_long', title, description, actionLabel, onAction }) {
  return (
    <div className="bg-surface-container-lowest p-12 rounded-3xl text-center">
      <span className="material-symbols-outlined text-5xl text-outline mb-3 block">{icon}</span>
      <p className="text-on-surface-variant font-medium">{title}</p>
      {description ? <p className="mt-2 text-sm text-on-surface-variant/80">{description}</p> : null}
      {actionLabel ? (
        <button type="button" onClick={onAction} className="mt-4 text-primary font-bold text-sm">
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
