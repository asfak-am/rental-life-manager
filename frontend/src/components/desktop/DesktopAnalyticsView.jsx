import DesktopAppShell from './DesktopAppShell'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from 'recharts'

const COLORS = ['#6a5df6', '#57d0c5', '#f6b15a', '#f09595', '#9fe1cb']

export default function DesktopAnalyticsView({ summaryData, categoryData = [], monthlyData = [], utilityTrendData = [] }) {
  const totalSpent = summaryData?.totalExpenses || 0
  const hasCategoryData = categoryData.length > 0
  const hasMonthlyData = monthlyData.length > 0

  return (
    <DesktopAppShell
      title="Analytics Overview"
      subtitle="Shared household spending insights for all housemates."
      searchPlaceholder="Search analytics..."
      rightActions={(
        <>
          <button className="px-4 py-2 rounded-xl bg-[#ecebff] text-[#5f52f2] text-sm font-semibold">Last 30 Days</button>
          <button className="px-4 py-2 rounded-xl signature-gradient text-white text-sm font-semibold">Export PDF</button>
        </>
      )}
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
                    cursor={{ fill: '#6a5df610', radius: 8 }}
                  />
                  <Bar dataKey="amount" fill="#6a5df6" radius={[10, 10, 0, 0]} />
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
                        <Cell key={`${item.name}-${idx}`} fill={COLORS[idx % COLORS.length]} />
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
                    <span className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-[#6a5df6]' : idx === 1 ? 'bg-[#57d0c5]' : 'bg-[#f6b15a]'}`} />
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
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Water vs Electricity</span>
          </div>

          {utilityTrendData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilityTrendData}>
                  <defs>
                    <linearGradient id="waterFillDesktop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#57d0c5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#57d0c5" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="electricFillDesktop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6a5df6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6a5df6" stopOpacity={0.05} />
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
                  <Area type="monotone" dataKey="water" name="Water Bill" stroke="#57d0c5" fill="url(#waterFillDesktop)" strokeWidth={3} />
                  <Area type="monotone" dataKey="electricity" name="Electricity Bill" stroke="#6a5df6" fill="url(#electricFillDesktop)" strokeWidth={3} />
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
