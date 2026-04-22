import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RL'

  return (
    <header className="bg-slate-50/80 backdrop-blur-xl sticky top-0 z-50 border-b border-outline-variant/10">
      <div className="flex items-center justify-between gap-3 w-full px-4 sm:px-6 py-4 max-w-screen-xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 min-w-0 text-left active:scale-95 transition"
          aria-label="Open profile"
          title="Profile"
        >
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant font-bold text-sm overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              initials
            )}
          </div>
          <span className="text-xl font-black text-slate-900 font-headline tracking-tight">Rental Life</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-2 text-slate-500">
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 flex items-center justify-center rounded-full text-violet-700 hover:bg-slate-200/50 transition-all duration-200 active:scale-95"
            aria-label="Open notifications"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/messages')}
            className="w-10 h-10 flex items-center justify-center rounded-full text-violet-700 hover:bg-slate-200/50 transition-all duration-200 active:scale-95"
            aria-label="Open messages"
            title="Messages"
          >
            <span className="material-symbols-outlined">chat</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/help')}
            className="w-10 h-10 flex items-center justify-center rounded-full text-violet-700 hover:bg-slate-200/50 transition-all duration-200 active:scale-95"
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
            className="w-10 h-10 flex items-center justify-center rounded-full text-rose-700 hover:bg-rose-100 transition-all duration-200 active:scale-95"
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