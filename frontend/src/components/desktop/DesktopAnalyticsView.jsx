import DesktopAppShell from './DesktopAppShell'

export default function DesktopAnalyticsView({ summaryData, categoryData = [], monthlyData = [] }) {
  const totalSpent = summaryData?.totalExpenses || 0
  const hasCategoryData = categoryData.length > 0
  const hasMonthlyData = monthlyData.length > 0

  return (
    <DesktopAppShell
      title="Analytics Overview"
      subtitle="Financial performance and tenant engagement insights."
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
          <h4 className="text-2xl font-black tracking-tight mb-4">Revenue Trends</h4>
          {hasMonthlyData ? (
            <div className="h-[300px] flex items-end gap-3">
              {monthlyData.map(item => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-[#ecebff] rounded-t-xl relative" style={{ height: `${Math.max(18, Number(item.amount || 0) / Math.max(1, Math.max(...monthlyData.map(month => Number(month.amount || 0)))) * 220)}px` }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-[#6a5df6] rounded-t-xl" style={{ height: '68%' }} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{item.month}</span>
                </div>
              ))}
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
            <div className="w-40 h-40 rounded-full border-[18px] border-slate-100 relative">
              <div className="absolute inset-0 rounded-full border-[18px] border-transparent border-t-[#f6b15a] border-r-[#57d0c5] border-b-[#6a5df6]" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-4xl font-black">₹{Math.round(totalSpent / 1000)}.0k</p>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Total Spent</p>
                </div>
              </div>
            </div>
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
      </div>
    </DesktopAppShell>
  )
}
