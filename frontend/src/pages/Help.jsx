import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopAppShell from '../components/desktop/DesktopAppShell'

export default function Help() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    toast.success('Thanks! Your message has been submitted.')
    reset()
    return data
  }

  const AboutSection = () => (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">About Rental Life</p>
        <h3 className="text-3xl font-black tracking-tight mt-2 text-slate-900">Shared living made simple</h3>
      </div>

      <p className="text-slate-600 leading-relaxed">
        Rental Life helps housemates manage expenses, balances, chores, and updates in one place.
        Use the dashboard for quick insights, track expenses transparently, and stay aligned through tasks and chat.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: 'receipt_long', title: 'Expense Tracking', body: 'Log shared costs and split instantly.' },
          { icon: 'balance', title: 'Balance Clarity', body: 'See who owes what in real time.' },
          { icon: 'task_alt', title: 'Task Coordination', body: 'Assign and complete chores together.' },
        ].map(card => (
          <article key={card.title} className="rounded-2xl bg-[#f7f8fb] p-4 border border-slate-200">
            <span className="material-symbols-outlined text-[#5f52f2]">{card.icon}</span>
            <h4 className="font-bold text-slate-900 mt-2">{card.title}</h4>
            <p className="text-sm text-slate-600 mt-1">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  )

  const ContactSection = () => (
    <section className="bg-white rounded-3xl border border-slate-200 p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Contact Us</p>
        <h3 className="text-3xl font-black tracking-tight mt-2 text-slate-900">Send a message</h3>
        <p className="text-slate-600 mt-2">Tell us what you need help with and we will get back to you.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Name</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-[#f7f8fb] px-4 py-3 text-slate-900 outline-none focus:border-[#bdb8ff]"
              placeholder="Your name"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name ? <p className="text-xs text-red-600 mt-1">{errors.name.message}</p> : null}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 bg-[#f7f8fb] px-4 py-3 text-slate-900 outline-none focus:border-[#bdb8ff]"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Enter a valid email address',
                },
              })}
            />
            {errors.email ? <p className="text-xs text-red-600 mt-1">{errors.email.message}</p> : null}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Subject</label>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 bg-[#f7f8fb] px-4 py-3 text-slate-900 outline-none focus:border-[#bdb8ff]"
            placeholder="How can we help?"
            {...register('subject', { required: 'Subject is required' })}
          />
          {errors.subject ? <p className="text-xs text-red-600 mt-1">{errors.subject.message}</p> : null}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Message</label>
          <textarea
            rows={5}
            className="w-full rounded-xl border border-slate-200 bg-[#f7f8fb] px-4 py-3 text-slate-900 outline-none focus:border-[#bdb8ff] resize-none"
            placeholder="Share details about your issue or question"
            {...register('message', {
              required: 'Message is required',
              minLength: { value: 10, message: 'Please add at least 10 characters' },
            })}
          />
          {errors.message ? <p className="text-xs text-red-600 mt-1">{errors.message.message}</p> : null}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500">For urgent issues, email support@rentallife.app</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl signature-gradient text-white font-semibold disabled:opacity-60"
          >
            {isSubmitting ? 'Sending...' : 'Submit'}
          </button>
        </div>
      </form>
    </section>
  )

  return (
    <>
      <div className="hidden lg:block">
        <DesktopAppShell
          title="Help"
          subtitle="About Rental Life and contact support."
          searchPlaceholder="Search help topics..."
        >
          <div className="space-y-6">
            <AboutSection />
            <ContactSection />
          </div>
        </DesktopAppShell>
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />

        <main className="max-w-screen-xl mx-auto px-6 pt-6 pb-32 space-y-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Help</h1>
            <p className="text-on-surface-variant mt-1">About Rental Life and contact support.</p>
          </div>

          <AboutSection />
          <ContactSection />
        </main>

        <BottomNav />
      </div>
    </>
  )
}


