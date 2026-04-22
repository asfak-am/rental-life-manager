import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { taskService } from '../services'
import { useHouse } from '../context/HouseContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopTasksView from '../components/desktop/DesktopTasksView'

const PRIORITY_STYLES = {
  high:   { bg: 'bg-error-container',     text: 'text-on-error-container',   label: 'High Priority'   },
  medium: { bg: 'bg-tertiary-fixed',      text: 'text-on-tertiary-fixed',    label: 'Medium Priority' },
  low:    { bg: 'bg-secondary-container', text: 'text-on-secondary-container',label: 'Low Priority'   },
}

function TaskCard({ task, members, onToggle, onDelete }) {
  const assignee = members.find(m => m._id === task.assignedTo)
  const ps       = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.low

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl transition-all hover:scale-[1.01] hover:shadow-xl group">
      <div className="flex justify-between items-start mb-4">
        <span className={`${ps.bg} ${ps.text} text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md`}>
          {ps.label}
        </span>
        <button
          onClick={() => onDelete(task._id)}
          className="text-outline-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
      <h4 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">{task.description}</p>
      )}
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary">
            {assignee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
          </div>
          <span className="text-xs font-bold text-on-surface">{assignee?.name?.split(' ')[0] || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div className="flex items-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span className="text-xs font-semibold">
                {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
          <button
            onClick={() => onToggle(task)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              task.status === 'completed'
                ? 'bg-secondary text-on-secondary'
                : 'bg-primary-fixed text-primary hover:bg-primary hover:text-on-primary'
            }`}
          >
            {task.status === 'completed' ? 'Done ✓' : 'Mark done'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const { members } = useHouse()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskService.getAll().then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const addMutation = useMutation({
    mutationFn: (d) => taskService.add(d),
    onSuccess: () => { toast.success('Task added!'); qc.invalidateQueries(['tasks']); setShowAdd(false); reset() },
    onError: () => toast.error('Failed to add task'),
  })

  const toggleMutation = useMutation({
    mutationFn: (task) => taskService.update(task._id, {
      status: task.status === 'completed' ? 'pending' : 'completed',
    }),
    onSuccess: () => qc.invalidateQueries(['tasks']),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => taskService.remove(id),
    onSuccess: () => { toast.success('Task removed'); qc.invalidateQueries(['tasks']) },
  })

  const tasks     = data?.tasks || []
  const pending   = tasks.filter(t => t.status !== 'completed')
  const completed = tasks.filter(t => t.status === 'completed')

  // Rotation: who's up this week
  const weekAssignee = members[new Date().getWeekNumber?.() % members.length] || members[0]

  return (
    <>
      <div className="hidden lg:block">
        <DesktopTasksView tasks={tasks} />
      </div>

      <div className="lg:hidden bg-surface font-body text-on-surface min-h-screen pb-32">
        <TopBar />

      <main className="max-w-screen-xl mx-auto px-6 pt-6 pb-32">
        {/* Weekly rotation banner */}
        {weekAssignee && (
          <section className="mb-10">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-container p-1 shadow-lg">
              <div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-[1.25rem] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2 rounded-full">
                    <span className="material-symbols-outlined text-white">auto_awesome</span>
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-0.5">Weekly Rotation</p>
                    <h2 className="text-white text-lg font-bold font-headline">
                      This week: {weekAssignee.name?.split(' ')[0]}'s turn for common area
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Chore Ledger</h1>
            <p className="text-on-surface-variant font-medium">Coordinate, execute, and track shared responsibilities.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="signature-gradient text-on-primary px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            Add Task
          </button>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Pending */}
          <section>
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-primary rounded-full" />
                <h3 className="text-xl font-bold font-headline">Pending</h3>
                <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold px-2.5 py-0.5 rounded-full">{pending.length}</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {isLoading && [1,2].map(i => <div key={i} className="bg-surface-container-lowest p-6 rounded-xl h-40 animate-pulse" />)}
              {pending.length === 0 && !isLoading && (
                <div className="bg-surface-container-lowest p-8 rounded-xl text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2 text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                  All tasks done!
                </div>
              )}
              {pending.map(t => (
                <TaskCard key={t._id} task={t} members={members} onToggle={task => toggleMutation.mutate(task)} onDelete={id => deleteMutation.mutate(id)} />
              ))}
            </div>
          </section>

          {/* Completed */}
          <section>
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-secondary rounded-full" />
                <h3 className="text-xl font-bold font-headline">Completed</h3>
                <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-2.5 py-0.5 rounded-full">{completed.length}</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {completed.length === 0 && (
                <div className="bg-surface-container-lowest p-8 rounded-xl text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl block mb-2">pending</span>
                  No completed tasks yet.
                </div>
              )}
              {completed.map(t => (
                <div key={t._id} className="opacity-60">
                  <TaskCard task={t} members={members} onToggle={task => toggleMutation.mutate(task)} onDelete={id => deleteMutation.mutate(id)} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Add Task modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-on-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-t-[2.5rem] shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-headline font-bold">Add Task</h3>
              <button onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Task Title</label>
                <input
                  type="text" placeholder="e.g. Clean the kitchen"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface"
                  {...register('title', { required: true })}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Description</label>
                <input
                  type="text" placeholder="Details (optional)"
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface"
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Assign To</label>
                  <select
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface appearance-none"
                    {...register('assignedTo')}
                  >
                    {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface"
                    {...register('dueDate')}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Priority</label>
                <select
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface appearance-none"
                  {...register('priority')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addMutation.isPending}
                className="w-full py-4 signature-gradient text-on-primary font-bold rounded-2xl shadow-lg"
              >
                {addMutation.isPending ? 'Adding...' : 'Add Task'}
              </button>
            </form>
          </div>
        </div>
      )}

        <BottomNav />
      </div>
    </>
  )
}