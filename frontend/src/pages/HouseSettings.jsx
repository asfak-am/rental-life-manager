import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { houseService } from '../services'
import { authService } from '../services'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'
import TopBar from '../components/navigation/TopBar'
import BottomNav from '../components/navigation/BottomNav'
import DesktopSettingsView from '../layouts/desktop/DesktopSettingsView'
import InviteCodeCard from '../components/common/InviteCodeCard'
import { buildInviteLink, buildInviteQrSrc } from '../utils/inviteLink'

export default function HouseSettings() {
  const { user, logout, updateUser } = useAuth()
  const { house, members, refreshHouse } = useHouse()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [monthlyRentInput, setMonthlyRentInput] = useState('')
  const [reminderWindowInput, setReminderWindowInput] = useState('')
  const [notificationPrefs, setNotificationPrefs] = useState(user?.notifications || { expense: true, task: true, payment: true })
  const inviteCodeQueryKey = ['invite-code', house?._id || 'none']

  useEffect(() => {
    if (house?.monthlyRentAmount !== undefined && house?.monthlyRentAmount !== null) {
      setMonthlyRentInput(String(house.monthlyRentAmount))
    }
    if (house?.rentReminderWindowDays !== undefined && house?.rentReminderWindowDays !== null) {
      setReminderWindowInput(String(house.rentReminderWindowDays))
    }
  }, [house?.monthlyRentAmount, house?.rentReminderWindowDays])

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
    queryKey: inviteCodeQueryKey,
    queryFn: () => houseService.getInviteCode().then(r => r.data),
    enabled: !!house,
  })

  const inviteCode = codeData?.inviteCode || house?.inviteCode || ''
  const inviteLink = codeData?.inviteLink || buildInviteLink(inviteCode)
  const { data: rentStatus } = useQuery({
    queryKey: ['rent-status'],
    queryFn: () => houseService.getRentStatus().then(r => r.data),
    enabled: !!house,
  })

  const updateRentMutation = useMutation({
    mutationFn: (value) => houseService.updateRentConfig({ monthlyRentAmount: value }),
    onSuccess: () => {
      toast.success('Monthly rent updated')
      refreshHouse().catch(() => {})
      qc.invalidateQueries({ queryKey: ['rent-status'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update monthly rent'),
  })

  const updateReminderMutation = useMutation({
    mutationFn: (value) => houseService.updateRentConfig({ rentReminderWindowDays: value }),
    onSuccess: () => {
      toast.success('Reminder window updated')
      refreshHouse().catch(() => {})
      qc.invalidateQueries({ queryKey: ['rent-status'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update reminder window'),
  })
  const inviteQrSrc = buildInviteQrSrc(inviteLink)

  const refreshMutation = useMutation({
    mutationFn: () => houseService.refreshCode(),
    onSuccess: () => { toast.success('Invite code refreshed!'); qc.invalidateQueries({ queryKey: inviteCodeQueryKey }) },
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

  const removeMemberMutation = useMutation({
    mutationFn: ({ userId, confirm } = {}) => houseService.removeMember(userId, { confirm }),
    onSuccess: () => {
      toast.success('Member removed')
      refreshHouse().catch(() => {})
      qc.invalidateQueries({ queryKey: ['house'] })
      qc.invalidateQueries({ queryKey: ['rent-status'] })
      qc.invalidateQueries({ queryKey: ['rent-statuses'] })
      qc.invalidateQueries({ queryKey: ['rent-history'] })
      qc.invalidateQueries({ queryKey: ['expense-summary'] })
      qc.invalidateQueries({ queryKey: ['expenses'] })
      qc.invalidateQueries({ queryKey: ['balance-raw'] })
      qc.invalidateQueries({ queryKey: ['tasks-dashboard'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['invite-code'] })
    },
    onError: (err, variables) => {
      const status = err?.response?.status
      if (status === 409) {
        const data = err.response.data || {}
        const totals = data.totals || {}
        const warnings = Array.isArray(data.warnings) ? data.warnings : []
        const parts = []
        const names = warnings.map(w => w.name).filter(Boolean)
        if (names.length) parts.push(`Involved members: ${Array.from(new Set(names)).join(', ')}`)
        if (totals.totalOwedByTarget) parts.push(`They owe ${totals.totalOwedByTarget}`)
        if (totals.totalOwedToTarget) parts.push(`Owed to them ${totals.totalOwedToTarget}`)
        if (totals.totalUnpaidRent) parts.push(`Unpaid rent ${totals.totalUnpaidRent}`)
        if (totals.taskCountAssigned) parts.push(`${totals.taskCountAssigned} assigned tasks`)
        const msg = `This member has outstanding items: ${parts.join(', ')}. Confirm to clear these and remove the member?`
        if (window.confirm(msg)) {
          // retry with confirm
          removeMemberMutation.mutate({ userId: variables.userId, confirm: true })
        }
        return
      }
      toast.error(err.response?.data?.message || 'Failed to remove member')
    },
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
          inviteQrSrc={inviteQrSrc}
          onInvite={() => setInviteOpen(true)}
          onCopyInvite={copyCode}
          onLeave={handleLeaveHouse}
          leaving={leaveMutation.isPending}
          refreshCode={() => refreshMutation.mutate()}
          refreshing={refreshMutation.isPending}
          isAdmin={isAdmin}
          houseMembers={house?.members}
          currentUserId={user?._id}
          onRemoveMember={(member) => {
            if (!window.confirm(`Remove ${member.name || 'this member'} from the house?`)) return
            removeMemberMutation.mutate({ userId: member._id })
          }}
          notificationPrefs={notificationPrefs}
          onToggleNotification={toggleNotification}
          monthlyRentAmount={rentStatus?.totalRentAmount || house?.monthlyRentAmount || 0}
          monthlyRentInput={monthlyRentInput}
          onMonthlyRentInput={setMonthlyRentInput}
          reminderWindowDays={house?.rentReminderWindowDays || 5}
          reminderWindowInput={reminderWindowInput}
          onReminderWindowInput={setReminderWindowInput}
          onUpdateMonthlyRent={() => {
            const value = Number(monthlyRentInput || rentStatus?.totalRentAmount || 0)
            if (!Number.isFinite(value) || value < 0) {
              toast.error('Enter a valid rent amount')
              return
            }
            updateRentMutation.mutate(value)
          }}
          updatingMonthlyRent={updateRentMutation.isPending}
          onUpdateReminderWindow={() => {
            const value = Number(reminderWindowInput || house?.rentReminderWindowDays || 5)
            if (!Number.isInteger(value) || value < 1 || value > 31) {
              toast.error('Enter a reminder window between 1 and 31 days')
              return
            }
            updateReminderMutation.mutate(value)
          }}
          updatingReminderWindow={updateReminderMutation.isPending}
        />
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />

      <main className="max-w-screen-xl mx-auto px-6 pt-8 space-y-10">
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
                  {isAdmin && !isMe && (
                    <button
                      onClick={() => {
                        if (mIsAdmin) return
                        if (!window.confirm(`Remove ${member.name || 'this member'} from the house?`)) return
                        removeMemberMutation.mutate({ userId: member._id })
                      }}
                      disabled={mIsAdmin}
                      className={`mt-2 px-3 py-1 rounded-lg text-sm font-semibold ${mIsAdmin ? 'bg-surface text-slate-500 cursor-not-allowed' : 'bg-error text-on-error'}`}
                    >
                      {mIsAdmin ? 'ADMIN' : 'Remove'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InviteCodeCard
            code={inviteCode}
            qrSrc={inviteQrSrc}
            onCopy={copyCode}
            onRefresh={() => refreshMutation.mutate()}
            refreshing={refreshMutation.isPending}
            showRefresh={isAdmin}
            copyLabel={copied ? 'Copied' : 'Copy Code'}
            refreshLabel="Refresh"
            className="self-start"
          />
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

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Rent Reminders</h2>
          <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 space-y-2">
            <p className="text-sm text-on-surface-variant">All members get reminders during the last days of the month.</p>
            <p className="text-base font-semibold text-on-surface">Current setting: last {house?.rentReminderWindowDays || 5} days</p>
          </div>
        </section>

        {isAdmin && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Monthly Rent</h2>
            <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 space-y-3">
              <p className="text-sm text-on-surface-variant">Set the house default monthly rent. Only admins can edit this amount.</p>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="0"
                  value={monthlyRentInput}
                  onChange={e => setMonthlyRentInput(e.target.value)}
                  placeholder={`${rentStatus?.totalRentAmount || house?.monthlyRentAmount || 0}`}
                  className="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => {
                    const value = Number(monthlyRentInput || rentStatus?.totalRentAmount || 0)
                    if (!Number.isFinite(value) || value < 0) {
                      toast.error('Enter a valid rent amount')
                      return
                    }
                    updateRentMutation.mutate(value)
                  }}
                  disabled={updateRentMutation.isPending}
                  className="px-5 py-3 signature-gradient text-on-primary font-bold rounded-xl disabled:opacity-60"
                >
                  {updateRentMutation.isPending ? 'Saving...' : 'Save Rent'}
                </button>
              </div>
            </div>
          </section>
        )}

        {isAdmin && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Rent Reminders</h2>
            <div className="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 space-y-3">
              <p className="text-sm text-on-surface-variant">Choose how many days before month-end rent reminders should begin.</p>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={reminderWindowInput}
                  onChange={e => setReminderWindowInput(e.target.value)}
                  placeholder={`${house?.rentReminderWindowDays || 5}`}
                  className="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface"
                />
                <button
                  type="button"
                  onClick={() => {
                    const value = Number(reminderWindowInput || house?.rentReminderWindowDays || 5)
                    if (!Number.isInteger(value) || value < 1 || value > 31) {
                      toast.error('Enter a reminder window between 1 and 31 days')
                      return
                    }
                    updateReminderMutation.mutate(value)
                  }}
                  disabled={updateReminderMutation.isPending}
                  className="px-5 py-3 signature-gradient text-on-primary font-bold rounded-xl disabled:opacity-60"
                >
                  {updateReminderMutation.isPending ? 'Saving...' : 'Save Window'}
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">Current setting: last {house?.rentReminderWindowDays || 5} days of the month.</p>
            </div>
          </section>
        )}

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

