import { formatCurrency } from '../utils/currency'
import { createMemberMap, getMemberById } from '../utils/expenseMembers'
import { useMemo } from 'react'

const CATEGORY_ICONS = {
  Food: { icon: 'shopping_basket', bg: 'bg-amber-100', text: 'text-amber-700' },
  Rent: { icon: 'home', bg: 'bg-blue-100', text: 'text-blue-700' },
  Utilities: { icon: 'bolt', bg: 'bg-purple-100', text: 'text-purple-700' },
  'Water Bill': { icon: 'water_drop', bg: 'bg-cyan-100', text: 'text-cyan-700' },
  'Electricity Bill': { icon: 'electric_bolt', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Other: { icon: 'more_horiz', bg: 'bg-gray-100', text: 'text-gray-700' },
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
  layout = 'mobile', // 'mobile' or 'desktop'
}) {
  const displayExpenses = layout === 'desktop' ? expenses.slice(0, 4) : expenses
  const memberMap = useMemo(() => createMemberMap(members), [members])

  if (layout === 'desktop') {
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
              <div key={exp._id} className={`flex items-center gap-4 p-4 rounded-2xl ${bgColor} border border-slate-100 hover:border-slate-200 transition`}>
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
              <div className={`w-12 h-12 ${cat.bg} ${cat.text} rounded-2xl flex items-center justify-center flex-shrink-0`}>
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
