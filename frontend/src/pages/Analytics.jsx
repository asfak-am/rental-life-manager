import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from 'recharts'
import { expenseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopAnalyticsView from '../components/desktop/DesktopAnalyticsView'
import { formatCurrency, normalizeCurrency } from '../utils/currency'

const THEME_COLORS = [
  'rgb(var(--primary-rgb))',
  'rgba(var(--primary-rgb), 0.82)',
  'rgba(var(--primary-rgb), 0.66)',
  'rgba(var(--primary-rgb), 0.5)',
  'rgba(var(--primary-rgb), 0.36)',
]
const UTILITY_RANGE_OPTIONS = [
  { value: '3M', label: '3M', months: 3 },
  { value: '6M', label: '6M', months: 6 },
  { value: '12M', label: '12M', months: 12 },
  { value: 'ALL', label: 'All', months: null },
]

export default function Analytics() {
  const { members } = useHouse()
  const { user } = useAuth()
  const [utilityRange, setUtilityRange] = useState('6M')

  const { data: summaryData } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => expenseService.summary().then(r => r.data),
  })

  const { data: expensesData } = useQuery({
    queryKey: ['analytics-expenses-all'],
    queryFn: () => expenseService.getAll().then(r => r.data),
  })

  const categoryData = summaryData?.categoryBreakdown
    ? Object.entries(summaryData.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : []

  const monthlyData = summaryData?.monthlyTrends || []

  const utilityTrendData = useMemo(() => {
    const expenses = expensesData?.expenses || []
    const monthMap = new Map()

    expenses.forEach(expense => {
      if (expense.category !== 'Water Bill' && expense.category !== 'Electricity Bill') return

      const key = expense.billMonth
        ? expense.billMonth
        : new Date(expense.date).toISOString().slice(0, 7)

      if (!monthMap.has(key)) {
        monthMap.set(key, { key, water: 0, electricity: 0 })
      }

      const item = monthMap.get(key)
      if (expense.category === 'Water Bill') item.water += Number(expense.amount || 0)
      if (expense.category === 'Electricity Bill') item.electricity += Number(expense.amount || 0)
    })

    return [...monthMap.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(item => {
        const [year, month] = item.key.split('-')
        const date = new Date(Number(year), Number(month) - 1, 1)
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          water: item.water,
          electricity: item.electricity,
        }
      })
  }, [expensesData?.expenses])

  const filteredUtilityTrendData = useMemo(() => {
    const selected = UTILITY_RANGE_OPTIONS.find(option => option.value === utilityRange)
    if (!selected || selected.months == null) return utilityTrendData
    return utilityTrendData.slice(-selected.months)
  }, [utilityTrendData, utilityRange])

  const contributions = summaryData?.contributions || []

  const total  = summaryData?.totalExpenses || 0
  const currency = normalizeCurrency(user?.currency)

  return (
    <>
      <div className="hidden lg:block">
        <DesktopAnalyticsView
          summaryData={summaryData}
          categoryData={categoryData}
          monthlyData={monthlyData}
          utilityTrendData={filteredUtilityTrendData}
          utilityRange={utilityRange}
          onUtilityRangeChange={setUtilityRange}
        />
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />

      <main className="max-w-screen-xl mx-auto px-6 pt-8">
        {/* Header */}
        <section className="mb-10">
          <div>
            <span className="text-primary font-bold tracking-widest uppercase text-xs mb-2 block font-label">Analytics Ledger</span>
            <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-on-surface">Monthly Summary</h1>
            <p className="text-on-surface-variant mt-2 max-w-md">
              Comprehensive view of shared expenses across all housemates.
            </p>
          </div>
        </section>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-8 flex flex-col border border-outline-variant/15">
            <h3 className="text-xl font-headline font-bold mb-6">Spending by Category</h3>
            <div className="flex justify-center">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width={240} height={240}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%" cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [formatCurrency(v, currency), 'Amount']}
                      contentStyle={{ borderRadius: '12px', border: 'none', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-[240px] h-[240px] grid place-items-center rounded-full bg-surface-container text-sm text-on-surface-variant text-center px-8">
                  No category data yet.
                </div>
              )}
            </div>
            <div className="mt-3 text-center">
              <p className="text-2xl font-headline font-bold text-on-surface">{formatCurrency(Math.round(total), currency)}</p>
              <p className="text-[10px] uppercase tracking-widest text-outline">Total Spent</p>
            </div>
            <div className="space-y-3 mt-4">
              {categoryData.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Add expenses to see category breakdowns.</p>
              ) : categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: THEME_COLORS[i % THEME_COLORS.length] }} />
                    <span className="text-sm font-medium text-on-surface">{cat.name}</span>
                  </div>
                  <span className="font-bold text-on-surface">
                    {total > 0 ? Math.round((cat.value / categoryData.reduce((a, b) => a + b.value, 0)) * 100) : cat.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/15">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-headline font-bold">Shared Expense Trends</h3>
              <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">Last 6 Months</span>
            </div>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} barSize={32}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 700, fill: '#787586', fontFamily: 'Inter' }}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v, currency), 'Shared Spent']}
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    cursor={{ fill: 'rgba(var(--primary-rgb), 0.1)', radius: 8 }}
                  />
                  <Bar dataKey="amount" fill="rgb(var(--primary-rgb))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] grid place-items-center rounded-2xl bg-surface-container text-sm text-on-surface-variant">
                No monthly trend data yet.
              </div>
            )}
          </div>

          <div className="lg:col-span-12 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/15">
            <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-headline font-bold">Utility Bills Trend</h3>
                <p className="text-sm text-on-surface-variant mt-1">Water vs electricity over the selected period.</p>
              </div>
              <div className="inline-flex flex-wrap gap-2 rounded-2xl bg-surface-container-high/80 p-1.5 border border-outline-variant/20 shadow-sm">
                {UTILITY_RANGE_OPTIONS.map((option) => {
                  const active = utilityRange === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setUtilityRange(option.value)}
                      className={`min-w-[3.5rem] px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${active ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
                      aria-pressed={active}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
            {filteredUtilityTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={filteredUtilityTrendData}>
                  <defs>
                    <linearGradient id="waterFillMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--primary-rgb))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="rgb(var(--primary-rgb))" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="electricFillMobile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(var(--primary-rgb), 0.72)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="rgba(var(--primary-rgb), 0.72)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#787586' }} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(v) => [formatCurrency(Number(v || 0), currency), 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="water" name="Water Bill" stroke="rgb(var(--primary-rgb))" fill="url(#waterFillMobile)" strokeWidth={3} />
                  <Area type="monotone" dataKey="electricity" name="Electricity Bill" stroke="rgba(var(--primary-rgb), 0.72)" fill="url(#electricFillMobile)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] grid place-items-center rounded-2xl bg-surface-container text-sm text-on-surface-variant">
                Add water and electricity expenses to see monthly variation.
              </div>
            )}
          </div>

          {/* Contributions leaderboard */}
          <div className="lg:col-span-12 bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/15">
            <h3 className="text-xl font-headline font-bold mb-6">Individual Contributions</h3>
            <div className="space-y-4">
              {contributions.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No contribution history yet.</p>
              ) : contributions
                .sort((a, b) => b.amount - a.amount)
                .map((c, i) => {
                  const pct = total > 0 ? ((c.amount / total) * 100).toFixed(0) : 0
                  return (
                    <div key={c.userId || i} className="flex items-center gap-4">
                      <span className="text-xs font-bold text-outline w-4">{i + 1}</span>
                      <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {c.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-sm text-on-surface">{c.name}</span>
                          <span className="font-bold text-sm text-primary">{formatCurrency(c.amount, currency)}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-outline font-bold">{pct}%</span>
                    </div>
                  )
                })}
            </div>
          </div>

        </div>
      </main>

        <BottomNav />
      </div>
    </>
  )
}

