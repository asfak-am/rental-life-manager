import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { expenseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/navigation/BottomNav'
import TopBar from '../components/navigation/TopBar'
import DesktopAppShell from '../layouts/desktop/DesktopAppShell'
import { formatCurrency } from '../utils/currency'

const CATEGORIES = ['Food', 'Water Bill', 'Electricity Bill', 'Transport', 'Entertainment', 'Other']
const CAT_ICONS  = {
  Food: 'shopping_basket',
  'Water Bill': 'water_drop',
  'Electricity Bill': 'electric_bolt',
  Transport: 'directions_car',
  Entertainment: 'movie',
  Other: 'category',
}
const BILL_MONTH_CATEGORIES = new Set(['Water Bill', 'Electricity Bill'])

const getCurrentBillMonth = () => {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

export default function AddExpense() {
  const navigate  = useNavigate()
  const { id } = useParams()
  const { house, members } = useHouse()
  const { user }  = useAuth()
  const qc        = useQueryClient()
  const isEditMode = Boolean(id)
  const houseKey = house?._id || 'none'

  const [splitType, setSplitType]   = useState('equal')
  const [category, setCategory]     = useState('Food')
  const [customSplits, setCustom]   = useState({})
  const [participantScope, setParticipantScope] = useState('all')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false))
  const preferredCurrency = user?.currency || 'LKR'
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(isEditMode ? `/expenses/${id}` : '/expenses')
  }

  const { data: expenseData, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expenseService.getById(id).then(r => r.data),
    enabled: isEditMode,
  })

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      paidBy: user?._id,
      date: new Date().toISOString().split('T')[0],
      billMonth: getCurrentBillMonth(),
    },
  })

  const amount = parseFloat(watch('amount') || 0)
  const showBillMonth = BILL_MONTH_CATEGORIES.has(category)
  const showTitleField = category === 'Other'

  useEffect(() => {
    if (!isEditMode || !expenseData?.expense) return

    const exp = expenseData.expense
    const participantIds = (exp.participants || []).map(participant => String(participant.userId))
    const nextCustomSplits = Object.fromEntries((exp.participants || []).map(participant => [String(participant.userId), participant.amountOwed]))

    setCategory(exp.category || 'Food')
    setSplitType(exp.splitType || 'equal')
    setParticipantScope(participantIds.length === members.length ? 'all' : 'selected')
    setSelectedMembers(participantIds)
    setCustom(exp.splitType === 'custom' ? nextCustomSplits : {})

    reset({
      paidBy: exp.paidBy,
      date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      billMonth: exp.billMonth || getCurrentBillMonth(),
      title: exp.category === 'Other' ? exp.title : '',
      amount: exp.amount,
    })
  }, [expenseData, isEditMode, members.length, reset])

  const mutation = useMutation({
    mutationFn: (data) => (isEditMode ? expenseService.update(id, data) : expenseService.add(data)),
    onSuccess: (res) => {
      const savedExpense = res?.data?.expense
      toast.success(isEditMode ? 'Expense updated!' : 'Expense added!')
      qc.invalidateQueries({ queryKey: ['expenses', houseKey] })
      qc.invalidateQueries({ queryKey: ['expense-summary', houseKey] })
      qc.invalidateQueries({ queryKey: ['balance-raw', houseKey] })
      qc.invalidateQueries({ queryKey: ['dashboard-utility-trend', houseKey] })
      qc.invalidateQueries({ queryKey: ['expenses-recent', houseKey] })
      qc.invalidateQueries({ queryKey: ['rent-status', houseKey] })
      qc.invalidateQueries({ queryKey: ['rent-statuses', houseKey] })

      if (!isEditMode && savedExpense) {
        qc.setQueryData(['expenses-recent', houseKey], (previous) => {
          if (!previous) return previous
          if (Array.isArray(previous)) return [savedExpense, ...previous].slice(0, 5)
          if (Array.isArray(previous.expenses)) {
            return {
              ...previous,
              expenses: [savedExpense, ...previous.expenses].slice(0, 5),
            }
          }
          return previous
        })
      }

      qc.invalidateQueries({ queryKey: ['expense', id] })
      navigate(isEditMode ? `/expenses/${id}` : '/expenses')
    },
    onError: (err) => toast.error(err.response?.data?.message || (isEditMode ? 'Failed to update expense' : 'Failed to add expense')),
  })

  const onSubmit = (data) => {
    const normalizedTitle = showTitleField ? data.title?.trim() : category
    if (showTitleField && !normalizedTitle) {
      toast.error('What for? is required for Other category')
      return
    }

    const selectedIds = participantScope === 'all'
      ? members.map(member => member._id)
      : selectedMembers

    if (selectedIds.length === 0) {
      toast.error('Select at least one participant')
      return
    }

    const participants = splitType === 'equal'
      ? selectedIds.map(userId => ({ userId }))
      : (() => {
          const invalidMember = selectedIds.find(userId => {
            const rawAmount = customSplits[userId]
            if (rawAmount === '' || rawAmount === null || rawAmount === undefined) return false
            const parsedAmount = Number(rawAmount)
            return !Number.isFinite(parsedAmount) || parsedAmount < 0
          })

          if (invalidMember) {
            toast.error('Custom split amounts must be valid non-negative numbers')
            return null
          }

          return selectedIds.map(userId => ({
            userId,
            amountOwed: Number(customSplits[userId] || 0),
          }))
        })()

    if (!participants) return

    mutation.mutate({
      title: normalizedTitle,
      amount: +data.amount,
      paidBy: data.paidBy,
      splitType,
      category,
      date: data.date,
      billMonth: showBillMonth ? data.billMonth : undefined,
      participants,
    })
  }

  const equalShare = members.length > 0 ? amount / members.length : 0
  const selectedCount = participantScope === 'all' ? members.length : selectedMembers.length
  const equalSelectedShare = selectedCount > 0 ? amount / selectedCount : 0

  if (isEditMode && isLoadingExpense) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev => (
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    ))
  }

  const renderForm = (isDesktop = false) => (
    <form onSubmit={handleSubmit(onSubmit)} className={isDesktop ? 'space-y-8' : 'px-8 pb-12 pt-4 space-y-8'}>
      {/* Title + Amount */}
      <div className={`grid grid-cols-1 ${showTitleField ? 'md:grid-cols-2' : ''} gap-6`}>
        {showTitleField && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">What for?</label>
            <input
              type="text"
              placeholder="e.g. Fiber Internet"
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant font-medium"
              {...register('title')}
            />
            {errors.title && <p className="text-error text-xs">{errors.title.message}</p>}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">How much?</label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">{preferredCurrency}</span>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-surface-container-low border-none rounded-2xl pl-16 pr-5 py-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant font-bold text-lg"
              {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be > 0' } })}
            />
          </div>
          {errors.amount && <p className="text-error text-xs">{errors.amount.message}</p>}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                category === cat
                  ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-base">{CAT_ICONS[cat]}</span>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Date + Paid by */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date</label>
          <input
            type="date"
            className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            {...register('date', { required: true })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Paid by</label>
          <select
            className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium appearance-none"
            {...register('paidBy', { required: true })}
          >
            {members.map(m => (
              <option key={m._id} value={m._id}>{m.name}{m._id === user?._id ? ' (You)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {showBillMonth && (
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Billing Month</label>
          <input
            type="month"
            className="w-full md:w-64 bg-surface-container-low border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            {...register('billMonth', { required: 'Billing month is required' })}
          />
          {errors.billMonth && <p className="text-error text-xs">{errors.billMonth.message}</p>}
        </div>
      )}

      {/* Split type */}
      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Participants</label>
        <div className="flex gap-2 p-1.5 bg-surface-container-low rounded-2xl w-fit">
          {[
            { key: 'all', label: 'All Members' },
            { key: 'selected', label: 'Selected Members' },
          ].map(option => (
            <button
              key={option.key}
              type="button"
              onClick={() => setParticipantScope(option.key)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                participantScope === option.key
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {participantScope === 'selected' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {members.map(member => {
              const active = selectedMembers.includes(member._id)
              return (
                <button
                  key={member._id}
                  type="button"
                  onClick={() => toggleMemberSelection(member._id)}
                  className={`p-3 rounded-xl text-left border transition-all ${active ? 'border-primary bg-primary/10 text-on-surface' : 'border-outline-variant/20 bg-surface-container-low text-on-surface-variant'}`}
                >
                  <span className="font-semibold">{member.name}</span>
                </button>
              )
            })}
          </div>
        )}

        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Split Type</label>
        <div className="flex gap-2 p-1.5 bg-surface-container-low rounded-2xl w-fit">
          {['equal', 'custom'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setSplitType(t)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm capitalize transition-all ${
                splitType === t
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Equal split preview */}
        {splitType === 'equal' && amount > 0 && (
          <div className="space-y-2">
            {(participantScope === 'all' ? members : members.filter(member => selectedMembers.includes(member._id))).map(m => (
              <div key={m._id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary">
                    {m.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="font-semibold text-on-surface">{m.name}</span>
                </div>
                <span className="font-bold text-primary">{formatCurrency(equalSelectedShare, preferredCurrency)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Custom split */}
        {splitType === 'custom' && (
          <div className="space-y-2">
            {(participantScope === 'all' ? members : members.filter(member => selectedMembers.includes(member._id))).map(m => (
              <div key={m._id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary">
                    {m.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="font-semibold text-on-surface">{m.name}</span>
                </div>
                <div className="relative w-36">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xs font-semibold">{preferredCurrency}</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={customSplits[m._id] || ''}
                    onChange={e => setCustom(prev => ({ ...prev, [m._id]: e.target.value }))}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl pl-12 pr-3 py-2 text-on-surface font-bold text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-on-surface-variant px-1">
              Total assigned: {formatCurrency((participantScope === 'all' ? members : members.filter(member => selectedMembers.includes(member._id))).reduce((sum, member) => sum + (+customSplits[member._id] || 0), 0), preferredCurrency)} / {formatCurrency(amount, preferredCurrency)}
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-5 signature-gradient text-on-primary font-headline font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {mutation.isPending ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Expense' : '+ Add Expense')}
      </button>
    </form>
  )

  return (
    <>
      {isDesktop ? (
        <DesktopAppShell
          title={isEditMode ? 'Edit Expense' : 'Add Expense'}
          subtitle="Track shared costs with clear split and billing month details"
          searchPlaceholder="Search expenses..."
          rightActions={(
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white px-4 py-2.5 text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back
            </button>
          )}
        >
          <section className="max-w-4xl bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/15">
            {renderForm(true)}
          </section>
        </DesktopAppShell>
      ) : (
      <div className="bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />

        <main className="max-w-screen-xl mx-auto px-6 pt-8 pb-32">
          {/* Bottom sheet overlay */}
          <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm pointer-events-auto" onClick={() => navigate(-1)} />

            <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-t-[2.5rem] shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto no-scrollbar">
              {/* Handle */}
              <div className="sticky top-0 bg-surface-container-lowest/80 backdrop-blur-xl px-8 pt-6 pb-4 z-10 flex flex-col items-center">
                <div className="w-12 h-1.5 bg-surface-container-high rounded-full mb-6" />
                <div className="w-full flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-primary transition"
                    aria-label="Go back"
                    title="Back"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <h2 className="flex-1 text-center text-2xl font-headline font-extrabold tracking-tight text-on-surface">{isEditMode ? 'Edit Expense' : 'Add Expense'}</h2>
                  <button
                    type="button"
                    onClick={() => navigate('/expenses')}
                    className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant"
                    aria-label="Close add expense"
                    title="Close"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              {renderForm(false)}
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
      )}
    </>
  )
}

