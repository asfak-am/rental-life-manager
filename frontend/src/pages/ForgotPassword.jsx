import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { email: '' } })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('If this email exists, a reset code has been sent')
      navigate(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not request reset code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/15">
        <h1 className="text-2xl font-headline font-bold mb-2">Forgot Password</h1>
        <p className="text-sm text-on-surface-variant mb-6">Enter your email and we will send you a reset OTP.</p>

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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 signature-gradient text-on-primary font-bold rounded-lg disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <div className="mt-5 text-sm">
          <Link to="/login" className="text-primary font-bold">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
