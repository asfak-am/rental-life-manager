import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/expenses', label: 'Expenses', icon: 'receipt_long' },
  { to: '/tasks', label: 'Tasks', icon: 'task_alt' },
  { to: '/analytics', label: 'Analytics', icon: 'insights' },
  { to: '/ledger', label: 'Ledger', icon: 'account_balance' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export default function DesktopAppShell({
  title,
  subtitle,
  searchPlaceholder = 'Search...',
  children,
  rightActions,
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.displayName || user?.name || 'Profile'
  const avatarUrl = user?.avatar || ''
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="h-screen bg-[#f2f4f8] text-slate-900 flex overflow-hidden">
      <aside className="w-[220px] h-screen sticky top-0 bg-[#f7f8fb] border-r border-slate-200 px-5 py-6 flex flex-col overflow-y-auto">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[#6a5df6] leading-none">Rental Life</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 mt-1">Elevated Living</p>
        </div>

        <nav className="mt-10 space-y-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#ecebff] text-[#5e51f2]'
                    : 'text-slate-500 hover:bg-white hover:text-slate-800'
                }`
              }
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="w-full rounded-xl py-3 font-semibold bg-slate-900 text-white shadow-lg shadow-slate-300/50 hover:bg-slate-800 transition"
          >
            Logout
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mt-5 w-full flex items-center gap-3 rounded-xl bg-white p-3 border border-slate-200 text-left hover:bg-slate-50 transition"
          >
            <div className="w-9 h-9 rounded-full bg-[#5e51f2] text-white font-bold flex items-center justify-center text-xs overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                initials || 'RL'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">Property Manager</p>
            </div>
          </button>
        </div>
      </aside>

      <div className="flex-1 h-screen overflow-y-auto px-8 py-6">
        <header className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-[420px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              className="w-full bg-[#ebedf2] rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-600 placeholder:text-slate-400 border border-transparent focus:outline-none focus:border-[#bdb8ff]"
              placeholder={searchPlaceholder}
            />
          </div>
          <div className="ml-auto flex items-center gap-3 text-slate-500">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="w-8 h-8 rounded-full hover:bg-white grid place-items-center"
              aria-label="Open notifications"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="w-8 h-8 rounded-full hover:bg-white grid place-items-center"
              aria-label="Open messages"
              title="Messages"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/help')}
              className="w-8 h-8 rounded-full hover:bg-white grid place-items-center"
              aria-label="Open help and settings"
              title="Help"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
            </button>
          </div>
          <div className="h-6 w-px bg-slate-300" />
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white transition"
            aria-label="Open profile settings"
            title="Profile settings"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Profile</span>
            <div className="w-8 h-8 rounded-md bg-slate-800 text-white grid place-items-center text-xs font-bold overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                initials || 'RL'
              )}
            </div>
          </button>
        </header>

        <div className="flex items-start justify-between gap-5 mb-6">
          <div>
            <h2 className="text-[44px] leading-none font-black tracking-tight text-slate-900">{title}</h2>
            {subtitle ? <p className="text-slate-500 mt-2">{subtitle}</p> : null}
          </div>
          {rightActions ? <div className="flex items-center gap-3">{rightActions}</div> : null}
        </div>

        {children}
      </div>
    </div>
  )
}
