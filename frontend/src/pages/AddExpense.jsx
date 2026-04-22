import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { expenseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import TopBar from '../components/TopBar'

const CATEGORIES = ['Food', 'Rent', 'Utilities', 'Transport', 'Entertainment', 'Other']
const CAT_ICONS  = { Food: 'shopping_basket', Rent: 'home', Utilities: 'bolt', Transport: 'directions_car', Entertainment: 'movie', Other: 'category' }

export default function AddExpense() {
  const navigate  = useNavigate()
  const { members } = useHouse()
  const { user }  = useAuth()
  const qc        = useQueryClient()

  const [splitType, setSplitType]   = useState('equal')
  const [category, setCategory]     = useState('Food')
  const [customSplits, setCustom]   = useState({})

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { paidBy: user?._id, date: new Date().toISOString().split('T')[0] },
  })

  const amount = parseFloat(watch('amount') || 0)

  const mutation = useMutation({
    mutationFn: (data) => expenseService.add(data),
    onSuccess: () => {
      toast.success('Expense added!')
      qc.invalidateQueries(['expenses'])
      qc.invalidateQueries(['expense-summary'])
      qc.invalidateQueries(['balance-raw'])
      navigate('/expenses')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add expense'),
  })

  const onSubmit = (data) => {
    const participants = splitType === 'equal'
      ? members.map(m => ({ userId: m._id, amountOwed: +(amount / members.length).toFixed(2) }))
      : members.map(m => ({ userId: m._id, amountOwed: +(customSplits[m._id] || 0) }))

    mutation.mutate({
      title: data.title,
      amount: +data.amount,
      paidBy: data.paidBy,
      splitType,
      category,
      date: data.date,
      participants,
    })
  }

  const equalShare = members.length > 0 ? (amount / members.length).toFixed(2) : '0.00'

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen pb-32">
      <TopBar />

      <main className="max-w-screen-xl mx-auto px-6 pt-8 pb-32">
        {/* Bottom sheet overlay */}
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm pointer-events-auto" onClick={() => navigate(-1)} />

          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-t-[2.5rem] shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Handle */}
            <div className="sticky top-0 bg-surface-container-lowest/80 backdrop-blur-xl px-8 pt-6 pb-4 z-10 flex flex-col items-center">
              <div className="w-12 h-1.5 bg-surface-container-high rounded-full mb-6" />
              <div className="w-full flex justify-between items-center">
                <h2 className="text-2xl font-headline font-extrabold tracking-tight text-on-surface">Add Expense</h2>
                <button
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="px-8 pb-12 pt-4 space-y-8">
              {/* Title + Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">What for?</label>
                  <input
                    type="text"
                    placeholder="e.g. Fiber Internet"
                    className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant font-medium"
                    {...register('title', { required: 'Title is required' })}
                  />
                  {errors.title && <p className="text-error text-xs">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">How much?</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full bg-surface-container-low border-none rounded-2xl pl-9 pr-5 py-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant font-bold text-lg"
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

              {/* Split type */}
              <div className="space-y-4">
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
                    {members.map(m => (
                      <div key={m._id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary">
                            {m.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-semibold text-on-surface">{m.name}</span>
                        </div>
                        <span className="font-bold text-primary">₹{equalShare}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Custom split */}
                {splitType === 'custom' && (
                  <div className="space-y-2">
                    {members.map(m => (
                      <div key={m._id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary">
                            {m.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="font-semibold text-on-surface">{m.name}</span>
                        </div>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={customSplits[m._id] || ''}
                            onChange={e => setCustom(prev => ({ ...prev, [m._id]: e.target.value }))}
                            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl pl-7 pr-3 py-2 text-on-surface font-bold text-sm focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-on-surface-variant px-1">
                      Total assigned: ₹{Object.values(customSplits).reduce((a, b) => a + (+b || 0), 0).toFixed(2)} / ₹{amount.toFixed(2)}
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
                {mutation.isPending ? 'Adding...' : '+ Add Expense'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}