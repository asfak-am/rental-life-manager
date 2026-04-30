import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { expenseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import DesktopAppShell from '../components/desktop/DesktopAppShell'
import BottomNav from '../components/BottomNav'
import { formatCurrency } from '../utils/currency'

export default function ExpenseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { members } = useHouse()
  const { user } = useAuth()
  const qc = useQueryClient()
  const preferredCurrency = user?.currency || 'LKR'

  const { data, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expenseService.getById(id).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: () => expenseService.remove(id),
    onSuccess: () => {
      toast.success('Expense deleted')
      qc.invalidateQueries(['expenses'])
      navigate('/expenses')
    },
    onError: () => toast.error('Failed to delete'),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const exp = data?.expense
  if (!exp) return null

  const payer = members.find(m => m._id === exp.paidBy)
  const isPaidByMe = String(exp.paidBy) === String(user?._id)

  const detailBody = (
    <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-[0_16px_40px_-24px_rgba(26,28,29,0.22)] overflow-hidden">
      <div className="px-8 pt-6 pb-8 border-b border-outline-variant/10">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="space-y-1 flex-1 min-w-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-bold uppercase tracking-wider">
              {exp.category}
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-surface break-words">{exp.title}</h2>
            <div className="flex items-center gap-3 text-outline mt-2">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span className="text-sm font-medium">
                {exp.billMonth || new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs uppercase tracking-widest text-outline mb-1">Total Amount</p>
            <p className="text-3xl font-black text-on-surface tracking-tighter">{formatCurrency(exp.amount, preferredCurrency)}</p>
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
            {exp.splitType} split
          </span>
        </div>
      </div>

      <div className="px-8 py-8 space-y-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight mb-6">Split Breakdown</h3>
          <div className="space-y-3">
            {exp.participants?.map(p => {
              const member = members.find(m => m._id === p.userId)
              const isMe = String(p.userId) === String(user?._id)
              return (
                <div key={p.userId} className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
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
                        {p.settled ? 'Paid their share' : 'Pending payment'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tracking-tight ${p.settled ? 'text-secondary' : 'text-error'}`}>
                      {formatCurrency(p.amountOwed, preferredCurrency)}
                    </p>
                    <span className="material-symbols-outlined text-sm" style={{ color: p.settled ? '#006a65' : '#ba1a1a', fontVariationSettings: "'FILL' 1" }}>
                      {p.settled ? 'check_circle' : 'pending'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {data?.auditTrail?.length > 0 && (
          <div>
            <h3 className="text-xl font-bold tracking-tight mb-6">Activity Log</h3>
            <div className="space-y-3">
              {data.auditTrail.map((entry, i) => (
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
              onClick={() => navigate('/balances')}
              className="flex-1 py-4 signature-gradient text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Settle Up
            </button>
          )}
          {exp.paidBy === user?._id && (
            <button
              onClick={() => {
                if (window.confirm('Delete this expense?')) deleteMutation.mutate()
              }}
              className="px-5 py-4 bg-error-container text-on-error-container font-bold rounded-2xl active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
          <button
            onClick={() => navigate('/expenses')}
            className="px-5 py-4 bg-surface-container-high text-on-surface font-bold rounded-2xl active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="hidden lg:block bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <DesktopAppShell title="Expense Details" subtitle="See split status, audit history, and actions for this expense." searchPlaceholder="Search expense details...">
          <div className="max-w-4xl">
            {detailBody}
          </div>
        </DesktopAppShell>
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        {/* Dimmed background */}
        <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-surface-container-lowest w-full max-w-3xl rounded-t-[2.5rem] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-y-auto relative">
          {/* Drag handle */}
          <div className="flex justify-center pt-4 pb-2 sticky top-0 bg-surface-container-lowest/80 backdrop-blur-md z-10">
            <div className="w-12 h-1.5 bg-surface-container-highest rounded-full" />
          </div>

            {detailBody}
          </div>
        </div>
      <BottomNav />
      </div>
    </>
  )
}

