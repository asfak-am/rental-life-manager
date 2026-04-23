import { useNavigate } from 'react-router-dom'
import { useHouse } from '../context/HouseContext'

export default function OnboardingSuccess() {
  const navigate = useNavigate()
  const { house, members } = useHouse()

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient with blur */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-fixed/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-secondary-fixed/20 rounded-full blur-[100px] -z-10" />

      <header className="bg-slate-50/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-slate-900 font-headline tracking-tight">Rental Life</span>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-72px)] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Background */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-48 -left-24 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-xl w-full z-10 text-center">
          {/* Icon */}
          <div className="mb-12 relative inline-block">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl signature-gradient flex items-center justify-center mx-auto glass-halo shadow-2xl rotate-3 transform transition-transform hover:rotate-0 duration-500">
              <span className="material-symbols-outlined text-white text-6xl md:text-7xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary-fixed shadow-lg rounded-full flex items-center justify-center rotate-12">
              <span className="material-symbols-outlined text-on-secondary-fixed">celebration</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-headline font-extrabold text-on-surface tracking-tighter mb-4 leading-none">
            You're all set!
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl font-body mb-12 max-w-md mx-auto">
            Your new shared living experience starts now. Welcome home.
          </p>

          {/* House card */}
          <div className="bg-surface-container-low rounded-3xl p-1 mb-12">
            <div className="bg-surface-container-lowest rounded-[1.25rem] p-8 md:p-10 text-left relative overflow-hidden shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-primary">Active Household</span>
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface tracking-tight">
                  {house?.name || 'Your House'}
                </h2>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {members.slice(0, 3).map((m, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary">
                      {m.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  ))}
                  {members.length > 3 && (
                    <div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant">
                      +{members.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm font-body text-on-surface-variant font-medium">
                  {members.length} member{members.length !== 1 ? 's' : ''} active
                </span>
              </div>

              <div className="mt-8 pt-8 border-t border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                  <span className="text-sm font-body font-semibold text-on-surface">
                    Code: <span className="font-mono tracking-widest">{house?.inviteCode || '----'}</span>
                  </span>
                </div>
                <div className="px-3 py-1 bg-secondary-container/30 text-on-secondary-container rounded-full text-[11px] font-bold uppercase tracking-wider">
                  Primary Home
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/')}
            className="w-full md:w-auto md:min-w-[280px] inline-flex items-center justify-center gap-3 px-10 py-5 font-headline font-bold text-white transition-all duration-300 signature-gradient rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/30"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            Go to Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}