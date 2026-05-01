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

         {/* Invite Code */}
        {inviteCode && (
          <section className="col-span-4 bg-white rounded-[30px] p-6 border border-slate-200 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Invite Code</p>
            <h3 className="flex flex-col items-center justify-center text-2xl font-black tracking-widest text-[#5f52f2] mt-3 break-words">{inviteCode}</h3>
            {inviteQrSrc && (
              <div className="flex flex-col items-center justify-center mt-4 flex-1">
                <div className="bg-[#f7f8fb] rounded-[16px] p-4 border border-slate-200">
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
              className="px-3.5 py-1.5 rounded-lg bg-[#ecebff] text-[#5f52f2] text-xs font-bold uppercase tracking-wider hover:bg-[#ddd9ff] transition"
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
                  <p className="text-lg font-black text-[#5f52f2] flex-shrink-0">{formatCurrency(exp.amount, currency)}</p>
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
                  <div key={task._id} className="flex items-center gap-4 p-4 rounded-2xl bg-[#f7f8fb] border border-slate-100 hover:border-slate-300 transition">
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
                      className="ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#5f52f2] bg-white border border-[#d8d3ff] hover:bg-[#ecebff] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap transition"
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
        <section className="col-span-12 bg-white rounded-[30px] p-6 border border-slate-200">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Monthly Rent</p>
              <h3 className="text-2xl font-black mt-1">{formatCurrency(rentStatus?.myRent?.amountDue || 0, currency)}</h3>
              <p className="text-sm text-slate-500 mt-1">{rentStatus?.month || 'Current month'} · {rentPaid ? 'Paid' : 'Pending'}</p>
            </div>
            <button
              type="button"
              onClick={onPayRent}
              disabled={payingRent || rentPaid || !rentStatus?.earlyPayAllowed}
              className="px-5 py-3 signature-gradient text-white font-bold rounded-xl disabled:opacity-60"
            >
              {rentPaid ? 'Rent Paid' : payingRent ? 'Paying...' : 'Pay Monthly Rent'}
            </button>
          </div>

          {(rentStatus?.memberStatuses || []).length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {rentStatus.memberStatuses.map(member => {
                const paid = member.status === 'paid'
                const houseMember = findMemberById(members, member.userId)
                const memberAvatar = getMemberAvatar(houseMember)
                return (
                  <div
                    key={member.userId}
                    className={`p-4 rounded-2xl border ${paid ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}
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
                        <p className={`text-xs font-semibold ${paid ? 'text-emerald-700' : 'text-red-700'}`}>
                          {paid ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                      <div className={`w-7 h-7 rounded-md border-2 grid place-items-center flex-shrink-0 ${paid ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-red-500 bg-white text-red-500'}`}>
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {paid ? 'check' : 'close'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Balance Section */}
        <section className="col-span-12 bg-white rounded-[30px] p-5 border border-slate-200 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#6a5df6] via-[#57d0c5] to-[#f6b15a]" />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">House Roommates</p>
              <h3 className="text-[clamp(2rem,2.6vw,3rem)] leading-tight font-black mt-3 break-words">{houseName || 'Your House'}</h3>
            </div>
            <div className="rounded-2xl bg-[#f4f5f9] px-4 py-3 border border-slate-200">
              <p className="text-[11px] uppercase tracking-widest text-slate-400">House Balance</p>
              <p className="text-xl font-black mt-1 break-words">{balanceLabel}</p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={onTransferFunds} className="px-5 py-3 signature-gradient rounded-xl text-white font-semibold">
              Add Expenses
            </button>

            <button onClick={onViewLedger} className="px-5 py-3 rounded-xl bg-[#ecebff] text-[#5f52f2] font-semibold">
              View Ledger
            </button>
          </div>

          {/* Members */}
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {members.length === 0 ? (
              <p className="col-span-full text-center text-slate-500">
                No house members yet.
              </p>
            ) : (
              members.map(member => {
                const memberBalance = balances.find(b => b.userId === member._id)
                const amount = memberBalance?.net ?? 0
                const memberName = getMemberName(member)
                const memberAvatar = getMemberAvatar(member)

                return (
                  <div key={member._id} className="bg-[#f7f8fb] p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition text-center">
                    <div className="w-14 h-14 mx-auto rounded-full overflow-hidden bg-[#d9dbff] border border-slate-200">
                      {memberAvatar ? (
                        <img src={memberAvatar} alt={`${memberName} avatar`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#5f52f2] font-bold text-lg">
                          {(memberName || 'R')[0]}
                        </div>
                      )}
                    </div>

                    <p className="text-sm font-semibold mt-3 truncate">{(memberName || '').split(' ')[0]}</p>

                    <p className={`text-xs font-semibold mt-1 ${amount > 0 ? 'text-amber-700' : amount < 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
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