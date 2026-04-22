import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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