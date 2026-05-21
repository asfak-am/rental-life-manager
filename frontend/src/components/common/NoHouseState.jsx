import { useNavigate } from 'react-router-dom'
import TopBar from '../navigation/TopBar'
import BottomNav from '../navigation/BottomNav'
import DesktopAppShell from '../../layouts/desktop/DesktopAppShell'

export default function NoHouseState({
  title = 'No Home Connected',
  description = 'You are currently not part of a home. Connect to an existing home with an invite code or create a new one to continue.',
  desktopPageTitle,
  desktopSubtitle = 'You are not connected to a home yet',
  primaryActionLabel = 'Connect To A Home',
  secondaryActionLabel = 'Open Settings',
  primaryActionPath = '/onboarding/step1',
  secondaryActionPath = '/settings',
  onPrimaryAction,
  onSecondaryAction,
}) {
  const navigate = useNavigate()
  const handlePrimaryAction = () => {
    if (onPrimaryAction) return onPrimaryAction()
    navigate(primaryActionPath)
  }

  const handleSecondaryAction = () => {
    if (onSecondaryAction) return onSecondaryAction()
    navigate(secondaryActionPath)
  }

  const content = (
    <section className="w-full max-w-xl bg-surface-container-lowest rounded-2xl p-8 md:p-10 border border-outline-variant/15 shadow-[0_24px_48px_-12px_rgba(26,28,29,0.04)] text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-fixed/20 text-primary mb-5 mx-auto">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>home_work</span>
      </div>

      <h1 className="font-headline font-extrabold text-3xl tracking-tight">{title}</h1>
      <p className="text-on-surface-variant text-sm md:text-base mt-3 leading-relaxed">{description}</p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
        <button
          type="button"
          onClick={handlePrimaryAction}
          className="signature-gradient px-6 py-3.5 rounded-xl text-on-primary font-bold"
        >
          {primaryActionLabel}
        </button>
        <button
          type="button"
          onClick={handleSecondaryAction}
          className="px-6 py-3.5 rounded-xl bg-surface-container-high text-on-surface font-semibold border border-outline-variant/20"
        >
          {secondaryActionLabel}
        </button>
      </div>
    </section>
  )

  return (
    <>
      <div className="hidden lg:block">
        <DesktopAppShell
          title={desktopPageTitle || title}
          subtitle={desktopSubtitle}
          searchPlaceholder="Search..."
        >
          <section className="max-w-2xl mx-auto mt-8 bg-white rounded-3xl p-10 border border-slate-200 shadow-xl shadow-slate-200/60 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-fixed/20 text-primary mb-5 mx-auto">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>home_work</span>
            </div>

            <h1 className="font-headline font-extrabold text-3xl tracking-tight">{title}</h1>
            <p className="text-slate-500 text-sm md:text-base mt-3 leading-relaxed">{description}</p>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="signature-gradient px-6 py-3.5 rounded-xl text-on-primary font-bold"
              >
                {primaryActionLabel}
              </button>
              <button
                type="button"
                onClick={handleSecondaryAction}
                className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200"
              >
                {secondaryActionLabel}
              </button>
            </div>
          </section>
        </DesktopAppShell>
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-28">
        <TopBar />
        <main className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-fixed/20 rounded-full blur-[120px] -z-10" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-secondary-fixed/20 rounded-full blur-[100px] -z-10" />
          {content}
        </main>
        <BottomNav />
      </div>
    </>
  )
}