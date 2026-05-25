import DesktopAppShell from './DesktopAppShell'
import InviteCodeCard from '../../components/common/InviteCodeCard'

export default function DesktopSettingsView({
  members = [],
  onInvite,
  onLeave,
  leaving,
  inviteCode,
  inviteQrSrc,
  onCopyInvite,
  refreshCode,
  refreshing,
  isAdmin,
  currentUserId,
  onRemoveMember,
  houseMembers = [],
  notificationPrefs = {},
  onToggleNotification,
  monthlyRentAmount = 0,
  monthlyRentInput = '',
  onMonthlyRentInput,
  onUpdateMonthlyRent,
  updatingMonthlyRent,
  reminderWindowDays = 5,
  reminderWindowInput = '',
  onReminderWindowInput,
  onUpdateReminderWindow,
  updatingReminderWindow,
}) {
  return (
    <DesktopAppShell
      title="House Settings"
      subtitle="Manage residents, preferences, and workspace atmosphere."
      searchPlaceholder="Search for properties, members..."
    >
      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-8 space-y-5">
          <div className="bg-white rounded-[30px] p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-xl font-black tracking-tight">House Members</h4>
                <p className="text-sm text-slate-500">{members.length} active residents</p>
              </div>
              <button onClick={onInvite} type="button" className="text-primary font-semibold">+ Invite Member</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {members.map(member => {
                const membership = houseMembers?.find(hm => String(hm.userId) === String(member._id))
                const mIsAdmin = membership?.role === 'admin'
                const joinedDate = membership?.joinedAt || member?.createdAt
                const joinedLabel = joinedDate
                  ? `Joined ${new Date(joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
                  : 'Joined recently'
                return (
                  <div key={member._id} className="bg-surface-container-low rounded-2xl p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-fixed/25 grid place-items-center text-primary font-black">
                      {(member.displayName || member.name || 'R').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold truncate">{member.displayName || member.name}{member._id === currentUserId ? ' (You)' : ''}</p>
                        {mIsAdmin && (
                          <span className="text-[10px] leading-none px-2 py-1 rounded-full bg-secondary text-on-secondary font-bold uppercase tracking-wider">Admin</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{joinedLabel}</p>
                    </div>
                    {isAdmin && member._id !== currentUserId && (
                      <div className="ml-auto">
                        <button
                          onClick={() => {
                            if (mIsAdmin) return
                            onRemoveMember?.(member)
                          }}
                          disabled={mIsAdmin}
                          className={`px-3 py-1 rounded-lg text-sm font-semibold ${mIsAdmin ? 'bg-surface text-slate-500 cursor-not-allowed' : 'bg-error text-on-error'}`}
                        >
                          {mIsAdmin ? 'ADMIN' : 'Remove'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-[30px] p-5 border border-slate-200">
            <h4 className="text-xl font-black tracking-tight mb-4">House Notifications</h4>
            {[
              ['Rent & Utilities', 'expense', notificationPrefs.expense],
              ['Task Updates', 'task', notificationPrefs.task],
              ['House Announcements', 'payment', notificationPrefs.payment],
            ].map(([label, key, active]) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low mb-3 last:mb-0">
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-slate-500">Alerts for important activity and reminders</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleNotification?.(key, !active)}
                  className={`w-11 h-6 rounded-full relative transition ${active ? 'bg-primary' : 'bg-slate-300'}`}
                  aria-pressed={Boolean(active)}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${active ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[30px] p-5 border border-slate-200">
            <h4 className="text-xl font-black tracking-tight mb-2">Rent Reminders</h4>
            <p className="text-sm text-slate-500">All members get reminders during the last days of the month.</p>
            <p className="mt-2 text-base font-semibold text-slate-900">Current setting: last {reminderWindowDays} days</p>
          </div>

          {isAdmin ? (
            <div className="bg-white rounded-[30px] p-5 border border-slate-200">
              <h4 className="text-xl font-black tracking-tight mb-2">Monthly Rent</h4>
              <p className="text-sm text-slate-500">Set the default rent amount for each month. Only admins can edit this.</p>
              <div className="mt-4 flex gap-3">
                <span className="px-3 py-3 rounded-xl bg-surface-container-low text-slate-600 font-semibold">LKR</span>
                <input
                  type="number"
                  min="0"
                  value={monthlyRentInput}
                  onChange={e => onMonthlyRentInput?.(e.target.value)}
                  placeholder={`${monthlyRentAmount || 0}`}
                  className="flex-1 rounded-xl border border-slate-200 bg-surface-container-low px-4 py-3 text-slate-900"
                />
                <button
                  type="button"
                  onClick={onUpdateMonthlyRent}
                  disabled={updatingMonthlyRent}
                  className="px-5 py-3 rounded-xl signature-gradient text-white font-semibold disabled:opacity-60"
                >
                  {updatingMonthlyRent ? 'Saving...' : 'Save Rent'}
                </button>
              </div>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="bg-white rounded-[30px] p-5 border border-slate-200">
              <h4 className="text-xl font-black tracking-tight mb-2">Rent Reminders</h4>
              <p className="text-sm text-slate-500">Choose how many days before month-end reminders should begin.</p>
              <div className="mt-4 flex gap-3">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={reminderWindowInput}
                  onChange={e => onReminderWindowInput?.(e.target.value)}
                  placeholder={`${reminderWindowDays}`}
                  className="flex-1 rounded-xl border border-slate-200 bg-surface-container-low px-4 py-3 text-slate-900"
                />
                <button
                  type="button"
                  onClick={onUpdateReminderWindow}
                  disabled={updatingReminderWindow}
                  className="px-5 py-3 rounded-xl signature-gradient text-white font-semibold disabled:opacity-60"
                >
                  {updatingReminderWindow ? 'Saving...' : 'Save Window'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Current setting: last {reminderWindowDays} days of the month.</p>
            </div>
          ) : null}
        </section>

        <section className="col-span-4 space-y-5">
          <InviteCodeCard
            code={inviteCode}
            qrSrc={inviteQrSrc}
            onCopy={onCopyInvite}
            onRefresh={refreshCode}
            refreshing={refreshing}
            showRefresh={true}
            copyLabel="Copy Code"
            refreshLabel="Refresh"
            className="self-start"
          />

          <div className="bg-[#fff7f7] rounded-3xl p-5 border border-red-200">
            <h4 className="text-2xl font-black tracking-tight text-red-600">Danger Zone</h4>
            <p className="text-sm text-red-500 mt-2">These actions are permanent and cannot be undone.</p>
            <button
              onClick={onLeave}
              disabled={leaving}
              className="mt-4 w-full py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-60"
            >
              {leaving ? 'Leaving...' : 'Leave House'}
            </button>
          </div>
        </section>
      </div>
    </DesktopAppShell>
  )
}
