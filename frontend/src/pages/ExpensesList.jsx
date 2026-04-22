import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { expenseService } from '../services'
import { useHouse } from '../context/HouseContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopExpensesView from '../components/desktop/DesktopExpensesView'

const CATEGORIES = ['All', 'Food', 'Rent', 'Utilities', 'Other']

const catStyle = {
  Food:      { icon: 'shopping_basket', bg: 'bg-amber-100',  text: 'text-amber-700'  },
  Rent:      { icon: 'home',            bg: 'bg-blue-100',   text: 'text-blue-700'   },
  Utilities: { icon: 'bolt',            bg: 'bg-purple-100', text: 'text-purple-700' },
  Other:     { icon: 'more_horiz',      bg: 'bg-gray-100',   text: 'text-gray-700'   },
}

export default function ExpensesList() {
  const navigate = useNavigate()
  const { members } = useHouse()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch]       = useState('')

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

  return (
    <>
      <div className="hidden lg:block">
        <DesktopExpensesView
          expenses={data?.expenses || []}
          summaryData={summaryData}
          onAdd={() => navigate('/expenses/add')}
        />
      </div>

      <div className="lg:hidden bg-surface font-body text-on-surface min-h-screen pb-32">
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
          <button className="bg-surface-container-high p-3.5 rounded-2xl flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-95">
            <span className="material-symbols-outlined text-on-surface">tune</span>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === cat
                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Summary bento */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="col-span-2 md:col-span-1 bg-primary text-on-primary p-6 rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Balance</p>
              <h2 className="text-3xl font-black font-headline mb-4">
                ₹{summaryData?.totalExpenses?.toLocaleString() || '0'}
              </h2>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md w-fit px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-xs">calendar_month</span>
                <span className="text-xs font-bold">This month</span>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          </div>
          <div className="bg-surface-container-low p-6 rounded-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">My Share</p>
            <h2 className="text-2xl font-bold font-headline text-on-surface">
              ₹{summaryData?.myShare?.toLocaleString() || '0'}
            </h2>
          </div>
          <div className="bg-secondary-container p-6 rounded-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-on-secondary-container mb-1">Status</p>
            <h2 className="text-2xl font-bold font-headline text-on-secondary-container">
              {summaryData?.settled ? 'Paid Up' : 'Pending'}
            </h2>
          </div>
        </div>

        {/* Expense list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-1">Recent Transactions</h3>

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

          {!isLoading && data?.expenses?.length === 0 && (
            <div className="bg-surface-container-lowest p-12 rounded-3xl text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-3 block">receipt_long</span>
              <p className="text-on-surface-variant font-medium">No expenses found</p>
              <button onClick={() => navigate('/expenses/add')} className="mt-4 text-primary font-bold text-sm">+ Add First Expense</button>
            </div>
          )}

          {data?.expenses?.map(exp => {
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
                    {exp.category} • {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg text-on-surface">₹{exp.amount.toLocaleString()}</p>
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
      </main>

      {/* FAB */}
      <div className="fixed bottom-24 right-6 z-40">
        <button
          onClick={() => navigate('/expenses/add')}
          className="w-14 h-14 signature-gradient rounded-2xl flex items-center justify-center text-on-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </div>

        <BottomNav />
      </div>
    </>
  )
}