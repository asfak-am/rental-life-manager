import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { houseService } from '../services'
import { useHouse } from '../context/HouseContext'

export default function OnboardingStep1() {
  const navigate = useNavigate()
  const { setHouse, setMembers } = useHouse()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const createHouse = async () => {
    setLoading(true)
    try {
      const res = await houseService.create({ name: 'My House' })
      setHouse(res.data.house)
      setMembers(res.data.members)
      toast.success('House created!')
      navigate('/onboarding/step2')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create house')
    } finally {
      setLoading(false)
    }
  }

  const joinHouse = async () => {
    if (!inviteCode.trim()) return toast.error('Enter an invite code')
    setLoading(true)
    try {
      const res = await houseService.join(inviteCode.trim())
      setHouse(res.data.house)
      setMembers(res.data.members)
      toast.success(`Joined ${res.data.house.name}!`)
      navigate('/onboarding/step2')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col">
      <header className="w-full max-w-screen-xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="text-xl font-black text-on-surface tracking-tight font-headline">Rental Life</div>
        <div className="flex items-center gap-4">
          <span className="text-on-surface-variant font-label text-sm">Need help?</span>
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high transition-all duration-200 active:scale-95">
            <span className="material-symbols-outlined text-on-surface-variant">help</span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start pt-12 px-6">
        {/* Step dots */}
        <div className="flex gap-2 mb-12">
          <div className="h-1.5 w-10 bg-primary rounded-full" />
          <div className="h-1.5 w-6 bg-surface-container-highest rounded-full" />
          <div className="h-1.5 w-6 bg-surface-container-highest rounded-full" />
        </div>

        <div className="max-w-2xl w-full text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">Let's set up your space</h1>
          <p className="text-on-surface-variant text-lg max-w-md mx-auto">Choose how you want to start managing your shared living experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Create */}
          <button
            onClick={createHouse}
            disabled={loading}
            className="group relative flex flex-col items-start text-left p-8 rounded-xl bg-surface-container-lowest transition-all duration-300 hover:bg-white hover:scale-[1.02] border border-transparent hover:border-outline-variant/20 shadow-sm disabled:opacity-60"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center mb-10 group-hover:bg-primary transition-colors duration-300">
              <span className="material-symbols-outlined text-on-primary-fixed-variant group-hover:text-on-primary text-3xl">add_home</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-on-surface mb-2 font-headline">Create New House</h3>
              <p className="text-on-surface-variant mb-8 leading-relaxed">Start a fresh ledger, invite roommates, and set up your shared expense rules.</p>
            </div>
            <div className="mt-auto flex items-center font-bold text-primary gap-2 uppercase text-xs tracking-widest">
              <span>Get Started</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </button>

          {/* Join */}
          <div className="group flex flex-col p-8 rounded-xl bg-surface-container-low transition-all duration-300 hover:bg-surface-container-high border border-transparent">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center mb-10">
              <span className="material-symbols-outlined text-on-secondary-container text-3xl">group_add</span>
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-on-surface mb-2 font-headline">Join with Code</h3>
              <p className="text-on-surface-variant mb-6 leading-relaxed">Entering an existing household? Use the invitation code sent by your roommate.</p>
            </div>
            <div className="relative w-full mb-4">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2 px-1">Invite Code</label>
              <input
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-lg p-4 text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary transition-all duration-200 font-mono tracking-widest"
                placeholder="e.g. RNTL-8821"
              />
            </div>
            <button
              onClick={joinHouse}
              disabled={loading}
              className="w-full py-4 signature-gradient text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60"
            >
              Verify Code
            </button>
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-20 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-t border-outline-variant/10 pt-12 opacity-80">
          <div className="flex items-center gap-4">
            <p className="text-xs text-on-surface-variant italic leading-snug">"Managing our flat expenses used to be a nightmare until we started using this."</p>
          </div>
          <div className="md:col-span-2 flex justify-end gap-12">
            {[['12k+', 'Active Households'], ['$4.2M', 'Shared Monthly'], ['4.9/5', 'App Store Rating']].map(([val, lbl]) => (
              <div key={lbl} className="text-center">
                <div className="text-2xl font-bold font-headline">{val}</div>
                <div className="text-[10px] uppercase tracking-tighter text-on-surface-variant font-bold">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="w-full py-12 flex flex-col items-center gap-4 text-outline text-sm">
        <p>© 2024 Rental Life Architectural Ledger</p>
      </footer>
    </div>
  )
}