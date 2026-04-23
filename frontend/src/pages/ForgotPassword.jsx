import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [sendingCode, setSendingCode] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [emailChecked, setEmailChecked] = useState(false)
  const [emailExists, setEmailExists] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const sendResetCode = async () => {
    const email = String(getValues('email') || '').trim()
    if (!email) {
      setError('email', { type: 'manual', message: 'Email is required' })
      return
    }

    clearErrors('email')
    setSendingCode(true)
    try {
      const res = await api.post('/auth/forgot-password', { email })
      const exists = Boolean(res.data?.exists)
      setEmailChecked(true)
      setEmailExists(exists)

      if (!exists) {
        toast.error('Email does not exist')
        return
      }

      toast.success('Reset OTP sent to your email')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset code')
    } finally {
      setSendingCode(false)
    }
  }

  const onSubmit = async (data) => {
    if (!emailExists) {
      toast.error('Check email first')
      return
    }

    if (data.newPassword !== data.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' })
      return
    }

    setResetting(true)
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
      setResetting(false)
    }
  }

  const newPassword = watch('newPassword')

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
    {/* Background gradient with blur */}
    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-fixed/20 rounded-full blur-[120px] -z-10" />
    <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-secondary-fixed/20 rounded-full blur-[100px] -z-10" />
     
    <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/15 relative z-10">
        <h1 className="text-2xl font-headline font-bold mb-2">Forgot Password</h1>
        <p className="text-sm text-on-surface-variant mb-6">Check your email first. If it exists, reset fields will appear below.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-surface-container-high rounded-lg px-4 py-3"
              {...register('email', {
                required: 'Email is required',
                onChange: () => {
                  setEmailChecked(false)
                  setEmailExists(false)
                },
              })}
            />
            {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
          </div>

          <button
            type="button"
            onClick={sendResetCode}
            disabled={sendingCode}
            className="w-full py-3 signature-gradient text-on-primary font-bold rounded-lg disabled:opacity-60"
          >
            {sendingCode ? 'Checking...' : 'Check Email & Send OTP'}
          </button>

          {emailChecked && !emailExists && (
            <p className="text-error text-sm">This email does not exist.</p>
          )}

          {emailExists && (
            <>
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Confirm Password</label>
                <input
                  type="password"
                  className="w-full bg-surface-container-high rounded-lg px-4 py-3"
                  {...register('confirmPassword', {
                    required: 'Confirm password is required',
                    validate: (value) => value === newPassword || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && <p className="text-error text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={resetting}
                className="w-full py-3 signature-gradient text-on-primary font-bold rounded-lg disabled:opacity-60"
              >
                {resetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </>
          )}
        </form>

        <div className="mt-5 text-sm">
          <Link to="/login" className="text-primary font-bold">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
