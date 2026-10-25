import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MagneticButton } from '../components/Magnetic'
import { TiltCard } from '../components/TiltCard'
import { Field, PageHeader } from '../components/ui'
import { createCategory, deleteCategory, listCategories, updateProfile } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Category, TxnType } from '../lib/types'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED']

export function Settings() {
  const { session, profile, refreshProfile } = useAuth()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [cats, setCats] = useState<Category[]>([])
  const [draft, setDraft] = useState({ name: '', icon: '✨', color: '#a78bfa', type: 'EXPENSE' as TxnType })

  useEffect(() => {
    setName(profile?.full_name ?? '')
    setCurrency(profile?.currency ?? 'INR')
  }, [profile])

  const load = () => listCategories().then(setCats).catch((e) => toast.error(e.message))
  useEffect(() => {
    load()
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    try {
      await updateProfile({ full_name: name.trim(), currency }, session.user.id)
      await refreshProfile()
      toast.success('Profile saved')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return
    try {
      await createCategory({ ...draft, name: draft.name.trim() }, session.user.id)
      setDraft({ ...draft, name: '' })
      toast.success('Category added')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const removeCategory = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return
    try {
      await deleteCategory(c.id)
      load()
    } catch {
      toast.error('This category is used by transactions, so it can’t be deleted.')
    }
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Profile, currency and your own categories." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <TiltCard className="p-6" max={3}>
          <h3 className="mb-4 font-display text-lg font-semibold">Profile</h3>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Email">
              <input className="field opacity-60" value={session?.user.email ?? ''} disabled />
            </Field>
            <Field label="Full name">
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </Field>
            <Field label="Currency">
              <select className="field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <MagneticButton type="submit">Save profile</MagneticButton>
          </form>
        </TiltCard>

        <TiltCard className="p-6" max={2} depth={false}>
          <h3 className="mb-4 font-display text-lg font-semibold">Categories</h3>
          <form onSubmit={addCategory} className="mb-5 grid grid-cols-[56px_1fr] gap-2 sm:grid-cols-[56px_1fr_auto_48px_auto]">
            <input className="field text-center text-lg" value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} maxLength={4} aria-label="Icon (emoji)" />
            <input className="field" placeholder="New category name" required maxLength={50} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <select className="field" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as TxnType })} aria-label="Type">
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
            <input type="color" className="h-full min-h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-transparent p-1" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} aria-label="Color" />
            <MagneticButton type="submit" className="col-span-2 sm:col-span-1">
              <Plus size={16} /> Add
            </MagneticButton>
          </form>
          {(['EXPENSE', 'INCOME'] as const).map((type) => (
            <div key={type} className="mb-4">
              <p className="mb-2 text-xs uppercase tracking-wider text-white/40">{type === 'EXPENSE' ? 'Expense' : 'Income'}</p>
              <div className="flex flex-wrap gap-2">
                {cats
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <span key={c.id} className="group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-transform hover:-translate-y-0.5" style={{ borderColor: `${c.color}55`, background: `${c.color}14` }}>
                      {c.icon} {c.name}
                      {!c.is_default && (
                        <button onClick={() => removeCategory(c)} className="text-white/40 hover:text-coral" aria-label={`Delete ${c.name}`}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </TiltCard>
      </div>
    </>
  )
}
