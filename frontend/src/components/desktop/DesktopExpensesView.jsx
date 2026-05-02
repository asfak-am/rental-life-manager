import DesktopAppShell from './DesktopAppShell'
import { formatCurrency } from '../../utils/currency'
import { exportExpensesPdf } from '../../utils/pdfExport'

export default function DesktopExpensesView({
  expenses = [],
  rentHistory = [],
  summaryData,
  onAdd,
  currency = 'LKR',
  categories = ['All'],
  activeTab = 'All',
  onChangeTab,
  expenseFromDate = '',
  expenseToDate = '',
  onExpenseFromDateChange,
  onExpenseToDateChange,
  rentFromDate = '',
  rentToDate = '',
  onRentFromDateChange,
  onRentToDateChange,
}) {
  const categoryBreakdown = summaryData?.categoryBreakdown
    ? Object.entries(summaryData.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : []
  const totalExpenses = summaryData?.totalExpenses || 0
  const myShare = summaryData?.myShare || 0

  const exportPdf = () => {
    exportExpensesPdf({
      summaryData,
      expenses,
      rentHistory,
      currency,
      expenseFromDate,
      expenseToDate,
      rentFromDate,
      rentToDate,
    })
  }

  return (
    <DesktopAppShell
      title="Financial Flow"
      subtitle="Tracking real expense activity for the selected house"
      searchPlaceholder="Search expenses, invoices..."
      rightActions={(
        <>
          <button type="button" onClick={exportPdf} className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold">Export PDF</button>
          <button onClick={onAdd} className="px-4 py-2 rounded-xl signature-gradient text-white text-sm font-semibold">+ Add Expense</button>
        </>
      )}
    >
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-6 bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Outflow</p>
          <p className="text-[clamp(1.5rem,2vw,2.2rem)] font-black mt-2 leading-tight break-words">{formatCurrency(totalExpenses, currency)}</p>
        </div>
        <div
          className="col-span-6 rounded-2xl p-5 text-white shadow-lg transition-colors duration-300"
          style={{
            backgroundColor: 'rgb(var(--primary-rgb))',
            boxShadow: 'var(--primary-color) 0 0 24px 0.2',
          }}
        >
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">My Share</p>
          <p className="text-[clamp(1.9rem,2.6vw,3rem)] font-black mt-2 leading-tight break-words">{formatCurrency(myShare, currency)}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => onChangeTab?.(cat)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              activeTab === cat
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-[#f8f9fc] flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-[#5f52f2]">Expense History</span>
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">From</p>
              <input
                type="date"
                value={expenseFromDate}
                onChange={e => onExpenseFromDateChange?.(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                aria-label="Filter expenses from date"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">To</p>
              <input
                type="date"
                value={expenseToDate}
                onChange={e => onExpenseToDateChange?.(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                aria-label="Filter expenses to date"
              />
            </div>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="px-5 py-14 text-center text-slate-500">
            No expenses recorded yet.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400 border-b border-slate-200">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp._id} className="border-b border-slate-100">
                  <td className="px-5 py-4 font-semibold">{exp.title}</td>
                  <td className="px-5 py-4 text-slate-500">{exp.billMonth || new Date(exp.date).toLocaleDateString()}</td>
                  <td className="px-5 py-4"><span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-widest bg-[#ecebff] text-[#5f52f2]">{exp.category || 'Other'}</span></td>
                  <td className="px-5 py-4 font-black">{formatCurrency(exp.amount || 0, currency)}</td>
                  <td className="px-5 py-4 text-emerald-600 text-xs font-semibold uppercase tracking-widest">Recorded</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-6 bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-[#f8f9fc] flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-widest text-[#5f52f2]">Rent Paid History</span>
          <div className="flex items-center gap-2 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">From</p>
              <input
                type="date"
                value={rentFromDate}
                onChange={e => onRentFromDateChange?.(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                aria-label="Filter rent history from date"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">To</p>
              <input
                type="date"
                value={rentToDate}
                onChange={e => onRentToDateChange?.(e.target.value)}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                aria-label="Filter rent history to date"
              />
            </div>
          </div>
        </div>

        {rentHistory.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-500">
            No rent payments recorded yet.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-slate-400 border-b border-slate-200">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Month</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rentHistory.map(item => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-5 py-4 font-semibold">{item.name}</td>
                  <td className="px-5 py-4 text-slate-500">{new Date(item.paidAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-widest bg-[#ecebff] text-[#5f52f2]">{item.month}</span>
                  </td>
                  <td className="px-5 py-4 font-black">{formatCurrency(item.amount || 0, currency)}</td>
                  <td className="px-5 py-4 text-emerald-600 text-xs font-semibold uppercase tracking-widest">Paid</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </DesktopAppShell>
  )
}
