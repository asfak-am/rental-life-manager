const DEFAULT_APP_URL = 'https://rental-life.vercel.app'

const trimTrailingSlash = (value = '') => String(value).trim().replace(/\/+$/, '')

const isLocalhostUrl = (value = '') => /^(https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(trimTrailingSlash(value))

export const getPublicAppUrl = () => {
  const envUrl = trimTrailingSlash(import.meta.env.VITE_APP_URL || import.meta.env.VITE_CLIENT_URL || '')
  if (envUrl && !isLocalhostUrl(envUrl)) return envUrl

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = trimTrailingSlash(window.location.origin)
    if (origin && !isLocalhostUrl(origin)) return origin
  }

  return DEFAULT_APP_URL
}

export const buildInviteLink = (inviteCode) => {
  const normalizedCode = String(inviteCode || '').trim().toUpperCase()
  if (!normalizedCode) return ''
  return `${getPublicAppUrl()}/invite/${encodeURIComponent(normalizedCode)}`
}

export const buildInviteQrSrc = (inviteLink) => {
  if (!inviteLink) return ''
  return `https://api.qrserver.com/v1/create-qr-code/?size=248x248&data=${encodeURIComponent(inviteLink)}`
}
