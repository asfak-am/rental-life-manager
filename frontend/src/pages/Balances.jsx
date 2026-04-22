import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { balanceService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function Balances() {
  const { members } = useHouse()
  const { user }    = useAuth()
  const qc          = useQueryClient()
  const [simplified, setSimplified] = useState(false)
  const [settling, setSettling]     = useState(null)

  const { data: rawData } = useQuery({
    queryKey: ['balance-raw'],
    queryFn: () => balanceService.getRaw().then(r => r.data),
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

  const getName = (id) => members.find(m => m._id === id)?.name || 'Unknown'
  const getInit = (id) => {
    const n = getName(id)
    return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
  }

  const displayDebts = simplified
    ? (simData?.transactions || [])
    : (rawData?.debts || [])

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen pb-32">
      <TopBar />

      <main className="max-w-screen-xl mx-auto px-6 pt-8 pb-32">
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
          <div className="md:col-span-8 bg-gradient-to-br from-primary to-primary-container p-8 rounded-3xl text-on-primary shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
            <div className="relative z-10">
              <span className="text-xs font-label font-bold uppercase tracking-[0.2em] opacity-80">Total House Balance</span>
              <h2 className="text-5xl font-headline font-black mt-2 tracking-tighter">₹{totalHouse.toLocaleString()}</h2>
              <div className="mt-4 flex items-center gap-2 text-secondary-fixed">
                <span className="material-symbols-outlined text-sm">group</span>
                <span className="text-sm font-semibold tracking-wide">{members.length} members · {rawData?.debts?.length || 0} active debts</span>
              </div>
            </div>
            <div className="relative z-10 flex gap-4 mt-8">
              <span className={`px-4 py-2 rounded-2xl font-bold text-sm ${netAmount >= 0 ? 'bg-on-primary text-secondary' : 'bg-on-primary text-error'}`}>
                {netAmount >= 0 ? `You're owed ₹${netAmount.toFixed(0)}` : `You owe ₹${Math.abs(netAmount).toFixed(0)}`}
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
                {netAmount >= -0.5 ? 'No overdue payments detected.' : `Settle ₹${Math.abs(netAmount).toFixed(0)} to clear.`}
              </p>
            </div>
            <div className="bg-tertiary-container text-on-tertiary p-6 rounded-3xl flex-1">
              <span className="material-symbols-outlined text-3xl">savings</span>
              <span className="text-xs font-label font-bold uppercase tracking-widest opacity-80 block mt-2">House Savings</span>
              <p className="text-2xl font-headline font-black">₹{simData?.savedAmount?.toLocaleString() || '0'}</p>
            </div>
          </div>

          {/* You Owe */}
          <section className="md:col-span-6 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-headline font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-error">arrow_outward</span>
                You Owe
              </h3>
              <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                ₹{iOwe.reduce((a, d) => a + d.amount, 0).toFixed(0)} Total
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
                    <p className="font-black text-error text-lg">₹{debt.amount.toFixed(0)}</p>
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
                ₹{owedToMe.reduce((a, d) => a + d.amount, 0).toFixed(0)} Total
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
                  <p className="font-black text-secondary text-lg">₹{debt.amount.toFixed(0)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Settle modal */}
      {settling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/30 backdrop-blur-sm px-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Confirm Settlement</h3>
            <p className="text-on-surface-variant mb-6">
              Pay <strong>{getName(settling.to)}</strong> <strong>₹{settling.amount.toFixed(0)}</strong>?
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

      <BottomNav />
    </div>
  )
}