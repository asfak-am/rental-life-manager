import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { houseService } from '../services'
import { authService } from '../services'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopSettingsView from '../components/desktop/DesktopSettingsView'

export default function HouseSettings() {
  const { user, logout, updateUser } = useAuth()
  const { house, members } = useHouse()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [notificationPrefs, setNotificationPrefs] = useState(user?.notifications || { expense: true, task: true, payment: true })

  const syncNotificationPrefs = async (nextPrefs) => {
    const res = await authService.updateProfile({ notifications: nextPrefs })
    updateUser(res.data.user)
    setNotificationPrefs(res.data.user?.notifications || nextPrefs)
    return res
  }

  const toggleNotification = async (key, enabled) => {
    const nextPrefs = { ...(notificationPrefs || {}), [key]: enabled }
    setNotificationPrefs(nextPrefs)
    try {
      await syncNotificationPrefs(nextPrefs)
      toast.success('Notification settings updated')
    } catch (err) {
      setNotificationPrefs(user?.notifications || { expense: true, task: true, payment: true })
      toast.error(err.response?.data?.message || 'Failed to update notification settings')
    }
  }

  const { data: codeData } = useQuery({
    queryKey: ['invite-code'],
    queryFn: () => houseService.getInviteCode().then(r => r.data),
    enabled: !!house,
  })

  const inviteCode = codeData?.inviteCode || house?.inviteCode || ''
  const inviteQrSrc = inviteCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=248x248&data=${encodeURIComponent(inviteCode)}`
    : ''

  const refreshMutation = useMutation({
    mutationFn: () => houseService.refreshCode(),
    onSuccess: () => { toast.success('Invite code refreshed!'); qc.invalidateQueries(['invite-code']) },
  })

  const inviteMutation = useMutation({
    mutationFn: (email) => houseService.inviteMember({ email }),
    onSuccess: () => {
      toast.success('Invitation email sent')
      setInviteEmail('')
      setInviteOpen(false)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send invite')
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => houseService.leave(),
    onSuccess: () => { toast.success('You left the house'); logout(); navigate('/login') },
    onError: () => toast.error('Failed to leave house'),
  })

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const isAdmin = house?.members?.find(m => m.userId === user?._id)?.role === 'admin'

  const sendInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Enter an email address')
      return
    }
    inviteMutation.mutate(inviteEmail.trim())
  }

  const handleLeaveHouse = () => {
    if (window.confirm('Are you sure you want to leave this house?')) {
      leaveMutation.mutate()
    }
  }

  return (
    <>
      <div className="hidden lg:block">
        <DesktopSettingsView
          members={members}
          inviteCode={inviteCode}
          onInvite={() => setInviteOpen(true)}
          onCopyInvite={copyCode}
          onLeave={handleLeaveHouse}
          leaving={leaveMutation.isPending}
          refreshCode={() => refreshMutation.mutate()}
          refreshing={refreshMutation.isPending}
          isAdmin={isAdmin}
          notificationPrefs={notificationPrefs}
          onToggleNotification={toggleNotification}
        />
      </div>

      <div className="lg:hidden bg-surface font-body text-on-surface min-h-screen pb-32">
        <TopBar />

      <main className="max-w-screen-xl mx-auto px-6 pt-8 space-y-10">
        {/* House identity */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[11px] uppercase tracking-[0.2em] text-outline font-semibold">Active Residence</span>
              <h1 className="text-4xl font-extrabold text-on-surface mt-2 tracking-tight">{house?.name || 'Your House'}</h1>
              <p className="text-on-surface-variant mt-2 max-w-md">
                {members.length} members · Managed with Rental Life
              </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          </div>

          <div className="bg-primary-container text-on-primary-container p-8 rounded-xl flex flex-col justify-center items-start space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">House Invite Code</span>
            <div className="flex items-center justify-between w-full bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <code className="text-2xl font-mono font-bold tracking-widest">
                {inviteCode || '----'}
              </code>
              <button onClick={copyCode} className="hover:bg-white/20 p-2 rounded-lg transition-colors active:scale-90">
                <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
              </button>
            </div>
            <div className="w-full bg-white rounded-xl p-4 flex flex-col items-center gap-3 text-slate-900">
              <div className="bg-white p-2 rounded-lg">
                {inviteCode ? (
                  <img
                    src={inviteQrSrc}
                    alt="Invite code QR"
                    width={124}
                    height={124}
                    className="w-[124px] h-[124px]"
                  />
                ) : (
                  <div className="w-[124px] h-[124px] rounded bg-slate-100" />
                )}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Scan to share invite code
              </p>
            </div>
            <p className="text-xs opacity-70">Share this code with new roommates.</p>
            {isAdmin && (
              <button
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
                className="text-xs font-bold underline underline-offset-2 opacity-70 hover:opacity-100"
              >
                Refresh code
              </button>
            )}
          </div>
        </section>

        {/* Members */}
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">House Members</h2>
              <p className="text-on-surface-variant text-sm">{members.length} Residents Currently Active</p>
            </div>
            <button
              onClick={() => setInviteOpen(true)}
              className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Invite More
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {members.map(member => {
              const isMe    = member._id === user?._id
              const mIsAdmin = house?.members?.find(m => m.userId === member._id)?.role === 'admin'
              return (
                <div key={member._id} className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/10 flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-xl font-black text-primary">
                      {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    {mIsAdmin && (
                      <span className="absolute bottom-0 right-0 bg-secondary text-on-secondary text-[9px] font-bold px-2 py-0.5 rounded-full">ADMIN</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">{member.name}{isMe ? ' (You)' : ''}</h3>
                    <p className="text-xs text-outline">
                      Joined {new Date(member.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Notification Settings</h2>
          {[
            { key: 'expense',  label: 'Expense alerts',    sub: 'When a new expense is added' },
            { key: 'task',     label: 'Chore reminders',   sub: 'When tasks are assigned or due' },
            { key: 'payment',  label: 'Payment reminders', sub: 'When someone settles a debt' },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
              <div>
                <p className="font-semibold text-on-surface">{label}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:bg-primary transition-colors" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          ))}
        </section>

        {/* Danger zone */}
        <section className="space-y-4 pb-8">
          <h2 className="text-2xl font-bold tracking-tight text-error">Danger Zone</h2>
          <div className="border border-error/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface">Leave House</p>
                <p className="text-xs text-on-surface-variant">You'll lose access to all shared expenses and tasks.</p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to leave this house?')) {
                    leaveMutation.mutate()
                  }
                }}
                disabled={leaveMutation.isPending}
                className="px-5 py-2.5 bg-error-container text-on-error-container font-bold rounded-xl active:scale-95 transition-all disabled:opacity-60"
              >
                Leave House
              </button>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Invite Member</p>
                <h3 className="text-2xl font-black tracking-tight mt-1">Send house invitation</h3>
              </div>
              <button onClick={() => setInviteOpen(false)} className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-[#f7f8fb] px-4 py-3 text-slate-900 outline-none focus:border-[#5f52f2]"
                />
              </div>

              <div className="rounded-2xl bg-[#f7f8fb] border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Invite Link</p>
                <p className="text-sm text-slate-600 mt-1">They will be asked to sign up first if they do not already have an account, then continue into this house.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setInviteOpen(false)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={sendInvite}
                  disabled={inviteMutation.isPending}
                  className="flex-1 rounded-xl signature-gradient px-4 py-3 font-semibold text-white disabled:opacity-60"
                >
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}