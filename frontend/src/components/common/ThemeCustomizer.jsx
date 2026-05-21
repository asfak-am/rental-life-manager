import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services'
import { applyTheme, clearTheme, DEFAULT_THEME, getInitialTheme, persistTheme } from '../../theme/applyTheme'
import { CURRENCY_OPTIONS, normalizeCurrency } from '../../utils/currency'

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

export default function ThemeCustomizer() {
	const { user, updateUser } = useAuth()
	const [isOpen, setIsOpen] = useState(false)
	const [theme, setTheme] = useState(() => getInitialTheme())
	const [currency, setCurrency] = useState(() => normalizeCurrency(user?.currency))
	const [savingCurrency, setSavingCurrency] = useState(false)

	useEffect(() => {
		applyTheme(theme)
	}, [theme])

	useEffect(() => {
		setCurrency(normalizeCurrency(user?.currency))
	}, [user?.currency])

	const updateTheme = (key, value) => {
		const newTheme = { ...theme, [key]: value }
		setTheme(newTheme)
		persistTheme(newTheme)
	}

	const resetTheme = () => {
		clearTheme()
		const defaultTheme = { ...DEFAULT_THEME }
		setTheme(defaultTheme)
		persistTheme(defaultTheme)
		setIsOpen(false)
	}

	const updateCurrency = async (nextCurrency) => {
		const normalizedCurrency = normalizeCurrency(nextCurrency)
		setCurrency(normalizedCurrency)
		if (!user || normalizeCurrency(user.currency) === normalizedCurrency) return

		setSavingCurrency(true)
		try {
			const res = await authService.updateProfile({ currency: normalizedCurrency })
			updateUser(res.data.user)
			toast.success('Preferred currency updated')
		} catch (err) {
			setCurrency(normalizeCurrency(user?.currency))
			toast.error(err.response?.data?.message || 'Failed to update currency')
		} finally {
			setSavingCurrency(false)
		}
	}

	return (
		<>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="fixed top-20 right-0 md:right-3 z-40 w-11 h-11 rounded-l-lg rounded-tr-none rounded-br-none text-white shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/25 hover:scale-105 flex items-center justify-center transition-all duration-300 active:scale-95"
				style={{ backgroundColor: theme.primaryColor }}
				title="Theme Customizer"
			>
				<span className="material-symbols-outlined text-xl">settings</span>
				{isOpen && <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />}
			</button>

			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-end">
					<div
						className="absolute inset-0 bg-black/30 backdrop-blur-sm"
						onClick={() => setIsOpen(false)}
					/>

					<div className="relative bg-white dark:bg-slate-900 w-full md:w-96 h-[90vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl overflow-y-auto m-0 md:m-8">
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

						<div className="p-6 space-y-8">
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

							<div>
								<h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Currency</h3>
								<div className="flex items-center gap-3">
									<select
										value={currency}
										onChange={(event) => updateCurrency(event.target.value)}
										disabled={savingCurrency}
										className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-60"
									>
										{CURRENCY_OPTIONS.map(option => (
											<option key={option} value={option}>{option}</option>
										))}
									</select>
								</div>
								<p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
									Applies to amounts shown across dashboard, expenses, balances, and analytics.
								</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
