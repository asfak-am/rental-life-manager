import { useId } from 'react'
import { AreaChart, Area, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const DEFAULT_RANGE_OPTIONS = [
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '12M', label: '12M' },
  { value: 'ALL', label: 'All' },
]

export default function UtilityChart({
  data = [],
  range = '6M',
  onRangeChange,
  currency = 'LKR',
  title = 'Water vs Electricity',
  subtitle = 'Tap a range to filter the chart.',
  emptyMessage = 'Add water and electricity expenses to see monthly variation.',
  rangeOptions = DEFAULT_RANGE_OPTIONS,
  sectionClassName = '',
  headerClassName = '',
  labelClassName = '',
  titleClassName = '',
  subtitleClassName = '',
  rangeWrapClassName = '',
  activeRangeButtonClassName = '',
  inactiveRangeButtonClassName = '',
  chartWrapClassName = 'h-[240px] min-w-0',
  emptyStateClassName = '',
  waterColor = 'rgb(20,184,166)',
  electricityColor = 'rgb(139,92,246)',
  electricityFillColor = 'rgba(139,92,246,0.72)',
  waterFillOpacityStart = 0.35,
  waterFillOpacityEnd = 0.06,
  electricityFillOpacityStart = 0.35,
  electricityFillOpacityEnd = 0.05,
  xAxisTickColor = '#787586',
}) {
  const id = useId().replace(/:/g, '')
  const waterFillId = `waterFill-${id}`
  const electricFillId = `electricFill-${id}`

  const buttonActiveClass =
    activeRangeButtonClassName ||
    'bg-primary text-on-primary shadow-md shadow-primary/20'
  const buttonInactiveClass =
    inactiveRangeButtonClassName ||
    'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'

  return (
    <section className={sectionClassName}>
      <div className={`flex items-start justify-between gap-4 flex-wrap mb-4 ${headerClassName}`.trim()}>
        <div>
          <span className={`text-on-surface-variant text-sm font-semibold uppercase tracking-widest ${labelClassName}`.trim()}>
            Utility Trend
          </span>
          <h2 className={`text-2xl font-extrabold mt-2 tracking-tight text-on-surface ${titleClassName}`.trim()}>{title}</h2>
          <p className={`text-sm text-on-surface-variant mt-1 ${subtitleClassName}`.trim()}>{subtitle}</p>
        </div>

        <div className={`inline-flex flex-wrap gap-2 rounded-2xl bg-surface-container-high/80 p-1.5 border border-outline-variant/20 backdrop-blur-sm ${rangeWrapClassName}`.trim()}>
          {rangeOptions.map((option) => {
            const active = range === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onRangeChange?.(option.value)}
                className={`min-w-[3.5rem] px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${active ? buttonActiveClass : buttonInactiveClass}`}
                aria-pressed={active}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={chartWrapClassName}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={waterFillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={waterColor} stopOpacity={waterFillOpacityStart} />
                  <stop offset="95%" stopColor={waterColor} stopOpacity={waterFillOpacityEnd} />
                </linearGradient>
                <linearGradient id={electricFillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={electricityFillColor} stopOpacity={electricityFillOpacityStart} />
                  <stop offset="95%" stopColor={electricityFillColor} stopOpacity={electricityFillOpacityEnd} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: xAxisTickColor }} />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [`${currency} ${Number(value || 0).toLocaleString('en-LK')}`, 'Amount']}
                contentStyle={{ borderRadius: '12px', border: 'none', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Legend />
              <Area type="monotone" dataKey="water" name="Water Bill" stroke={waterColor} fill={`url(#${waterFillId})`} strokeWidth={3} />
              <Area type="monotone" dataKey="electricity" name="Electricity Bill" stroke={electricityColor} fill={`url(#${electricFillId})`} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className={`h-full grid place-items-center rounded-2xl bg-surface-container-low text-sm text-on-surface-variant ${emptyStateClassName}`.trim()}>
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  )
}
