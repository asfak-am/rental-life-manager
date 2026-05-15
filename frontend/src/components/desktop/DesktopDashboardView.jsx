import { useMemo } from 'react'
import DesktopAppShell from './DesktopAppShell'
import InviteCodeCard from '../InviteCodeCard'
import RentStatusCard from '../RentStatusCard'
import UtilityChart from '../UtilityChart'
import DashboardTasksSection from '../DashboardTasksSection'
import DashboardExpensesSection from '../DashboardExpensesSection'
import { formatCurrency } from '../../utils/currency'

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

        {inviteCode && (
          <div className="col-span-4">
            <InviteCodeCard
              code={inviteCode}
              qrSrc={inviteQrSrc}
              onCopy={onCopyInvite}
              onRefresh={onOpenInvite}
              copyLabel="Copy Code"
              refreshLabel="Refresh"
              className="h-full flex flex-col"
              qrWrapperClassName="flex-1"
            />
          </div>
        )}

        <DashboardExpensesSection
          expenses={expenses}
          members={members}
          currency={currency}
          onViewAll={onViewExpenses}
          layout="desktop"
        />

        <DashboardTasksSection
          tasks={tasks}
          onMarkTaskComplete={onMarkTaskComplete}
          isMarkingTaskComplete={isMarkingTaskComplete}
          layout="desktop"
        />

        {/* Rent */}
        {(rentStatuses || []).filter(s => s.unpaidCount > 0).length > 0 && (
          <section className="col-span-12 space-y-4">
            {(rentStatuses || []).filter(s => s.unpaidCount > 0).map(status => (
              <RentStatusCard
                key={status.month}
                status={status}
                members={members}
                isAdmin={isAdmin}
                onPayMemberRent={onPayMemberRent}
                payingMemberRent={payingMemberRent}
              />
            ))}
          </section>
        )}
      </div>
    </DesktopAppShell>
  )
}