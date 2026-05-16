import { formatCurrency } from '../../utils/currency'
import { createMemberMap, getMemberById } from '../../utils/expenseMembers'
import { useMemo } from 'react'

const CATEGORY_ICONS = {
  Food: { icon: 'shopping_bag', bg: 'bg-blue-50' },
  Rent: { icon: 'receipt_long', bg: 'bg-purple-50' },
  Utilities: { icon: 'local_dining', bg: 'bg-emerald-50' },
  Other: { icon: 'build', bg: 'bg-amber-50' },
}

function getMemberName(member) {
  return member?.displayName?.trim() || member?.name?.trim() || 'Unknown'
}

export default function DashboardExpensesSection({
  expenses = [],
  members = [],
  currency = 'LKR',
  onViewAll,
  onExpenseClick,
  layout = 'mobile',
  compact = false,
}) {
  const displayExpenses = layout === 'desktop' ? expenses.slice(0, 4) : expenses
  const memberMap = useMemo(() => createMemberMap(members), [members])

  if (layout === 'desktop') {
    if (compact) {
      return (
        <section className="col-span-6 bg-white rounded-[24px] p-5 border border-slate-200 shadow-[0_20px_50px_-34px_rgba(26,28,29,0.22)] overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h4 className="text-xl font-black tracking-tight">Recent Expenses</h4>
            <button
              type="button"
              onClick={onViewAll}
              className="px-3.5 py-1.5 rounded-full bg-primary-fixed/20 text-primary text-[11px] font-bold uppercase tracking-[0.18em] hover:bg-primary-fixed/30 transition"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {displayExpenses.map((exp, idx) => {
              const bgColor = ['bg-blue-50', 'bg-purple-50', 'bg-emerald-50', 'bg-amber-50'][idx % 4]
              const icon = ['shopping_bag', 'receipt_long', 'local_dining', 'build'][idx % 4]
              return (
                <div
                  key={exp._id}
                  onClick={() => onExpenseClick?.(exp._id)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3.5 border border-slate-100 hover:border-slate-200 transition cursor-pointer ${bgColor}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-slate-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-slate-900">{exp.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{exp.category} • {exp.billMonth || new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm text-slate-900">{formatCurrency(exp.amount, currency)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )
    }
    const colors = ['bg-blue-50', 'bg-purple-50', 'bg-emerald-50', 'bg-amber-50']
    const icons = ['shopping_bag', 'receipt_long', 'local_dining', 'build']

    return (
      <section className="col-span-6 bg-white rounded-[30px] p-6 border border-slate-200">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h4 className="text-2xl font-black">Recent Expenses</h4>
          <button
            type="button"
            onClick={onViewAll}
            className="px-3.5 py-1.5 rounded-lg bg-primary-fixed/20 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary-fixed/30 transition"
          >
            View all
          </button>
        </div>

        <div className="space-y-3">
          {displayExpenses.map((exp, idx) => {
            const bgColor = colors[idx % colors.length]
            const icon = icons[idx % icons.length]

            return (
              <div
                key={exp._id}
                onClick={() => onExpenseClick?.(exp._id)}
                className={`flex items-center gap-4 p-4 rounded-2xl ${bgColor} border border-slate-100 hover:border-slate-200 transition cursor-pointer`}
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-slate-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{exp.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Recently added</p>
                </div>
                <p className="text-lg font-black text-primary flex-shrink-0">{formatCurrency(exp.amount, currency)}</p>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // Mobile layout
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">Recent Expenses</h3>
        <button onClick={onViewAll} className="text-primary text-sm font-bold">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {expenses.length === 0 && (
          <div className="bg-surface-container-lowest p-8 rounded-3xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 block">receipt_long</span>
            No expenses yet. Add your first one!
          </div>
        )}
        {expenses.map(exp => {
          const cat = CATEGORY_ICONS[exp.category] || CATEGORY_ICONS.Other
          const payer = getMemberById(memberMap, exp.paidBy)
          const payerName = getMemberName(payer)
          return (
            <div
              key={exp._id}
              onClick={() => onExpenseClick?.(exp._id)}
              className="group bg-surface-container-lowest p-4 rounded-3xl flex items-center gap-4 transition-all duration-300 hover:bg-surface-container hover:translate-x-1 active:scale-[0.98] cursor-pointer"
            >
              <div className={`w-12 h-12 ${cat.bg} text-slate-600 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                <span className="material-symbols-outlined">{cat.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-on-surface truncate">{exp.title}</h4>
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-tight">
                  {exp.category} • {exp.billMonth || new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-on-surface">{formatCurrency(exp.amount, currency)}</p>
                <p className="text-xs text-on-surface-variant">{payerName.split(' ')[0]} paid</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
