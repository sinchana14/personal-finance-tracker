import { ArrowUp, RotateCcw, Sparkles, Square } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TiltCard } from '../components/TiltCard'
import { PageHeader } from '../components/ui'
import { askAssistant, type ChatTurn } from '../lib/assistant'
import { useAuth } from '../lib/auth'

const SUGGESTIONS = [
  'Where did most of my money go this month?',
  'Which budgets am I close to breaking?',
  'How much did I save on average over the last few months?',
  'Give me 3 realistic ways to save ₹2,000 next month',
  'Compare my food spending this month vs last month',
]

const STORE_KEY = 'fintrack.assistant.history'

function loadHistory(): ChatTurn[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as ChatTurn[]) : []
  } catch {
    return []
  }
}

export function Assistant() {
  const { profile } = useAuth()
  const [turns, setTurns] = useState<ChatTurn[]>(loadHistory)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(turns))
    } catch {
      // storage unavailable: history just won't survive a reload
    }
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns])

  useEffect(() => () => abort.current?.abort(), [])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    const history: ChatTurn[] = [...turns, { role: 'user', content: q }]
    setTurns([...history, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    const ctrl = new AbortController()
    abort.current = ctrl
    const append = (delta: string) =>
      setTurns((t) => {
        const next = t.slice()
        const last = next[next.length - 1]
        next[next.length - 1] = { ...last, content: last.content + delta }
        return next
      })
    try {
      await askAssistant(history, append, ctrl.signal)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') append(`⚠️ ${(e as Error).message}`)
    } finally {
      setBusy(false)
      abort.current = null
      box.current?.focus()
    }
  }

  const reset = () => {
    abort.current?.abort()
    setTurns([])
  }

  const first = profile?.full_name?.split(' ')[0]

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[520px] flex-col lg:h-[calc(100vh-4rem)]">
      <PageHeader
        title="Assistant"
        subtitle="Ask anything about your income, spending and budgets."
        action={
          turns.length > 0 && (
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white">
              <RotateCcw size={15} /> New chat
            </button>
          )
        }
      />

      <TiltCard className="flex min-h-0 flex-1 flex-col" max={1} depth={false}>
        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 scrollbar-thin sm:p-7">
            {turns.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                <motion.div
                  className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-violet to-mint text-ink-950 shadow-[0_0_40px_-6px_rgba(167,139,250,0.8)]"
                  animate={{ rotate: [0, 8, -8, 0], y: [0, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles size={28} />
                </motion.div>
                <div>
                  <p className="font-display text-2xl font-semibold">Hi{first ? ` ${first}` : ''}, what would you like to know?</p>
                  <p className="mt-1 text-sm text-white/50">I can read your transactions and budgets from the last 12 months.</p>
                </div>
                <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s}
                      onClick={() => send(s)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.05 } }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:border-violet/50 hover:bg-violet/10 hover:text-white"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {turns.map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${t.role === 'user' ? 'justify-end' : ''}`}>
                    {t.role === 'assistant' && (
                      <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet to-mint text-ink-950">
                        <Sparkles size={15} />
                      </span>
                    )}
                    <div
                      className={
                        t.role === 'user'
                          ? 'max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-gradient-to-br from-violet/90 to-violet-deep px-4 py-2.5 text-sm text-white'
                          : 'prose-chat min-w-0 max-w-[90%] text-sm leading-relaxed text-white/85'
                      }
                    >
                      {t.role === 'user' ? (
                        t.content
                      ) : t.content ? (
                        <Markdown remarkPlugins={[remarkGfm]}>{t.content}</Markdown>
                      ) : (
                        <span className="inline-flex gap-1 py-2">
                          {[0, 1, 2].map((d) => (
                            <motion.span key={d} className="h-2 w-2 rounded-full bg-violet" animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }} />
                          ))}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={bottom} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void send(input)
            }}
            className="border-t border-white/5 p-3 sm:p-4"
          >
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-ink-950/60 p-2 focus-within:border-violet/60 focus-within:shadow-[0_0_0_4px_rgba(167,139,250,0.12)]">
              <textarea
                ref={box}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send(input)
                  }
                }}
                maxLength={4000}
                placeholder="Ask about your money…"
                className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-white/35"
              />
              {busy ? (
                <button type="button" onClick={() => abort.current?.abort()} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20" aria-label="Stop">
                  <Square size={14} fill="currentColor" />
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()} className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet to-violet-deep text-white transition-opacity disabled:opacity-40" aria-label="Send">
                  <ArrowUp size={18} />
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-white/35">AI answers can be wrong. Not financial advice.</p>
          </form>
        </div>
      </TiltCard>
    </div>
  )
}
