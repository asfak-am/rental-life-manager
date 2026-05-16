import { formatCurrency } from '../../utils/currency'

function findMemberById(members = [], userId) {
  const key = String(userId || '')
  return members.find(member => String(member?._id || member?.id || '') === key)
}

function getMemberAvatar(member) {
  return member?.avatar || member?.profileImage || member?.image || ''
}

export default function RentStatusCard({ status = {}, members = [], isAdmin = false, onPayMemberRent, payingMemberRent = false, className = '' }) {
  const month = status.month
  const unpaidCount = status.unpaidCount || 0
  const memberStatuses = status.memberStatuses || []

  return (
    <div className={(`bg-white rounded-[30px] p-6 border border-slate-200 ${className}`).trim()}>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Monthly Rent</p>
          <h3 className="text-2xl font-black mt-1">{month}</h3>
          <p className="text-sm text-slate-500 mt-1">{unpaidCount} unpaid of {status.memberCount} members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {memberStatuses.map(member => {
          const paid = member.status === 'paid'
          const houseMember = findMemberById(members, member.userId)
          const memberAvatar = getMemberAvatar(houseMember)
          return (
            <div
              key={member.userId}
              className={`p-4 rounded-2xl border bg-transparent ${paid ? 'border-emerald-500/50' : 'border-red-500/50'}`}
            >
              <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap sm:items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                  {memberAvatar ? (
                    <img src={memberAvatar} alt={`${member.name} avatar`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs font-bold text-slate-600">
                      {(member.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-bold text-sm sm:truncate">{member.name}</p>
                  <p className={`text-xs font-semibold inline-block mr-2 ${paid ? 'text-emerald-500' : 'text-red-500'}`}>
                    {paid ? 'Paid' : 'Pending'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 ml-0 sm:ml-auto flex-shrink-0">
                  <div className={`w-7 h-7 rounded-md border-2 grid place-items-center flex-shrink-0 ${paid ? 'border-emerald-500 text-emerald-500 bg-transparent' : 'border-red-500 text-red-500 bg-transparent'}`}>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {paid ? 'check' : 'close'}
                    </span>
                  </div>

                  {isAdmin && !paid && (
                    <button
                      type="button"
                      onClick={() => onPayMemberRent?.({ userId: member.userId, month })}
                      disabled={payingMemberRent}
                      className="w-full sm:w-auto px-2 py-1 text-[10px] font-bold bg-primary text-on-primary rounded-md disabled:opacity-60"
                    >
                      {payingMemberRent ? 'Marking...' : 'Mark'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
