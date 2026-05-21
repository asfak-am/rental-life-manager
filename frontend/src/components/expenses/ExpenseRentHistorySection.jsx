import { formatCurrency } from '../../utils/currency'
import ExpenseDateRangeFilters from './ExpenseDateRangeFilters'
import ExpenseEmptyState from './ExpenseEmptyState'

export default function ExpenseRentHistorySection({
  rentHistory = [],
  currency = 'LKR',
  rentFromDate = '',
  rentToDate = '',
  onRentFromDateChange,
  onRentToDateChange,
  page = 1,
  pages = 1,
  onPageChange,
}) {
  const getVisiblePages = (current, total, maxButtons = 3) => {
    const safeTotal = Math.max(1, total || 1)
    const safeCurrent = Math.min(Math.max(1, current || 1), safeTotal)
    const buttonCount = Math.min(maxButtons, safeTotal)
    const start = Math.max(1, Math.min(safeCurrent - Math.floor(buttonCount / 2), safeTotal - buttonCount + 1))
    return Array.from({ length: buttonCount }, (_, index) => start + index)
  }

  return (
    <div className="space-y-3 mt-10">
      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-1">Rent Paid History</h3>

      <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/10">
        <ExpenseDateRangeFilters
          fromValue={rentFromDate}
          toValue={rentToDate}
          onFromChange={onRentFromDateChange}
          onToChange={onRentToDateChange}
          wrapperClassName="grid grid-cols-1 sm:grid-cols-2 gap-2"
          labelClassName="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1"
          inputClassName="w-full bg-white rounded-xl px-3 py-2 text-sm border border-outline-variant/20"
          fromAriaLabel="Filter rent history from date"
          toAriaLabel="Filter rent history to date"
        />
      </div>

      {rentHistory.length === 0 && (
        <ExpenseEmptyState icon="payments" title="No rent payments recorded yet." />
      )}

      {rentHistory.map(item => (
        <div key={item.id} className="bg-surface-container-lowest p-4 rounded-3xl flex items-center justify-between gap-3 border border-outline-variant/10">
          <div className="min-w-0">
            <p className="font-bold text-on-surface truncate">{item.name}</p>
            <p className="text-xs text-on-surface-variant">{new Date(item.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-on-surface">{formatCurrency(item.amount || 0, currency)}</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Paid</p>
          </div>
        </div>
      ))}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-xl bg-surface-container text-sm font-semibold border border-outline-variant/30 disabled:opacity-45 disabled:cursor-not-allowed hover:bg-surface-container-high transition"
          >
            Prev
          </button>
          {getVisiblePages(page, pages, 3).map(pageNumber => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange?.(pageNumber)}
              className={`min-w-9 px-3 py-1.5 rounded-xl text-sm font-semibold border transition ${
                page === pageNumber
                  ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20'
                  : 'bg-surface-container text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <div className="text-sm text-on-surface-variant">Page {page} of {pages}</div>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="px-3 py-1.5 rounded-xl bg-surface-container text-sm font-semibold border border-outline-variant/30 disabled:opacity-45 disabled:cursor-not-allowed hover:bg-surface-container-high transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
