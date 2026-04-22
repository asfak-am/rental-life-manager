import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { expenseService, balanceService, houseService, taskService } from '../services'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopAppShell from '../components/desktop/DesktopAppShell'
import DesktopDashboardView from '../components/desktop/DesktopDashboardView'
import { formatCurrency } from '../utils/currency'

// Harmony score: 0-100 based on ratio of completed tasks and settled debts
function harmonyScore(balances = [], totalExpenses = 0) {
  if (totalExpenses === 0) return 100
  const unsettled = balances.filter(b => Math.abs(b.amount) > 0.5).length
  const score = Math.max(0, 100 - unsettled * 12)
  return Math.min(100, score)
}

function scoreLabel(s) {
  if (s >= 80) return { label: 'High', color: 'text-secondary' }
  if (s >= 50) return { label: 'Medium', color: 'text-tertiary' }
  return { label: 'Low', color: 'text-error' }
}

const CIRCUMFERENCE = 2 * Math.PI * 88 // r=88

function getMemberName(member) {
  return member?.displayName?.trim() || member?.name?.trim() || 'Unknown'
}

export default function Dashboard() {
  const { user } = useAuth()
  const { house, members } = useHouse()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const preferredCurrency = user?.currency || 'LKR'

  const noHouseView = (
    <>
      <div className="hidden lg:block">
        <DesktopAppShell
          title="Dashboard"
          subtitle="You are not connected to a home yet"
          searchPlaceholder="Search..."
        >
          <section className="max-w-2xl mx-auto mt-8 bg-white rounded-3xl p-10 border border-slate-200 shadow-xl shadow-slate-200/60 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#ecebff] text-[#5e51f2] mb-5">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>home_work</span>
            </div>

            <h1 className="font-headline font-extrabold text-3xl tracking-tight">No Home Connected</h1>
            <p className="text-slate-500 text-sm md:text-base mt-3 leading-relaxed">
              You are currently not part of a home. Connect to an existing home with an invite code or create a new one to continue.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/onboarding/step1')}
                className="signature-gradient px-6 py-3.5 rounded-xl text-on-primary font-bold"
              >
                Connect To A Home
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200"
              >
                Open Settings
              </button>
            </div>
          </section>
        </DesktopAppShell>
      </div>

      <div className="lg:hidden bg-surface font-body text-on-surface min-h-screen">
        <main className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-fixed/20 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-secondary-fixed/20 rounded-full blur-[100px] -z-10" />

          <section className="w-full max-w-xl bg-surface-container-lowest rounded-2xl p-8 md:p-10 border border-outline-variant/15 shadow-[0_24px_48px_-12px_rgba(26,28,29,0.04)] text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-fixed text-primary mb-5">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>home_work</span>
            </div>

            <h1 className="font-headline font-extrabold text-3xl tracking-tight">No Home Connected</h1>
            <p className="text-on-surface-variant text-sm md:text-base mt-3 leading-relaxed">
              You are currently not part of a home. Connect to an existing home with an invite code or create a new one to continue.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
              <button
                type="button"
                onClick={() => navigate('/onboarding/step1')}
                className="signature-gradient px-6 py-3.5 rounded-xl text-on-primary font-bold"
              >
                Connect To A Home
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="px-6 py-3.5 rounded-xl bg-surface-container-high text-on-surface font-semibold border border-outline-variant/20"
              >
                Open Settings
              </button>
            </div>
          </section>
        </main>
      </div>
    </>
  )

  const { data: summaryData } = useQuery({
    queryKey: ['expense-summary'],
    queryFn: () => expenseService.summary().then(r => r.data),
    enabled: !!house,
  })

  const { data: balanceData } = useQuery({
    queryKey: ['balance-raw'],
    queryFn: () => balanceService.getRaw().then(r => r.data),
    enabled: !!house,
  })

  const { data: expensesData } = useQuery({
    queryKey: ['expenses-recent'],
    queryFn: () => expenseService.getAll({ limit: 5 }).then(r => r.data),
    enabled: !!house,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks-dashboard'],
    queryFn: () => taskService.getAll().then(r => r.data),
    enabled: !!house,
  })

  const { data: inviteData } = useQuery({
    queryKey: ['invite-code'],
    queryFn: () => houseService.getInviteCode().then(r => r.data),
    enabled: !!house,
  })

  const { data: rentStatus } = useQuery({
    queryKey: ['rent-status'],
    queryFn: () => houseService.getRentStatus().then(r => r.data),
    enabled: !!house,
  })

  const payRentMutation = useMutation({
    mutationFn: () => houseService.payRent(rentStatus?.month),
    onSuccess: () => {
      toast.success('Monthly rent paid')
      qc.invalidateQueries(['rent-status'])
      qc.invalidateQueries(['balance-raw'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to pay rent'),
  })

  const myBalance  = balanceData?.balances?.find(b => b.userId === user?._id)
  const netAmount  = myBalance?.net ?? 0
  const isOwed     = netAmount > 0
  const score      = harmonyScore(balanceData?.balances, summaryData?.totalExpenses)
  const { label: sLabel, color: sColor } = scoreLabel(score)
  const dashOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
  const settledPercent = balanceData?.balances?.length
    ? Math.round((balanceData.balances.filter(balance => Math.abs(balance.net ?? balance.amount ?? 0) <= 0.5).length / balanceData.balances.length) * 100)
    : 0
  const taskCompletion = tasksData?.tasks?.length
    ? Math.round((tasksData.tasks.filter(task => task.status === 'completed').length / tasksData.tasks.length) * 100)
    : 0
  const inviteCode = inviteData?.inviteCode || house?.inviteCode || ''
  const inviteQrSrc = inviteCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=248x248&data=${encodeURIComponent(inviteCode)}`
    : ''
  const rentPaid = rentStatus?.myRent?.status === 'paid'

  const categoryIcons = {
    Food:       { icon: 'shopping_basket', bg: 'bg-amber-100',   text: 'text-amber-700'  },
    Rent:       { icon: 'home',            bg: 'bg-blue-100',    text: 'text-blue-700'   },
    Utilities:  { icon: 'bolt',            bg: 'bg-purple-100',  text: 'text-purple-700' },
    'Water Bill': { icon: 'water_drop',    bg: 'bg-cyan-100',    text: 'text-cyan-700'   },
    'Electricity Bill': { icon: 'electric_bolt', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    Other:      { icon: 'more_horiz',      bg: 'bg-gray-100',    text: 'text-gray-700'   },
  }

  if (!house) {
    return noHouseView
  }

  return (
    <>
      <div className="hidden lg:block">
        <DesktopDashboardView
          user={user}
          houseName={house?.name}
          members={members}
          expenses={expensesData?.expenses || []}
          balances={balanceData?.balances || []}
          netAmount={netAmount}
          settledPercent={settledPercent}
          taskCompletion={taskCompletion}
          tasks={tasksData?.tasks || []}
          currency={preferredCurrency}
          inviteCode={inviteCode}
          inviteQrSrc={inviteQrSrc}
          onViewLedger={() => navigate('/balances')}
          onTransferFunds={() => navigate('/expenses/add')}
          onOpenInvite={() => navigate('/settings')}
          onCopyInvite={() => {
            navigator.clipboard.writeText(inviteCode)
            toast.success('Invite code copied')
          }}
          rentStatus={rentStatus}
          onPayRent={() => payRentMutation.mutate()}
          payingRent={payRentMutation.isPending}
        />
      </div>

      <div className="lg:hidden bg-surface font-body text-on-surface min-h-screen pb-32">
        <TopBar />

      <main className="max-w-screen-xl mx-auto px-6 pt-6 space-y-8">
        {/* Harmony score + balance */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Harmony score */}
          <div className="md:col-span-7 bg-surface-container-lowest rounded-[2rem] p-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 border border-outline-variant/10">
            <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-surface-container" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12" />
                <circle
                  className="text-primary transition-all duration-700"
                  cx="96" cy="96" fill="transparent" r="88"
                  stroke="currentColor"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  strokeWidth="12"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight text-on-surface">{score}</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${sColor}`}>{sLabel}</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <h2 className="text-2xl font-bold tracking-tight">House Harmony Score</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {score >= 80
                  ? 'Your household is running smoothly! Bills are paid and tasks are on track.'
                  : 'Some balances need settling. Settle up to improve your score.'}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider">
                  {house?.name || 'Your House'}
                </span>
              </div>
            </div>
          </div>

          {/* Balance card */}
          <div className="md:col-span-5 bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-8 text-on-primary flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-on-primary-container/80 text-sm font-semibold uppercase tracking-widest">Financial Status</span>
              <h2 className="text-3xl font-extrabold mt-2 tracking-tight">
                {isOwed
                  ? `Owed to you: ${formatCurrency(Math.abs(netAmount), preferredCurrency)}`
                  : netAmount < -0.5
                  ? `You owe: ${formatCurrency(Math.abs(netAmount), preferredCurrency)}`
                  : 'All settled up!'}
              </h2>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => navigate('/balances')}
                className="flex-1 bg-on-primary text-primary font-bold py-3 px-6 rounded-xl text-sm transition-transform active:scale-95"
              >
                Settle Up
              </button>
              <button
                onClick={() => navigate('/expenses')}
                className="w-12 h-12 flex items-center justify-center bg-primary-fixed/20 rounded-xl text-on-primary transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined">receipt_long</span>
              </button>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Monthly Rent</p>
              <h3 className="text-2xl font-extrabold mt-1">{formatCurrency(rentStatus?.myRent?.amountDue || 0, preferredCurrency)}</h3>
              <p className="text-sm text-on-surface-variant mt-1">{rentStatus?.month || 'Current month'} · {rentStatus?.myRent?.status === 'paid' ? 'Paid' : 'Pending'}</p>
              {rentStatus?.warningVisible ? <p className="text-xs text-error mt-1">Payment overdue. Reminder notifications are active.</p> : null}
            </div>
            <button
              type="button"
              onClick={() => payRentMutation.mutate()}
              disabled={payRentMutation.isPending || rentStatus?.myRent?.status === 'paid' || !rentStatus?.earlyPayAllowed}
              className="px-5 py-3 signature-gradient text-on-primary font-bold rounded-xl disabled:opacity-60"
            >
              {rentStatus?.myRent?.status === 'paid' ? 'Rent Paid' : payRentMutation.isPending ? 'Paying...' : 'Pay Monthly Rent'}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* Roommates */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold tracking-tight">Roommates</h3>
            <button onClick={() => navigate('/balances')} className="text-primary text-sm font-bold">View Ledger</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            {members.map(member => {
              const memberBal = balanceData?.balances?.find(b => b.userId === member._id)
              const amt = memberBal?.net ?? 0
              const memberName = getMemberName(member)
              return (
                <div key={member._id} className="flex-shrink-0 w-32 bg-surface-container-low p-4 rounded-3xl flex flex-col items-center gap-2 border border-outline-variant/10">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-primary-fixed border-2 ${amt > 0 ? 'border-secondary' : amt < -0.5 ? 'border-error' : 'border-transparent'}`}>
                    <span className="text-lg font-black text-primary">
                      {memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <span className="text-xs font-bold">{memberName.split(' ')[0]}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${amt > 0.5 ? 'text-secondary' : amt < -0.5 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {amt > 0.5 ? `Owes ${formatCurrency(amt, preferredCurrency)}` : amt < -0.5 ? `Gets ${formatCurrency(Math.abs(amt), preferredCurrency)}` : 'Settled'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Recent expenses */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold tracking-tight">Recent Expenses</h3>
            <button onClick={() => navigate('/expenses')} className="text-primary text-sm font-bold">View All</button>
          </div>
          <div className="space-y-3">
            {expensesData?.expenses?.length === 0 && (
              <div className="bg-surface-container-lowest p-8 rounded-3xl text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 block">receipt_long</span>
                No expenses yet. Add your first one!
              </div>
            )}
            {expensesData?.expenses?.map(exp => {
              const cat = categoryIcons[exp.category] || categoryIcons.Other
              const payer = members.find(m => m._id === exp.paidBy)
              const payerName = getMemberName(payer)
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
                      {exp.category} • {exp.billMonth || new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-on-surface">{formatCurrency(exp.amount, preferredCurrency)}</p>
                    <p className="text-xs text-on-surface-variant">{payerName.split(' ')[0]} paid</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Quick add FAB */}
        <div className="fixed bottom-24 right-6 z-40">
          <button
            onClick={() => navigate('/expenses/add')}
            className="w-14 h-14 signature-gradient rounded-2xl flex items-center justify-center text-on-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
        </div>
      </main>

        <BottomNav />
      </div>
    </>
  )
}