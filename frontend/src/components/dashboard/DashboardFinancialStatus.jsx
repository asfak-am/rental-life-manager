import { formatCurrency } from '../../utils/currency'

export default function DashboardFinancialStatus({
  netAmount = 0,
  currency = 'LKR',
  onSettleUp,
  onViewExpenses,
}) {
  const isOwed = netAmount > 0

  return (
    <section className="bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-8 text-on-primary flex flex-col justify-between shadow-xl">
      <div>
        <span className="text-on-primary-container/80 text-xs font-bold uppercase tracking-widest">Financial Status</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
          {isOwed
            ? `Owed to you: ${formatCurrency(Math.abs(netAmount), currency)}`
            : netAmount < -0.5
            ? `You owe: ${formatCurrency(Math.abs(netAmount), currency)}`
            : 'All settled up!'}
        </h2>
      </div>
      <div className="mt-8 flex gap-3">
        <button
          onClick={onSettleUp}
          className="flex-1 bg-on-primary text-primary font-bold py-3 px-6 rounded-xl text-sm transition-transform active:scale-95"
        >
          Settle Up
        </button>
        <button
          onClick={onViewExpenses}
          className="w-12 h-12 flex items-center justify-center bg-primary-fixed/20 rounded-xl text-on-primary transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">receipt_long</span>
        </button>
      </div>
    </section>
  )
}
