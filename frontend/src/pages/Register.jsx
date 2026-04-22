import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

function RegisterForm({ variant, defaultEmail, defaultInviteCode, onSubmit, loading, registerUser, navigate }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: defaultEmail,
      inviteCode: defaultInviteCode,
    },
  })

  useEffect(() => {
    if (defaultInviteCode) setValue('inviteCode', defaultInviteCode)
    if (defaultEmail) setValue('email', defaultEmail)
  }, [defaultEmail, defaultInviteCode, setValue])

  const desktop = variant === 'desktop'

  return (
    <form className={desktop ? 'space-y-5 mt-8' : 'space-y-6'} onSubmit={handleSubmit(onSubmit)}>
      {desktop ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Alex Rivera"
                autoComplete="name"
                className="w-full bg-[#ebedf2] border-none rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-500"
                {...register('name', { required: 'Name is required' })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">House Code</label>
              <input
                id="inviteCode"
                type="text"
                placeholder="HSE-9982-LM"
                className="w-full bg-[#ebedf2] border-none rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-500"
                {...register('inviteCode')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="alex@example.com"
              autoComplete="email"
              className="w-full bg-[#ebedf2] border-none rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-500"
              {...register('email', { required: 'Email is required' })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full bg-[#ebedf2] border-none rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-500"
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            />
          </div>

          {errors.name && <p className="text-red-600 text-xs">{errors.name.message}</p>}
          {errors.email && <p className="text-red-600 text-xs">{errors.email.message}</p>}
          {errors.password && <p className="text-red-600 text-xs">{errors.password.message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="signature-gradient w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-200"
          >
            {loading ? 'Creating...' : 'Get Started'}
          </button>
        </>
      ) : (
        <>
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="name">Full Name</label>
            <input
              id="name" type="text" placeholder="Alex Rivera"
              autoComplete="name"
              className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-error text-xs">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
            <input
              id="email" type="email" placeholder="alex@example.com"
              autoComplete="email"
              className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-error text-xs">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="password">Password</label>
            <input
              id="password" type="password" placeholder="••••••••"
              autoComplete="new-password"
              className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            />
            {errors.password && <p className="text-error text-xs">{errors.password.message}</p>}
          </div>

          {/* Invite Code */}
          <div className="pt-2 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant ml-1" htmlFor="inviteCode">House Invite Code</label>
            <input
              id="inviteCode" type="text" placeholder="RL-XXXX-XXXX"
              className="w-full bg-surface-container-high border-none rounded-lg px-4 py-3 text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200 font-mono tracking-widest text-sm"
              {...register('inviteCode')}
            />
            <p className="text-[10px] text-on-surface-variant/60 mt-1.5 ml-1 italic">Optional: Leave blank if you're creating a new house.</p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="signature-gradient w-full py-4 rounded-lg text-on-primary font-headline font-bold text-base tracking-tight shadow-lg shadow-primary/10 active:scale-[0.98] transition-transform duration-200 disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate  = useNavigate()
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(false)

  const defaultInviteCode = params.get('inviteCode') || ''
  const defaultEmail = params.get('email') || ''

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await registerUser(data.name, data.email, data.password, data.inviteCode)
      if (response?.requiresVerification) {
        toast.success('OTP sent to your email')
        navigate(`/verify-otp?email=${encodeURIComponent(response.email)}`)
        return
      }

      toast.success('Account created!')
      navigate(response.user?.houseId ? '/' : '/onboarding/step1')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="hidden lg:flex min-h-screen bg-[#f2f4f8] items-center justify-center px-8 py-10">
        <section className="w-full max-w-[1220px] bg-white rounded-[28px] shadow-2xl shadow-slate-300/40 border border-slate-200 overflow-hidden grid grid-cols-2">
          <div className="relative min-h-[760px] bg-[url('https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-t from-[#5f52f2cc] via-transparent to-transparent" />
            <div className="absolute top-8 left-9 text-white">
              <h1 className="text-4xl font-black tracking-tight">Rental Life</h1>
            </div>
            <div className="absolute bottom-8 left-9 right-9 text-white">
              <h2 className="text-6xl leading-tight font-black tracking-tight">Elevate your property experience.</h2>
              <p className="mt-4 text-white/85 text-lg">Join a curated community of property managers and residents where every detail is managed with architectural precision.</p>
            </div>
          </div>

          <div className="px-10 py-9">
            <h2 className="text-5xl font-black tracking-tight">Create an account</h2>
            <p className="text-slate-500 mt-2">Fill in your details to start your journey with Rental Life Manager.</p>

            <RegisterForm
              variant="desktop"
              defaultEmail={defaultEmail}
              defaultInviteCode={defaultInviteCode}
              onSubmit={onSubmit}
              loading={loading}
              registerUser={registerUser}
              navigate={navigate}
            />

            <div className="mt-8 text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#5f52f2] font-bold">Sign in here</Link>
            </div>
          </div>
        </section>
      </div>

      <div className="lg:hidden bg-surface font-body text-on-surface min-h-screen flex flex-col">
        <main className="flex-grow flex items-center justify-center px-6 py-12 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] rounded-full bg-secondary/5 blur-[100px]" />

        <section className="w-full max-w-md z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 mb-6 bg-surface-container-highest rounded-xl text-primary">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
          </div>  
            <h1 className="font-headline font-black text-4xl tracking-tight text-on-surface mb-2">Rental Life</h1>
            <p className="font-body text-on-surface-variant text-sm tracking-wide">The Architectural Ledger for Modern Living</p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-8 md:p-10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.04)] border border-outline-variant/15">
            <div className="mb-8">
              <h2 className="font-headline font-bold text-2xl text-on-surface tracking-tight">Create Account</h2>
              <p className="font-body text-on-surface-variant text-sm mt-1">Start managing your shared space with precision.</p>
            </div>

            <RegisterForm
              variant="mobile"
              defaultEmail={defaultEmail}
              defaultInviteCode={defaultInviteCode}
              onSubmit={onSubmit}
              loading={loading}
              registerUser={registerUser}
              navigate={navigate}
            />

            <div className="mt-8 flex items-center justify-center space-x-2">
              <span className="text-xs text-on-surface-variant">Already part of a house?</span>
              <Link to="/login" className="text-xs font-bold text-primary hover:text-primary-container transition-colors">Sign In</Link>
            </div>
          </div>

          {/* Feature chips */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-4 rounded-lg text-center border border-outline-variant/10">
              <div className="flex justify-center mb-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              </div>
              <span className="block text-[10px] uppercase font-bold tracking-tighter text-on-surface-variant">Expense Tracking</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg text-center border border-outline-variant/10">
              <div className="flex justify-center mb-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
              </div>
              <span className="block text-[10px] uppercase font-bold tracking-tighter text-on-surface-variant">Chore Ledger</span>
            </div>
          </div>
        </section>
      </main>

        <footer className="py-8 px-6 text-center">
          <p className="text-[10px] text-outline uppercase tracking-[0.2em] font-medium">© Rental Life Manager • Modern Living Protocol</p>
        </footer>
      </div>
    </>
  )
}