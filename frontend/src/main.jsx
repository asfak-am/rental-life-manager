import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { HouseProvider } from './context/HouseContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
})

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HouseProvider>
            <App />
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#ffffff',
                  color: '#191c1e',
                  borderRadius: '12px',
                  border: '1px solid #e0e3e5',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                },
              }}
            />
          </HouseProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)