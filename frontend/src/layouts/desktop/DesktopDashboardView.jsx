import DesktopAppShell from './DesktopAppShell'
import InviteCodeCard from '../../components/common/InviteCodeCard'
import RentStatusCard from '../../components/common/RentStatusCard'
import RentPaymentsTable from '../../components/common/RentPaymentsTable'
import UtilityChart from '../../components/common/UtilityChart'
import DashboardTasksSection from '../../components/dashboard/DashboardTasksSection'
import DashboardExpensesSection from '../../components/dashboard/DashboardExpensesSection'
import { formatCurrency } from '../../utils/currency'

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
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
  rentReminderWindowDays = 5,
  onUtilityRangeChange,
  onMarkTaskComplete,
  isMarkingTaskComplete = false,
  onViewLedger,
  onTransferFunds,
  onViewExpenses,
  onOpenInvite,
  onCopyInvite,
  rentStatus,
  houseKey,
  onPayRent,
  payingRent,
  rentStatuses = [],
  onPayMemberRent,
  payingMemberRent = false,
  markingMemberKey = '',
  isAdmin = false,
  onExpenseClick,
}) {
  const displayName = user?.displayName || user?.name || 'Manager'
  const shortName = displayName.split(' ')[0]

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
      title={`${getTimeGreeting()}, ${shortName}`}
      // subtitle={houseName ? `${houseName} dashboard` : 'House dashboard overview'}
      searchPlaceholder="Search property or resident..."
    >
      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-8 bg-white rounded-3xl p-6 border border-slate-200 flex flex-col">
          <UtilityChart
            data={utilityTrendData}
            range={utilityRange}
            onRangeChange={onUtilityRangeChange}
            currency={currency}
            subtitle="Water vs electricity over the selected period."
            labelClassName="text-slate-400"
            subtitleClassName="text-slate-500"
            rangeWrapClassName="bg-surface-container p-1.5 border-slate-200"
            activeRangeButtonClassName="signature-gradient text-white shadow-lg shadow-primary/15 min-w-[4.5rem]"
            inactiveRangeButtonClassName="text-slate-500 hover:text-slate-900 hover:bg-white min-w-[4.5rem]"
            chartWrapClassName="h-[280px] flex-1"
            emptyStateClassName="text-slate-500"
            waterColor="rgb(var(--primary-rgb))"
            electricityColor="rgb(139,92,246)"
            electricityFillColor="rgba(139,92,246,0.72)"
            electricityFillOpacityStart={0.3}
            xAxisTickColor="#787586"
          />
        </section>

        <div className="col-span-4 flex flex-col gap-5 h-full">
          {inviteCode && (
            <InviteCodeCard
              code={inviteCode}
              qrSrc={inviteQrSrc}
              onCopy={onCopyInvite}
              onRefresh={onOpenInvite}
              copyLabel="Copy Code"
              refreshLabel="Refresh"
              className="flex-1 flex flex-col"
              qrWrapperClassName="flex-1"
            />
          )}
        </div>

        <DashboardExpensesSection
          expenses={expenses}
          members={members}
          currency={currency}
          onViewAll={onViewExpenses}
          onExpenseClick={onExpenseClick}
          layout="desktop"
          compact
        />

        <DashboardTasksSection
          tasks={tasks}
          onMarkTaskComplete={onMarkTaskComplete}
          isMarkingTaskComplete={isMarkingTaskComplete}
          layout="desktop"
        />

        {/* Rent */}
        <section className="col-span-12">
          <RentPaymentsTable
            houseId={houseKey}
            members={members}
            isAdmin={isAdmin}
            onPayMemberRent={onPayMemberRent}
            markingMemberKey={markingMemberKey}
          />
        </section>
      </div>
    </DesktopAppShell>
  )
}
