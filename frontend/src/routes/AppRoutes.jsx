import { Routes, Route, Navigate } from 'react-router-dom'
import { publicRouteElements } from './PublicRoutes'
import { protectedRouteElements } from './ProtectedRoutes'

export default function AppRoutes() {
  return (
    <Routes>
      {publicRouteElements}
      {protectedRouteElements}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
