import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ThemeCustomizer from '../ThemeCustomizer'
import { useRef, useState, useEffect } from 'react'

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
  const qc = useQueryClient()
  const lastDesktopCount = useRef(0)
  const [isHoverExpanded, setIsHoverExpanded] = useState(false)

  const isSidebarExpanded = isHoverExpanded

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }
  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'desktop-topbar-count'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    staleTime: 30000,
    refetchInterval: 15000,
    onSuccess(data) {
      const unread = (data?.notifications || []).filter(n => !n.read).length
      if (unread > lastDesktopCount.current) qc.invalidateQueries(['rent-status'])
      lastDesktopCount.current = unread
    }
  })
  const unreadCount = (notificationData?.notifications || []).filter(notification => !notification.read).length
  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="h-screen bg-surface text-on-surface flex overflow-hidden">
      <aside
        className={`h-screen sticky top-0 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col overflow-y-auto transition-all duration-300 ${isSidebarExpanded ? 'w-[220px] px-5' : 'w-[80px] px-3'} py-6`}
        onMouseEnter={() => setIsHoverExpanded(true)}
        onMouseLeave={() => setIsHoverExpanded(false)}
      >
        <div className={`flex items-center ${isSidebarExpanded ? 'justify-start gap-3' : 'justify-center'}`}>
          {!isSidebarExpanded && (
            <div className="w-12 h-12 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]" style={{ color: 'rgb(var(--primary-rgb))', fontVariationSettings: "'FILL' 1" }}>apartment</span>
            </div>
          )}
          <div className={`${isSidebarExpanded ? '' : 'hidden'}`}>
            <div className="leading-[0.9]">
              <h1 className="text-[24px] font-black tracking-tight whitespace-nowrap" style={{ color: 'rgb(var(--primary-rgb))' }}>Rental Life</h1>
            </div>
          </div>
        </div>

        <nav className={`mt-10 space-y-2 ${isSidebarExpanded ? '' : 'flex flex-col items-center'}`}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition ${
                  isActive
                    ? 'bg-primary-fixed/20 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                } ${isSidebarExpanded ? 'text-sm' : 'justify-center w-10 h-10 px-0'}`
              }
              title={isSidebarExpanded ? undefined : item.label}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {isSidebarExpanded && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className={`w-full flex items-center gap-3 rounded-xl bg-transparent p-3 border border-outline-variant/30 text-left hover:border-primary hover:text-primary hover:bg-surface-container-low transition ${isSidebarExpanded ? '' : 'justify-center px-0'}`}
            title={isSidebarExpanded ? undefined : 'Profile'}
          >
            <div className="w-9 h-9 rounded-full bg-transparent border border-outline-variant/30 text-on-surface-variant font-bold flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" className="w-full h-full object-cover" />
              ) : (
                initials || 'RL'
              )}
            </div>
            {isSidebarExpanded && (
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-on-surface-variant truncate">Property Manager</p>
              </div>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 h-screen overflow-y-auto px-8 py-6 bg-surface">
        <header className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-[420px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input
              className="w-full bg-surface-container rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant border border-transparent focus:outline-none focus:border-primary-fixed/40"
              placeholder={searchPlaceholder}
            />
          </div>
          <div className="ml-auto flex items-center gap-3 text-primary">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative w-8 h-8 rounded-full bg-transparent border border-primary/35 grid place-items-center hover:bg-transparent hover:border-primary transition"
              aria-label="Open notifications"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error border border-surface" />
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="w-8 h-8 rounded-full bg-transparent border border-primary/35 grid place-items-center hover:bg-transparent hover:border-primary transition"
              aria-label="Open messages"
              title="Messages"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/help')}
              className="w-8 h-8 rounded-full bg-transparent border border-primary/35 grid place-items-center hover:bg-transparent hover:border-primary transition"
              aria-label="Open help and settings"
              title="Help"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
            </button>
          </div>
          <div className="h-6 w-px bg-outline-variant/30" />
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 rounded-lg px-3 py-1 bg-transparent border border-primary/35 text-primary hover:border-primary hover:bg-transparent transition"
            aria-label="Open profile settings"
            title="Profile settings"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-current">Profile</span>
            <div className="w-8 h-8 rounded-full bg-transparent border border-primary/35 text-current grid place-items-center text-xs font-bold overflow-hidden">
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

      <ThemeCustomizer />
    </div>
  )
}
