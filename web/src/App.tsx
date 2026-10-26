import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CursorFX } from './components/CursorFX'
import { Layout } from './components/Layout'
import { AuthProvider, useAuth } from './lib/auth'
import { supabaseConfigured } from './lib/supabase'
import { Assistant } from './pages/Assistant'
import { AuthPage } from './pages/AuthPage'
import { Budgets } from './pages/Budgets'
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'
import { Transactions } from './pages/Transactions'

function Routed() {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="relative z-10 grid min-h-screen place-items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-violet/30 border-t-violet" />
      </div>
    )
  }
  if (!session) return <AuthPage />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="ambient" aria-hidden />
      <div className="grid-floor" aria-hidden />
      <CursorFX />
      {supabaseConfigured ? (
        <AuthProvider>
          <Routed />
        </AuthProvider>
      ) : (
        <div className="relative z-10 grid min-h-screen place-items-center p-6 text-center">
          <p className="max-w-md text-white/70">
            Supabase isn’t configured. Set <code className="text-violet">VITE_SUPABASE_URL</code> and <code className="text-violet">VITE_SUPABASE_PUBLISHABLE_KEY</code>.
          </p>
        </div>
      )}
      <Toaster theme="dark" position="top-center" toastOptions={{ style: { background: 'rgba(14,14,38,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' } }} />
    </BrowserRouter>
  )
}
