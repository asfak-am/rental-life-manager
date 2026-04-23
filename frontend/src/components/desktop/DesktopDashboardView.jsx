import { useMemo } from 'react'
import DesktopAppShell from './DesktopAppShell'
import { AreaChart, Area, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../../utils/currency'

function getMemberName(member) {
  return member?.displayName?.trim() || member?.name?.trim() || 'Unknown'
}

export default function DesktopDashboardView({
  user,
  houseName,
  members = [],
  expenses = [],
  balances = [],
  netAmount = 0,
  settledPercent = 0,
  taskCompletion = 0,
  tasks = [],
  currency = 'LKR',
  inviteCode = '',
  inviteQrSrc = '',
  utilityTrendData = [],
  utilityRange = '6M',
  onUtilityRangeChange,
  onMarkTaskComplete,
  isMarkingTaskComplete = false,
  onViewLedger,
  onTransferFunds,
  onOpenInvite,
  onCopyInvite,
  rentStatus,
  onPayRent,
  payingRent,
}) {
  const displayName = user?.displayName || user?.name || 'Manager'
  const shortName = displayName.split(' ')[0]

  const harmonyScore = useMemo(() => {
    const balanceScore = settledPercent
    const taskScore = taskCompletion
    if (!balances.length && !tasks.length) return 0
    return Math.max(0, Math.min(100, Math.round((balanceScore + taskScore) / 2)))
  }, [balances.length, settledPercent, taskCompletion, tasks.length])

  const recent = expenses.slice(0, 4)
  const upcomingTasks = tasks.filter(task => task.status !== 'completed')

  const settledLabel = settledPercent > 0 ? `${settledPercent}% settled` : 'No balances yet'
  const taskLabel = tasks.length ? `${taskCompletion}% complete` : 'No tasks yet'

  const balanceLabel =
    netAmount > 0.5
      ? `Owed to you: ${formatCurrency(Math.abs(netAmount), currency)}`
      : netAmount < -0.5
      ? `You owe: ${formatCurrency(Math.abs(netAmount), currency)}`
      : 'All settled up'
  const rentPaid = rentStatus?.myRent?.status === 'paid'

  return (
    <DesktopAppShell
      title={`Good Morning, ${shortName}`}
      subtitle={houseName ? `${houseName} dashboard` : 'House dashboard overview'}
      searchPlaceholder="Search property or resident..."
    >
      <div className="grid grid-cols-12 gap-5">

        {/* Harmony Score */}
        <section className="col-span-6 bg-white rounded-[30px] p-5 border border-slate-200">
          <span className="inline-flex px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] rounded-full bg-[#ecebff] text-[#5f52f2]">
            Wellness Metric
          </span>

          <h3 className="text-[30px] font-black tracking-tight mt-4">
            House Harmony Score
          </h3>

          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Calculated based on chore completion and expense settlement.
          </p>

          <div className="mt-5 flex flex-col items-center gap-6">
            <div className="w-40 h-40 rounded-full border-[10px] border-[#8a82f0] flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-black text-[#5f52f2]">{harmonyScore}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
                  {harmonyScore >= 80
                    ? 'Healthy'
                    : harmonyScore >= 50
                    ? 'Needs attention'
                    : 'No activity'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-[#f4f5f9] rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                  Settled
                </p>
                <p className="text-2xl font-black mt-1 leading-tight break-words">{settledLabel}</p>
              </div>

              <div className="bg-[#f4f5f9] rounded-2xl p-4">
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                  Tasks
                </p>
                <p className="text-2xl font-black mt-1 leading-tight break-words">{taskLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-6 bg-white rounded-3xl p-6 border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Utility Trend</p>
              <h4 className="text-2xl font-black mt-1">Water vs Electricity</h4>
              <p className="text-sm text-slate-500 mt-1">Tap a range to filter the graph.</p>
            </div>
            <div className="inline-flex flex-wrap gap-2 rounded-2xl bg-[#f4f5f9] p-1.5 border border-slate-200">
              {['3M', '6M', '12M', 'ALL'].map((range) => {
                const active = utilityRange === range
                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => onUtilityRangeChange?.(range)}
                    className={`min-w-[4.5rem] px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${active ? 'signature-gradient text-white shadow-lg shadow-primary/15' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
                    aria-pressed={active}
                  >
                    {range === 'ALL' ? 'All' : range}
                  </button>
                )
              })}
            </div>
          </div>

          {utilityTrendData.length > 0 ? (
            <div className="h-[280px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilityTrendData}>
                  <defs>
                    <linearGradient id="waterFillDesktopDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#57d0c5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#57d0c5" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="electricFillDesktopDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FFB800" stopOpacity={0.05} />
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
                  <Area type="monotone" dataKey="water" name="Water Bill" stroke="#57d0c5" fill="url(#waterFillDesktopDashboard)" strokeWidth={3} />
                  <Area type="monotone" dataKey="electricity" name="Electricity Bill" stroke="#FFB800" fill="url(#electricFillDesktopDashboard)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] grid place-items-center rounded-2xl bg-[#f7f8fb] text-sm text-slate-500">
              Add water and electricity expenses to see monthly variation.
            </div>
          )}
        </section>

        {/* Recent Expenses */}
        <section className="col-span-6 bg-white rounded-3xl p-6 border border-slate-200">
          <h4 className="text-2xl font-black mb-4">Recent Expenses</h4>

          {recent.map(exp => (
            <div key={exp._id} className="bg-[#f7f8fb] p-4 rounded-xl flex justify-between mb-2">
              <p>{exp.title}</p>
              <p>{formatCurrency(exp.amount, currency)}</p>
            </div>
          ))}
        </section>

        {/* Tasks */}
        <section className="col-span-6 bg-white rounded-3xl p-6 border border-slate-200 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6a5df6] via-[#57d0c5] to-[#f6b15a]" />
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-2xl font-black">Tasks</h4>
              <p className="text-sm text-slate-500 mt-1">{upcomingTasks.length} pending items</p>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[#f4f5f9] text-slate-500">
              Live
            </span>
          </div>

          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="rounded-2xl bg-[#f7f8fb] p-4 text-sm text-slate-500">
                No open tasks right now.
              </div>
            ) : upcomingTasks.map((task, index) => {
              const isInProgress = task.status === 'in-progress'
              const isPending = !task.status || task.status === 'todo' || task.status === 'pending'
              const accentClasses = [
                'bg-[#ecebff] text-[#5f52f2]',
                'bg-[#e9faf7] text-[#0f9d8d]',
                'bg-[#fff4e6] text-[#d97706]',
                'bg-[#fef2f2] text-[#dc2626]',
              ]
              const accent = accentClasses[index % accentClasses.length]

              return (
                <div key={task._id} className="rounded-2xl border border-slate-200 bg-[#f8f9fc] p-4 flex items-start gap-3 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)]">
                  <div className={`w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 ${accent}`}>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isInProgress ? 'progress_activity' : isPending ? 'radio_button_unchecked' : 'check_circle'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 truncate">{task.title}</p>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0 ${isInProgress ? 'bg-amber-100 text-amber-700' : isPending ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isInProgress ? 'Working' : isPending ? 'Pending' : 'Done'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {task.description || 'Household task to keep things moving.'}
                    </p>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onMarkTaskComplete?.(task)}
                        disabled={isMarkingTaskComplete}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-[0.18em] bg-white text-[#5f52f2] border border-[#d8d3ff] hover:bg-[#ecebff] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        Mark as complete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Rent */}
        {/* Balance Section */}
        <section className="col-span-12 bg-white rounded-[30px] p-5 border border-slate-200">
          <p className="text-xs uppercase text-slate-400">House Balance</p>

          <h3 className="text-[clamp(2rem,2.6vw,3rem)] leading-tight font-black mt-3 break-words">{balanceLabel}</h3>

          <div className="mt-5 flex gap-3">
            <button onClick={onTransferFunds} className="px-5 py-3 signature-gradient rounded-xl text-white font-semibold">
              Add Expenses
            </button>

            <button onClick={onViewLedger} className="px-5 py-3 rounded-xl bg-[#ecebff] text-[#5f52f2] font-semibold">
              View Ledger
            </button>
          </div>

          {/* Members */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {members.length === 0 ? (
              <p className="col-span-3 text-center text-slate-500">
                No house members yet.
              </p>
            ) : (
              members.slice(0, 3).map(member => {
                const memberBalance = balances.find(b => b.userId === member._id)
                const amount = memberBalance?.net ?? 0
                const memberName = getMemberName(member)

                return (
                  <div key={member._id} className="bg-[#f7f8fb] p-3 rounded-xl text-center">
                    <div className="w-10 h-10 mx-auto bg-[#d9dbff] rounded-full flex items-center justify-center text-[#5f52f2] font-bold">
                      {(memberName || 'R')[0]}
                    </div>

                    <p className="text-xs mt-2">
                      {(memberName || '').split(' ')[0]}
                    </p>

                    <p className="text-[10px] mt-1">
                      {amount > 0
                        ? `Owes ${formatCurrency(amount, currency)}`
                        : amount < 0
                        ? `Gets ${formatCurrency(Math.abs(amount), currency)}`
                        : 'Settled'}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </section>

      </div>
    </DesktopAppShell>
  )
}