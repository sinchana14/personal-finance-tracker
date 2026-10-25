import { ArrowDownRight, ArrowUpRight, PiggyBank, Plus, Receipt, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { toast } from 'sonner'
import { useQuickAdd } from '../components/Layout'
import { MagneticButton } from '../components/Magnetic'
import { TiltCard } from '../components/TiltCard'
import { CountUp, Empty, Skeleton } from '../components/ui'
import { getDashboard, type Dashboard as D } from '../lib/api'
import { useAuth } from '../lib/auth'
import { money, prettyDate } from '../lib/format'

const BalanceOrb = lazy(() => import('../three/BalanceOrb'))
const TrendBars3D = lazy(() => import('../three/TrendBars3D'))

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const rise = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 140, damping: 18 } } }

export function Dashboard() {
  const { profile } = useAuth()
  const { open, version } = useQuickAdd()
  const [d, setD] = useState<D | null>(null)

  useEffect(() => {
    getDashboard()
      .then(setD)
      .catch((e) => toast.error(e.message))
  }, [version])

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const first = profile?.full_name?.split(' ')[0]

  if (!d) {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  const expenseDelta = d.prevExpense > 0 ? (d.expense - d.prevExpense) / d.prevExpense : 0
  const health = d.income === 0 && d.expense === 0 ? 0.6 : d.savingsRate

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-5 lg:grid-cols-3">
      {/* Hero balance */}
      <motion.div variants={rise} className="lg:col-span-2">
        <TiltCard className="h-full overflow-hidden" max={4}>
          <div className="grid h-full gap-2 p-6 sm:grid-cols-[1fr_220px] sm:p-8">
            <div className="flex flex-col justify-between gap-6">
              <div>
                <p className="text-sm text-white/50">
                  {greet}
                  {first ? `, ${first}` : ''} 👋
                </p>
                <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-white/40">Net balance · all time</p>
                <CountUp value={d.allTimeBalance} className="mt-2 block font-display text-5xl font-bold tracking-tight sm:text-6xl" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${d.balance >= 0 ? 'bg-mint/15 text-mint' : 'bg-coral/15 text-coral'}`}>
                  {money(d.balance, { sign: true })} this month
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">Savings rate {(d.savingsRate * 100).toFixed(0)}%</span>
                <MagneticButton onClick={open} className="ml-auto hidden sm:inline-flex">
                  <Plus size={16} /> Add
                </MagneticButton>
              </div>
            </div>
            <div className="relative -my-4 hidden h-56 sm:block" data-cursor="hover">
              <Suspense fallback={null}>
                <BalanceOrb health={health} />
              </Suspense>
            </div>
          </div>
        </TiltCard>
      </motion.div>

      {/* Breakdown donut */}
      <motion.div variants={rise}>
        <TiltCard className="h-full p-6">
          <h3 className="font-display text-lg font-semibold">Where it went</h3>
          <p className="text-xs text-white/40">Expenses this month</p>
          {d.breakdown.length === 0 ? (
            <Empty icon={<Receipt />} title="No expenses yet" hint="Add one to see your breakdown." />
          ) : (
            <>
              <div className="relative mx-auto mt-2 h-44 w-44">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={d.breakdown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3} cornerRadius={6} stroke="none">
                      {d.breakdown.map((b) => (
                        <Cell key={b.name} fill={b.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(14,14,38,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(v) => money(Number(v))}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Spent</p>
                    <p className="font-display text-lg font-semibold">{money(d.expense, { compact: true })}</p>
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {d.breakdown.slice(0, 4).map((b) => (
                  <li key={b.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                    <span className="flex-1 truncate text-white/70">
                      {b.icon} {b.name}
                    </span>
                    <span className="font-mono text-xs text-white/60">{((b.value / d.expense) * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </TiltCard>
      </motion.div>

      {/* Stat tiles */}
      <StatTile icon={<ArrowUpRight />} label="Income · this month" value={d.income} tone="mint" />
      <StatTile
        icon={<ArrowDownRight />}
        label="Expenses · this month"
        value={d.expense}
        tone="coral"
        foot={d.prevExpense > 0 ? `${expenseDelta >= 0 ? '▲' : '▼'} ${Math.abs(expenseDelta * 100).toFixed(0)}% vs last month` : undefined}
      />
      <StatTile icon={<PiggyBank />} label="Saved · this month" value={Math.max(0, d.balance)} tone="violet" foot={`${(d.savingsRate * 100).toFixed(0)}% of income`} />

      {/* 3D trend */}
      <motion.div variants={rise} className="lg:col-span-2">
        <TiltCard className="h-full p-6" max={3} depth={false}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Six-month trend</h3>
              <p className="text-xs text-white/40">Move your cursor to orbit · hover a month for totals</p>
            </div>
            <div className="flex gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-mint" /> Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-coral" /> Expense
              </span>
            </div>
          </div>
          <div className="mt-2 h-72" data-cursor="hover">
            <Suspense fallback={<Skeleton className="h-full" />}>
              <TrendBars3D data={d.trend} />
            </Suspense>
          </div>
        </TiltCard>
      </motion.div>

      {/* Budgets */}
      <motion.div variants={rise}>
        <TiltCard className="h-full p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Budgets</h3>
            <Link to="/budgets" className="text-xs text-violet hover:text-white">
              Manage →
            </Link>
          </div>
          {d.budgets.length === 0 ? (
            <Empty icon={<Wallet />} title="No budgets set" hint="Cap a category to get alerts before you overspend." />
          ) : (
            <ul className="mt-4 space-y-4">
              {d.budgets.slice(0, 5).map((b) => (
                <BudgetBar key={b.id} name={`${b.category?.icon ?? ''} ${b.category?.name ?? ''}`} spent={b.spent} limit={b.amount_limit} />
              ))}
            </ul>
          )}
        </TiltCard>
      </motion.div>

      {/* Recent */}
      <motion.div variants={rise} className="lg:col-span-3">
        <TiltCard className="p-6" max={2} depth={false}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent activity</h3>
            <Link to="/transactions" className="text-xs text-violet hover:text-white">
              View all →
            </Link>
          </div>
          {d.recent.length === 0 ? (
            <Empty icon={<Receipt />} title="Nothing here yet" hint="Your latest transactions will show up here." action={<MagneticButton onClick={open}>Add your first</MagneticButton>} />
          ) : (
            <ul className="divide-y divide-white/5">
              {d.recent.map((t, i) => (
                <motion.li key={t.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="flex items-center gap-4 py-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg" style={{ background: `${t.category?.color ?? '#607D8B'}22` }}>
                    {t.category?.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.description || t.category?.name}</p>
                    <p className="text-xs text-white/40">
                      {t.category?.name} · {prettyDate(t.transaction_date)}
                    </p>
                  </div>
                  <span className={`font-mono text-sm ${t.type === 'INCOME' ? 'text-mint' : 'text-coral'}`}>{money(t.type === 'INCOME' ? t.amount : -t.amount, { sign: true })}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </TiltCard>
      </motion.div>
    </motion.div>
  )
}

const toneMap = {
  mint: 'from-mint/25 text-mint',
  coral: 'from-coral/25 text-coral',
  violet: 'from-violet/25 text-violet',
}

function StatTile({ icon, label, value, tone, foot }: { icon: React.ReactNode; label: string; value: number; tone: keyof typeof toneMap; foot?: string }) {
  return (
    <motion.div variants={rise}>
      <TiltCard className="h-full p-5">
        <div className="flex items-start gap-4">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br to-transparent ${toneMap[tone]}`}>{icon}</span>
          <div className="min-w-0">
            <p className="text-xs text-white/50">{label}</p>
            <CountUp value={value} className="mt-1 block font-display text-2xl font-semibold" />
            {foot && <p className="mt-1 text-xs text-white/40">{foot}</p>}
          </div>
        </div>
      </TiltCard>
    </motion.div>
  )
}

export function BudgetBar({ name, spent, limit }: { name: string; spent: number; limit: number }) {
  const pct = limit > 0 ? spent / limit : 0
  const color = pct >= 1 ? 'from-coral to-coral' : pct >= 0.8 ? 'from-amber to-coral' : 'from-mint to-sky'
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-white/80">{name}</span>
        <span className="shrink-0 font-mono text-xs text-white/50">
          {money(spent, { compact: true })} / {money(limit, { compact: true })}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
        <motion.div className={`h-full rounded-full bg-gradient-to-r ${color} shadow-[0_0_12px_rgba(52,211,153,0.4)]`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct * 100)}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
      </div>
      {pct >= 1 && <p className="mt-1 text-[11px] text-coral">Over by {money(spent - limit)}</p>}
    </li>
  )
}
