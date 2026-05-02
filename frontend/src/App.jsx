import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import ProtectedRoute from './components/ProtectedRoute'

// Auth & Onboarding
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyOtp from './pages/VerifyOtp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import InviteHouse from './pages/InviteHouse'
import OnboardingStep1 from './pages/OnboardingStep1'
import OnboardingStep2 from './pages/OnboardingStep2'
import OnboardingSuccess from './pages/OnboardingSuccess'

// App Pages
import Dashboard from './pages/Dashboard'
import ExpensesList from './pages/ExpensesList'
import ExpenseDetails from './pages/ExpenseDetails'
import AddExpense from './pages/AddExpense'
import Balances from './pages/Balances'
import Tasks from './pages/Tasks'
import Analytics from './pages/Analytics'
import HouseSettings from './pages/HouseSettings'
import Notifications from './pages/Notifications'
import Messages from './pages/Messages'
import Help from './pages/Help'
import Profile from './pages/Profile'

export default function App() {
  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('app-theme')
    if (savedTheme) {
      const theme = JSON.parse(savedTheme)
      
      // Apply primary color
      document.documentElement.style.setProperty('--primary-color', theme.primaryColor)
      const hex = theme.primaryColor.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`)

      // Apply dark mode
      const html = document.documentElement
      if (theme.mode === 'dark') {
        html.classList.add('dark')
      } else if (theme.mode === 'light') {
        html.classList.remove('dark')
      } else if (theme.mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
      }

      // Apply skin
      if (theme.skin === 'bordered') {
        html.classList.add('skin-bordered')
      }

      // Apply semi-dark
      if (theme.semiDark) {
        html.classList.add('semi-dark')
      }
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"              element={<Login />} />
        <Route path="/register"           element={<Register />} />
        <Route path="/verify-otp"         element={<VerifyOtp />} />
        <Route path="/forgot-password"    element={<ForgotPassword />} />
        <Route path="/reset-password"     element={<ResetPassword />} />
        <Route path="/invite/:code"       element={<InviteHouse />} />
        <Route path="/onboarding/step1"   element={<OnboardingStep1 />} />
        <Route path="/onboarding/step2"   element={<OnboardingStep2 />} />
        <Route path="/onboarding/success" element={<OnboardingSuccess />} />

        {/* Protected — must be logged in */}
        <Route element={<ProtectedRoute />}>
          <Route path="/"                 element={<Dashboard />} />
          <Route path="/expenses"         element={<ExpensesList />} />
          <Route path="/expenses/add"     element={<AddExpense />} />
          <Route path="/expenses/:id"     element={<ExpenseDetails />} />
          <Route path="/balances"         element={<Balances />} />
          <Route path="/ledger"           element={<Balances />} />
          <Route path="/tasks"            element={<Tasks />} />
          <Route path="/analytics"        element={<Analytics />} />
          <Route path="/settings"         element={<HouseSettings />} />
          <Route path="/notifications"    element={<Notifications />} />
          <Route path="/messages"         element={<Messages />} />
          <Route path="/help"             element={<Help />} />
          <Route path="/profile"          element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}