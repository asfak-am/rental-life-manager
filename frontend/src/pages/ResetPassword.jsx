import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const emailFromUrl = useMemo(() => params.get('email') || '', [params])
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { email: emailFromUrl, otp: '', newPassword: '' },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      })
      toast.success('Password reset successful')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
     {/* Background gradient with blur */}
     <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-fixed/20 rounded-full blur-[120px] -z-10" />
     <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-secondary-fixed/20 rounded-full blur-[100px] -z-10" />

     <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/15 relative z-10">
        <h1 className="text-2xl font-headline font-bold mb-2">Reset Password</h1>
        <p className="text-sm text-on-surface-variant mb-6">Enter your email, reset OTP, and a new password.</p>

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
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Reset OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="w-full bg-surface-container-high rounded-lg px-4 py-3 font-mono tracking-[0.35em]"
              {...register('otp', { required: 'OTP is required', minLength: { value: 6, message: 'Enter 6 digits' } })}
            />
            {errors.otp && <p className="text-error text-xs mt-1">{errors.otp.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">New Password</label>
            <input
              type="password"
              className="w-full bg-surface-container-high rounded-lg px-4 py-3"
              {...register('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            />
            {errors.newPassword && <p className="text-error text-xs mt-1">{errors.newPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 signature-gradient text-on-primary font-bold rounded-lg disabled:opacity-60"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-5 text-sm flex items-center justify-between">
          <Link to="/forgot-password" className="text-primary font-bold">Resend Code</Link>
          <Link to="/login" className="text-on-surface-variant">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
