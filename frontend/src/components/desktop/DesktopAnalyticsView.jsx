import DesktopAppShell from './DesktopAppShell'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from 'recharts'

const THEME_COLORS = [
  'rgb(var(--primary-rgb))',
  'rgba(var(--primary-rgb), 0.82)',
  'rgba(var(--primary-rgb), 0.66)',
  'rgba(var(--primary-rgb), 0.5)',
  'rgba(var(--primary-rgb), 0.36)',
]

const UTILITY_RANGE_OPTIONS = [
  { value: '3M', label: 'Last 3 Months' },
  { value: '6M', label: 'Last 6 Months' },
  { value: '12M', label: 'Last 12 Months' },
  { value: 'ALL', label: 'All Time' },
]

export default function DesktopAnalyticsView({
  summaryData,
  categoryData = [],
  monthlyData = [],
  utilityTrendData = [],
  utilityRange = '6M',
  onUtilityRangeChange,
}) {
  const totalSpent = summaryData?.totalExpenses || 0
  const hasCategoryData = categoryData.length > 0
  const hasMonthlyData = monthlyData.length > 0

  return (
    <DesktopAppShell
      title="Analytics Overview"
      subtitle="Shared household spending insights for all housemates."
      searchPlaceholder="Search analytics..."
    >
      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-8 bg-white rounded-3xl p-5 border border-slate-200">
          <h4 className="text-2xl font-black tracking-tight mb-4">Shared Expense Trends</h4>
          {hasMonthlyData ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barSize={34}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 700, fill: '#787586' }}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => [`LKR ${Number(value || 0).toLocaleString('en-LK')}`, 'Shared Spent']}
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    cursor={{ fill: 'rgba(var(--primary-rgb), 0.1)', radius: 8 }}
                  />
                  <Bar dataKey="amount" fill="rgb(var(--primary-rgb))" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] grid place-items-center text-sm text-slate-500 bg-[#f7f8fb] rounded-2xl">
              No monthly expense data yet.
            </div>
          )}
        </section>

        <section className="col-span-4 bg-white rounded-3xl p-5 border border-slate-200">
          <h4 className="text-2xl font-black tracking-tight">Expense Distribution</h4>
          <div className="mt-5 flex justify-center">
            <div className="w-44 h-44">
              {hasCategoryData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((item, idx) => (
                        <Cell key={`${item.name}-${idx}`} fill={THEME_COLORS[idx % THEME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`LKR ${Number(value || 0).toLocaleString('en-LK')}`, 'Amount']}
                      contentStyle={{ borderRadius: '12px', border: 'none', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full rounded-full border-[18px] border-slate-100" />
              )}
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xl font-black leading-tight">LKR {Math.round(totalSpent).toLocaleString('en-LK')}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Total Spent</p>
          </div>
          {hasCategoryData ? (
            <ul className="mt-5 space-y-2">
              {categoryData.slice(0, 3).map((item, idx) => (
                <li key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: THEME_COLORS[idx % THEME_COLORS.length] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.percent || `${Math.round((item.value / Math.max(1, categoryData.reduce((s, c) => s + c.value, 0))) * 100)}%`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-slate-500">No category breakdown available yet.</p>
          )}
        </section>

        <section className="col-span-12 bg-white rounded-3xl p-5 border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-2xl font-black tracking-tight">Utility Bills Variation</h4>
            <div className="inline-flex flex-wrap gap-2 rounded-2xl bg-[#f4f5f9] p-1.5 border border-slate-200">
              {UTILITY_RANGE_OPTIONS.map((option) => {
                const active = utilityRange === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onUtilityRangeChange?.(option.value)}
                    className={`min-w-[4.5rem] px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${active ? 'signature-gradient text-white shadow-lg shadow-primary/15' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
                    aria-pressed={active}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {utilityTrendData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilityTrendData}>
                  <defs>
                    <linearGradient id="waterFillDesktop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--primary-rgb))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="rgb(var(--primary-rgb))" stopOpacity={0.06} />
                    </linearGradient>
                    <linearGradient id="electricFillDesktop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgba(var(--primary-rgb), 0.72)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgba(var(--primary-rgb), 0.72)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#787586' }} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => [`LKR ${Number(value || 0).toLocaleString('en-LK')}`, 'Amount']}
                    contentStyle={{ borderRadius: '12px', border: 'none', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="water" name="Water Bill" stroke="rgb(var(--primary-rgb))" fill="url(#waterFillDesktop)" strokeWidth={3} />
                  <Area type="monotone" dataKey="electricity" name="Electricity Bill" stroke="rgba(var(--primary-rgb), 0.72)" fill="url(#electricFillDesktop)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] grid place-items-center rounded-2xl bg-[#f7f8fb] text-sm text-slate-500">
              Add water and electricity expenses to see monthly variation.
            </div>
          )}
        </section>
      </div>
    </DesktopAppShell>
  )
}
