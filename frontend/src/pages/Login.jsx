import { useEffect, useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'
import { houseService } from '../services'

function LoginForm({ variant, onSubmit, handleGoogleLogin, loading, googleLoading, defaultEmail }) {
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: defaultEmail },
  })

  useEffect(() => {
    if (defaultEmail) setValue('email', defaultEmail)
  }, [defaultEmail, setValue])

  const desktop = variant === 'desktop'

  return (
    <form className={desktop ? 'space-y-5 mt-8' : 'space-y-6'} onSubmit={handleSubmit(onSubmit)}>
      <div className={desktop ? 'space-y-1.5' : 'space-y-1.5'}>
        <label className={`block text-xs font-semibold uppercase tracking-widest ${desktop ? 'text-on-surface-variant ml-1' : 'text-on-surface-variant ml-1'}`} htmlFor={`email-${variant}`}>
          Email Address
        </label>
        <input
          id={`email-${variant}`}
          type="email"
          placeholder={desktop ? 'name@example.com' : 'name@example.com'}
          autoComplete="email"
          className={desktop
            ? 'w-full h-14 px-4 bg-surface-container-high border-0 rounded-lg focus:ring-0 focus:outline-none border-b-2 border-transparent focus:border-primary transition-all duration-200 placeholder:text-outline/60 text-on-surface font-medium'
            : 'w-full h-14 px-4 bg-surface-container-high border-none rounded-lg focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-outline/60 text-on-surface font-medium'
          }
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div className={desktop ? 'space-y-1.5' : 'space-y-1.5'}>
        <div className={`flex justify-between items-center px-1`}>
          <label className={`block text-xs font-semibold uppercase tracking-widest ${desktop ? 'text-on-surface-variant' : 'text-on-surface-variant'}`} htmlFor={`password-${variant}`}>
            Password
          </label>
          <Link to="/forgot-password" className="text-[11px] font-bold text-primary hover:text-primary-container transition-colors">
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <input
            id={`password-${variant}`}
            type={showPass ? 'text' : 'password'}
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            autoComplete="current-password"
            className={desktop
              ? 'w-full h-14 px-4 bg-surface-container-high border-0 rounded-lg focus:ring-0 focus:outline-none border-b-2 border-transparent focus:border-primary transition-all duration-200 placeholder:text-outline/60 text-on-surface font-medium'
              : 'w-full h-14 px-4 bg-surface-container-high border-none rounded-lg focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-outline/60 text-on-surface font-medium'
            }
            {...register('password', { required: 'Password is required' })}
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-xl">{showPass ? 'visibility_off' : 'visibility'}</span>
          </button>
        </div>
        {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
      </div>

      {desktop ? (
        <div className="pt-2 space-y-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 signature-gradient text-on-primary font-headline font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center glass-halo disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
          </button>
        </div>
      ) : (
        <div className="pt-4 space-y-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 signature-gradient text-on-primary font-headline font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center glass-halo disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <div className="relative py-4 flex items-center">
            <div className="flex-grow border-t border-outline-variant/30" />
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-[0.2em] text-outline">Or continue with</span>
            <div className="flex-grow border-t border-outline-variant/30" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full h-14 bg-surface-container-low border border-outline-variant/20 text-on-surface font-semibold rounded-lg hover:bg-surface-container-high transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>
        </div>
      )}
    </form>
  )
}

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const { setHouse, setMembers } = useHouse()
  const navigate  = useNavigate()
  const [params] = useSearchParams()
  const [loading, setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const inviteCode = params.get('inviteCode') || ''
  const defaultEmail = params.get('email') || ''
  const getFirstName = (u) => (u?.displayName || u?.name || 'there').split(' ')[0]

  const completeInvite = async () => {
    if (!inviteCode) return
    const res = await houseService.join(inviteCode)
    setHouse(res.data.house)
    setMembers(res.data.members)
  }

  const googleSignIn = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      try {
        const user = await loginWithGoogle(tokenResponse.access_token)
        if (inviteCode) await completeInvite()
        toast.success(`Welcome, ${getFirstName(user)}!`)
        navigate('/')
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google sign-in failed')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => toast.error('Google sign-in cancelled or failed'),
  })

  const handleGoogleLogin = () => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      toast.error('Google login is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend env.')
      return
    }
    googleSignIn()
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await login(data.email, data.password)
      if (inviteCode) await completeInvite()
      toast.success(`Welcome back, ${getFirstName(user)}!`)
      navigate(user.houseId || inviteCode ? '/' : '/onboarding/step1')
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        const email = err.response?.data?.email || data.email
        toast.error('Verify your email first')
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`)
        return
      }
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface app-light-gradient font-body text-on-surface min-h-screen">
        <main className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
          {/* Background blobs */}
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-fixed/20 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-secondary-fixed/20 rounded-full blur-[100px] -z-10" />

          {/* Brand */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center p-3 mb-6 bg-surface-container-highest rounded-xl text-primary">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
            </div>
            <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">Rental Life</h1>
            <p className="text-on-surface-variant font-medium mt-2">The Architectural Ledger for Modern Living</p>
          </div>

          {/* Card */}
          <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl p-8 md:p-10 border border-outline-variant/15 shadow-[0_24px_48px_-12px_rgba(26,28,29,0.04)]">
            <header className="mb-8">
              <h2 className="font-headline font-bold text-2xl tracking-tight mb-2">Welcome Back</h2>
              <p className="text-on-surface-variant text-sm">Manage your properties and shared expenses with precision.</p>
            </header>

            <LoginForm
              variant="mobile"
              onSubmit={onSubmit}
              handleGoogleLogin={handleGoogleLogin}
              loading={loading}
              googleLoading={googleLoading}
              defaultEmail={defaultEmail}
            />

            <footer className="mt-10 pt-8 border-t border-outline-variant/15 text-center">
              <p className="text-sm text-on-surface-variant">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary font-bold hover:underline decoration-2 underline-offset-4">
                  Create an account
                </Link>
              </p>
            </footer>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-col md:flex-row items-center gap-8 md:gap-16 opacity-60">
            
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl">history_edu</span>
              <span className="text-xs font-bold uppercase tracking-widest">Editorial Accuracy</span>
            </div>
          </div>
        </main>
    </div>
  )
}

