import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { balanceService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/navigation/TopBar'
import BottomNav from '../components/navigation/BottomNav'
import DesktopLedgerView from '../layouts/desktop/DesktopLedgerView'
import NoHouseState from '../components/common/NoHouseState'
import ExpenseRentHistorySection from '../components/expenses/ExpenseRentHistorySection'
import ThemeCustomizer from '../components/common/ThemeCustomizer'
import { getErrorMessage } from '../utils/apiError'

export default function Ledger() {
  const queryClient = useQueryClient()
  const { house, members, loading: houseLoading, error: houseError } = useHouse()
  const { user } = useAuth()

  const [rentFromDate, setRentFromDate] = useState('')
  const [rentToDate, setRentToDate] = useState('')
  const [rentPage, setRentPage] = useState(1)
  // placeholders for rent/status UI (ledger shows debts only)
  const statuses = []
  const statusesData = null
  const houseKey = house?._id || 'none'
  // fetch balances (debts) to show who owes whom with reasons (manual fetch to avoid hook ordering issues)
  const [rawData, setRawData] = useState(null)
  const [settlingIds, setSettlingIds] = useState([])
  useEffect(() => {
    let mounted = true
    if (!house) return
    balanceService.getRaw()
      .then(r => { if (mounted) setRawData(r.data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [house])

  const handleSettle = async (debt) => {
    if (!user) return
    const previous = rawData
    const id = `${debt.from}:${debt.to}:${debt.amount}`
    setSettlingIds(s => [...s, id])
    setRawData(prev => {
      if (!prev) return prev
      const debts = prev.debts.filter(d => !(String(d.from) === String(debt.from) && String(d.to) === String(debt.to)))
      return { ...prev, debts }
    })
    try {
      await balanceService.settle({ from: debt.from, to: debt.to, amount: debt.amount })
      toast.success('Settlement recorded')
    } catch (err) {
      setRawData(previous)
      toast.error(getErrorMessage(err) || 'Failed to record settlement')
    } finally {
      setSettlingIds(s => s.filter(x => x !== id))
      queryClient.invalidateQueries(['balance-raw', houseKey])
    }
  }

  const isHouseBootstrapping = !!user && !house && !houseError && houseLoading
  const isNoHouse = !!user && !house && (!houseError || houseError.response?.status === 404)

  if (isHouseBootstrapping) return (
    <div className="min-h-screen grid place-items-center bg-surface app-light-gradient font-body text-on-surface px-6">
      <div className="flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        <span className="font-medium">Loading your home...</span>
      </div>
    </div>
  )

  if (isNoHouse) return (
    <NoHouseState desktopPageTitle="Ledger" desktopSubtitle="You are not connected to a home yet" />
  )

  const displayDebts = rawData?.debts || []
  const iOwe = displayDebts.filter(d => String(d.from) === String(user?._id))
  const owedToMe = displayDebts.filter(d => String(d.to) === String(user?._id))

  return (
    <>
      <div className="hidden lg:block">
        <DesktopLedgerView
          statuses={statuses}
          currency={user?.currency || 'LKR'}
          rentFromDate={rentFromDate}
          rentToDate={rentToDate}
          onRentFromDateChange={setRentFromDate}
          onRentToDateChange={setRentToDate}
          rentPage={statusesData?.page || rentPage}
          rentPages={statusesData?.pages || 1}
          onRentPageChange={setRentPage}
          members={members || []}
          isAdmin={members?.some(m => String(m._id || m.id || m.userId) === String(user?._id) && (m.role === 'admin' || m?.role === 'admin'))}
          iOwe={iOwe}
          owedToMe={owedToMe}
          onSettle={handleSettle}
        />
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />
        <main className="max-w-screen-xl mx-auto px-6 pt-4 pb-32">
          <section className="mb-8">
            <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Ledger</h1>
            <p className="text-on-surface-variant font-medium">House rent payment history and statuses.</p>
          </section>

          <div className="space-y-4">
            {statuses.map(status => (
              <div key={status.month} className="mb-3">
                <RentStatusCard status={status} members={members || []} isAdmin={members?.some(m => String(m._id || m.id || m.userId) === String(user?._id) && (m.role === 'admin' || m?.role === 'admin'))} />
              </div>
            ))}

            {/* Debts: You Owe / Owed To You */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between px-2 mb-4">
                  <h3 className="text-lg font-headline font-bold flex items-center gap-2"><span className="material-symbols-outlined text-error">arrow_outward</span> You Owe</h3>
                  <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">{new Intl.NumberFormat(undefined, { style: 'currency', currency: user?.currency || 'LKR' }).format(iOwe.reduce((a, d) => a + d.amount, 0))} Total</span>
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
                        <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-sm font-bold text-primary">{(members.find(m => String(m._id || m.userId) === String(debt.to))?.name || '').split(' ').map(s => s[0]||'').join('').toUpperCase().slice(0,2)}</div>
                        <div>
                          <p className="font-bold text-on-surface">{members.find(m => String(m._id || m.userId) === String(debt.to))?.name || 'Unknown'}</p>
                          <p className="text-xs text-outline font-medium">Pending payment</p>
                          {debt.reasons && debt.reasons.length > 0 && (
                            <p className="text-xs text-slate-500 mt-1 font-medium truncate">{debt.reasons[0]}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-black text-error text-lg">{new Intl.NumberFormat(undefined, { style: 'currency', currency: user?.currency || 'LKR' }).format(debt.amount)}</p>
                        <button type="button" onClick={() => handleSettle(debt)} className="px-3 py-1 rounded-lg bg-primary text-on-primary font-semibold">Settle</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between px-2 mb-4">
                  <h3 className="text-lg font-headline font-bold flex items-center gap-2"><span className="material-symbols-outlined text-secondary">arrow_downward</span> Owed to You</h3>
                  <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">{new Intl.NumberFormat(undefined, { style: 'currency', currency: user?.currency || 'LKR' }).format(owedToMe.reduce((a, d) => a + d.amount, 0))} Total</span>
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
                        <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-sm font-bold text-secondary">{(members.find(m => String(m._id || m.userId) === String(debt.from))?.name || '').split(' ').map(s => s[0]||'').join('').toUpperCase().slice(0,2)}</div>
                        <div>
                          <p className="font-bold text-on-surface">{members.find(m => String(m._id || m.userId) === String(debt.from))?.name || 'Unknown'}</p>
                          <p className="text-xs text-outline font-medium">Owes you</p>
                          {debt.reasons && debt.reasons.length > 0 && (
                            <p className="text-xs text-slate-500 mt-1 font-medium truncate">{debt.reasons[0]}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-black text-secondary text-lg">{new Intl.NumberFormat(undefined, { style: 'currency', currency: user?.currency || 'LKR' }).format(debt.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        <BottomNav />
        <ThemeCustomizer />
      </div>
    </>
  )
}
