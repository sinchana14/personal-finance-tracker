// FinTrack AI assistant: answers questions about the signed-in user's own
// finances with Claude. The user's JWT is forwarded to Supabase, so RLS
// limits the data to their rows. Streams plain-text deltas back to the app.
//
// Secrets: ANTHROPIC_API_KEY (set in Supabase → Edge Functions → Secrets).
// SUPABASE_URL and SUPABASE_ANON_KEY are provided by the platform.

import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "claude-opus-5-5";
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

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return bad(500, "The AI assistant isn't configured yet (missing ANTHROPIC_API_KEY).");

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

  let accountContext: string;
  try {
    accountContext = await loadAccountContext(supabase);
  } catch (e) {
    return bad(500, `Couldn't load your data: ${(e as Error).message}`);
  }

  const client = new Anthropic({ apiKey });
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low" },
    // On a safety decline, the API re-runs the request on a suitable fallback model
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      { type: "text", text: INSTRUCTIONS },
      // Account data changes rarely between turns, so cache it with the instructions
      { type: "text", text: accountContext, cache_control: { type: "ephemeral" } },
    ],
    messages: turns,
  } as Parameters<typeof client.beta.messages.stream>[0]);

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\nSorry, I can't help with that one. Try asking about your spending, income or budgets."));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n(Answer cut short. Try a narrower question.)"));
        }
      } catch (e) {
        let msg = "Something went wrong talking to the AI. Please try again.";
        if (e instanceof Anthropic.AuthenticationError) msg = "The AI assistant's API key is invalid.";
        else if (e instanceof Anthropic.RateLimitError) msg = "The AI assistant is busy right now. Try again in a minute.";
        else if (e instanceof Anthropic.APIError) msg = `AI service error (${e.status}). Please try again.`;
        console.error(e);
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: { ...cors, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
});
