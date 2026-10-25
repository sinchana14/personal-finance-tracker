import { ChevronLeft, ChevronRight, Plus, Target, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MagneticButton } from '../components/Magnetic'
import { TiltCard } from '../components/TiltCard'
import { CountUp, Empty, Field, Modal, PageHeader, Skeleton } from '../components/ui'
import { deleteBudget, listBudgets, listCategories, listTransactions, upsertBudget } from '../lib/api'
import { useAuth } from '../lib/auth'
import { isoDate, money, MONTHS } from '../lib/format'
import type { Budget, Category } from '../lib/types'

type Row = Budget & { spent: number }

export function Budgets() {
  const { session } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [rows, setRows] = useState<Row[] | null>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [form, setForm] = useState<{ category_id: number | ''; amount: string } | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    listCategories('EXPENSE').then(setCats).catch(() => {})
  }, [])

  useEffect(() => {
    setRows(null)
    const from = isoDate(new Date(year, month - 1, 1))
    const to = isoDate(new Date(year, month, 0))
    Promise.all([listBudgets(month, year), listTransactions({ type: 'EXPENSE', from, to }, 5000)])
      .then(([b, t]) => {
        const spent = new Map<number, number>()
        for (const x of t) spent.set(x.category_id, (spent.get(x.category_id) ?? 0) + x.amount)
        setRows(b.map((x) => ({ ...x, spent: spent.get(x.category_id) ?? 0 })).sort((a, z) => z.spent / z.amount_limit - a.spent / a.amount_limit))
      })
      .catch((e) => toast.error(e.message))
  }, [month, year, tick])

  const shift = (d: number) => {
    const dt = new Date(year, month - 1 + d, 1)
    setMonth(dt.getMonth() + 1)
    setYear(dt.getFullYear())
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form?.category_id || !session) return
    try {
      await upsertBudget({ category_id: form.category_id, amount_limit: Number(form.amount), budget_month: month, budget_year: year }, session.user.id)
      toast.success('Budget saved')
      setForm(null)
      setTick((x) => x + 1)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const remove = async (b: Row) => {
    if (!confirm(`Remove the ${b.category?.name} budget?`)) return
    try {
      await deleteBudget(b.id)
      setTick((x) => x + 1)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const totalLimit = rows?.reduce((s, r) => s + r.amount_limit, 0) ?? 0
  const totalSpent = rows?.reduce((s, r) => s + r.spent, 0) ?? 0

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Set monthly limits per category and watch them fill up."
        action={
          <div className="flex items-center gap-2">
            <div className="glass flex items-center rounded-2xl">
              <button onClick={() => shift(-1)} className="p-3 text-white/60 hover:text-white" aria-label="Previous month">
                <ChevronLeft size={16} />
              </button>
              <span className="w-24 text-center font-display text-sm">
                {MONTHS[month - 1]} {year}
              </span>
              <button onClick={() => shift(1)} className="p-3 text-white/60 hover:text-white" aria-label="Next month">
                <ChevronRight size={16} />
              </button>
            </div>
            <MagneticButton onClick={() => setForm({ category_id: cats[0]?.id ?? '', amount: '' })}>
              <Plus size={16} /> Set budget
            </MagneticButton>
          </div>
        }
      />

      {rows && rows.length > 0 && (
        <TiltCard className="mb-5 p-6" max={2}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40">Total budgeted</p>
              <CountUp value={totalLimit} className="font-display text-3xl font-semibold" />
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-white/40">Spent so far</p>
              <CountUp value={totalSpent} className={`font-display text-3xl font-semibold ${totalSpent > totalLimit ? 'text-coral' : 'text-mint'}`} />
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-violet via-mint to-amber" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (totalSpent / Math.max(1, totalLimit)) * 100)}%` }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
          </div>
        </TiltCard>
      )}

      {!rows ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <TiltCard className="p-6">
          <Empty icon={<Target />} title={`No budgets for ${MONTHS[month - 1]}`} hint="Pick a category and a limit. You'll see progress here and on the dashboard." action={<MagneticButton onClick={() => setForm({ category_id: cats[0]?.id ?? '', amount: '' })}>Set a budget</MagneticButton>} />
        </TiltCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 20, rotateX: -15 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 140, damping: 16 }}>
              <BudgetCard b={b} onEdit={() => setForm({ category_id: b.category_id, amount: String(b.amount_limit) })} onDelete={() => remove(b)} />
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title={`Budget · ${MONTHS[month - 1]} ${year}`}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Category">
              <select className="field" required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Monthly limit">
              <input className="field font-mono text-xl" type="number" step="0.01" min="0.01" required placeholder="5000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <MagneticButton type="button" variant="ghost" onClick={() => setForm(null)}>
                Cancel
              </MagneticButton>
              <MagneticButton type="submit">Save budget</MagneticButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}

function BudgetCard({ b, onEdit, onDelete }: { b: Row; onEdit: () => void; onDelete: () => void }) {
  const pct = b.amount_limit > 0 ? b.spent / b.amount_limit : 0
  const R = 46
  const C = 2 * Math.PI * R
  const stroke = pct >= 1 ? '#fb7185' : pct >= 0.8 ? '#fbbf24' : '#34d399'
  return (
    <TiltCard className="group h-full p-5" max={10}>
      <div className="flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
            <circle cx="56" cy="56" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <motion.circle cx="56" cy="56" r={R} fill="none" stroke={stroke} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - Math.min(1, pct)) }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} style={{ filter: `drop-shadow(0 0 8px ${stroke}88)` }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-2xl">{b.category?.icon}</div>
              <div className="font-mono text-xs text-white/70">{Math.round(pct * 100)}%</div>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold">{b.category?.name}</p>
          <p className="mt-1 font-mono text-sm text-white/70">
            {money(b.spent)} <span className="text-white/35">/ {money(b.amount_limit)}</span>
          </p>
          <p className={`mt-1 text-xs ${pct >= 1 ? 'text-coral' : 'text-white/45'}`}>{pct >= 1 ? `Over by ${money(b.spent - b.amount_limit)}` : `${money(b.amount_limit - b.spent)} left`}</p>
          <div className="mt-3 flex gap-2 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <button onClick={onEdit} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
              Edit
            </button>
            <button onClick={onDelete} className="rounded-lg p-1.5 text-white/50 hover:bg-coral/15 hover:text-coral" aria-label="Delete budget">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </TiltCard>
  )
}
