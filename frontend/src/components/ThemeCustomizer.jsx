import { useState, useEffect } from 'react'

const COLORS = [
  { name: 'purple', value: '#6a5df6' },
  { name: 'teal', value: '#1ba0a8' },
  { name: 'orange', value: '#ff9f43' },
  { name: 'pink', value: '#e64980' },
  { name: 'blue', value: '#0066ff' },
]

const MODES = [
  { name: 'light', label: 'Light', icon: 'light_mode' },
  { name: 'dark', label: 'Dark', icon: 'dark_mode' },
  { name: 'system', label: 'System', icon: 'desktop_windows' },
]

const SKINS = [
  { name: 'default', label: 'Default' },
  { name: 'bordered', label: 'Bordered' },
]

const LAYOUTS = [
  { name: 'vertical', label: 'Vertical' },
  { name: 'collapsed', label: 'Collapsed' },
  { name: 'horizontal', label: 'Horizontal' },
]

const CONTENTS = [
  { name: 'compact', label: 'Compact' },
  { name: 'wide', label: 'Wide' },
]

export default function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState({
    primaryColor: '#6a5df6',
    mode: 'light',
    skin: 'default',
    layout: 'vertical',
    content: 'compact',
    semiDark: false,
  })

  useEffect(() => {
    const saved = localStorage.getItem('app-theme')
    if (saved) {
      const savedTheme = JSON.parse(saved)
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      // Check system preference on first load
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const defaultTheme = {
        ...theme,
        mode: prefersDark ? 'dark' : 'light'
      }
      setTheme(defaultTheme)
      applyTheme(defaultTheme)
    }
  }, [])

  const applyTheme = (newTheme) => {
    const html = document.documentElement
    const root = document.documentElement

    // Apply primary color
    root.style.setProperty('--primary-color', newTheme.primaryColor)
    
    // Parse hex color and create RGB for opacity usage
    const hex = newTheme.primaryColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`)

    // Apply dark mode
    if (newTheme.mode === 'dark') {
      html.classList.add('dark')
    } else if (newTheme.mode === 'light') {
      html.classList.remove('dark')
    } else if (newTheme.mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    }

    // Apply skin
    html.classList.remove('skin-bordered', 'skin-default')
    html.classList.add(`skin-${newTheme.skin}`)

    // Apply layout
    html.classList.remove('layout-vertical', 'layout-collapsed', 'layout-horizontal')
    html.classList.add(`layout-${newTheme.layout}`)

    // Apply content width
    html.classList.remove('content-compact', 'content-wide')
    html.classList.add(`content-${newTheme.content}`)

    // Apply semi-dark
    if (newTheme.semiDark) {
      html.classList.add('semi-dark')
    } else {
      html.classList.remove('semi-dark')
    }

    // Save to localStorage
    localStorage.setItem('app-theme', JSON.stringify(newTheme))
  }

  const updateTheme = (key, value) => {
    const newTheme = { ...theme, [key]: value }
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  const resetTheme = () => {
    localStorage.removeItem('app-theme')
    const defaultTheme = {
      primaryColor: '#6a5df6',
      mode: 'light',
      skin: 'default',
      layout: 'vertical',
      content: 'compact',
      semiDark: false,
    }
    setTheme(defaultTheme)
    applyTheme(defaultTheme)
    setIsOpen(false)
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 right-0 md:right-3 z-40 w-11 h-11 rounded-l-lg rounded-tr-none rounded-br-none text-white shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center transition-all duration-300 active:scale-95"
        style={{ backgroundColor: theme.primaryColor }}
        title="Theme Customizer"
      >
        <span className="material-symbols-outlined text-xl">settings</span>
        {isOpen && <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white dark:bg-slate-900 w-full md:w-96 h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto m-0 md:m-8">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Theme Customizer</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Customize & Preview in Real Time</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetTheme}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
                  title="Reset theme"
                >
                  <span className="material-symbols-outlined">refresh</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
                  title="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Primary Color */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Primary Color</h3>
                <div className="flex gap-3 flex-wrap">
                  {COLORS.map(color => (
                    <button
                      key={color.name}
                      onClick={() => updateTheme('primaryColor', color.value)}
                      className={`w-12 h-12 rounded-lg transition-all transform hover:scale-110 ${
                        theme.primaryColor === color.value
                          ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-900 scale-110'
                          : 'hover:shadow-lg'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                  <label
                    className="relative w-12 h-12 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer overflow-hidden"
                    title="Pick custom color"
                  >
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => updateTheme('primaryColor', e.target.value)}
                      aria-label="Pick custom color"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 pointer-events-none">colorize</span>
                  </label>
                </div>
              </div>

              {/* Mode */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Mode</h3>
                <div className="grid grid-cols-3 gap-3">
                  {MODES.map(mode => (
                    <button
                      key={mode.name}
                      onClick={() => updateTheme('mode', mode.name)}
                      className={`p-4 rounded-2xl border-2 transition flex flex-col items-center gap-2 ${
                        theme.mode === mode.name
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-3xl">{mode.icon}</span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              
            </div>
          </div>
        </div>
      )}
    </>
  )
}
