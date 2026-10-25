import { ArrowRight, Lock, Mail, Sparkles, User } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useState } from 'react'
import { toast } from 'sonner'
import { MagneticButton } from '../components/Magnetic'
import { TiltCard } from '../components/TiltCard'
import { supabase } from '../lib/supabase'

const HeroScene = lazy(() => import('../three/HeroScene'))

const words = ['Track.', 'Budget.', 'Grow.']

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Welcome back!')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        if (!data.session) setSent(true)
        else toast.success('Account created')
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* 3D hero */}
      <section className="relative flex min-h-[78vh] flex-col justify-end overflow-hidden px-6 pb-8 pt-10 sm:px-12 lg:min-h-screen lg:pb-16">
        <div className="absolute inset-0">
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        </div>
        <div className="pointer-events-none relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
            <Sparkles size={13} className="text-amber" /> Your money, in three dimensions
          </div>
          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
            {words.map((w, i) => (
              <motion.span key={w} className={`block ${i === 2 ? 'text-gradient' : ''}`} initial={{ opacity: 0, y: 40, rotateX: -60 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 120, damping: 14 }}>
                {w}
              </motion.span>
            ))}
          </h1>
          <p className="mt-5 max-w-md text-white/60">Income, expenses and monthly budgets in one place, synced securely to the cloud.</p>
        </div>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-4 pb-12 sm:px-8 lg:py-12">
        <TiltCard className="w-full max-w-md p-7 sm:p-9" max={5}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-mint/15 text-mint">
                  <Mail size={28} />
                </div>
                <h2 className="font-display text-2xl font-semibold">Check your inbox</h2>
                <p className="mt-2 text-sm text-white/60">
                  We sent a confirmation link to <span className="text-white">{email}</span>. Open it to activate your account, then sign in.
                </p>
                <MagneticButton variant="ghost" className="mt-6" onClick={() => (setSent(false), setMode('login'))}>
                  Back to sign in
                </MagneticButton>
              </motion.div>
            ) : (
              <motion.div key={mode} initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }} transition={{ duration: 0.25 }}>
                <h2 className="font-display text-3xl font-semibold tracking-tight">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
                <p className="mt-1.5 text-sm text-white/50">{mode === 'login' ? 'Sign in to see your dashboard.' : 'Start tracking in under a minute.'}</p>

                <form onSubmit={submit} className="mt-7 space-y-4">
                  {mode === 'register' && (
                    <IconInput icon={<User size={16} />} placeholder="Full name" value={fullName} onChange={setFullName} required autoComplete="name" />
                  )}
                  <IconInput icon={<Mail size={16} />} type="email" placeholder="Email" value={email} onChange={setEmail} required autoComplete="email" />
                  <IconInput icon={<Lock size={16} />} type="password" placeholder={mode === 'register' ? 'Password (min 6 characters)' : 'Password'} value={password} onChange={setPassword} required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                  <MagneticButton type="submit" className="w-full py-3.5" disabled={busy} strength={0.15}>
                    {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
                  </MagneticButton>
                </form>

                <p className="mt-6 text-center text-sm text-white/50">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button className="font-medium text-violet hover:text-white" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </TiltCard>
      </section>
    </div>
  )
}

function IconInput({ icon, onChange, ...rest }: { icon: React.ReactNode; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">{icon}</span>
      <input className="field pl-11" onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  )
}
