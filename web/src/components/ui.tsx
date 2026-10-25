import { X } from 'lucide-react'
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { money } from '../lib/format'

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-label={title}
            className="glass w-full max-w-lg rounded-t-3xl p-6 sm:rounded-3xl [transform-style:preserve-3d]"
            initial={{ opacity: 0, y: 40, rotateX: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, rotateX: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{ transformPerspective: 1000, background: 'linear-gradient(160deg, rgba(30,27,75,0.92), rgba(10,10,30,0.95))' }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold">{title}</h3>
              <button onClick={onClose} className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Number that counts up to its value whenever it changes. */
export function CountUp({ value, className, compact }: { value: number; className?: string; compact?: boolean }) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => money(v, { compact }))
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.2, ease: [0.16, 1, 0.3, 1] })
    return () => c.stop()
  }, [value, mv])
  return <motion.span className={className}>{text}</motion.span>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">{label}</span>
      {children}
    </label>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/5 ${className}`} />
}

export function Empty({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-violet">{icon}</div>
      <p className="font-display text-lg">{title}</p>
      {hint && <p className="max-w-xs text-sm text-white/50">{hint}</p>}
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <motion.h1
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {title}
        </motion.h1>
        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
