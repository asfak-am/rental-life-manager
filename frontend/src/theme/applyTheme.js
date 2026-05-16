const THEME_STORAGE_KEY = 'app-theme'

export const DEFAULT_THEME = {
  primaryColor: '#6a5df6',
  mode: 'light',
  skin: 'default',
  layout: 'vertical',
  content: 'compact',
  semiDark: false,
}

const DARK_CLASS = 'dark'
const SKIN_CLASSES = ['skin-bordered', 'skin-default']
const LAYOUT_CLASSES = ['layout-vertical', 'layout-collapsed', 'layout-horizontal']
const CONTENT_CLASSES = ['content-compact', 'content-wide']

const safeParseTheme = (savedTheme) => {
  try {
    return JSON.parse(savedTheme)
  } catch {
    return null
  }
}

const prefersDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export const getInitialTheme = () => {
  const savedTheme = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_STORAGE_KEY) : null
  const parsedTheme = savedTheme ? safeParseTheme(savedTheme) : null
  if (parsedTheme) return parsedTheme

  return {
    ...DEFAULT_THEME,
    mode: prefersDark() ? 'dark' : 'light',
  }
}

export const readSavedTheme = () => {
  if (typeof window === 'undefined') return null
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return savedTheme ? safeParseTheme(savedTheme) : null
}

export const persistTheme = (theme) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))
}

export const clearTheme = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(THEME_STORAGE_KEY)
}

export const applyTheme = (theme) => {
  if (typeof window === 'undefined') return

  const html = document.documentElement
  const root = document.documentElement
  const primaryColor = theme?.primaryColor || DEFAULT_THEME.primaryColor

  root.style.setProperty('--primary-color', primaryColor)

  const hex = primaryColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`)

  const resolvedMode = theme?.mode === 'system' ? (prefersDark() ? 'dark' : 'light') : theme?.mode || DEFAULT_THEME.mode
  html.classList.toggle(DARK_CLASS, resolvedMode === 'dark')

  html.classList.remove(...SKIN_CLASSES)
  html.classList.add(`skin-${theme?.skin || DEFAULT_THEME.skin}`)

  html.classList.remove(...LAYOUT_CLASSES)
  html.classList.add(`layout-${theme?.layout || DEFAULT_THEME.layout}`)

  html.classList.remove(...CONTENT_CLASSES)
  html.classList.add(`content-${theme?.content || DEFAULT_THEME.content}`)

  html.classList.toggle('semi-dark', Boolean(theme?.semiDark))
}
