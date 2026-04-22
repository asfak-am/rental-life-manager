const CURRENCY_MAP = {
  LKR: { code: 'LKR', locale: 'en-LK' },
  INR: { code: 'INR', locale: 'en-IN' },
  USD: { code: 'USD', locale: 'en-US' },
  EUR: { code: 'EUR', locale: 'en-IE' },
  GBP: { code: 'GBP', locale: 'en-GB' },
}

export const CURRENCY_OPTIONS = Object.keys(CURRENCY_MAP)

export const normalizeCurrency = (currency) => {
  const key = String(currency || '').toUpperCase()
  return CURRENCY_MAP[key] ? key : 'LKR'
}

export const formatCurrency = (amount, currency = 'LKR') => {
  const key = normalizeCurrency(currency)
  const { code, locale } = CURRENCY_MAP[key]
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))
}
