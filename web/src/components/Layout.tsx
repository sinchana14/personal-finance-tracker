import { ArrowLeftRight, LayoutDashboard, LogOut, Plus, Settings, Target } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { MagneticButton } from './Magnetic'
import { TransactionForm } from './TransactionForm'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** Lets any page open the quick-add modal and react to saves. */
const QuickAdd = createContext<{ open: () => void; version: number }>({ open: () => {}, version: 0 })
export const useQuickAdd = () => useContext(QuickAdd)

export function Layout() {
  const { profile, session, signOut } = useAuth()
  const [adding, setAdding] = useState(false)
  const [version, setVersion] = useState(0)
  const loc = useLocation()
  const name = profile?.full_name || session?.user.email?.split('@')[0] || 'You'
  const open = useCallback(() => setAdding(true), [])

  return (
    <QuickAdd.Provider value={{ open, version }}>
      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-4 lg:flex">
          <div className="glass flex h-full flex-col rounded-3xl p-4">
            <div className="mb-8 flex items-center gap-3 px-2 pt-2">
              <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-xl" />
              <span className="font-display text-xl font-semibold tracking-tight">FinTrack</span>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={to === '/'} className="relative">
                  {({ isActive }) => (
                    <span className={`relative z-10 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-white/50 hover:text-white'}`}>
                      {isActive && (
                        <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-2xl border border-violet/30 bg-gradient-to-r from-violet/25 to-mint/10 shadow-[0_0_24px_-6px_rgba(167,139,250,0.6)]" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                      )}
                      <Icon size={18} />
                      {label}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
            <MagneticButton onClick={open} className="mb-4 w-full">
              <Plus size={16} /> Add transaction
            </MagneticButton>
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet to-mint font-display font-bold text-ink-950">{name[0]?.toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-white/40">{session?.user.email}</p>
              </div>
              <button onClick={signOut} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-coral" aria-label="Sign out" title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {/* Mobile top bar */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="" className="h-8 w-8 rounded-lg" />
              <span className="font-display text-lg font-semibold">FinTrack</span>
            </div>
            <button onClick={signOut} className="rounded-xl p-2 text-white/60 hover:bg-white/10" aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <nav className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl px-2 py-2 lg:hidden">
          {NAV.slice(0, 2).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[10px] ${isActive ? 'text-violet' : 'text-white/50'}`}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <button onClick={open} className="-mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet to-violet-deep shadow-[0_10px_30px_-6px_rgba(124,58,237,0.9)]" aria-label="Add transaction">
            <Plus size={24} />
          </button>
          {NAV.slice(2).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[10px] ${isActive ? 'text-violet' : 'text-white/50'}`}>
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <TransactionForm open={adding} onClose={() => setAdding(false)} onSaved={() => setVersion((v) => v + 1)} />
    </QuickAdd.Provider>
  )
}
