import { Route } from 'react-router-dom'
import ProtectedRoute from '../components/common/ProtectedRoute'

import Dashboard from '../pages/Dashboard'
import ExpensesList from '../pages/ExpensesList'
import ExpenseDetails from '../pages/ExpenseDetails'
import AddExpense from '../pages/AddExpense'
import Balances from '../pages/Balances'
import Ledger from '../pages/Ledger'
import Tasks from '../pages/Tasks'
import Analytics from '../pages/Analytics'
import HouseSettings from '../pages/HouseSettings'
import Notifications from '../pages/Notifications'
import Help from '../pages/Help'
import Profile from '../pages/Profile'

export const protectedRouteElements = [
  <Route key="protected" element={<ProtectedRoute />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/expenses" element={<ExpensesList />} />
    <Route path="/expenses/add" element={<AddExpense />} />
    <Route path="/expenses/:id/edit" element={<AddExpense />} />
    <Route path="/expenses/:id" element={<ExpenseDetails />} />
    <Route path="/balances" element={<Balances />} />
    <Route path="/ledger" element={<Ledger />} />
    <Route path="/tasks" element={<Tasks />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/settings" element={<HouseSettings />} />
    <Route path="/notifications" element={<Notifications />} />
    <Route path="/help" element={<Help />} />
    <Route path="/profile" element={<Profile />} />
  </Route>,
]
