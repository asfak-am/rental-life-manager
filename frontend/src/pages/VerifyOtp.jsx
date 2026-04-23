import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function VerifyOtp() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const emailFromUrl = useMemo(() => params.get('email') || '', [params])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const { establishSession } = useAuth()

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { email: emailFromUrl, otp: '' },
  })

  const email = watch('email')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/verify-otp', { email: data.email, otp: data.otp })
      establishSession(res.data?.token, res.data?.user)
      toast.success('Email verified successfully')
      navigate(res.data?.user?.houseId ? '/' : '/onboarding/step1')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    if (!email) return toast.error('Please enter your email first')
    setResending(true)
    try {
      await api.post('/auth/resend-otp', { email })
      toast.success('A new OTP has been sent')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-surface app-light-gradient font-body text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
     {/* Background gradient with blur */}
     <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-fixed/20 rounded-full blur-[120px] -z-10" />
     <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-secondary-fixed/20 rounded-full blur-[100px] -z-10" />

     <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/15 relative z-10">
        <h1 className="text-2xl font-headline font-bold mb-2">Verify Email</h1>
        <p className="text-sm text-on-surface-variant mb-6">Enter the 6-digit OTP sent to your email.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-surface-container-high rounded-lg px-4 py-3"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="w-full bg-surface-container-high rounded-lg px-4 py-3 font-mono tracking-[0.35em]"
              {...register('otp', { required: 'OTP is required', minLength: { value: 6, message: 'Enter 6 digits' } })}
            />
            {errors.otp && <p className="text-error text-xs mt-1">{errors.otp.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 signature-gradient text-on-primary font-bold rounded-lg disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <button onClick={resendOtp} disabled={resending} className="text-primary font-bold disabled:opacity-60">
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
          <Link to="/login" className="text-on-surface-variant">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}


