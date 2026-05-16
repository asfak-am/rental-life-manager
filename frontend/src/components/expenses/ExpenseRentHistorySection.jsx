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
}) {
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

      {rentHistory.slice(0, 10).map(item => (
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
    </div>
  )
}
