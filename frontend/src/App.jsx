import { BrowserRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { applyTheme, getInitialTheme, readSavedTheme } from './theme/applyTheme'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  useEffect(() => {
    const savedTheme = readSavedTheme() || getInitialTheme()
    applyTheme(savedTheme)
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}