import DesktopAppShell from './DesktopAppShell'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import UtilityChart from '../../components/common/UtilityChart'

// Palette based on provided swatches — one of them is the theme color.
// Order: purple, theme (teal), orange, pink
const PALETTE_PURPLE = 'rgb(139,92,246)'
const PALETTE_ORANGE = 'rgb(251,146,60)'
const PALETTE_PINK = 'rgb(236,72,153)'

const ACCENT_COLOR = PALETTE_PURPLE
const THEME_COLORS = [
  PALETTE_PURPLE,
  'rgb(var(--primary-rgb))',
  PALETTE_ORANGE,
  PALETTE_PINK,
]

function getCategoryColor(name, idx) {
  if (!name) return THEME_COLORS[idx % THEME_COLORS.length]
  const key = name.toLowerCase()
  if (key.includes('water')) return 'rgb(var(--primary-rgb))'
  if (key.includes('electric')) return ACCENT_COLOR
  if (key.includes('other')) return PALETTE_ORANGE
  return THEME_COLORS[idx % THEME_COLORS.length]
}

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
                        <Cell key={`${item.name}-${idx}`} fill={getCategoryColor(item.name, idx)} />
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
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: getCategoryColor(item.name, idx) }} />
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
          <UtilityChart
            data={utilityTrendData}
            range={utilityRange}
            onRangeChange={onUtilityRangeChange}
            title="Utility Bills Variation"
            subtitle="Water vs electricity over the selected period."
            rangeOptions={UTILITY_RANGE_OPTIONS}
            labelClassName="hidden"
            rangeWrapClassName="bg-[#f4f5f9] border-slate-200"
            activeRangeButtonClassName="signature-gradient text-white shadow-lg shadow-primary/15 min-w-[4.5rem]"
            inactiveRangeButtonClassName="text-slate-500 hover:text-slate-900 hover:bg-white min-w-[4.5rem]"
            chartWrapClassName="h-[280px]"
            emptyStateClassName="bg-[#f7f8fb] text-slate-500"
            waterColor="rgb(var(--primary-rgb))"
            electricityColor={ACCENT_COLOR}
            electricityFillColor="rgba(139,92,246,0.72)"
            electricityFillOpacityStart={0.3}
          />
        </section>
      </div>
    </DesktopAppShell>
  )
}
