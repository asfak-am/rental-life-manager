import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { expenseService, balanceService, houseService, taskService } from '../services'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopDashboardView from '../components/desktop/DesktopDashboardView'

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

export default function Dashboard() {
  const { user } = useAuth()
  const { house, members } = useHouse()
  const navigate = useNavigate()

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

  const categoryIcons = {
    Food:       { icon: 'shopping_basket', bg: 'bg-amber-100',   text: 'text-amber-700'  },
    Rent:       { icon: 'home',            bg: 'bg-blue-100',    text: 'text-blue-700'   },
    Utilities:  { icon: 'bolt',            bg: 'bg-purple-100',  text: 'text-purple-700' },
    Other:      { icon: 'more_horiz',      bg: 'bg-gray-100',    text: 'text-gray-700'   },
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
          inviteCode={inviteCode}
          inviteQrSrc={inviteQrSrc}
          onViewLedger={() => navigate('/balances')}
          onTransferFunds={() => navigate('/expenses/add')}
          onOpenInvite={() => navigate('/settings')}
          onCopyInvite={() => {
            navigator.clipboard.writeText(inviteCode)
            toast.success('Invite code copied')
          }}
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
                  ? `Owed to you: ₹${Math.abs(netAmount).toLocaleString()}`
                  : netAmount < -0.5
                  ? `You owe: ₹${Math.abs(netAmount).toLocaleString()}`
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
              return (
                <div key={member._id} className="flex-shrink-0 w-32 bg-surface-container-low p-4 rounded-3xl flex flex-col items-center gap-2 border border-outline-variant/10">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-primary-fixed border-2 ${amt > 0 ? 'border-secondary' : amt < -0.5 ? 'border-error' : 'border-transparent'}`}>
                    <span className="text-lg font-black text-primary">
                      {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <span className="text-xs font-bold">{member.name?.split(' ')[0]}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${amt > 0.5 ? 'text-secondary' : amt < -0.5 ? 'text-error' : 'text-on-surface-variant'}`}>
                    {amt > 0.5 ? `Owes ₹${amt.toFixed(0)}` : amt < -0.5 ? `Gets ₹${Math.abs(amt).toFixed(0)}` : 'Settled'}
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
                      {exp.category} • {new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-on-surface">₹{exp.amount.toLocaleString()}</p>
                    <p className="text-xs text-on-surface-variant">{payer?.name?.split(' ')[0] || 'Unknown'} paid</p>
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