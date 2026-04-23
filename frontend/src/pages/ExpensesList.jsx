import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { expenseService, houseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopExpensesView from '../components/desktop/DesktopExpensesView'
import { formatCurrency } from '../utils/currency'
import { exportExpensesPdf } from '../utils/pdfExport'

const EXPENSE_CATEGORIES = ['All', 'Food', 'Water Bill', 'Electricity Bill', 'Transport', 'Entertainment', 'Other']

const catStyle = {
  Food:      { icon: 'shopping_basket', bg: 'bg-amber-100',  text: 'text-amber-700'  },
  'Water Bill': { icon: 'water_drop',   bg: 'bg-cyan-100',   text: 'text-cyan-700'   },
  'Electricity Bill': { icon: 'electric_bolt', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Transport: { icon: 'directions_car',  bg: 'bg-sky-100',    text: 'text-sky-700'    },
  Entertainment: { icon: 'movie',       bg: 'bg-pink-100',   text: 'text-pink-700'   },
  Utilities: { icon: 'bolt',            bg: 'bg-purple-100', text: 'text-purple-700' },
  Rent:      { icon: 'home',            bg: 'bg-blue-100',   text: 'text-blue-700'   },
  Other:     { icon: 'more_horiz',      bg: 'bg-gray-100',   text: 'text-gray-700'   },
}

export default function ExpensesList() {
  const navigate = useNavigate()
  const { members } = useHouse()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch]       = useState('')
  const [expenseFromDate, setExpenseFromDate] = useState('')
  const [expenseToDate, setExpenseToDate] = useState('')
  const [rentFromDate, setRentFromDate] = useState('')
  const [rentToDate, setRentToDate] = useState('')
  const preferredCurrency = user?.currency || 'LKR'

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', activeTab, search],
    queryFn: () => expenseService.getAll({
      category: activeTab === 'All' ? undefined : activeTab,
      search:   search || undefined,
    }).then(r => r.data),
  })

  const { data: summaryData } = useQuery({
    queryKey: ['expense-summary'],
    queryFn: () => expenseService.summary().then(r => r.data),
  })

  const { data: rentHistoryData } = useQuery({
    queryKey: ['rent-history'],
    queryFn: () => houseService.getRentHistory().then(r => r.data),
  })

  const getExpenseFilterDate = (expense) => {
    const billMonth = String(expense?.billMonth || '').trim()
    if (/^\d{4}-\d{2}$/.test(billMonth)) {
      return new Date(`${billMonth}-01T00:00:00`)
    }
    return new Date(expense?.date)
  }

  const isWithinDateRange = (value, from, to) => {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return false

    if (from) {
      const start = new Date(`${from}T00:00:00`)
      if (date < start) return false
    }
    if (to) {
      const end = new Date(`${to}T23:59:59.999`)
      if (date > end) return false
    }
    return true
  }

  const filteredExpenses = (data?.expenses || []).filter(expense =>
    isWithinDateRange(getExpenseFilterDate(expense), expenseFromDate, expenseToDate)
  )

  const filteredRentHistory = (rentHistoryData?.history || []).filter(item =>
    isWithinDateRange(item.paidAt, rentFromDate, rentToDate)
  )

  const exportPdf = () => {
    exportExpensesPdf({
      summaryData,
      expenses: filteredExpenses,
      rentHistory: filteredRentHistory,
      currency: preferredCurrency,
      expenseFromDate,
      expenseToDate,
      rentFromDate,
      rentToDate,
    })
  }

  return (
    <>
      <div className="hidden lg:block">
        <DesktopExpensesView
          expenses={filteredExpenses}
          rentHistory={filteredRentHistory}
          summaryData={summaryData}
          currency={preferredCurrency}
          onAdd={() => navigate('/expenses/add')}
          categories={EXPENSE_CATEGORIES}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          expenseFromDate={expenseFromDate}
          expenseToDate={expenseToDate}
          onExpenseFromDateChange={setExpenseFromDate}
          onExpenseToDateChange={setExpenseToDate}
          rentFromDate={rentFromDate}
          rentToDate={rentToDate}
          onRentFromDateChange={setRentFromDate}
          onRentToDateChange={setRentToDate}
        />
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />

      <main className="max-w-screen-xl mx-auto px-6 pt-4 pb-32">
        {/* Hero */}
        <section className="mb-8">
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Expenses</h1>
          <p className="text-on-surface-variant font-medium">Keep track of your shared living costs.</p>
        </section>

        {/* Search + filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-container-high border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/60 transition-all duration-200"
              placeholder="Search transactions..."
            />
          </div>
          <button
            type="button"
            onClick={exportPdf}
            className="bg-surface-container-high p-3.5 rounded-2xl flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-95"
            aria-label="Export PDF"
          >
            <span className="material-symbols-outlined text-on-surface">download</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/expenses/add')}
            className="signature-gradient p-3.5 rounded-2xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/25 transition-transform active:scale-95"
            aria-label="Add expense"
          >
            <span className="material-symbols-outlined text-on-primary">add</span>
          </button>
        </div>

        {/* Summary bento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="sm:col-span-2 bg-primary text-on-primary p-6 rounded-3xl relative overflow-hidden min-w-0">
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Balance</p>
              <h2 className="text-[clamp(1.8rem,7vw,2.6rem)] font-black font-headline mb-4 leading-tight break-words">
                {formatCurrency(summaryData?.totalExpenses || 0, preferredCurrency)}
              </h2>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md w-fit px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-xs">calendar_month</span>
                <span className="text-xs font-bold">This month</span>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          </div>
          <div className="bg-surface-container-low p-6 rounded-3xl min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">My Share</p>
            <h2 className="text-[clamp(1.25rem,5vw,1.9rem)] font-bold font-headline text-on-surface leading-tight break-words">
              {formatCurrency(summaryData?.myShare || 0, preferredCurrency)}
            </h2>
          </div>
          <div className="bg-secondary-container p-6 rounded-3xl min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-on-secondary-container mb-1">Status</p>
            <h2 className="text-[clamp(1.25rem,5vw,1.9rem)] font-bold font-headline text-on-secondary-container leading-tight break-words">
              {summaryData?.settled ? 'Paid Up' : 'Pending'}
            </h2>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {EXPENSE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
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

        {/* Expense list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-1">Recent Transactions</h3>

          <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">From</p>
              <input
                type="date"
                value={expenseFromDate}
                onChange={e => setExpenseFromDate(e.target.value)}
                className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-outline-variant/20"
                aria-label="Filter expenses from date"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">To</p>
              <input
                type="date"
                value={expenseToDate}
                onChange={e => setExpenseToDate(e.target.value)}
                className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-outline-variant/20"
                aria-label="Filter expenses to date"
              />
            </div>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-surface-container-lowest p-4 rounded-3xl flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-surface-container rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-container rounded w-3/4" />
                    <div className="h-3 bg-surface-container rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredExpenses.length === 0 && (
            <div className="bg-surface-container-lowest p-12 rounded-3xl text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-3 block">receipt_long</span>
              <p className="text-on-surface-variant font-medium">No expenses found</p>
              <button onClick={() => navigate('/expenses/add')} className="mt-4 text-primary font-bold text-sm">+ Add First Expense</button>
            </div>
          )}

          {filteredExpenses.map(exp => {
            const cat   = catStyle[exp.category] || catStyle.Other
            const payer = members.find(m => m._id === exp.paidBy)
            return (
              <div
                key={exp._id}
                onClick={() => navigate(`/expenses/${exp._id}`)}
                className="group bg-surface-container-lowest p-4 rounded-3xl flex items-center gap-4 transition-all duration-300 hover:bg-surface-container hover:translate-x-1 active:scale-[0.98] cursor-pointer"
              >
                <div className={`w-12 h-12 ${cat.bg} ${cat.text} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <span className="material-symbols-outlined">{cat.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-on-surface truncate">{exp.title}</h4>
                  <p className="text-xs text-on-surface-variant font-medium uppercase tracking-tight">
                    {exp.category}
                    {exp.billMonth ? ` - ${exp.billMonth}` : ` - ${new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg text-on-surface">{formatCurrency(exp.amount, preferredCurrency)}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <div className="w-5 h-5 rounded-full bg-primary-fixed flex items-center justify-center text-[8px] font-bold text-primary">
                      {payer?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-xs text-on-surface-variant">{exp.splitType}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-3 mt-10">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-1">Rent Paid History</h3>

          <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">From</p>
              <input
                type="date"
                value={rentFromDate}
                onChange={e => setRentFromDate(e.target.value)}
                className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-outline-variant/20"
                aria-label="Filter rent history from date"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">To</p>
              <input
                type="date"
                value={rentToDate}
                onChange={e => setRentToDate(e.target.value)}
                className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-outline-variant/20"
                aria-label="Filter rent history to date"
              />
            </div>
          </div>

          {filteredRentHistory.length === 0 && (
            <div className="bg-surface-container-lowest p-8 rounded-3xl text-center text-on-surface-variant">
              No rent payments recorded yet.
            </div>
          )}

          {filteredRentHistory.slice(0, 10).map(item => (
            <div key={item.id} className="bg-surface-container-lowest p-4 rounded-3xl flex items-center justify-between gap-3 border border-outline-variant/10">
              <div className="min-w-0">
                <p className="font-bold text-on-surface truncate">{item.name}</p>
                <p className="text-xs text-on-surface-variant">{new Date(item.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-on-surface">{formatCurrency(item.amount || 0, preferredCurrency)}</p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Paid</p>
              </div>
            </div>
          ))}
        </div>
      </main>

        <BottomNav />
      </div>
    </>
  )
}

