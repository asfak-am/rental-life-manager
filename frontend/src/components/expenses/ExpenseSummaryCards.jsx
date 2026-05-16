import { formatCurrency } from '../../utils/currency'

export default function ExpenseSummaryCards({ totalExpenses = 0, myShare = 0, currency = 'LKR' }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
      <div className="sm:col-span-2 bg-primary text-on-primary p-6 rounded-3xl relative overflow-hidden min-w-0">
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Outflow</p>
          <h2 className="text-[clamp(1.8rem,7vw,2.6rem)] font-black font-headline mb-4 leading-tight break-words">
            {formatCurrency(totalExpenses, currency)}
          </h2>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      </div>
      <div className="bg-surface-container-low p-6 rounded-3xl min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">My Share</p>
        <h2 className="text-[clamp(1.25rem,5vw,1.9rem)] font-bold font-headline text-on-surface leading-tight break-words">
          {formatCurrency(myShare, currency)}
        </h2>
      </div>
    </div>
  )
}
