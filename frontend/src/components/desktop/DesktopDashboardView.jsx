import { useMemo } from 'react'
import DesktopAppShell from './DesktopAppShell'
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
  const upcomingTasks = tasks.filter(task => task.status !== 'completed').slice(0, 3)

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
        <section className="col-span-7 bg-white rounded-[30px] p-5 border border-slate-200">
          <span className="inline-flex px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] rounded-full bg-[#ecebff] text-[#5f52f2]">
            Wellness Metric
          </span>

          <h3 className="text-[30px] font-black tracking-tight mt-4">
            House Harmony Score
          </h3>

          <p className="text-slate-500 text-sm mt-1 max-w-xl">
            Calculated based on chore completion and expense settlement.
          </p>

          <div className="mt-5 flex items-center gap-8">
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

            <div className="grid grid-cols-2 gap-3 flex-1">
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

        {/* Balance Section */}
        <section className="col-span-5 bg-white rounded-[30px] p-5 border border-slate-200">
          <p className="text-xs uppercase text-slate-400">House Balance</p>

          <h3 className="text-[clamp(2rem,2.6vw,3rem)] leading-tight font-black mt-3 break-words">{balanceLabel}</h3>

          <div className="mt-5 flex gap-3">
            <button onClick={onTransferFunds} className="px-5 py-3 signature-gradient rounded-xl text-white font-semibold">
              Transfer Funds
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

        {/* Recent Expenses */}
        <section className="col-span-8 bg-white rounded-3xl p-6 border border-slate-200">
          <h4 className="text-2xl font-black mb-4">Recent Expenses</h4>

          {recent.map(exp => (
            <div key={exp._id} className="bg-[#f7f8fb] p-4 rounded-xl flex justify-between mb-2">
              <p>{exp.title}</p>
              <p>{formatCurrency(exp.amount, currency)}</p>
            </div>
          ))}
        </section>

        {/* Tasks */}
        <section className="col-span-4 bg-white rounded-3xl p-6 border border-slate-200">
          <h4 className="text-2xl font-black mb-4">Tasks</h4>

          {upcomingTasks.map(task => (
            <div key={task._id} className="bg-[#f7f8fb] p-3 rounded-xl mb-2">
              {task.title}
            </div>
          ))}
        </section>

        {/* Rent */}
        <section className="col-span-12 bg-white rounded-3xl p-6 border border-slate-200">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Monthly Rent</p>
              <h4 className="text-2xl font-black mt-1">{formatCurrency(rentStatus?.myRent?.amountDue || 0, currency)}</h4>
              <p className="text-sm text-slate-500 mt-1">{rentStatus?.month || 'Current month'} · {rentStatus?.myRent?.status === 'paid' ? 'Paid' : 'Pending'}</p>
              {rentStatus?.warningVisible ? <p className="text-xs text-red-600 mt-1">Payment overdue. Please pay before month end.</p> : null}
            </div>
            <button
              type="button"
              onClick={onPayRent}
              disabled={payingRent || rentStatus?.myRent?.status === 'paid' || !rentStatus?.earlyPayAllowed}
              className="px-5 py-3 rounded-xl signature-gradient text-white font-semibold disabled:opacity-60"
            >
              {rentStatus?.myRent?.status === 'paid' ? 'Rent Paid' : payingRent ? 'Paying...' : 'Pay Monthly Rent'}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {(rentStatus?.memberStatuses || []).map(member => {
              const paid = member.status === 'paid'
              return (
                <div
                  key={member.userId}
                  className={`p-3 rounded-xl border ${paid ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded border-2 grid place-items-center ${paid ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-red-500 bg-white text-red-500'}`}>
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {paid ? 'check' : 'close'}
                      </span>
                    </div>
                    <p className="font-bold text-sm truncate">{member.name}</p>
                  </div>
                  <p className={`text-xs font-semibold mt-1 ${paid ? 'text-emerald-700' : 'text-red-700'}`}>
                    {paid ? 'Paid' : 'Pending'}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </DesktopAppShell>
  )
}