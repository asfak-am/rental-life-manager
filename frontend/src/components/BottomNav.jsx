import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',          icon: 'dashboard',       label: 'Home'     },
  { to: '/expenses',  icon: 'receipt_long',    label: 'Expenses' },
  { to: '/tasks',     icon: 'task_alt',        label: 'Tasks'    },
  { to: '/analytics', icon: 'bar_chart',       label: 'Analytics'},
  { to: '/ledger',    icon: 'account_balance', label: 'Ledger'   },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed left-1/2 z-50 w-[min(calc(100vw-1rem),30rem)] -translate-x-1/2 rounded-full border bg-[primary] px-2 py-2 shadow-[0_18px_45px_rgba(18,52,140,0.34)] backdrop-blur-2xl ring-1 ring-white/12 md:hidden"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between gap-1">
        {tabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-center transition-all duration-200 ${
                isActive
                  ? 'bg-[rgba(255,255,255,0.2)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(17,53,149,0.28)] ring-1 ring-white/18'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[1.65rem] leading-none transition-transform duration-200 text-primary"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" }}
                >
                  {icon}
                </span>
                <span className="sr-only text-primary">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}