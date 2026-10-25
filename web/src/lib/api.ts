import { isoDate } from './format'
import { supabase } from './supabase'
import type { Budget, Category, Profile, Transaction, TxnInput, TxnType } from './types'

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

// numeric columns arrive as strings from PostgREST
const num = (v: unknown) => Number(v)

const TXN_SELECT = 'id, category_id, amount, type, description, transaction_date, created_at, category:categories(*)'

function normTxn(r: Transaction): Transaction {
  return { ...r, amount: num(r.amount) }
}

export async function getProfile(): Promise<Profile | null> {
  const res = await supabase.from('profiles').select('*').maybeSingle()
  return unwrap(res)
}

export async function updateProfile(patch: Partial<Pick<Profile, 'full_name' | 'currency'>>, id: string) {
  unwrap(await supabase.from('profiles').update(patch).eq('id', id))
}

export async function listCategories(type?: TxnType): Promise<Category[]> {
  let q = supabase.from('categories').select('*').order('is_default', { ascending: false }).order('name')
  if (type) q = q.eq('type', type)
  return unwrap(await q)
}

export async function createCategory(input: Pick<Category, 'name' | 'icon' | 'color' | 'type'>, userId: string) {
  return unwrap(await supabase.from('categories').insert({ ...input, user_id: userId }).select().single()) as Category
}

export async function deleteCategory(id: number) {
  unwrap(await supabase.from('categories').delete().eq('id', id))
}

export interface TxnFilters {
  type?: TxnType | ''
  from?: string
  to?: string
  search?: string
}

export async function listTransactions(f: TxnFilters = {}, limit = 500): Promise<Transaction[]> {
  let q = supabase
    .from('transactions')
    .select(TXN_SELECT)
    .order('transaction_date', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  if (f.type) q = q.eq('type', f.type)
  if (f.from) q = q.gte('transaction_date', f.from)
  if (f.to) q = q.lte('transaction_date', f.to)
  if (f.search) q = q.ilike('description', `%${f.search}%`)
  const rows = unwrap(await q) as unknown as Transaction[]
  return rows.map(normTxn)
}

export async function saveTransaction(input: TxnInput, id?: number) {
  const res = id
    ? await supabase.from('transactions').update(input).eq('id', id)
    : await supabase.from('transactions').insert(input)
  unwrap(res)
}

export async function deleteTransaction(id: number) {
  unwrap(await supabase.from('transactions').delete().eq('id', id))
}

export async function listBudgets(month: number, year: number): Promise<Budget[]> {
  const rows = unwrap(
    await supabase
      .from('budgets')
      .select('id, category_id, amount_limit, budget_month, budget_year, category:categories(*)')
      .eq('budget_month', month)
      .eq('budget_year', year),
  ) as unknown as Budget[]
  return rows.map((b) => ({ ...b, amount_limit: num(b.amount_limit) }))
}

export async function upsertBudget(b: { category_id: number; amount_limit: number; budget_month: number; budget_year: number }, userId: string) {
  unwrap(
    await supabase
      .from('budgets')
      .upsert({ ...b, user_id: userId }, { onConflict: 'user_id,category_id,budget_month,budget_year' }),
  )
}

export async function deleteBudget(id: number) {
  unwrap(await supabase.from('budgets').delete().eq('id', id))
}

/* ---------- Dashboard aggregation (done client-side over the user's own rows) ---------- */

export interface Dashboard {
  income: number
  expense: number
  balance: number
  savingsRate: number
  prevExpense: number
  trend: { key: string; label: string; income: number; expense: number }[]
  breakdown: { name: string; icon: string; color: string; value: number }[]
  budgets: (Budget & { spent: number; pct: number })[]
  recent: Transaction[]
  allTimeBalance: number
}

export async function getDashboard(now = new Date()): Promise<Dashboard> {
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const [txns, budgets, totals] = await Promise.all([
    listTransactions({ from: isoDate(start) }, 5000),
    listBudgets(now.getMonth() + 1, now.getFullYear()),
    supabase.rpc('get_balance'),
  ])

  const ym = (iso: string) => iso.slice(0, 7)
  const thisKey = isoDate(now).slice(0, 7)
  const prevKey = isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7)

  const trend: Dashboard['trend'] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    trend.push({ key: isoDate(d).slice(0, 7), label: d.toLocaleDateString(undefined, { month: 'short' }), income: 0, expense: 0 })
  }
  const byKey = new Map(trend.map((t) => [t.key, t]))
  const cat = new Map<number, Dashboard['breakdown'][number]>()
  const spentByCat = new Map<number, number>()
  let prevExpense = 0

  for (const t of txns) {
    const k = ym(t.transaction_date)
    const bucket = byKey.get(k)
    if (bucket) bucket[t.type === 'INCOME' ? 'income' : 'expense'] += t.amount
    if (t.type === 'EXPENSE' && k === prevKey) prevExpense += t.amount
    if (t.type === 'EXPENSE' && k === thisKey) {
      spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + t.amount)
      const c = t.category
      const e = cat.get(t.category_id) ?? { name: c?.name ?? 'Other', icon: c?.icon ?? '📦', color: c?.color ?? '#607D8B', value: 0 }
      e.value += t.amount
      cat.set(t.category_id, e)
    }
  }

  const cur = byKey.get(thisKey)!
  const allTimeBalance = num(unwrap(totals) ?? 0)

  return {
    income: cur.income,
    expense: cur.expense,
    balance: cur.income - cur.expense,
    savingsRate: cur.income > 0 ? Math.max(0, (cur.income - cur.expense) / cur.income) : 0,
    prevExpense,
    trend,
    breakdown: [...cat.values()].sort((a, b) => b.value - a.value),
    budgets: budgets
      .map((b) => {
        const spent = spentByCat.get(b.category_id) ?? 0
        return { ...b, spent, pct: b.amount_limit > 0 ? spent / b.amount_limit : 0 }
      })
      .sort((a, b) => b.pct - a.pct),
    recent: txns.slice(0, 6),
    allTimeBalance,
  }
}
