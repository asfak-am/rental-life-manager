export default function ExpenseErrorState({ title = 'Unable to load expenses', message, onRetry }) {
  return (
    <div className="min-h-[50vh] grid place-items-center px-6 py-12">
      <div className="max-w-md w-full rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-8 text-center shadow-[0_18px_40px_-28px_rgba(26,28,29,0.25)]">
        <div className="w-14 h-14 mx-auto rounded-full bg-error-container text-on-error-container grid place-items-center mb-4">
          <span className="material-symbols-outlined">error</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-on-surface">{title}</h2>
        <p className="mt-3 text-sm text-on-surface-variant">{message || 'Something went wrong while loading this page.'}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex items-center justify-center rounded-xl signature-gradient px-4 py-3 font-semibold text-on-primary"
          >
            Try Again
          </button>
        ) : null}
      </div>
    </div>
  )
}
