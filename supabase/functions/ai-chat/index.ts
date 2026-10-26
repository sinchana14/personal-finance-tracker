// FinTrack AI assistant: answers questions about the signed-in user's own
// finances with Google Gemini (free tier). The user's JWT is forwarded to
// Supabase, so RLS limits the data to their rows. Streams plain-text deltas
// back to the app.
//
// Secrets: GEMINI_API_KEY (set in Supabase → Edge Functions → Secrets).
// Optional GEMINI_MODEL overrides the model below.
// SUPABASE_URL and SUPABASE_ANON_KEY are provided by the platform.

import { ApiError, GoogleGenAI } from "npm:@google/genai@2.31.0";
import { createClient } from "npm:@supabase/supabase-js@2";

// Free-tier models, tried in order. Busy (503) or rate-limited (429) models
// fall through to the next one, so a demand spike on the newest model
// doesn't surface as an error. GEMINI_MODEL, if set, is tried first.
const MODELS = [
  ...new Set([Deno.env.get("GEMINI_MODEL"), "gemini-3.8-flash", "gemini-3.6-flash", "gemini-2.5-flash", "gemini-3.5-flash-lite"].filter(Boolean) as string[]),
];
const RETRYABLE = new Set([404, 429, 500, 503, 504]);
const MAX_TURNS = 20;
const MAX_CHARS = 4000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INSTRUCTIONS = `You are FinTrack's money assistant, built into a personal finance tracker.
You help one person understand their own income, spending and budgets, using the account data provided below.

How to answer:
- Ground every number in the data. Do the arithmetic carefully; if something isn't in the data, say so rather than guessing.
- Use the user's currency and Indian number formatting for INR (for example ₹1,25,000).
- Be concise and friendly. Lead with the answer, then the few figures that support it. Use short bullet lists or a small table when it helps; no long preambles.
- When asked for advice, give practical, specific suggestions tied to their actual categories and amounts (for example which budget to tighten and by how much).
- You are not a licensed financial adviser. For investment, tax or legal questions, give general educational information and suggest a qualified professional for personal decisions. Never recommend specific stocks, funds or securities to buy or sell.
- You can't change their data. If they ask you to add or edit a transaction, tell them to use the Add button.`;

type Turn = { role: "user" | "assistant"; content: string };

function bad(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function parseTurns(body: unknown): Turn[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const turns = raw.slice(-MAX_TURNS).map((m) => {
    const r = m as { role?: unknown; content?: unknown };
    if ((r.role !== "user" && r.role !== "assistant") || typeof r.content !== "string") return null;
    const content = r.content.trim().slice(0, MAX_CHARS);
    return content ? { role: r.role, content } : null;
  });
  if (turns.some((t) => t === null)) return null;
  const clean = turns as Turn[];
  // History must start with a user turn and end on the new user question
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length || clean[clean.length - 1].role !== "user") return null;
  return clean;
}

async function loadAccountContext(supabase: ReturnType<typeof createClient>) {
  const today = new Date();
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11, 1)).toISOString().slice(0, 10);
  const month = today.getUTCMonth() + 1;
  const year = today.getUTCFullYear();

  const [profile, txns, budgets] = await Promise.all([
    supabase.from("profiles").select("full_name, currency").maybeSingle(),
    supabase
      .from("transactions")
      .select("transaction_date, type, amount, description, category:categories(name)")
      .gte("transaction_date", from)
      .order("transaction_date", { ascending: true })
      .limit(3000),
    supabase
      .from("budgets")
      .select("amount_limit, budget_month, budget_year, category:categories(name)")
      .gte("budget_year", year - 1),
  ]);
  for (const r of [profile, txns, budgets]) if (r.error) throw new Error(r.error.message);

  const rows = (txns.data ?? []) as unknown as {
    transaction_date: string; type: string; amount: string; description: string | null; category: { name: string } | null;
  }[];
  const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const csv = [
    "date,type,category,amount,note",
    ...rows.map((t) => [t.transaction_date, t.type, csvCell(t.category?.name ?? ""), t.amount, csvCell(t.description ?? "")].join(",")),
  ].join("\n");

  const budgetLines = ((budgets.data ?? []) as unknown as {
    amount_limit: string; budget_month: number; budget_year: number; category: { name: string } | null;
  }[])
    .sort((a, b) => a.budget_year - b.budget_year || a.budget_month - b.budget_month)
    .map((b) => `${b.budget_year}-${String(b.budget_month).padStart(2, "0")},${csvCell(b.category?.name ?? "")},${b.amount_limit}`);

  const p = profile.data as { full_name?: string; currency?: string } | null;
  return `<account>
Name: ${p?.full_name || "not set"}
Currency: ${p?.currency || "INR"}
Today: ${today.toISOString().slice(0, 10)} (current budget month ${year}-${String(month).padStart(2, "0")})

<transactions period="${from} to today" count="${rows.length}">
${csv}
</transactions>

<budgets>
month,category,monthly_limit
${budgetLines.join("\n") || "(none set)"}
</budgets>
</account>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return bad(405, "Method not allowed");

  const auth = req.headers.get("Authorization");
  if (!auth) return bad(401, "Not signed in");

  let turns: Turn[] | null = null;
  try {
    turns = parseTurns(await req.json());
  } catch {
    // fall through
  }
  if (!turns) return bad(400, "Send { messages: [{ role, content }] } ending with a user message.");

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return bad(401, "Not signed in");

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return bad(500, "The AI assistant isn't configured yet (missing GEMINI_API_KEY).");

  let accountContext: string;
  try {
    accountContext = await loadAccountContext(supabase);
  } catch (e) {
    return bad(500, `Couldn't load your data: ${(e as Error).message}`);
  }

  const history = turns;
  const ai = new GoogleGenAI({ apiKey });
  const abort = new AbortController();
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Gemini names the assistant role "model"
      const contents = history.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] }));
      let sent = false;
      try {
        let finish: string | undefined;
        for (let i = 0; ; i++) {
          try {
            const stream = await ai.models.generateContentStream({
              model: MODELS[i],
              contents,
              config: {
                systemInstruction: `${INSTRUCTIONS}\n\n${accountContext}`,
                maxOutputTokens: 8192,
                abortSignal: abort.signal,
              },
            });
            for await (const chunk of stream) {
              const text = chunk.text;
              if (text) {
                controller.enqueue(encoder.encode(text));
                sent = true;
              }
              finish = chunk.candidates?.[0]?.finishReason ?? finish;
            }
            break;
          } catch (e) {
            // Only switch models before any of the answer has been streamed
            const retryable = e instanceof ApiError && RETRYABLE.has(e.status);
            if (sent || !retryable || i === MODELS.length - 1 || abort.signal.aborted) throw e;
            console.warn(`${MODELS[i]} unavailable (${(e as ApiError).status}), trying ${MODELS[i + 1]}`);
            await new Promise((r) => setTimeout(r, 400));
          }
        }
        if (finish === "SAFETY" || finish === "PROHIBITED_CONTENT" || finish === "BLOCKLIST") {
          controller.enqueue(encoder.encode("\n\nSorry, I can't help with that one. Try asking about your spending, income or budgets."));
        } else if (finish === "MAX_TOKENS") {
          controller.enqueue(encoder.encode("\n\n(Answer cut short. Try a narrower question.)"));
        }
      } catch (e) {
        if (abort.signal.aborted) return;
        let msg = "Something went wrong talking to the AI. Please try again.";
        if (e instanceof ApiError) {
          if (e.status === 400 || e.status === 401 || e.status === 403) msg = "The AI assistant's API key is invalid or not allowed to use this model.";
          else if (e.status === 429) msg = "The free AI quota is used up for now. Try again in a minute (or tomorrow if the daily limit is reached).";
          else if (e.status === 503) msg = "Google's free AI models are all busy right now. Please try again in a minute.";
          else msg = `AI service error (${e.status}). Please try again.`;
        }
        console.error(e);
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
      } finally {
        try {
          controller.close();
        } catch {
          // already closed by a client disconnect
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(body, {
    headers: { ...cors, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
});
