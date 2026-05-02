import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useRef } from 'react'

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const qc = useQueryClient()
  const lastCountRef = useRef(0)
  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'topbar-count'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    staleTime: 30000,
    refetchInterval: 15000,
    onSuccess(data) {
      const unread = (data?.notifications || []).filter(n => !n.read).length
      if (unread > lastCountRef.current) qc.invalidateQueries(['rent-status'])
      lastCountRef.current = unread
    }
  })

  const unreadCount = (notificationData?.notifications || []).filter(notification => !notification.read).length

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RL'

  return (
    <header className="bg-surface-container-high/80 backdrop-blur-xl sticky top-0 z-50 border-b border-outline-variant/10">
      <div className="flex items-center justify-between gap-3 w-full px-4 sm:px-6 py-4 max-w-screen-xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 min-w-0 text-left active:scale-95 transition"
          aria-label="Open profile"
          title="Profile"
        >
          <div className="w-10 h-10 rounded-full bg-transparent border border-primary/35 flex items-center justify-center text-primary font-bold text-sm overflow-hidden flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              initials
            )}
          </div>
          <span className="text-xl font-black text-on-surface font-headline tracking-tight">Rental Life</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2 text-primary">
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-transparent border border-primary/35 text-primary hover:border-primary hover:bg-transparent transition-all duration-200 active:scale-95"
            aria-label="Open notifications"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-error border-2 border-surface" />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/messages')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent border border-primary/35 text-primary hover:border-primary hover:bg-transparent transition-all duration-200 active:scale-95"
            aria-label="Open messages"
            title="Messages"
          >
            <span className="material-symbols-outlined">chat</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/help')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent border border-primary/35 text-primary hover:border-primary hover:bg-transparent transition-all duration-200 active:scale-95"
            aria-label="Open help"
            title="Help"
          >
            <span className="material-symbols-outlined">help</span>
          </button>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-transparent border border-primary/35 text-primary hover:border-primary hover:bg-transparent transition-all duration-200 active:scale-95"
            aria-label="Logout"
            title="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}