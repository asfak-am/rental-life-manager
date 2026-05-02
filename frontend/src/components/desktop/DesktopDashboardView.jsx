import { useMemo } from 'react'
import DesktopAppShell from './DesktopAppShell'
import { AreaChart, Area, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../../utils/currency'

function getMemberName(member) {
  return member?.displayName?.trim() || member?.name?.trim() || 'Unknown'
}

function getMemberAvatar(member) {
  return member?.avatar || member?.profileImage || member?.image || ''
}

function findMemberById(members, userId) {
  const key = String(userId || '')
  return members.find(member => String(member?._id || member?.id || '') === key)
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
  onViewExpenses,
  onOpenInvite,
  onCopyInvite,
  rentStatus,
  onPayRent,
  payingRent,
  rentStatuses = [],
  onPayMemberRent,
  payingMemberRent = false,
  isAdmin = false,
}) {
  const displayName = user?.displayName || user?.name || 'Manager'
  const shortName = displayName.split(' ')[0]

  // Harmony score removed — deprecated UI

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
      // subtitle={houseName ? `${houseName} dashboard` : 'House dashboard overview'}
      searchPlaceholder="Search property or resident..."
    >
      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-8 bg-white rounded-3xl p-6 border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Utility Trend</p>
              <h4 className="text-2xl font-black mt-1">Water vs Electricity</h4>
              <p className="text-sm text-slate-500 mt-1">Tap a range to filter the graph.</p>
            </div>
            <div className="inline-flex flex-wrap gap-2 rounded-2xl bg-surface-container p-1.5 border border-slate-200">
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
                      <stop offset="5%" stopColor="rgb(var(--primary-rgb))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="rgb(var(--primary-rgb))" stopOpacity={0.06} />
                    </linearGradient>
                    <linearGradient id="electricFillDesktopDashboard" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="water" name="Water Bill" stroke="rgb(var(--primary-rgb))" fill="url(#waterFillDesktopDashboard)" strokeWidth={3} />
                  <Area type="monotone" dataKey="electricity" name="Electricity Bill" stroke="rgba(var(--primary-rgb), 0.72)" fill="url(#electricFillDesktopDashboard)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] grid place-items-center rounded-2xl bg-surface-container-low text-sm text-slate-500">
              Add water and electricity expenses to see monthly variation.
            </div>
          )}
        </section>

         {/* Invite Code */}
        {inviteCode && (
          <section className="col-span-4 bg-white rounded-[30px] p-6 border border-slate-200 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Invite Code</p>
            <h3 className="flex flex-col items-center justify-center text-2xl font-black tracking-widest text-primary mt-3 break-words">{inviteCode}</h3>
            {inviteQrSrc && (
              <div className="flex flex-col items-center justify-center mt-4 flex-1">
                <div className="bg-surface-container-low rounded-[16px] p-4">
                  <img
                    src={inviteQrSrc}
                    alt="Invite QR Code"
                    className="w-40 h-40"
                  />
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={onCopyInvite}
                className="w-full px-4 py-2.5 signature-gradient text-white font-bold rounded-lg text-sm transition-transform active:scale-95"
              >
                Copy Code
              </button>
              <button
                onClick={onOpenInvite}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 text-slate-700 font-bold border border-slate-300 text-sm hover:bg-white transition"
              >
                Refresh
              </button>
            </div>
          </section>
        )}

        {/* Recent Expenses */}
        <section className="col-span-6 bg-white rounded-[30px] p-6 border border-slate-200">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h4 className="text-2xl font-black">Recent Expenses</h4>
            <button
              type="button"
              onClick={onViewExpenses}
              className="px-3.5 py-1.5 rounded-lg bg-primary-fixed/20 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary-fixed/30 transition"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {recent.map((exp, idx) => {
              const colors = ['bg-blue-50', 'bg-purple-50', 'bg-emerald-50', 'bg-amber-50']
              const icons = ['shopping_bag', 'receipt_long', 'local_dining', 'build']
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

       

        {/* Tasks */}
        <section className="col-span-6 bg-white rounded-3xl p-6 border border-slate-200">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h4 className="text-2xl font-black">Tasks</h4>
              <p className="text-sm text-slate-500 mt-1">{upcomingTasks.length} pending items</p>
            </div>
          </div>

          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <span className="material-symbols-outlined text-4xl block mb-2">task_alt</span>
                No open tasks right now.
              </div>
            ) : (
              upcomingTasks.map((task) => {
                const isPending = !task.status || task.status === 'todo' || task.status === 'pending'

                return (
                  <div key={task._id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-slate-100 hover:border-slate-300 transition">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isPending ? 'radio_button_unchecked' : 'check_circle'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {task.description || 'Household task to keep things moving.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onMarkTaskComplete?.(task)}
                      disabled={isMarkingTaskComplete}
                      className="ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-white border border-primary-fixed/40 hover:bg-primary-fixed/20 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap transition"
                    >
                      Mark done
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Rent */}
        {(rentStatuses || []).filter(s => s.unpaidCount > 0).length > 0 && (
          <section className="col-span-12 space-y-4">
            {(rentStatuses || []).filter(s => s.unpaidCount > 0).map(status => (
              <div key={status.month} className="bg-white rounded-[30px] p-6 border border-slate-200">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Monthly Rent</p>
                    <h3 className="text-2xl font-black mt-1">{status.month}</h3>
                    <p className="text-sm text-slate-500 mt-1">{status.unpaidCount} unpaid of {status.memberCount} members</p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onPayRent?.(status.month)}
                      disabled={payingRent}
                      className="px-5 py-3 signature-gradient text-white font-bold rounded-xl disabled:opacity-60"
                    >
                      {payingRent ? 'Paying...' : 'Mark Paid'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {status.memberStatuses.map(member => {
                    const paid = member.status === 'paid'
                    const houseMember = findMemberById(members, member.userId)
                    const memberAvatar = getMemberAvatar(houseMember)
                    return (
                      <div
                        key={member.userId}
                        className={`p-4 rounded-2xl border bg-transparent ${paid ? 'border-emerald-500/50' : 'border-red-500/50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                            {memberAvatar ? (
                              <img src={memberAvatar} alt={`${member.name} avatar`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full grid place-items-center text-xs font-bold text-slate-600">
                                {(member.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm truncate">{member.name}</p>
                            <p className={`text-xs font-semibold ${paid ? 'text-emerald-500' : 'text-red-500'}`}>
                              {paid ? 'Paid' : 'Pending'}
                            </p>
                          </div>
                          <div className={`w-7 h-7 rounded-md border-2 grid place-items-center flex-shrink-0 ${paid ? 'border-emerald-500 text-emerald-500 bg-transparent' : 'border-red-500 text-red-500 bg-transparent'}`}>
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {paid ? 'check' : 'close'}
                            </span>
                          </div>
                          {isAdmin && !paid && (
                            <button
                              type="button"
                              onClick={() => onPayMemberRent?.({ userId: member.userId, month: status.month })}
                              disabled={payingMemberRent}
                              className="px-2 py-1 text-[10px] font-bold bg-primary text-on-primary rounded-md disabled:opacity-60"
                            >
                              {payingMemberRent ? 'Marking...' : 'Mark'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </DesktopAppShell>
  )
}