import DesktopAppShell from './DesktopAppShell'
import { formatCurrency } from '../../utils/currency'

function ParticipantRow({ participant, isMe, currency, member }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-colors">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary border-2 border-surface-container-lowest overflow-hidden flex-shrink-0">
          {member?.avatar ? (
            <img src={member.avatar} alt={`${member?.name || 'Member'} avatar`} className="w-full h-full object-cover" />
          ) : (
            member?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-on-surface truncate">
            {member?.name || 'Unknown'}{isMe ? ' (You)' : ''}
          </p>
          <p className="text-xs font-medium text-outline">
            {participant.settled ? 'Paid their share' : 'Pending payment'}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-lg font-black tracking-tight ${participant.settled ? 'text-secondary' : 'text-error'}`}>
          {formatCurrency(participant.amountOwed, currency)}
        </p>
        <span
          className="material-symbols-outlined text-sm"
          style={{ color: participant.settled ? '#006a65' : '#ba1a1a', fontVariationSettings: "'FILL' 1" }}
        >
          {participant.settled ? 'check_circle' : 'pending'}
        </span>
      </div>
    </div>
  )
}

export default function DesktopExpenseDetailsView({
  expense,
  payer,
  participants,
  memberMap,
  preferredCurrency,
  userId,
  auditTrail,
  isPaidByMe,
  canEdit = false,
  onSettle,
  onEdit,
  onDelete,
  onClose,
  settling,
}) {
  const canDelete = String(expense.paidBy) === String(userId)

  const backButton = (
    <button
      type="button"
      onClick={onClose}
      className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-4 py-2.5 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition"
    >
      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
      Back
    </button>
  )

  const summaryActions = (
    <div className="flex flex-wrap gap-3 pt-2">
      {!isPaidByMe && (
        <button
          type="button"
          onClick={onSettle}
          disabled={settling}
          className="flex-1 min-w-[180px] py-4 signature-gradient text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {settling ? 'Settling...' : 'Settle Up'}
        </button>
      )}
      <button
        type="button"
        onClick={canEdit ? onEdit : undefined}
        disabled={!canEdit}
        title={!canEdit ? 'Only the creator can edit this expense' : 'Edit expense'}
        className="px-5 py-4 bg-primary-fixed text-primary font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined">edit</span>
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="px-5 py-4 bg-error-container text-on-error-container font-bold rounded-2xl active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-4 bg-surface-container-high text-on-surface font-bold rounded-2xl active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  )

  return (
    <DesktopAppShell
      title="Expense Details"
      subtitle="See split status, audit history, and actions for this expense."
      searchPlaceholder="Search expense details..."
      rightActions={backButton}
    >
      <div className="max-w-6xl mx-auto w-full px-1 lg:px-0 space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <section className="xl:col-span-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-6 shadow-[0_16px_40px_-32px_rgba(26,28,29,0.12)]">
            {!canEdit && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                Read-only view: only the creator can edit this expense.
              </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="space-y-1 flex-1 min-w-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-bold uppercase tracking-wider">
                  {expense.category}
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight text-on-surface break-words">{expense.title}</h2>
                <div className="flex items-center gap-3 text-outline mt-2">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span className="text-sm font-medium">
                    {expense.billMonth || new Date(expense.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs uppercase tracking-widest text-outline mb-1">Total Amount</p>
                <p className="text-3xl font-black text-on-surface tracking-tighter">
                  {formatCurrency(expense.amount, preferredCurrency)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
                {payer?.avatar ? (
                  <img src={payer.avatar} alt="payer avatar" className="w-full h-full object-cover" />
                ) : (
                  payer?.name?.charAt(0) || '?'
                )}
              </div>
              <div>
                <p className="text-xs text-outline font-medium">Paid by</p>
                <p className="font-bold text-on-surface">{payer?.name || 'Unknown'}</p>
              </div>
              <span className="ml-auto text-xs font-bold uppercase text-secondary bg-secondary-container px-3 py-1 rounded-full">
                {expense.splitType} split
              </span>
            </div>

            {summaryActions}
          </section>

          <section className="xl:col-span-6 space-y-6">
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-6 shadow-[0_16px_40px_-32px_rgba(26,28,29,0.12)]">
              <h3 className="text-xl font-bold tracking-tight mb-5">Split Breakdown</h3>
              <div className="space-y-3">
                {participants.map(participant => {
                  const member = memberMap[String(participant.userId || '')]
                  const isMe = String(participant.userId) === String(userId)

                  return (
                    <ParticipantRow
                      key={participant.userId}
                      participant={participant}
                      isMe={isMe}
                      currency={preferredCurrency}
                      member={member}
                    />
                  )
                })}
              </div>
            </div>

            {auditTrail?.length > 0 && (
              <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-6 shadow-[0_16px_40px_-32px_rgba(26,28,29,0.12)]">
                <h3 className="text-xl font-bold tracking-tight mb-5">Activity Log</h3>
                <div className="space-y-3">
                  {auditTrail.map((entry, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-on-surface">{entry.action}</p>
                        <p className="text-xs text-outline">{new Date(entry.timestamp).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </DesktopAppShell>
  )
}
