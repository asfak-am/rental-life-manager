import { formatCurrency } from '../utils/currency'

function getMemberName(member) {
  return member?.displayName?.trim() || member?.name?.trim() || 'Unknown'
}

function getMemberAvatar(member) {
  return member?.avatar || member?.profileImage || member?.image || ''
}

export default function DashboardRoommatesSection({
  members = [],
  balances = [],
  currency = 'LKR',
  onViewLedger,
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">Roommates</h3>
        <button onClick={onViewLedger} className="text-primary text-sm font-bold">
          View Ledger
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
        {members.map(member => {
          const memberBal = balances?.find(b => b.userId === member._id)
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
                    {memberName
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold">{memberName.split(' ')[0]}</span>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${amt > 0.5 ? 'text-secondary' : amt < -0.5 ? 'text-error' : 'text-on-surface-variant'}`}>
                {amt > 0.5 ? `Owes ${formatCurrency(amt, currency)}` : amt < -0.5 ? `Gets ${formatCurrency(Math.abs(amt), currency)}` : 'Settled'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
