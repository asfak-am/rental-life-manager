import { formatCurrency } from '../../utils/currency'
import { getExpenseCategoryStyle } from '../../constants/categories'

export default function ExpenseTransactionCard({ expense, currency = 'LKR', payerName = 'Unknown', onClick }) {
  const category = getExpenseCategoryStyle(expense.category)
  const dateLabel = expense.billMonth || new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const payerInitial = payerName?.charAt?.(0) || '?'

  return (
    <div
      onClick={() => onClick?.(expense._id)}
      className="group bg-surface-container-lowest p-4 rounded-3xl flex items-center gap-4 transition-all duration-300 hover:bg-surface-container hover:translate-x-1 active:scale-[0.98] cursor-pointer"
    >
      <div className={`w-12 h-12 ${category.bg} ${category.text} rounded-2xl flex items-center justify-center flex-shrink-0`}>
        <span className="material-symbols-outlined">{category.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold truncate text-slate-900 dark:text-white">{expense.title}</h4>
        <p className="text-xs font-medium uppercase tracking-tight text-slate-500 dark:text-slate-300">
          {expense.category} • {dateLabel}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-lg text-slate-900 dark:text-white">{formatCurrency(expense.amount, currency)}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <div className="w-5 h-5 rounded-full bg-primary-fixed flex items-center justify-center text-[8px] font-bold text-primary">
            {payerInitial}
          </div>
          <span className="text-xs text-on-surface-variant">{expense.splitType}</span>
        </div>
      </div>
    </div>
  )
}
