import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { listCategories, saveTransaction } from '../lib/api'
import { isoDate } from '../lib/format'
import type { Category, Transaction, TxnType } from '../lib/types'
import { MagneticButton } from './Magnetic'
import { Field, Modal } from './ui'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing?: Transaction | null
}

export function TransactionForm({ open, onClose, onSaved, editing }: Props) {
  const [type, setType] = useState<TxnType>('EXPENSE')
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(isoDate(new Date()))
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setType(editing?.type ?? 'EXPENSE')
    setCategoryId(editing?.category_id ?? '')
    setAmount(editing ? String(editing.amount) : '')
    setDate(editing?.transaction_date ?? isoDate(new Date()))
    setDescription(editing?.description ?? '')
  }, [open, editing])

  useEffect(() => {
    if (!open) return
    listCategories(type)
      .then((c) => {
        setCategories(c)
        setCategoryId((cur) => (c.some((x) => x.id === cur) ? cur : (c[0]?.id ?? '')))
      })
      .catch((e) => toast.error(e.message))
  }, [type, open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId) return
    setBusy(true)
    try {
      await saveTransaction(
        { type, category_id: categoryId, amount: Number(amount), transaction_date: date, description: description.trim() || null },
        editing?.id,
      )
      toast.success(editing ? 'Transaction updated' : 'Transaction added')
      onSaved()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit transaction' : 'New transaction'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink-950/60 p-1.5">
          {(['EXPENSE', 'INCOME'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                type === t ? (t === 'INCOME' ? 'bg-mint/20 text-mint shadow-[0_0_20px_-4px_rgba(52,211,153,0.6)]' : 'bg-coral/20 text-coral shadow-[0_0_20px_-4px_rgba(251,113,133,0.6)]') : 'text-white/50 hover:text-white'
              }`}
            >
              {t === 'INCOME' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {t === 'INCOME' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>

        <Field label="Amount">
          <input className="field font-mono text-2xl" type="number" inputMode="decimal" step="0.01" min="0.01" required placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>

        <Field label="Category">
          <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-4">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[11px] transition-all ${categoryId === c.id ? 'scale-[1.03] border-violet/70 bg-violet/15 text-white' : 'border-white/5 bg-white/[0.03] text-white/60 hover:border-white/20'}`}
              >
                <span className="text-lg">{c.icon}</span>
                <span className="line-clamp-1">{c.name}</span>
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input className="field" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Note">
            <input className="field" maxLength={255} placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <MagneticButton type="button" variant="ghost" onClick={onClose}>
            Cancel
          </MagneticButton>
          <MagneticButton type="submit" disabled={busy || !categoryId}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}
          </MagneticButton>
        </div>
      </form>
    </Modal>
  )
}
