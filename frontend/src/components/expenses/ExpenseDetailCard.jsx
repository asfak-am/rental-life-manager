import { formatCurrency } from '../../utils/currency'

function ParticipantRow({ participant, isMe, currency, member }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-sm font-bold text-primary border-2 border-surface-container-lowest overflow-hidden">
          {member?.avatar ? (
            <img src={member.avatar} alt={`${member?.name || 'Member'} avatar`} className="w-full h-full object-cover" />
          ) : (
            member?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
          )}
        </div>
        <div>
          <p className="font-bold text-on-surface">{member?.name || 'Unknown'}{isMe ? ' (You)' : ''}</p>
          <p className="text-xs font-medium text-outline">
            {participant.settled ? 'Paid their share' : 'Pending payment'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-black tracking-tight ${participant.settled ? 'text-secondary' : 'text-error'}`}>
          {formatCurrency(participant.amountOwed, currency)}
        </p>
        <span className="material-symbols-outlined text-sm" style={{ color: participant.settled ? '#006a65' : '#ba1a1a', fontVariationSettings: "'FILL' 1" }}>
          {participant.settled ? 'check_circle' : 'pending'}
        </span>
      </div>
    </div>
  )
}

export default function ExpenseDetailCard({
  expense,
  payer,
  participants = [],
  memberMap = {},
  preferredCurrency = 'LKR',
  userId,
  auditTrail = [],
  isPaidByMe = false,
  onSettle,
  onDelete,
  onClose,
}) {
  return (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-[0_16px_40px_-24px_rgba(26,28,29,0.22)] overflow-hidden">
      <div className="px-8 pt-6 pb-8 border-b border-outline-variant/10">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="space-y-1 flex-1 min-w-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-bold uppercase tracking-wider">
              {expense.category}
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-surface break-words">{expense.title}</h2>
            <div className="flex items-center gap-3 text-outline mt-2">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span className="text-sm font-medium">
                {expense.billMonth || new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs uppercase tracking-widest text-outline mb-1">Total Amount</p>
            <p className="text-3xl font-black text-on-surface tracking-tighter">{formatCurrency(expense.amount, preferredCurrency)}</p>
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
      </div>

      <div className="px-8 py-8 space-y-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight mb-6">Split Breakdown</h3>
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
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-6">Activity Log</h3>
            <div className="space-y-3">
              {auditTrail.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-on-surface">{entry.action}</p>
                    <p className="text-xs text-outline">
                      {new Date(entry.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {!isPaidByMe && (
            <button
              onClick={onSettle}
              className="flex-1 py-4 signature-gradient text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Settle Up
            </button>
          )}
          {String(expense.paidBy) === String(userId) && (
            <button
              onClick={onDelete}
              className="px-5 py-4 bg-error-container text-on-error-container font-bold rounded-2xl active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-4 bg-surface-container-high text-on-surface font-bold rounded-2xl active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    </div>
  )
}
