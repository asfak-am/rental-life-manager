import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { houseService } from '../services'
import { useAuth } from '../context/AuthContext'
import { useHouse } from '../context/HouseContext'

export default function InviteHouse() {
  const { code } = useParams()
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { setHouse, setMembers } = useHouse()
  const [attemptedAutoJoin, setAttemptedAutoJoin] = useState(false)

  const inviteCode = useMemo(() => String(code || '').trim().toUpperCase(), [code])

  const joinMutation = useMutation({
    mutationFn: () => houseService.join(inviteCode),
    onSuccess: (res) => {
      setHouse(res.data.house)
      setMembers(res.data.members)
      toast.success(`Joined ${res.data.house.name}`)
      navigate('/', { replace: true })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Unable to join house')
    },
  })

  useEffect(() => {
    if (loading || !user || !inviteCode || attemptedAutoJoin) return
    setAttemptedAutoJoin(true)
    joinMutation.mutate()
  }, [attemptedAutoJoin, joinMutation, loading, inviteCode, user])

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-[28px] border border-slate-200 shadow-xl shadow-slate-200/60 p-8 md:p-10 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-semibold">House Invitation</p>
        <h1 className="text-4xl font-black tracking-tight mt-3">Join with invite code</h1>
        <p className="text-slate-500 mt-3 max-w-md mx-auto">
          {email ? `This invitation was sent to ${email}.` : 'Your housemate sent you an invitation.'}
          {' '}
          If you already have an account, sign in and you will be added automatically.
        </p>

        <div className="mt-8 bg-[#f7f8fb] rounded-2xl p-5 border border-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Invite Code</p>
          <p className="text-3xl font-black tracking-widest text-[#5f52f2] mt-2">{inviteCode || '----'}</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            to={`/register?inviteCode=${encodeURIComponent(inviteCode)}${email ? `&email=${encodeURIComponent(email)}` : ''}`}
            className="signature-gradient text-white font-bold rounded-xl py-3.5"
          >
            Create account
          </Link>
          <Link
            to={`/login?inviteCode=${encodeURIComponent(inviteCode)}${email ? `&email=${encodeURIComponent(email)}` : ''}`}
            className="rounded-xl py-3.5 border border-slate-300 bg-white font-bold text-slate-700"
          >
            Sign in
          </Link>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          After you sign in or sign up, weâ€™ll continue the invitation and add you to the house.
        </p>
      </div>
    </div>
  )
}
