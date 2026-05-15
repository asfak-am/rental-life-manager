import { formatCurrency } from '../utils/currency'

export default function DashboardTasksSection({
  tasks = [],
  onMarkTaskComplete,
  isMarkingTaskComplete = false,
  layout = 'mobile', // 'mobile' or 'desktop'
}) {
  const upcomingTasks = tasks.filter(task => task.status !== 'completed')

  if (layout === 'desktop') {
    return (
      <section className="col-span-6 bg-white rounded-3xl p-6 border border-slate-200">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h4 className="text-2xl font-black">Tasks</h4>
            <p className="text-sm text-slate-500 mt-1">{upcomingTasks.length} pending items</p>
          </div>
        </div>

        <div className="space-y-3">
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="material-symbols-outlined text-4xl block mb-2">task_alt</span>
              No open tasks right now.
            </div>
          ) : (
            upcomingTasks.map((task) => {
              const isPending = !task.status || task.status === 'todo' || task.status === 'pending'

              return (
                <div key={task._id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-slate-100 hover:border-slate-300 transition">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isPending ? 'radio_button_unchecked' : 'check_circle'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {task.description || 'Household task to keep things moving.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onMarkTaskComplete?.(task)}
                    disabled={isMarkingTaskComplete}
                    className="ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-white border border-primary-fixed/40 hover:bg-primary-fixed/20 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap transition"
                  >
                    Mark done
                  </button>
                </div>
              )
            })
          )}
        </div>
      </section>
    )
  }

  // Mobile layout
  return (
    <section className="bg-surface-container-lowest rounded-[2rem] p-6 border border-outline-variant/10">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tasks</p>
          <h3 className="text-xl sm:text-2xl font-extrabold mt-1 tracking-tight text-on-surface">Pending chores</h3>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {tasks.length} total
        </span>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-2xl bg-surface-container p-6 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 block">task_alt</span>
            No open tasks right now.
          </div>
        ) : (
          upcomingTasks.slice(0, 4).map((task) => {
            const isPending = !task.status || task.status === 'todo' || task.status === 'pending'
            return (
              <div key={task._id} className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container border border-outline-variant/10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isPending ? 'radio_button_unchecked' : 'check_circle'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-on-surface truncate">{task.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                    {task.description || 'Household task to keep things moving.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onMarkTaskComplete?.(task)}
                  disabled={isMarkingTaskComplete}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-outline-variant/15 text-primary disabled:opacity-60"
                >
                  Done
                </button>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
