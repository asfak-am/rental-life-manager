import DesktopAppShell from './DesktopAppShell'

function TaskColumn({ title, colorClass, tasks }) {
  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-block w-1.5 h-6 rounded ${colorClass}`} />
        <h4 className="text-2xl font-black tracking-tight">{title}</h4>
        <span className="ml-2 text-xs rounded-full px-2 py-1 bg-slate-100 font-semibold">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.map(task => (
          <article key={task._id} className="bg-[#f7f8fb] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400">{task.priority || 'normal'}</span>
              <span className="text-[11px] text-slate-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
            </div>
            <h5 className="font-bold">{task.title}</h5>
            {task.description ? <p className="text-sm text-slate-500 mt-1">{task.description}</p> : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export default function DesktopTasksView({ tasks = [] }) {
  const pending = tasks.filter(task => task.status !== 'completed')
  const completed = tasks.filter(task => task.status === 'completed')

  return (
    <DesktopAppShell
      title="Task Flow"
      subtitle="Elevate your property management flow"
      searchPlaceholder="Search tasks, properties..."
    >
      <section className="signature-gradient rounded-3xl p-8 text-white mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">Weekly Focus</p>
          <h3 className="text-[42px] leading-tight font-black mt-2">Elevate your property management flow.</h3>
          <p className="mt-2 text-white/80">You have 12 maintenance requests pending this week.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 rounded-2xl p-4 min-w-[120px]">
            <p className="text-[10px] uppercase tracking-widest">Upcoming</p>
            <p className="text-3xl font-black mt-1">14:00</p>
          </div>
          <div className="bg-white/20 rounded-2xl p-4 min-w-[120px]">
            <p className="text-[10px] uppercase tracking-widest">Completed</p>
            <p className="text-3xl font-black mt-1">84%</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <TaskColumn title="Pending" colorClass="bg-amber-700" tasks={pending.slice(0, 5)} />
        <TaskColumn title="Completed" colorClass="bg-emerald-600" tasks={completed.slice(0, 5)} />
      </div>
    </DesktopAppShell>
  )
}
