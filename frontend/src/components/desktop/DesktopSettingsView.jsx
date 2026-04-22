import DesktopAppShell from './DesktopAppShell'

export default function DesktopSettingsView({
  members = [],
  onInvite,
  onLeave,
  leaving,
  inviteCode,
  onCopyInvite,
  refreshCode,
  refreshing,
  isAdmin,
  notificationPrefs = {},
  onToggleNotification,
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
              <button onClick={onInvite} type="button" className="text-[#5f52f2] font-semibold">+ Invite Member</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {members.slice(0, 4).map(member => (
                <div key={member._id} className="bg-[#f7f8fb] rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#dbdeff] grid place-items-center text-[#5f52f2] font-black">
                    {(member.displayName || member.name || 'R').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{member.displayName || member.name}</p>
                    <p className="text-xs text-slate-500">Resident</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[30px] p-5 border border-slate-200">
            <h4 className="text-xl font-black tracking-tight mb-4">House Notifications</h4>
            {[
              ['Rent & Utilities', 'expense', notificationPrefs.expense],
              ['Task Updates', 'task', notificationPrefs.task],
              ['House Announcements', 'payment', notificationPrefs.payment],
            ].map(([label, key, active]) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-[#f7f8fb] mb-3 last:mb-0">
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-slate-500">Alerts for important activity and reminders</p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleNotification?.(key, !active)}
                  className={`w-11 h-6 rounded-full relative transition ${active ? 'bg-[#5f52f2]' : 'bg-slate-300'}`}
                  aria-pressed={Boolean(active)}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${active ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="col-span-4 space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-slate-200">
            <h4 className="text-lg font-black">Invite Code</h4>
            <p className="text-3xl font-black tracking-widest mt-3 text-[#5f52f2]">{inviteCode || '----'}</p>
            <div className="mt-4 space-y-2">
              <button onClick={onCopyInvite} className="w-full py-2.5 rounded-xl signature-gradient text-white font-semibold">Copy Invite Code</button>
              {isAdmin ? (
                <button
                  onClick={refreshCode}
                  disabled={refreshing}
                  className="w-full py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold disabled:opacity-60"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Code'}
                </button>
              ) : null}
            </div>
          </div>

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
