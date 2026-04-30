import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { balanceService, expenseService, houseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopAppShell from '../components/desktop/DesktopAppShell'
import { formatCurrency } from '../utils/currency'

export default function Balances() {
  const { house, members } = useHouse()
  const { user }    = useAuth()
  const qc          = useQueryClient()
  const [settling, setSettling]     = useState(null)
  const preferredCurrency = user?.currency || 'LKR'
  const isAdmin = house?.members?.find(m => String(m.userId) === String(user?._id))?.role === 'admin'

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

  const { data: rentStatus } = useQuery({
    queryKey: ['rent-status'],
    queryFn: () => houseService.getRentStatus().then(r => r.data),
  })

  const settleMutation = useMutation({
    mutationFn: (data) => balanceService.settle(data),
    onSuccess: () => {
      toast.success('Payment settled!')
      qc.invalidateQueries(['balance-raw'])
      setSettling(null)
    },
    onError: () => toast.error('Failed to settle'),
  })

  const payRentMutation = useMutation({
    mutationFn: (month) => houseService.payRent(month),
    onSuccess: () => {
      toast.success('Rent marked as paid')
      qc.invalidateQueries(['rent-status'])
      qc.invalidateQueries(['rent-expenses', currentBillMonth])
    },
    onError: () => toast.error('Failed to mark rent as paid'),
  })

  const myBalance  = rawData?.balances?.find(b => b.userId === user?._id)
  const netAmount  = myBalance?.net ?? 0
  const iOwe       = rawData?.debts?.filter(d => d.from === user?._id) || []
  const owedToMe   = rawData?.debts?.filter(d => d.to === user?._id)   || []
  const totalHouse = rawData?.totalHouseExpenses ?? 0

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

  // Use rentStatus for the correct monthly rent amount (from house settings, divided by members)
  // Fall back to expense-based calculation if rentStatus is not available
  const rentDue = rentStatus?.myRent?.amountDue ?? myRentItems.reduce((sum, item) => sum + item.amount, 0)
  const rentPaid = rentStatus?.myRent?.status === 'paid' ?? (myRentItems.length > 0 && myRentItems.every(item => item.paid))
  const rentStatusLabel = !rentStatus?.myRent ? 'Not Recorded' : (rentPaid ? 'Paid' : 'Pending')

  const getName = (id) => members.find(m => m._id === id)?.name || 'Unknown'
  const getInit = (id) => {
    const n = getName(id)
    return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
  }

  const displayDebts = rawData?.debts || []
  const settlementCounterpartyId = settling ? (String(settling.from) === String(user?._id) ? settling.to : settling.from) : null

  const ledgerContent = (
    <>
      {/* Header */}
      <section className="mb-10">
        <div className="max-w-2xl">
          <p className="text-on-surface-variant max-w-md font-medium">Keep the house harmony high by settling balances.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <section className="md:col-span-12 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Monthly Rent Payment</p>
              <h3 className="text-2xl font-headline font-black mt-1">{formatCurrency(rentDue, preferredCurrency)}</h3>
              <p className="text-sm text-on-surface-variant mt-1">{currentBillMonth} tracked separately from other expenses</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${rentPaid ? 'bg-secondary-container text-on-secondary-container' : myRentItems.length === 0 ? 'bg-surface-container text-on-surface-variant' : 'bg-error-container text-on-error-container'}`}>
                {rentStatusLabel}
              </span>
              {!isAdmin && (
                <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
                  Only admins can mark rent as paid
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => payRentMutation.mutate(currentBillMonth)}
            disabled={payRentMutation.isPending || rentStatus?.myRent?.status === 'paid' || !rentStatus?.earlyPayAllowed || !isAdmin}
            className="mt-6 w-full bg-primary text-on-primary font-bold py-3 px-4 rounded-full hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {rentStatus?.myRent?.status === 'paid'
              ? 'Rent Paid'
              : !isAdmin
              ? 'Admin Only'
              : payRentMutation.isPending
              ? 'Paying...'
              : 'Pay Monthly Rent'}
          </button>
        </section>

        {/* Member Rent Payment Status */}
        {(rentStatus?.memberStatuses || []).length > 0 && (
          <section className="md:col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {rentStatus.memberStatuses.map(member => {
                const paid = member.status === 'paid'
                return (
                  <div
                    key={member.userId}
                    className={`p-4 rounded-2xl border ${paid ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg border-2 grid place-items-center flex-shrink-0 ${paid ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-red-500 bg-white text-red-500'}`}>
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {paid ? 'check' : 'close'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{member.name}</p>
                        <p className={`text-xs font-semibold ${paid ? 'text-emerald-700' : 'text-red-700'}`}>
                          {paid ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section className="md:col-span-12 bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">House Balance</p>
              <h3 className="text-2xl font-headline font-black mt-1">{formatCurrency(totalHouse, preferredCurrency)}</h3>
            </div>
            <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${netAmount >= -0.5 ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
              {netAmount >= -0.5 ? 'Balanced' : 'Owes'}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-2">
            {members.length} members {displayDebts.length} active debts
          </p>
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
                <div className="flex items-center gap-3">
                  <p className="font-black text-secondary text-lg">{formatCurrency(debt.amount, preferredCurrency)}</p>
                  <button
                    onClick={() => setSettling(debt)}
                    className="text-xs font-bold text-secondary bg-secondary-container px-3 py-1.5 rounded-full hover:bg-secondary hover:text-on-secondary transition-colors"
                  >
                    Mark paid
                  </button>
                </div>
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
        <DesktopAppShell title="Financial Ledger"  searchPlaceholder="Search members...">
          {ledgerContent}
        </DesktopAppShell>
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
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
              Confirm <strong>{getName(settlementCounterpartyId)}</strong> for <strong>{formatCurrency(settling.amount, preferredCurrency)}</strong>?
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

