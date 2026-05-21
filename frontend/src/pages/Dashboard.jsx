import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { expenseService, balanceService, houseService, taskService } from '../services'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'
import TopBar from '../components/navigation/TopBar'
import BottomNav from '../components/navigation/BottomNav'
import DesktopAppShell from '../layouts/desktop/DesktopAppShell'
import DesktopDashboardView from '../layouts/desktop/DesktopDashboardView'
import ThemeCustomizer from '../components/common/ThemeCustomizer'
import InviteCodeCard from '../components/common/InviteCodeCard'
import RentStatusCard from '../components/common/RentStatusCard'
import UtilityChart from '../components/common/UtilityChart'
import DashboardTasksSection from '../components/dashboard/DashboardTasksSection'
import DashboardExpensesSection from '../components/dashboard/DashboardExpensesSection'
import NoHouseState from '../components/common/NoHouseState'
import { formatCurrency } from '../utils/currency'
import { buildInviteLink, buildInviteQrSrc } from '../utils/inviteLink'

const UTILITY_RANGE_OPTIONS = [
  { value: '3M', label: '3M', months: 3 },
  { value: '6M', label: '6M', months: 6 },
  { value: '12M', label: '12M', months: 12 },
  { value: 'ALL', label: 'All', months: null },
]

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

const CIRCUMFERENCE = 2 * Math.PI * 88

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
    <NoHouseState
      desktopPageTitle="Dashboard"
      desktopSubtitle="You are not connected to a home yet"
    />
  )

  const houseErrorView = (
    <NoHouseState
      title="Couldn’t load your house"
      description="The app could not fetch your current house data. This is usually temporary, so try again before starting a new house."
      desktopPageTitle="Dashboard"
      desktopSubtitle="Couldn’t load your house"
      primaryActionLabel="Try Again"
      secondaryActionLabel="Open Settings"
      onPrimaryAction={() => refreshHouse().catch(() => {})}
      onSecondaryAction={() => navigate('/settings')}
    />
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

  const { data: utilityTrendResponse } = useQuery({
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

  const { data: rentHistory } = useQuery({
    queryKey: ['rent-history'],
    queryFn: () => houseService.getRentHistory().then(r => r.data),
    enabled: !!user,
    placeholderData: () => qc.getQueryData(['rent-history']),
  })

  const currentBillMonth = (() => {
    const now = new Date()
    const month = `${now.getMonth() + 1}`.padStart(2, '0')
    return `${now.getFullYear()}-${month}`
  })()

  const { data: rentStatus } = useQuery({
    queryKey: ['rent-status', currentBillMonth],
    queryFn: () => houseService.getRentStatus(currentBillMonth).then(r => r.data),
    enabled: !!user,
    placeholderData: () => qc.getQueryData(['rent-status', currentBillMonth]),
  })

  const rentMonths = (() => {
    const months = new Set([currentBillMonth, ...(rentHistory?.history || []).map(h => h.month)])
    return Array.from(months).sort((a, b) => b.localeCompare(a)).slice(0, 6)
  })()

  const { data: rentStatuses } = useQuery({
    queryKey: ['rent-statuses', rentMonths.join(',')],
    queryFn: () => houseService.getRentStatuses(rentMonths.length ? rentMonths : [currentBillMonth]).then(r => r.data?.statuses || []),
    enabled: Boolean(user),
    staleTime: 30 * 1000,
    placeholderData: () => qc.getQueryData(['rent-statuses', rentMonths.join(',')]),
  })

  const isAdmin = house?.members?.find(m => String(m.userId) === String(user?._id))?.role === 'admin'

  const payRentMutation = useMutation({
    mutationFn: (month) => houseService.payRent(month),
    onSuccess: (res, month) => {
      const m = month || currentBillMonth
      toast.success('Monthly rent paid')
      qc.invalidateQueries(['rent-status', m])
      qc.invalidateQueries(['rent-statuses'])
      qc.invalidateQueries(['balance-raw'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to pay rent'),
  })

  const payMemberRentMutation = useMutation({
    mutationFn: ({ userId, month }) => houseService.payRentForMember(userId, month),
    onMutate: ({ userId, month }) => {
      const targetMonth = month || currentBillMonth
      const uid = String(userId)

      qc.setQueryData(['rent-status', targetMonth], (previous) => {
        if (!previous || !Array.isArray(previous.memberStatuses)) return previous
        const memberStatuses = previous.memberStatuses.map(member => (
          String(member.userId) === uid
            ? { ...member, status: 'paid', paidAt: member.paidAt || new Date().toISOString() }
            : member
        ))
        const paidCount = memberStatuses.filter(member => member.status === 'paid').length
        return {
          ...previous,
          memberStatuses,
          paidCount,
          unpaidCount: Math.max(memberStatuses.length - paidCount, 0),
        }
      })

      qc.setQueriesData({ queryKey: ['rent-statuses'] }, (previous) => {
        if (!Array.isArray(previous)) return previous
        return previous.map(status => {
          if (String(status?.month) !== String(targetMonth) || !Array.isArray(status.memberStatuses)) return status
          const memberStatuses = status.memberStatuses.map(member => (
            String(member.userId) === uid
              ? { ...member, status: 'paid', paidAt: member.paidAt || new Date().toISOString() }
              : member
          ))
          const paidCount = memberStatuses.filter(member => member.status === 'paid').length
          return {
            ...status,
            memberStatuses,
            paidCount,
            unpaidCount: Math.max(memberStatuses.length - paidCount, 0),
          }
        })
      })
    },
    onSuccess: (res, vars) => {
      const month = vars?.month || currentBillMonth
      const payload = res?.data || res
      if (payload?.rentStatus) {
        qc.setQueryData(['rent-status', month], payload.rentStatus)
      }
      toast.success('Member rent marked as paid')
      qc.invalidateQueries(['rent-status', month])
      qc.invalidateQueries(['rent-statuses'])
      qc.invalidateQueries(['balance-raw'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to mark member rent as paid'),
  })

  const markingMemberKey = payMemberRentMutation.isPending && payMemberRentMutation.variables
    ? `${String(payMemberRentMutation.variables.userId)}:${String(payMemberRentMutation.variables.month || currentBillMonth)}`
    : ''

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
  const score = harmonyScore(balanceData?.balances, summaryData?.totalExpenses)
  const { label: sLabel, color: sColor } = scoreLabel(score)
  const dashOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
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

  const utilityTrendData = useMemo(() => {
    const trend = utilityTrendResponse?.trend || []

    return trend.map(item => {
      const [year, month] = String(item.month || '').split('-')
      const date = new Date(Number(year), Number(month) - 1, 1)

      return {
        month: Number.isNaN(date.getTime())
          ? item.month
          : date.toLocaleDateString('en-US', { month: 'short' }),
        water: Number(item.water || 0),
        electricity: Number(item.electricity || 0),
      }
    })
  }, [utilityTrendResponse?.trend])

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
          utilityTrendData={utilityTrendData}
          utilityRange={utilityRange}
          onUtilityRangeChange={setUtilityRange}
          onMarkTaskComplete={(task) => completeTaskMutation.mutate(task)}
          isMarkingTaskComplete={completeTaskMutation.isPending}
          onViewLedger={() => navigate('/balances')}
          onViewExpenses={() => navigate('/expenses')}
          onExpenseClick={(id) => navigate(`/expenses/${id}`)}
          onTransferFunds={() => navigate('/expenses/add')}
          onOpenInvite={() => refreshInviteMutation.mutate()}
          onCopyInvite={() => {
            navigator.clipboard.writeText(inviteCode)
            toast.success('Invite code copied')
          }}
          rentStatus={rentStatus}
          onPayRent={(month) => payRentMutation.mutate(month)}
          payingRent={payRentMutation.isPending}
          rentStatuses={rentStatuses || []}
          onPayMemberRent={(data) => payMemberRentMutation.mutate(data)}
          payingMemberRent={payMemberRentMutation.isPending}
          markingMemberKey={markingMemberKey}
          isAdmin={isAdmin}
        />
      </div>

      <div className="lg:hidden relative overflow-hidden app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <div className="pointer-events-none absolute -top-24 left-[-14%] h-64 w-64 rounded-full bg-primary-fixed/20 blur-3xl" />
        <div className="pointer-events-none absolute top-44 right-[-16%] h-72 w-72 rounded-full bg-[#59dad1]/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-16 left-[-12%] h-60 w-60 rounded-full bg-[#f6b15a]/18 blur-3xl" />
        <TopBar />

        <main className="relative z-10 max-w-screen-xl mx-auto px-6 pt-6 space-y-8">
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[2rem] p-8 border border-outline-variant/15 text-on-surface flex flex-col shadow-[0_20px_50px_-24px_rgba(26,28,29,0.22)] overflow-hidden min-w-0">
              <UtilityChart
                data={utilityTrendData}
                range={utilityRange}
                onRangeChange={setUtilityRange}
                currency={preferredCurrency}
                rangeOptions={UTILITY_RANGE_OPTIONS}
                chartWrapClassName="h-[240px] min-w-0"
                subtitle="Water vs electricity over the selected period."
              />
            </div>
          </section>

          {inviteCode ? (
            <InviteCodeCard
              code={inviteCode}
              qrSrc={inviteQrSrc}
              onCopy={() => {
                navigator.clipboard.writeText(inviteCode)
                toast.success('Invite code copied')
              }}
              onRefresh={() => refreshInviteMutation.mutate()}
              refreshing={refreshInviteMutation.isPending}
              className="h-full flex flex-col"
              copyLabel="Copy Code"
              refreshLabel="Refresh"
            />
          ) : null}

          <DashboardTasksSection
            tasks={tasksData?.tasks || []}
            onMarkTaskComplete={(task) => completeTaskMutation.mutate(task)}
            isMarkingTaskComplete={completeTaskMutation.isPending}
            layout="mobile"
          />

          {(rentStatuses || []).filter(s => s.unpaidCount > 0).length > 0 && (
            <section className="space-y-4">
              {(rentStatuses || []).filter(s => s.unpaidCount > 0).map(status => (
                <RentStatusCard
                  key={status.month}
                  status={status}
                  members={members}
                  isAdmin={isAdmin}
                  onPayMemberRent={(data) => payMemberRentMutation.mutate(data)}
                  payingMemberRent={payMemberRentMutation.isPending}
                  markingMemberKey={markingMemberKey}
                />
              ))}
            </section>
          )}

          <DashboardExpensesSection
            expenses={expensesData?.expenses || []}
            members={members}
            currency={preferredCurrency}
            onViewAll={() => navigate('/expenses')}
            onExpenseClick={(id) => navigate(`/expenses/${id}`)}
            layout="mobile"
          />
        </main>

        <BottomNav />
        <ThemeCustomizer />
      </div>
    </>
  )
}


