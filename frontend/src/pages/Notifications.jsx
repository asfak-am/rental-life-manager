import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopAppShell from '../components/desktop/DesktopAppShell'

const TYPE_STYLES = {
  expense:  { icon: 'receipt_long',        bg: 'bg-primary-fixed',       icon_color: 'text-primary'   },
  payment:  { icon: 'payments',            bg: 'bg-error-container',     icon_color: 'text-error'     },
  task:     { icon: 'assignment_turned_in',bg: 'bg-secondary-container', icon_color: 'text-secondary' },
  member:   { icon: 'person_add',          bg: 'bg-surface-container-high',icon_color: 'text-outline' },
  default:  { icon: 'notifications',       bg: 'bg-surface-container-high',icon_color: 'text-outline' },
}

export default function Notifications() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  })

  const markAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  })

  const markOneMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  })

  const notifications = data?.notifications || []
  const unread        = notifications.filter(n => !n.read)
  const read          = notifications.filter(n => n.read)

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
    return `${Math.floor(hrs / 24)} days ago`
  }

  const NotifItem = ({ n }) => {
    const s = TYPE_STYLES[n.type] || TYPE_STYLES.default
    return (
      <div
        onClick={() => !n.read && markOneMutation.mutate(n._id)}
        className={`p-5 rounded-xl flex items-start gap-4 group transition-all duration-200 hover:bg-surface-container-low cursor-pointer relative overflow-hidden ${!n.read ? 'bg-surface-container-lowest' : 'bg-surface-container-lowest/50 opacity-75'}`}
      >
        {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />}
        <div className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
          <span className={`material-symbols-outlined ${s.icon_color}`}>{s.icon}</span>
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-on-surface leading-tight">{n.title}</h3>
            {!n.read && (
              <span className="text-[11px] font-medium text-primary uppercase bg-primary-fixed px-2 py-0.5 rounded-full ml-2 flex-shrink-0">New</span>
            )}
          </div>
          <p className="text-on-surface-variant text-sm mb-2">{n.body}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {timeAgo(n.createdAt)}
            </span>
            {n.amount && (
              <span className="text-xs font-bold text-primary">â‚¹{n.amount.toLocaleString()}</span>
            )}
          </div>
        </div>
        {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
      </div>
    )
  }

  return (
    <>
      <div className="hidden lg:block">
        <DesktopAppShell
          title="Notifications"
          subtitle="Stay informed about your shared household activities."
          searchPlaceholder="Search notifications..."
          rightActions={
            unread.length > 0 ? (
              <button
                onClick={() => markAllMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-[#ecebff] text-[#5f52f2] text-sm font-semibold"
              >
                Mark all as read
              </button>
            ) : null
          }
        >
          <div className="grid grid-cols-12 gap-6">
            <section className="col-span-8 bg-white rounded-3xl p-6 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Recent Activity {unread.length > 0 && `Â· ${unread.length} unread`}
                </span>
              </div>

              {isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="bg-[#f7f8fb] p-5 rounded-xl h-24 animate-pulse" />)}
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div className="bg-[#f7f8fb] p-12 rounded-xl text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-400 mb-3 block">notifications_none</span>
                  <p className="text-slate-500 font-medium">All caught up! No notifications yet.</p>
                </div>
              )}

              {unread.map(n => <NotifItem key={n._id} n={n} />)}

              {read.length > 0 && (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2 pt-4">Earlier</p>
                  {read.map(n => <NotifItem key={n._id} n={n} />)}
                </>
              )}
            </section>

            <aside className="col-span-4 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Total notifications', value: notifications.length, icon: 'notifications', color: 'text-[#5f52f2]' },
                    { label: 'Unread', value: unread.length, icon: 'mark_email_unread', color: 'text-red-500' },
                    { label: 'Read', value: read.length, icon: 'done_all', color: 'text-emerald-600' },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-[#f7f8fb] rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${color}`}>{icon}</span>
                        <span className="text-sm text-slate-600">{label}</span>
                      </div>
                      <span className="font-bold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#ecebff] p-6 rounded-3xl border border-[#ddd9ff]">
                <h3 className="font-bold text-slate-900 mb-2">Stay Informed</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Notifications are sent when housemates add expenses, settle debts, or assign chores.
                </p>
              </div>
            </aside>
          </div>
        </DesktopAppShell>
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />

        <main className="max-w-screen-xl mx-auto px-6 pt-8 pb-32">
          <div className="mb-10">
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">Updates</h2>
            <p className="text-on-surface-variant font-body">Stay informed about your shared household activities.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Notifications list */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-bold uppercase tracking-widest text-outline">
                  Recent Activity {unread.length > 0 && `Â· ${unread.length} unread`}
                </span>
                {unread.length > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    className="text-primary font-semibold text-sm hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="bg-surface-container-lowest p-5 rounded-xl h-24 animate-pulse" />)}
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div className="bg-surface-container-lowest p-12 rounded-xl text-center">
                  <span className="material-symbols-outlined text-5xl text-outline mb-3 block">notifications_none</span>
                  <p className="text-on-surface-variant font-medium">All caught up! No notifications yet.</p>
                </div>
              )}

              {unread.map(n => <NotifItem key={n._id} n={n} />)}

              {read.length > 0 && (
                <>
                  <p className="text-xs font-bold uppercase tracking-widest text-outline px-2 pt-4">Earlier</p>
                  {read.map(n => <NotifItem key={n._id} n={n} />)}
                </>
              )}
            </div>

            {/* Summary sidebar */}
            <div className="space-y-4">
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                <h3 className="font-bold text-on-surface mb-4">Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Total notifications', value: notifications.length, icon: 'notifications', color: 'text-primary' },
                    { label: 'Unread',              value: unread.length,        icon: 'mark_email_unread', color: 'text-error' },
                    { label: 'Read',                value: read.length,          icon: 'done_all', color: 'text-secondary' },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${color}`}>{icon}</span>
                        <span className="text-sm text-on-surface-variant">{label}</span>
                      </div>
                      <span className="font-bold text-on-surface">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary-container/30 p-6 rounded-2xl">
                <h3 className="font-bold text-on-surface mb-2">Stay Informed</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Notifications are sent when housemates add expenses, settle debts, or assign chores.
                </p>
              </div>
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  )
}

