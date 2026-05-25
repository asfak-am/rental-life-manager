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
            className={`invite-code-card rounded-[1.5rem] border border-[rgba(var(--primary-rgb),0.16)] p-4 shadow-[0_16px_36px_-24px_rgba(17,24,39,0.28)] backdrop-blur-xl ${className}`.trim()}
            style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.12)' }}
        >
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">{title}</p>
            <p className={`mt-2.5 text-center text-[clamp(1.9rem,1.8vw,2rem)] font-black tracking-[0.18em] text-primary break-words ${codeClassName}`.trim()}>
                {hasCode ? code : placeholderText}
            </p>

            <div className={`mt-4 flex justify-center ${qrWrapperClassName}`.trim()}>
                <div className="invite-code-shell rounded-[1.25rem] p-3 border border-[rgba(var(--primary-rgb),0.16)] shadow-[0_14px_28px_-20px_rgba(26,28,29,0.2)] backdrop-blur-sm">
                    <div className="rounded-[1rem] bg-surface-container-lowest p-2.5 shadow-sm border border-outline-variant/10">
                        {hasQr ? (
                            <img
                                src={qrSrc}
                                alt="Invite QR code"
                                className="w-32 h-32 sm:w-36 sm:h-36"
                            />
                        ) : (
                            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[0.85rem] bg-surface-container-high" />
                        )}
                    </div>
                </div>
            </div>

            <div className={`mt-4 space-y-2.5 ${buttonWrapClassName}`.trim()}>
                <button
                    type="button"
                    onClick={onCopy}
                    disabled={!hasCode || !onCopy}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-bold text-on-primary shadow-[0_12px_26px_-14px_rgba(var(--primary-rgb),0.55)] disabled:opacity-60 disabled:cursor-not-allowed ${copyButtonClassName}`.trim()}
                    style={{ backgroundColor: 'rgb(var(--primary-rgb))' }}
                >
                    {copyLabel}
                </button>

                {showRefresh ? (
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={!onRefresh || refreshing}
                        className={`w-full rounded-2xl border border-[rgba(var(--primary-rgb),0.22)] bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary transition hover:bg-[rgba(var(--primary-rgb),0.08)] disabled:opacity-60 disabled:cursor-not-allowed ${refreshButtonClassName}`.trim()}
                    >
                        {refreshing ? 'Refreshing...' : refreshLabel}
                    </button>
                ) : null}
            </div>
        </section>
    )
}
