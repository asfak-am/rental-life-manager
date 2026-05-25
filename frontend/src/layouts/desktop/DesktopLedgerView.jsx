import DesktopAppShell from './DesktopAppShell'
import ExpenseDateRangeFilters from '../../components/expenses/ExpenseDateRangeFilters'
import { formatCurrency } from '../../utils/currency'
import RentStatusCard from '../../components/common/RentStatusCard'

export default function DesktopLedgerView({
  statuses = [],
  members = [],
  isAdmin = false,
  currency = 'LKR',
  rentFromDate = '',
  rentToDate = '',
  onRentFromDateChange,
  onRentToDateChange,
  rentPage = 1,
  rentPages = 1,
  onRentPageChange,
  iOwe = [],
  owedToMe = [],
  onSettle,
}) {
  const getVisiblePages = (current, total, maxButtons = 3) => {
    const safeTotal = Math.max(1, total || 1)
    const safeCurrent = Math.min(Math.max(1, current || 1), safeTotal)
    const buttonCount = Math.min(maxButtons, safeTotal)
    const start = Math.max(1, Math.min(safeCurrent - Math.floor(buttonCount / 2), safeTotal - buttonCount + 1))
    return Array.from({ length: buttonCount }, (_, index) => start + index)
  }

  return (
    <DesktopAppShell
      title="Ledger"
      subtitle="Debts and settlements"
      searchPlaceholder="Search ledger..."
    >

      <section className="mt-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-lg font-headline font-bold flex items-center gap-2"><span className="material-symbols-outlined text-error">arrow_outward</span> You Owe</h3>
              <span className="text-sm font-label font-bold text-on-surface-variant">{formatCurrency(iOwe.reduce((a, d) => a + d.amount, 0), currency)} Total</span>
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
                    <p className="font-black text-error text-lg">{formatCurrency(debt.amount, currency)}</p>
                    <button type="button" onClick={() => onSettle && onSettle(debt)} className="px-3 py-1 rounded-lg bg-primary text-on-primary font-semibold">Settle</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-lg font-headline font-bold flex items-center gap-2"><span className="material-symbols-outlined text-secondary">arrow_downward</span> Owed to You</h3>
              <span className="text-sm font-label font-bold text-on-surface-variant">{formatCurrency(owedToMe.reduce((a, d) => a + d.amount, 0), currency)} Total</span>
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
                    <p className="font-black text-secondary text-lg">{formatCurrency(debt.amount, currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </DesktopAppShell>
  )
}
