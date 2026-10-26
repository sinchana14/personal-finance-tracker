import { supabase } from './supabase'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`

/** Sends the conversation to the ai-chat edge function and streams the reply text into onDelta. */
export async function askAssistant(messages: ChatTurn[], onDelta: (text: string) => void, signal?: AbortSignal) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in again.')

  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
    signal,
  })

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error ?? err?.message ?? `Assistant unavailable (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    onDelta(decoder.decode(value, { stream: true }))
  }
}
