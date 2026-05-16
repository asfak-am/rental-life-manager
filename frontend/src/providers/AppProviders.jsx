import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../context/AuthContext'
import { HouseProvider } from '../context/HouseContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

const toastOptions = {
  style: {
    background: '#ffffff',
    color: '#191c1e',
    borderRadius: '12px',
    border: '1px solid #e0e3e5',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
  },
}

export default function AppProviders({ children }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HouseProvider>
            {children}
            <Toaster position="top-center" toastOptions={toastOptions} />
          </HouseProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}
