import { useParams, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { expenseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import DesktopAppShell from '../layouts/desktop/DesktopAppShell'
import BottomNav from '../components/BottomNav'
import { createMemberMap, getMemberById } from '../utils/expenseMembers'
import ExpenseDetailCard from '../components/expenses/ExpenseDetailCard'
import ExpenseErrorState from '../components/expenses/ExpenseErrorState'
import { getErrorMessage } from '../utils/apiError'

export default function ExpenseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { members } = useHouse()
  const { user } = useAuth()
  const qc = useQueryClient()
  const preferredCurrency = user?.currency || 'LKR'
  const memberMap = useMemo(() => createMemberMap(members), [members])

  const { data, isLoading, error } = useQuery({
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
    onError: (mutationError) => toast.error(getErrorMessage(mutationError)),
  })

  if (error) {
    return (
      <ExpenseErrorState
        title="Unable to load expense details"
        message={getErrorMessage(error)}
        onRetry={() => qc.invalidateQueries(['expense', id])}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const exp = data?.expense
  if (!exp) return null

  const payer = getMemberById(memberMap, exp.paidBy)
  const isPaidByMe = String(exp.paidBy) === String(user?._id)

  const detailBody = (
    <ExpenseDetailCard
      expense={exp}
      payer={payer}
      participants={exp.participants || []}
      memberMap={memberMap}
      preferredCurrency={preferredCurrency}
      userId={user?._id}
      auditTrail={data?.auditTrail || []}
      isPaidByMe={isPaidByMe}
      onSettle={() => navigate('/balances')}
      onDelete={() => {
        if (window.confirm('Delete this expense?')) deleteMutation.mutate()
      }}
      onClose={() => navigate('/expenses')}
    />
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

