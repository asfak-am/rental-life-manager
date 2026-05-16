export default function ExpenseDateRangeFilters({
  fromValue = '',
  toValue = '',
  onFromChange,
  onToChange,
  wrapperClassName = 'grid grid-cols-1 sm:grid-cols-2 gap-2',
  labelClassName = 'text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1',
  inputClassName = 'w-full bg-white rounded-xl px-3 py-2 text-sm border border-outline-variant/20',
  fromLabel = 'From',
  toLabel = 'To',
  fromAriaLabel = 'Filter from date',
  toAriaLabel = 'Filter to date',
}) {
  return (
    <div className={wrapperClassName}>
      <div>
        <p className={labelClassName}>{fromLabel}</p>
        <input
          type="date"
          value={fromValue}
          onChange={e => onFromChange?.(e.target.value)}
          className={inputClassName}
          aria-label={fromAriaLabel}
        />
      </div>
      <div>
        <p className={labelClassName}>{toLabel}</p>
        <input
          type="date"
          value={toValue}
          onChange={e => onToChange?.(e.target.value)}
          className={inputClassName}
          aria-label={toAriaLabel}
        />
      </div>
    </div>
  )
}
