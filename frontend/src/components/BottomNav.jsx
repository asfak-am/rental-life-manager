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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/15">
      <div className="max-w-screen-xl mx-auto flex justify-around items-center py-2 px-2">
        {tabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-2xl"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}