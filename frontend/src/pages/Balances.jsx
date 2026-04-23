import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { balanceService, expenseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopAppShell from '../components/desktop/DesktopAppShell'
import { formatCurrency } from '../utils/currency'

export default function Balances() {
  const { members } = useHouse()
  const { user }    = useAuth()
  const qc          = useQueryClient()
  const [simplified, setSimplified] = useState(false)
  const [settling, setSettling]     = useState(null)
  const preferredCurrency = user?.currency || 'LKR'

  const { data: rawData } = useQuery({
    queryKey: ['balance-raw'],
    queryFn: () => balanceService.getRaw().then(r => r.data),
  })

  const currentBillMonth = (() => {
    const now = new Date()
    const month = `${now.getMonth() + 1}`.padStart(2, '0')
    return `${now.getFullYear()}-${month}`
  })()

  const { data: rentData } = useQuery({
    queryKey: ['rent-expenses', currentBillMonth],
    queryFn: () => expenseService.getAll({ category: 'Rent' }).then(r => r.data),
  })

  const { data: simData } = useQuery({
    queryKey: ['balance-simplified'],
    queryFn: () => balanceService.getSimplified().then(r => r.data),
  })

  const settleMutation = useMutation({
    mutationFn: (data) => balanceService.settle(data),
    onSuccess: () => {
      toast.success('Payment settled!')
      qc.invalidateQueries(['balance-raw'])
      qc.invalidateQueries(['balance-simplified'])
      setSettling(null)
    },
    onError: () => toast.error('Failed to settle'),
  })

  const myBalance  = rawData?.balances?.find(b => b.userId === user?._id)
  const netAmount  = myBalance?.net ?? 0
  const iOwe       = rawData?.debts?.filter(d => d.from === user?._id) || []
  const owedToMe   = rawData?.debts?.filter(d => d.to === user?._id)   || []
  const totalHouse = rawData?.totalHouseExpenses ?? 0
  const savedTx    = rawData?.debts?.length - (simData?.transactions?.length || 0)

  const currentMonthRent = (rentData?.expenses || []).filter(expense => {
    if (expense.billMonth === currentBillMonth) return true
    const date = new Date(expense.date)
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}` === currentBillMonth
  })

  const myRentItems = currentMonthRent.map(expense => {
    if (String(expense.paidBy) === String(user?._id)) {
      return { amount: Number(expense.amount || 0), paid: true }
    }
    const participant = (expense.participants || []).find(part => String(part.userId) === String(user?._id))
    if (!participant) return null
    return { amount: Number(participant.amountOwed || 0), paid: Boolean(participant.settled) }
  }).filter(Boolean)

  const rentDue = myRentItems.reduce((sum, item) => sum + item.amount, 0)
  const rentPaid = myRentItems.length > 0 && myRentItems.every(item => item.paid)
  const rentStatusLabel = myRentItems.length === 0 ? 'Not Recorded' : (rentPaid ? 'Paid' : 'Pending')

  const getName = (id) => members.find(m => m._id === id)?.name || 'Unknown'
  const getInit = (id) => {
    const n = getName(id)
    return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
  }

  const displayDebts = simplified
    ? (simData?.transactions || [])
    : (rawData?.debts || [])

  const ledgerContent = (
    <>
      {/* Header */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface mb-2">Financial Ledger</h1>
            <p className="text-on-surface-variant max-w-md font-medium">Keep the house harmony high by settling balances.</p>
          </div>

          {/* Simplified toggle */}
          <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-2xl">
            <div className="flex items-center gap-2 px-3">
              <span className="text-xs font-label font-bold uppercase tracking-widest text-on-surface-variant">Simplified Debts</span>
              {savedTx > 0 && (
                <span className="bg-secondary text-on-secondary text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {savedTx} saved
                </span>
              )}
            </div>
            <button
              onClick={() => setSimplified(s => !s)}
              className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${simplified ? 'bg-primary' : 'bg-surface-container-high'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${simplified ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Hero balance card */}
        <div className="md:col-span-8 bg-gradient-to-br from-primary to-primary-container p-8 rounded-3xl text-on-primary shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[280px] min-w-0">
          <div className="relative z-10">
            <span className="text-xs font-label font-bold uppercase tracking-[0.2em] opacity-80">Total House Balance</span>
            <h2 className="mt-2 text-[clamp(2.2rem,10vw,4.4rem)] leading-none font-headline font-black tracking-tighter break-words max-w-full">
              {formatCurrency(totalHouse, preferredCurrency)}
            </h2>
            <div className="mt-4 flex items-center gap-2 text-secondary-fixed">
              <span className="material-symbols-outlined text-sm">group</span>
              <span className="text-sm font-semibold tracking-wide break-words">{members.length} members · {displayDebts.length} active debts</span>
            </div>
          </div>
          <div className="relative z-10 flex gap-4 mt-8">
            <span className={`px-4 py-2 rounded-2xl font-bold text-sm ${netAmount >= 0 ? 'bg-on-primary text-secondary' : 'bg-on-primary text-error'}`}>
              {netAmount >= 0 ? `You're owed ${formatCurrency(netAmount, preferredCurrency)}` : `You owe ${formatCurrency(Math.abs(netAmount), preferredCurrency)}`}
            </span>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-on-primary/10 rounded-full blur-3xl" />
          <div className="absolute right-12 top-12 w-32 h-32 border-[20px] border-on-primary/5 rounded-full" />
        </div>

        {/* Side stats */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-3xl flex-1 flex flex-col justify-center">
            <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest mb-1">Status</span>
            <h3 className={`text-2xl font-headline font-bold ${netAmount >= -0.5 ? 'text-secondary' : 'text-error'}`}>
              {netAmount >= -0.5 ? 'Balanced' : 'Owes'}
            </h3>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              {netAmount >= -0.5 ? 'No overdue payments detected.' : `Settle ${formatCurrency(Math.abs(netAmount), preferredCurrency)} to clear.`}
            </p>
          </div>
          <div className="bg-tertiary-container text-on-tertiary p-6 rounded-3xl flex-1">
            <span className="material-symbols-outlined text-3xl">savings</span>
            <span className="text-xs font-label font-bold uppercase tracking-widest opacity-80 block mt-2">House Savings</span>
            <p className="text-2xl font-headline font-black">{formatCurrency(simData?.savedAmount || 0, preferredCurrency)}</p>
          </div>
        </div>

        {/* Monthly rent status */}
        <section className="md:col-span-12 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Monthly Rent Payment</p>
              <h3 className="text-2xl font-headline font-black mt-1">{formatCurrency(rentDue, preferredCurrency)}</h3>
              <p className="text-sm text-on-surface-variant mt-1">{currentBillMonth} • tracked separately from other expenses</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${rentPaid ? 'bg-secondary-container text-on-secondary-container' : myRentItems.length === 0 ? 'bg-surface-container text-on-surface-variant' : 'bg-error-container text-on-error-container'}`}>
              {rentStatusLabel}
            </span>
          </div>
        </section>

        {/* You Owe */}
        <section className="md:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-headline font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-error">arrow_outward</span>
              You Owe
            </h3>
            <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
              {formatCurrency(iOwe.reduce((a, d) => a + d.amount, 0), preferredCurrency)} Total
            </span>
          </div>
          <div className="space-y-3">
            {iOwe.length === 0 && (
              <div className="bg-surface-container-lowest p-6 rounded-3xl text-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-3xl block mb-2 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                You don't owe anyone!
              </div>
            )}
            {iOwe.map((debt, i) => (
              <div key={i} className="bg-surface-container-lowest p-5 rounded-3xl flex items-center justify-between group hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-sm font-bold text-primary">
                    {getInit(debt.to)}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{getName(debt.to)}</p>
                    <p className="text-xs text-outline font-medium">Pending payment</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-black text-error text-lg">{formatCurrency(debt.amount, preferredCurrency)}</p>
                  <button
                    onClick={() => setSettling(debt)}
                    className="text-xs font-bold text-primary bg-primary-fixed px-3 py-1.5 rounded-full hover:bg-primary-container transition-colors"
                  >
                    Pay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Owed to you */}
        <section className="md:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-headline font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">arrow_downward</span>
              Owed to You
            </h3>
            <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
              {formatCurrency(owedToMe.reduce((a, d) => a + d.amount, 0), preferredCurrency)} Total
            </span>
          </div>
          <div className="space-y-3">
            {owedToMe.length === 0 && (
              <div className="bg-surface-container-lowest p-6 rounded-3xl text-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-3xl block mb-2 text-outline">payments</span>
                No one owes you right now.
              </div>
            )}
            {owedToMe.map((debt, i) => (
              <div key={i} className="bg-surface-container-lowest p-5 rounded-3xl flex items-center justify-between group hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-sm font-bold text-secondary">
                    {getInit(debt.from)}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{getName(debt.from)}</p>
                    <p className="text-xs text-outline font-medium">Owes you</p>
                  </div>
                </div>
                <p className="font-black text-secondary text-lg">{formatCurrency(debt.amount, preferredCurrency)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )

  return (
    <>
      <div className="hidden lg:block">
        <DesktopAppShell title="Financial Ledger" subtitle="Keep your house balances clear and settled" searchPlaceholder="Search members...">
          {ledgerContent}
        </DesktopAppShell>
      </div>

      <div className="lg:hidden bg-surface font-body text-on-surface min-h-screen pb-32">
        <TopBar />
        <main className="max-w-screen-xl mx-auto px-6 pt-8 pb-32">{ledgerContent}</main>
        <BottomNav />
      </div>

      {/* Settle modal */}
      {settling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 backdrop-blur-sm px-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Confirm Settlement</h3>
            <p className="text-on-surface-variant mb-6">
              Pay <strong>{getName(settling.to)}</strong> <strong>{formatCurrency(settling.amount, preferredCurrency)}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => settleMutation.mutate({ from: settling.from, to: settling.to, amount: settling.amount })}
                disabled={settleMutation.isPending}
                className="flex-1 py-3 signature-gradient text-on-primary font-bold rounded-xl"
              >
                {settleMutation.isPending ? 'Settling...' : 'Confirm'}
              </button>
              <button onClick={() => setSettling(null)} className="flex-1 py-3 bg-surface-container font-bold rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}