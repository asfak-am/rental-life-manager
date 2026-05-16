export default function InviteCodeCard({
    code = '',
    qrSrc = '',
    onCopy,
    onRefresh,
    refreshing = false,
    showRefresh = true,
    copyLabel = 'Copy Code',
    refreshLabel = 'Refresh',
    title = 'INVITE CODE',
    className = '',
    codeClassName = '',
    qrWrapperClassName = '',
    buttonWrapClassName = '',
    copyButtonClassName = '',
    refreshButtonClassName = '',
    placeholderText = '----',
}) {
    const hasCode = Boolean(code)
    const hasQr = Boolean(qrSrc)

    return (
<section
  className={`rounded-[2rem] border border-purple-500/20 bg-[linear-gradient(65deg,rgba(168,85,247,0.22),rgba(192,132,252,0.16)_35%,rgba(255,255,255,0.9)_55%,rgba(139,92,246,0.2))] p-6 shadow-[0_18px_45px_-18px_rgba(88,28,135,0.3)] ${className}`.trim()}
>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{title}</p>
            <p className={`mt-3 text-center text-[clamp(1.5rem,2vw,2.4rem)] font-black tracking-[0.18em] text-primary break-words ${codeClassName}`.trim()}>
                {hasCode ? code : placeholderText}
            </p>

            <div className={`mt-6 flex justify-center ${qrWrapperClassName}`.trim()}>
                <div className="rounded-[1.75rem] bg-white/65 p-4 border border-white/70 shadow-[0_14px_30px_-18px_rgba(26,28,29,0.2)] backdrop-blur-sm">
                    <div className="rounded-[1.25rem] bg-white p-3 shadow-sm">
                        {hasQr ? (
                            <img
                                src={qrSrc}
                                alt="Invite QR code"
                                className="w-40 h-40 sm:w-44 sm:h-44"
                            />
                        ) : (
                            <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-[1rem] bg-slate-100" />
                        )}
                    </div>
                </div>
            </div>

            <div className={`mt-6 space-y-3 ${buttonWrapClassName}`.trim()}>
                <button
                    type="button"
                    onClick={onCopy}
                    disabled={!hasCode || !onCopy}
                    className={`w-full rounded-2xl px-4 py-3.5 text-base font-bold text-white signature-gradient disabled:opacity-60 disabled:cursor-not-allowed ${copyButtonClassName}`.trim()}
                >
                    {copyLabel}
                </button>

                {showRefresh ? (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={!onRefresh || refreshing}
                        className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed ${refreshButtonClassName}`.trim()}
                    >
                        {refreshing ? 'Refreshing...' : refreshLabel}
                    </button>
                ) : null}
            </div>
        </section>
    )
}
