import { Download, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useQuickAdd } from '../components/Layout'
import { MagneticButton } from '../components/Magnetic'
import { TiltCard } from '../components/TiltCard'
import { TransactionForm } from '../components/TransactionForm'
import { Empty, PageHeader, Skeleton } from '../components/ui'
import { deleteTransaction, listTransactions, type TxnFilters } from '../lib/api'
import { money, prettyDate } from '../lib/format'
import type { Transaction } from '../lib/types'

export function Transactions() {
  const { open, version } = useQuickAdd()
  const [rows, setRows] = useState<Transaction[] | null>(null)
  const [filters, setFilters] = useState<TxnFilters>({ type: '' })
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: search.trim() || undefined })), 250)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    listTransactions(filters)
      .then(setRows)
      .catch((e) => toast.error(e.message))
  }, [filters, version, tick])

  const totals = useMemo(() => {
    const inc = rows?.filter((r) => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0) ?? 0
    const exp = rows?.filter((r) => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0) ?? 0
    return { inc, exp }
  }, [rows])

  const remove = async (t: Transaction) => {
    if (!confirm(`Delete "${t.description || t.category?.name}" (${money(t.amount)})?`)) return
    try {
      await deleteTransaction(t.id)
      setRows((r) => r?.filter((x) => x.id !== t.id) ?? null)
      toast.success('Deleted')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const exportCsv = () => {
    if (!rows?.length) return
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
    const lines = [['Date', 'Type', 'Category', 'Amount', 'Note'].join(','), ...rows.map((r) => [r.transaction_date, r.type, esc(r.category?.name ?? ''), r.amount, esc(r.description ?? '')].join(','))]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'fintrack-transactions.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={rows ? `${rows.length} shown · ${money(totals.inc, { compact: true })} in · ${money(totals.exp, { compact: true })} out` : 'Loading…'}
        action={
          <div className="flex gap-2">
            <MagneticButton variant="ghost" onClick={exportCsv} disabled={!rows?.length}>
              <Download size={16} /> CSV
            </MagneticButton>
            <MagneticButton onClick={open}>
              <Plus size={16} /> Add
            </MagneticButton>
          </div>
        }
      />

      <TiltCard className="mb-5 p-4" max={1.5} depth={false}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input className="field pl-11" placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex rounded-2xl bg-ink-950/60 p-1">
            {(['', 'INCOME', 'EXPENSE'] as const).map((t) => (
              <button key={t || 'all'} onClick={() => setFilters((f) => ({ ...f, type: t }))} className={`relative rounded-xl px-4 py-2 text-sm transition-colors ${filters.type === t ? 'text-white' : 'text-white/50 hover:text-white'}`}>
                {filters.type === t && <motion.span layoutId="type-pill" className="absolute inset-0 rounded-xl bg-white/10" />}
                <span className="relative">{t === '' ? 'All' : t === 'INCOME' ? 'Income' : 'Expense'}</span>
              </button>
            ))}
          </div>
          <input className="field" type="date" aria-label="From" value={filters.from ?? ''} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined }))} />
          <input className="field" type="date" aria-label="To" value={filters.to ?? ''} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined }))} />
        </div>
      </TiltCard>

      {!rows ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <TiltCard className="p-6">
          <Empty icon={<Receipt />} title="No transactions match" hint="Try clearing filters, or add a new one." action={<MagneticButton onClick={open}>Add transaction</MagneticButton>} />
        </TiltCard>
      ) : (
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {rows.map((t, i) => (
              <motion.li key={t.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.025 } }} exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}>
                <TiltCard className="group" max={3} depth={false}>
                  <div className="flex items-center gap-4 p-3.5 sm:p-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg" style={{ background: `${t.category?.color ?? '#607D8B'}26` }}>
                      {t.category?.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.description || t.category?.name}</p>
                      <p className="text-xs text-white/40">
                        {t.category?.name} · {prettyDate(t.transaction_date)}
                      </p>
                    </div>
                    <span className={`font-mono text-sm sm:text-base ${t.type === 'INCOME' ? 'text-mint' : 'text-coral'}`}>{money(t.type === 'INCOME' ? t.amount : -t.amount, { sign: true })}</span>
                    <div className="flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <button onClick={() => setEditing(t)} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(t)} className="rounded-lg p-2 text-white/50 hover:bg-coral/15 hover:text-coral" aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </TiltCard>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <TransactionForm open={!!editing} editing={editing} onClose={() => setEditing(null)} onSaved={() => setTick((x) => x + 1)} />
    </>
  )
}
