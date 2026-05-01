import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AreaChart, Area, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { expenseService, balanceService, houseService, taskService } from '../services'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopAppShell from '../components/desktop/DesktopAppShell'
import DesktopDashboardView from '../components/desktop/DesktopDashboardView'
import { formatCurrency } from '../utils/currency'
import { buildInviteLink, buildInviteQrSrc } from '../utils/inviteLink'

const UTILITY_RANGE_OPTIONS = [
  { value: '3M', label: '3M', months: 3 },
  { value: '6M', label: '6M', months: 6 },
  { value: '12M', label: '12M', months: 12 },
  { value: 'ALL', label: 'All', months: null },
]

// Harmony score removed — helpers deprecated

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

export default function Dashboard() {
  const { user } = useAuth()
  const { house, members, loading: houseLoading, error: houseError, refreshHouse } = useHouse()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const preferredCurrency = user?.currency || 'LKR'
  const [utilityRange, setUtilityRange] = useState('6M')

  const isHouseBootstrapping = !!user && !house && !houseError && (houseLoading || members.length === 0)

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

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen">
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

  const houseErrorView = (
    <div className="min-h-screen bg-surface app-light-gradient font-body text-on-surface flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl bg-surface-container-lowest rounded-2xl p-8 md:p-10 border border-outline-variant/15 shadow-[0_24px_48px_-12px_rgba(26,28,29,0.04)] text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-error-container text-on-error-container mb-5">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_off</span>
        </div>

        <h1 className="font-headline font-extrabold text-3xl tracking-tight">Couldn’t load your house</h1>
        <p className="text-on-surface-variant text-sm md:text-base mt-3 leading-relaxed">
          The app could not fetch your current house data. This is usually temporary, so try again before starting a new house.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
          <button
            type="button"
            onClick={() => refreshHouse().catch(() => {})}
            className="signature-gradient px-6 py-3.5 rounded-xl text-on-primary font-bold"
          >
            Try Again
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
    </div>
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

  const { data: utilityTrendData } = useQuery({
    queryKey: ['dashboard-utility-trend', utilityRange],
    queryFn: () => expenseService.utilityTrend(utilityRange).then(r => r.data),
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
      qc.setQueryData(['rent-status'], prev => prev ? { ...prev, myRent: { ...prev.myRent, status: 'paid', paidAt: new Date() } } : prev)
      qc.invalidateQueries(['rent-status'])
      qc.invalidateQueries(['balance-raw'])
      qc.invalidateQueries(['rent-expenses'])
      qc.invalidateQueries(['expenses-recent'])
      qc.invalidateQueries({ queryKey: ['expense'] })
      toast.success('Monthly rent paid')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to pay rent'),
  })

  const completeTaskMutation = useMutation({
    mutationFn: (task) => taskService.update(task._id, { status: 'completed' }),
    onSuccess: () => {
      toast.success('Task marked complete')
      qc.invalidateQueries(['tasks-dashboard'])
      qc.invalidateQueries(['tasks'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update task'),
  })

  const refreshInviteMutation = useMutation({
    mutationFn: () => houseService.refreshCode(),
    onSuccess: () => {
      toast.success('Invite code refreshed!')
      qc.invalidateQueries(['invite-code'])
    },
    onError: () => toast.error('Failed to refresh invite code'),
  })

  const myBalance = balanceData?.balances?.find(b => b.userId === user?._id)
  const netAmount = myBalance?.net ?? 0
  const isOwed = netAmount > 0
  // Harmony score removed
  const settledPercent = balanceData?.balances?.length
    ? Math.round((balanceData.balances.filter(balance => Math.abs(balance.net ?? balance.amount ?? 0) <= 0.5).length / balanceData.balances.length) * 100)
    : 0
  const taskCompletion = tasksData?.tasks?.length
    ? Math.round((tasksData.tasks.filter(task => task.status === 'completed').length / tasksData.tasks.length) * 100)
    : 0
  const inviteCode = inviteData?.inviteCode || house?.inviteCode || ''
  const inviteLink = inviteData?.inviteLink || buildInviteLink(inviteCode)
  const inviteQrSrc = buildInviteQrSrc(inviteLink)
  const rentPaid = rentStatus?.myRent?.status === 'paid'

  const filteredUtilityTrendData = useMemo(() => {
    const data = utilityTrendData?.trend || []
    return data.map(item => {
      const [year, month] = String(item.month || '').split('-')
      const date = new Date(Number(year), Number(month) - 1, 1)
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        water: Number(item.water || 0),
        electricity: Number(item.electricity || 0),
      }
    })
  }, [utilityTrendData])

  const categoryIcons = {
    Food: { icon: 'shopping_basket', bg: 'bg-amber-100', text: 'text-amber-700' },
    Rent: { icon: 'home', bg: 'bg-blue-100', text: 'text-blue-700' },
    Utilities: { icon: 'bolt', bg: 'bg-purple-100', text: 'text-purple-700' },
    'Water Bill': { icon: 'water_drop', bg: 'bg-cyan-100', text: 'text-cyan-700' },
    'Electricity Bill': { icon: 'electric_bolt', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    Other: { icon: 'more_horiz', bg: 'bg-gray-100', text: 'text-gray-700' },
  }

  if (isHouseBootstrapping) {
    return (
      <div className="min-h-screen bg-surface app-light-gradient font-body text-on-surface flex items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-11 h-11 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-on-surface-variant text-sm font-medium">Loading your house...</span>
        </div>
      </div>
    )
  }

  if (houseError && houseError.response?.status !== 404) {
    return houseErrorView
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
          utilityTrendData={filteredUtilityTrendData}
          utilityRange={utilityRange}
          onUtilityRangeChange={setUtilityRange}
          onMarkTaskComplete={(task) => completeTaskMutation.mutate(task)}
          isMarkingTaskComplete={completeTaskMutation.isPending}
          onViewLedger={() => navigate('/balances')}
          onViewExpenses={() => navigate('/expenses')}
          onTransferFunds={() => navigate('/expenses/add')}
          onOpenInvite={() => refreshInviteMutation.mutate()}
          onCopyInvite={() => {
            navigator.clipboard.writeText(inviteCode)
            toast.success('Invite code copied')
          }}
          rentStatus={rentStatus}
          onPayRent={() => payRentMutation.mutate()}
          payingRent={payRentMutation.isPending}
        />
      </div>

      <div className="lg:hidden relative overflow-hidden bg-[linear-gradient(180deg,#f1eeff_0%,#eaf9ff_38%,#fff8ee_100%)] font-body text-on-surface min-h-screen pb-32">
        <div className="pointer-events-none absolute -top-24 left-[-14%] h-64 w-64 rounded-full bg-[#5f52f2]/18 blur-3xl" />
        <div className="pointer-events-none absolute top-44 right-[-16%] h-72 w-72 rounded-full bg-[#59dad1]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-16 left-[-12%] h-60 w-60 rounded-full bg-[#f6b15a]/18 blur-3xl" />
        <TopBar />

        <main className="relative z-10 max-w-screen-xl mx-auto px-6 pt-6 space-y-8">
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 border border-outline-variant/10 flex flex-col justify-center">
              <div className="flex flex-col items-center gap-6 text-center">
                {/* Harmony score removed */}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-8 text-on-primary flex flex-col shadow-xl overflow-hidden min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <span className="text-on-primary-container/80 text-sm font-semibold uppercase tracking-widest">Utility Trend</span>
                  <h2 className="text-2xl font-extrabold mt-2 tracking-tight">Water vs Electricity</h2>
                  <p className="text-sm text-on-primary/80 mt-1">Tap a range to filter the chart.</p>
                </div>
                <div className="inline-flex flex-wrap gap-2 rounded-2xl bg-white/10 p-1.5 border border-white/10 backdrop-blur-sm">
                  {UTILITY_RANGE_OPTIONS.map((option) => {
                    const active = utilityRange === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setUtilityRange(option.value)}
                        className={`min-w-[3.5rem] px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${active ? 'bg-white text-primary shadow-lg' : 'text-white/85 hover:text-white hover:bg-white/10'}`}
                        aria-pressed={active}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="h-[240px] min-w-0">
                {filteredUtilityTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredUtilityTrendData}>
                      <defs>
                        <linearGradient id="waterFillDashboard" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#59dad1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#59dad1" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="electricFillDashboard" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFB800" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#FFB800" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.25)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: 'rgba(255,255,255,0.78)' }} />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value) => [`?${Number(value || 0).toLocaleString()}`, 'Amount']}
                        contentStyle={{ borderRadius: '12px', border: 'none', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="water" name="Water Bill" stroke="#59dad1" fill="url(#waterFillDashboard)" strokeWidth={3} />
                      <Area type="monotone" dataKey="electricity" name="Electricity Bill" stroke="#FFB800" fill="url(#electricFillDashboard)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full grid place-items-center rounded-2xl bg-white/10 text-sm text-on-primary/80">
                    Add water and electricity expenses to see monthly variation.
                  </div>
                )}
              </div>
            </div>
          </section>

          {inviteCode ? (
            <section className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10 shadow-[0_18px_40px_-20px_rgba(26,28,29,0.18)]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Invite Code</p>
                  <h3 className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight text-on-surface">Share with a roommate</h3>
                </div>
                <button
                  type="button"
                  onClick={() => refreshInviteMutation.mutate()}
                  className="px-4 py-2 rounded-xl bg-primary-fixed text-primary font-bold text-sm"
                >
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_0.8fr] gap-4 items-center">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-surface-container p-4 border border-outline-variant/10">
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant">Code</p>
                    <h4 className="text-[clamp(1.55rem,4vw,1.95rem)] sm:text-[clamp(1.8rem,5vw,3rem)] font-black tracking-[0.14em] text-primary break-words mt-2">
                      {inviteCode}
                    </h4>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteCode)
                        toast.success('Invite code copied')
                      }}
                      className="px-4 py-3 rounded-xl signature-gradient text-on-primary font-bold"
                    >
                      Copy Code
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="px-4 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold border border-outline-variant/15"
                    >
                      Open Settings
                    </button>
                  </div>
                </div>

                {inviteQrSrc ? (
                  <div className="flex justify-center sm:justify-end">
                    <div className="bg-white p-3 rounded-2xl border border-outline-variant/10 shadow-sm">
                      <img src={inviteQrSrc} alt="Invite QR code" className="w-44 h-44 sm:w-40 sm:h-40" />
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tasks</p>
                <h3 className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight text-on-surface">Pending chores</h3>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {tasksData?.tasks?.length || 0} total
              </span>
            </div>

            <div className="space-y-3">
              {(tasksData?.tasks || []).length === 0 ? (
                <div className="rounded-2xl bg-surface-container p-6 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 block">task_alt</span>
                  No open tasks right now.
                </div>
              ) : (
                tasksData.tasks
                  .filter(task => task.status !== 'completed')
                  .slice(0, 4)
                  .map((task) => {
                    const isPending = !task.status || task.status === 'todo' || task.status === 'pending'
                    return (
                      <div key={task._id} className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container border border-outline-variant/10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isPending ? 'radio_button_unchecked' : 'check_circle'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-on-surface truncate">{task.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                            {task.description || 'Household task to keep things moving.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => completeTaskMutation.mutate(task)}
                          disabled={completeTaskMutation.isPending}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-outline-variant/15 text-primary disabled:opacity-60"
                        >
                          Done
                        </button>
                      </div>
                    )
                  })
              )}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Monthly Rent</p>
                <h3 className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight text-on-surface">{formatCurrency(rentStatus?.myRent?.amountDue || 0, preferredCurrency)}</h3>
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
                const houseMember = findMemberById(members, member.userId)
                const memberAvatar = getMemberAvatar(houseMember)
                return (
                  <div
                    key={member.userId}
                    className={`p-3 rounded-xl border ${paid ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-outline-variant/10 flex-shrink-0">
                        {memberAvatar ? (
                          <img src={memberAvatar} alt={`${member.name} avatar`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-xs font-bold text-on-surface-variant">
                            {(member.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{member.name}</p>
                        <p className={`text-[11px] font-semibold ${paid ? 'text-emerald-700' : 'text-red-700'}`}>
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
          </section>

          <section className="bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-8 text-on-primary flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-on-primary-container/80 text-xs font-bold uppercase tracking-widest">Financial Status</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
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
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">Roommates</h3>
              <button onClick={() => navigate('/balances')} className="text-primary text-sm font-bold">View Ledger</button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
              {members.map(member => {
                const memberBal = balanceData?.balances?.find(b => b.userId === member._id)
                const amt = memberBal?.net ?? 0
                const memberName = getMemberName(member)
                const memberAvatar = getMemberAvatar(member)
                return (
                  <div key={member._id} className="flex-shrink-0 w-36 bg-surface-container-low p-4 rounded-3xl flex flex-col items-center gap-2 border border-outline-variant/10 shadow-[0_8px_24px_-16px_rgba(26,28,29,0.22)]">
                    <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-primary-fixed border-2 ${amt > 0 ? 'border-secondary' : amt < -0.5 ? 'border-error' : 'border-transparent'}`}>
                      {memberAvatar ? (
                        <img src={memberAvatar} alt={`${memberName} avatar`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-black text-primary">
                          {memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      )}
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

          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">Recent Expenses</h3>
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
        </main>

        <BottomNav />
      </div>
    </>
  )
}


