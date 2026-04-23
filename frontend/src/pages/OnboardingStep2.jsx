import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function OnboardingStep2() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const preferredName = user?.displayName || user?.name || ''
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { displayName: preferredName, bio: user?.bio || '' },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await api.put('/auth/profile', data)
      updateUser(res.data.user)
      toast.success('Profile saved!')
      navigate('/onboarding/success')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface app-light-gradient font-body text-on-surface min-h-screen flex flex-col relative">
      {/* Background gradient with blur */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-fixed/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-secondary-fixed/20 rounded-full blur-[100px] -z-10" />

      <header className="bg-slate-50/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
          <h1 className="text-xl font-black text-slate-900 font-headline tracking-tight">Rental Life</h1>
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">help_outline</span>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto w-full px-6 pb-32 pt-10">
        {/* Step indicator */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="font-label text-[11px] font-semibold uppercase tracking-wider text-primary mb-1 block">Step 2 of 3</span>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Set Up Your Profile</h2>
            </div>
            <div className="flex gap-1.5 h-1.5">
              <div className="w-8 rounded-full bg-primary-container" />
              <div className="w-12 rounded-full bg-primary" />
              <div className="w-8 rounded-full bg-surface-container-highest" />
            </div>
          </div>
          <p className="text-on-surface-variant font-body leading-relaxed max-w-sm">
            Personalize your presence in the ledger. Your housemates will see this when you split expenses.
          </p>
        </div>

        <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>
          {/* Avatar preview */}
          <section className="space-y-6">
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-lg font-bold text-on-surface">Your Avatar</span>
              <span className="font-label text-xs text-on-surface-variant opacity-60">(Initials auto-generated)</span>
            </div>
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-primary-fixed flex items-center justify-center ring-4 ring-primary/10">
                  <span className="text-4xl font-black text-primary">
                    {preferredName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'RL'}
                  </span>
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-10 h-10 signature-gradient rounded-full flex items-center justify-center text-on-primary shadow-lg ring-4 ring-background transition-transform active:scale-90"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                </button>
              </div>
            </div>
          </section>

          {/* Display name */}
          <section className="space-y-4">
            <h3 className="font-headline text-lg font-bold text-on-surface">Display Name</h3>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="displayName">
                What should your housemates call you?
              </label>
              <input
                id="displayName"
                type="text"
                placeholder="e.g. Alex"
                className="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant font-medium transition-all"
                {...register('displayName', { required: 'Display name is required' })}
              />
              {errors.displayName && <p className="text-error text-xs">{errors.displayName.message}</p>}
            </div>
          </section>

          {/* Bio */}
          <section className="space-y-4">
            <h3 className="font-headline text-lg font-bold text-on-surface">Short Bio <span className="text-outline font-normal text-sm">(optional)</span></h3>
            <textarea
              rows={3}
              placeholder="e.g. Morning person, loves cooking, pays on time ðŸ™Œ"
              className="w-full bg-surface-container-low border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline-variant font-medium transition-all resize-none"
              {...register('bio')}
            />
          </section>

          {/* Notifications prefs */}
          <section className="space-y-4">
            <h3 className="font-headline text-lg font-bold text-on-surface">Notifications</h3>
            {[
              { id: 'notifyExpense', label: 'New expenses added',   sub: 'Get notified when a housemate adds an expense' },
              { id: 'notifyTask',    label: 'Chore reminders',      sub: 'Be reminded when tasks are assigned or due'    },
              { id: 'notifySettle',  label: 'Payment reminders',    sub: 'Alerts when someone settles a debt'            },
            ].map(({ id, label, sub }) => (
              <div key={id} className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
                <div>
                  <p className="font-semibold text-on-surface">{label}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{sub}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked {...register(id)} />
                  <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </label>
              </div>
            ))}
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 signature-gradient text-on-primary font-headline font-bold text-lg rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save & Continue â†’'}
          </button>
        </form>
      </main>
    </div>
  )
}

