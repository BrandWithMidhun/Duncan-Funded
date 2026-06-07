import Anthropic from '@anthropic-ai/sdk';
import { all, get, run } from '../lib/db.js';
import { ApiError, genId, now } from '../lib/helpers.js';
import { getSettings } from './settingsService.js';
import { listPrograms } from './programService.js';
import { getAllContent } from './contentService.js';
import { enforceCompliance, SAFE_FALLBACK } from './chatCompliance.js';
import { getActiveCustomPatterns } from './chatRestrictionService.js';

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

/**
 * Detect trivial conversational inputs (greetings, acknowledgements,
 * farewells) and short-circuit the LLM call entirely. Saves real money
 * across many conversations.
 *
 * Returns null if the message isn't trivial — proceeds to the LLM
 * normally. Otherwise returns { reply, actions? } for the canned
 * response.
 *
 * Conservative on purpose: only matches messages that are 95%+
 * obviously trivial. Anything ambiguous (e.g. "is it good?") goes to
 * the LLM so we don't miss real questions.
 */
function detectSmallTalk(text) {
  const t = text.toLowerCase().trim().replace(/[!.?,]+$/g, '');
  if (t.length === 0 || t.length > 40) return null;

  // Greetings — answer + nudge with a useful question
  if (
    /^(hi|hello|hey|yo|hola|howdy|sup|hi there|hello there|hey there|good (morning|afternoon|evening))$/.test(
      t,
    )
  ) {
    return {
      reply:
        "Hi! I'm Duncan, the guide for Duncan Funded. I can answer questions about our challenges, rules, payouts, or platforms. What would you like to know?",
    };
  }

  // Thanks
  if (/^(thanks|thank you|thx|ty|cheers|appreciate it|much obliged)$/.test(t)) {
    return {
      reply: "You're welcome. Anything else I can help with?",
    };
  }

  // Acknowledgements / fillers
  if (/^(ok|okay|k|kk|cool|nice|got it|sounds good|alright|right|sure)$/.test(t)) {
    return {
      reply: 'Understood. Let me know if you have another question.',
    };
  }

  // Farewells
  if (/^(bye|goodbye|cya|see ya|see you|later|gtg|gn|good night)$/.test(t)) {
    return {
      reply: 'Take care. Come back anytime.',
    };
  }

  // Tests / pings
  if (/^(test|testing|ping|hello\?|are you there|you there)$/.test(t)) {
    return {
      reply:
        "I'm here. Ask me about Duncan Funded's challenges, rules, payouts, or supported platforms.",
    };
  }

  return null;
}

/**
 * Compose the system prompt as TWO blocks suitable for Anthropic
 * prompt caching:
 *   - STATIC block: compliance rules + programs + about + admin
 *     extras. Same across requests until admin edits something.
 *     Marked with cache_control so Anthropic caches it (5-min TTL).
 *   - DYNAMIC block: top-N FAQ matches scored against the user's
 *     message. Changes per request, so not cached.
 *
 * Token math vs the previous version:
 *   - Compliance rules stated ONCE (was twice) — saves ~600 tokens
 *   - Compact program format on one line each — saves ~600 tokens
 *   - FAQ filtered to top 6 by keyword relevance (was top 25) — saves
 *     ~1100 tokens on average
 *   - About paragraph trimmed to one — saves ~100 tokens
 *   - Conversation context capped at 8 turns (was 30) elsewhere
 *
 * Combined effect: ~3000 -> ~1500 input tokens per request, then
 * the static ~1200 of that is cached on every subsequent request
 * within 5 minutes, so cache-hit cost is ~150 tokens for the static
 * portion (10% of normal price for cached input).
 */
async function buildSystemPrompt(settings, programs, userMessage) {
  const content = await getAllContent();

  // ---- Compliance rules (single block, no duplication) ----
  const COMPLIANCE_RULES = `
CRITICAL COMPLIANCE RULES — NEVER VIOLATE:

1. Your name is Duncan. You are the official guide for Duncan Funded.
   If asked who you are, say: "I'm Duncan, the guide for Duncan Funded."
   Never call yourself an AI assistant, chatbot, or Claude.

2. Duncan Funded sells EDUCATIONAL CHALLENGES and EVALUATION SERVICES — not
   investments. Always refer to offerings as "challenges", "evaluations",
   "programs", or "accounts". Never "investments".

3. NEVER use these terms or variants: invest, investing, investment, investor,
   securities, brokerage, portfolio, financial advice, financial advisor,
   wealth management, "suitable for you", "best investment", "right for you",
   guaranteed returns, guaranteed profits, risk-free, sure-fire.

4. NEVER use "risk" as a marketing descriptor (no "low risk", "no risk",
   "high risk", "risky"). When a user asks about risk, redirect to the
   concrete rules that limit losses — drawdown limits, daily loss limits,
   max loss limits — discussed factually without "low/high" labels.

5. NEVER recommend a specific challenge as "best" or "right for the user".
   Describe what each offers and let them decide. If asked "which should
   I pick?", give neutral trade-offs and point to the Programs page.

6. NEVER predict, project, or imply returns. Only describe rules, profit
   splits as defined, drawdown limits, and evaluation structure.

7. NEVER answer questions about specific markets, trading strategies, when
   to buy/sell anything, or "how to make money trading". Decline and
   redirect to evaluation-specific topics.

8. For ANY question about taxes, legal status, regulatory licensing,
   refunds, account suspension, or personal data: defer to
   support@duncanfunded.com. Do not invent answers.

9. Use only the KNOWLEDGE BASE below. If asked something not in it, say
   you don't know and suggest contacting support@duncanfunded.com.

10. Quote numbers (prices, drawdown percentages, account sizes) EXACTLY
    from the knowledge base. Never paraphrase or round.
`.trim();

  // ---- Programs — compact one-liner each ----
  const formatProgram = (p) => {
    const sizes = Array.isArray(p.sizes) && p.sizes.length
      ? `${Math.min(...p.sizes) >= 1000 ? '$' + Math.min(...p.sizes) / 1000 + 'K' : '$' + Math.min(...p.sizes)}-${Math.max(...p.sizes) >= 1000 ? '$' + Math.max(...p.sizes) / 1000 + 'K' : '$' + Math.max(...p.sizes)}`
      : 'sizes n/a';
    const prices = p.prices && Object.keys(p.prices).length
      ? `$${Math.min(...Object.values(p.prices).map(Number))}-$${Math.max(...Object.values(p.prices).map(Number))}`
      : 'pricing n/a';
    const platforms = (p.platforms || []).join('/') || 'n/a';
    const rules = (p.rules || []).join('; ') || 'no rules listed';
    return `${p.name} (${p.category})${p.popular ? ' [POPULAR]' : ''}: ${sizes}, ${prices}. Platforms: ${platforms}. Rules: ${rules}`;
  };
  const programsBlock = programs.map(formatProgram).join('\n') || '(no programs configured)';

  // ---- About — one paragraph only ----
  const aboutBlock =
    content['about.paragraph1'] ||
    'Duncan Funded is a prop firm providing capital allocation challenges.';

  // ---- Static block (cacheable) ----
  const staticText = [
    COMPLIANCE_RULES,
    '',
    '## ABOUT DUNCAN FUNDED',
    aboutBlock,
    '',
    '## PROGRAMS / CHALLENGES (use exact names verbatim)',
    programsBlock,
    settings.chatbot.systemExtras
      ? `\n## ADMIN GUIDANCE\n${settings.chatbot.systemExtras}`
      : '',
    '',
    '## RESPONSE STYLE — STRICT',
    '- MAXIMUM 2-3 short sentences. No exceptions unless user explicitly asks for detail.',
    '- When asked to "list" or "show" programs, name them only (grouped by asset class if helpful). Do NOT include prices, rules, or descriptions in lists — the user can click the chip below or visit /programs for those.',
    '- NO markdown. No asterisks, headings, or bullet lines. Plain prose only.',
    '- Quote program names exactly as listed so action chips can trigger.',
    '- Quote numeric values (drawdown %, prices, account sizes) EXACTLY when asked.',
    '- Be direct, no filler like "Great question!" or "I would be happy to help."',
    '',
    '## INTENT GUIDANCE',
    '- If user names an asset class (forex/crypto/futures/equities), name the relevant programs by exact spelling.',
    '- If user expresses intent to start (sign up, begin, apply, get funded), confirm and tell them to use buttons below.',
    '- If exploring with no clear intent, ask ONE question: which asset class they trade.',
    '- Never call any program "best" or "right for them".',
  ]
    .filter(Boolean)
    .join('\n');

  // ---- Dynamic block: FAQ filtered by relevance to the user's question ----
  const dynamicText = await buildRelevantFaqBlock(userMessage);

  return { staticText, dynamicText };
}

/**
 * Pull FAQs from the DB and score each against the user's message.
 * Score = number of distinct ≥3-letter words from the question that
 * appear in the FAQ question or answer (case-insensitive). Returns
 * top 6 most relevant, or top 6 by category order if no words match.
 *
 * Cheaper than embeddings, deterministic, and good enough for ~50-200
 * FAQs (your scale). Future upgrade: embeddings + cosine similarity.
 */
async function buildRelevantFaqBlock(userMessage) {
  const faqs = await all(
    `SELECT i.question, i.answer
     FROM faq_items i JOIN faq_categories c ON c.id = i."categoryId"
     ORDER BY c."order" ASC, i."order" ASC
     LIMIT 100`,
  );
  if (faqs.length === 0) return '## FAQ\n(no FAQs configured)';

  const STOP = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'how',
    'what', 'when', 'where', 'why', 'who', 'this', 'that', 'with', 'from',
    'have', 'has', 'will', 'your', 'our', 'about', 'into', 'they', 'them',
  ]);
  const tokens = String(userMessage || '')
    .toLowerCase()
    .match(/[a-z0-9]{3,}/g) || [];
  const queryWords = [...new Set(tokens.filter((w) => !STOP.has(w)))];

  const scored = faqs.map((f, idx) => {
    const haystack = `${f.question} ${f.answer}`.toLowerCase();
    let score = 0;
    for (const w of queryWords) {
      if (haystack.includes(w)) score += 1;
    }
    return { f, score, idx };
  });
  // If query has content words, score-then-order matters. If not (greetings,
  // empty), keep category order so the model still sees a representative slice.
  scored.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));
  const top = scored.slice(0, 6);

  const block = top
    .map(({ f }) => `Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n');
  return `## RELEVANT FAQ\n${block}`;
}

// ---- Rate limiting ----

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

async function checkRateLimit(ipAddress, settings) {
  if (!ipAddress) return; // can't enforce without IP — let it through

  const sinceHour = new Date(Date.now() - HOUR_MS).toISOString();
  const sinceDay = new Date(Date.now() - DAY_MS).toISOString();

  const hourly = await get(
    'SELECT COUNT(*) AS n FROM chat_rate_limit WHERE "ipAddress" = ? AND "createdAt" >= ?',
    [ipAddress, sinceHour],
  );
  if (Number(hourly.n) >= settings.chatbot.ratePerHour) {
    throw new ApiError(
      429,
      `You've sent a lot of messages recently. Please wait a bit before sending more.`,
    );
  }
  const daily = await get(
    'SELECT COUNT(*) AS n FROM chat_rate_limit WHERE "ipAddress" = ? AND "createdAt" >= ?',
    [ipAddress, sinceDay],
  );
  if (Number(daily.n) >= settings.chatbot.ratePerDay) {
    throw new ApiError(
      429,
      `You've reached today's chat limit. Please come back tomorrow or contact support@duncanfunded.com.`,
    );
  }

  // Garbage-collect rows older than 25 hours so the table stays small.
  await run(
    'DELETE FROM chat_rate_limit WHERE "createdAt" < ?',
    [new Date(Date.now() - 25 * HOUR_MS).toISOString()],
  );
  await run(
    'INSERT INTO chat_rate_limit ("ipAddress", "createdAt") VALUES (?, ?)',
    [ipAddress, now()],
  );
}

// ---- Monthly token budget ----

function currentYearMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function checkMonthlyBudget(settings) {
  const ym = currentYearMonth();
  const row = await get(
    'SELECT "tokensIn", "tokensOut" FROM chat_usage WHERE "yearMonth" = ?',
    [ym],
  );
  if (!row) return;
  const total = Number(row.tokensIn) + Number(row.tokensOut);
  if (total >= settings.chatbot.monthlyTokenBudget) {
    throw new ApiError(
      503,
      'Our chat assistant has reached its monthly limit. Please contact support@duncanfunded.com.',
    );
  }
}

async function recordUsage(tokensIn, tokensOut) {
  const ym = currentYearMonth();
  await run(
    `INSERT INTO chat_usage ("yearMonth", "tokensIn", "tokensOut", "messageCount", "updatedAt")
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT ("yearMonth") DO UPDATE SET
       "tokensIn" = chat_usage."tokensIn" + EXCLUDED."tokensIn",
       "tokensOut" = chat_usage."tokensOut" + EXCLUDED."tokensOut",
       "messageCount" = chat_usage."messageCount" + 1,
       "updatedAt" = EXCLUDED."updatedAt"`,
    [ym, Number(tokensIn) || 0, Number(tokensOut) || 0, now()],
  );
}

// ---- Session + message persistence ----

async function ensureSession(sessionId, visitorId, ipAddress, userAgent) {
  if (sessionId) {
    const existing = await get('SELECT * FROM chat_sessions WHERE id = ?', [sessionId]);
    if (existing) return existing;
  }
  const id = sessionId || genId();
  const ts = now();
  await run(
    `INSERT INTO chat_sessions (id, "visitorId", "ipAddress", "userAgent", "createdAt", "lastMessageAt")
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO NOTHING`,
    [id, visitorId || id, ipAddress || null, (userAgent || '').slice(0, 500), ts, ts],
  );
  return get('SELECT * FROM chat_sessions WHERE id = ?', [id]);
}

async function appendMessage(sessionId, role, content, tokensIn = 0, tokensOut = 0) {
  await run(
    `INSERT INTO chat_messages (id, "sessionId", role, content, "tokensIn", "tokensOut", "createdAt")
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [genId(), sessionId, role, content, tokensIn, tokensOut, now()],
  );
  await run('UPDATE chat_sessions SET "lastMessageAt" = ? WHERE id = ?', [now(), sessionId]);
}

async function loadSessionMessages(sessionId, limit) {
  const rows = await all(
    `SELECT role, content FROM chat_messages
     WHERE "sessionId" = ?
     ORDER BY "createdAt" ASC
     LIMIT ?`,
    [sessionId, limit],
  );
  // Format for Anthropic API
  return rows.map((r) => ({ role: r.role, content: r.content }));
}

// ---- Main chat handler (non-streaming for simplicity & reliability) ----

export async function chat({ sessionId, visitorId, message, ipAddress, userAgent }) {
  const settings = await getSettings();
  if (!settings.chatbot.enabled) {
    throw new ApiError(503, 'Chat is currently disabled.');
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new ApiError(400, 'message is required');
  }
  const trimmed = message.trim().slice(0, 2000);

  await checkRateLimit(ipAddress, settings);
  await checkMonthlyBudget(settings);

  // Open or fetch the session
  const session = await ensureSession(sessionId, visitorId, ipAddress, userAgent);

  // Cap per-session message count
  const count = await get(
    'SELECT COUNT(*) AS n FROM chat_messages WHERE "sessionId" = ?',
    [session.id],
  );
  if (Number(count.n) >= settings.chatbot.maxMessagesPerSession * 2) {
    throw new ApiError(
      429,
      "This conversation has reached its length limit. Please start a new conversation.",
    );
  }

  // Persist user message first so it shows in admin even if the API call fails
  await appendMessage(session.id, 'user', trimmed);

  // ---- Small-talk shortcut ----
  // Trivial greetings / acknowledgements don't need an LLM call. Skipping
  // here saves 100% of input tokens for these messages, which in real
  // usage are 20-30% of all chats. We still persist + return a sensible,
  // compliance-safe canned reply.
  const small = detectSmallTalk(trimmed);
  if (small) {
    await appendMessage(session.id, 'assistant', small.reply, 0, 0);
    return {
      sessionId: session.id,
      reply: small.reply,
      actions: small.actions || [],
    };
  }

  // Build context for the model. Prompt is split into two blocks
  // for Anthropic prompt caching:
  //   - static (compliance + programs + about + style) — cache_control set
  //   - dynamic (FAQ filtered to user's question) — not cached
  // Conversation history capped at 8 turns (was 30) — enough for chat
  // continuity, big token saving on long sessions.
  const programs = await listPrograms();
  const { staticText, dynamicText } = await buildSystemPrompt(
    settings,
    programs,
    trimmed,
  );
  const customPatterns = await getActiveCustomPatterns();
  const priorMessages = await loadSessionMessages(session.id, 8);

  // Now we need a real API call — guard for missing key.
  if (!client) {
    throw new ApiError(
      503,
      'Chat is temporarily unavailable. Please contact support@duncanfunded.com.',
    );
  }

  let assistantText = '';
  let usageIn = 0;
  let usageOut = 0;
  let cacheRead = 0;
  let cacheCreate = 0;
  try {
    const response = await client.messages.create({
      model: settings.chatbot.model,
      max_tokens: 280,
      // System as array of blocks. The static block gets cache_control
      // (5-min TTL ephemeral cache). Anthropic's minimum cache size is
      // ~1024 tokens for Haiku; our static block is well above that.
      system: [
        {
          type: 'text',
          text: staticText,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: dynamicText,
        },
      ],
      messages: priorMessages,
    });
    assistantText = (response.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    usageIn = response.usage?.input_tokens || 0;
    usageOut = response.usage?.output_tokens || 0;
    cacheRead = response.usage?.cache_read_input_tokens || 0;
    cacheCreate = response.usage?.cache_creation_input_tokens || 0;
    if (cacheRead || cacheCreate) {
      console.log(
        `[chat] tokens in=${usageIn} out=${usageOut} cache_read=${cacheRead} cache_create=${cacheCreate}`,
      );
    }
  } catch (e) {
    console.error('Anthropic API error:', e.message || e);
    throw new ApiError(
      502,
      'Our chat assistant is having trouble right now. Please try again in a moment or contact support@duncanfunded.com.',
    );
  }

  if (!assistantText) assistantText = SAFE_FALLBACK;

  // Compliance pass — core patterns + admin-added custom patterns.
  // If anything matches, the whole reply is replaced with SAFE_FALLBACK.
  const safeText = enforceCompliance(assistantText, customPatterns);

  // Count cached input as input for budget purposes — Anthropic still
  // bills it, just at 10% of normal. We track total so budget caps work.
  const totalIn = usageIn + cacheRead + cacheCreate;
  await appendMessage(session.id, 'assistant', safeText, totalIn, usageOut);
  await recordUsage(totalIn, usageOut);

  // Detect actionable elements to offer the user inline buttons.
  // Stays compliance-safe: we only surface programs Duncan already
  // mentioned by name. We never inject "best for you" picks.
  const actions = detectActions({
    assistantText: safeText,
    userMessage: trimmed,
    programs,
    beginChallengeUrl: settings.urls.beginChallenge,
  });

  return {
    sessionId: session.id,
    reply: safeText,
    actions,
  };
}

/**
 * Inspect the assistant reply + the user message and build up to 3
 * action chips. Order: program mentions first, then a single signup
 * CTA if the user's message expresses intent to start.
 */
function detectActions({ assistantText, userMessage, programs, beginChallengeUrl }) {
  const actions = [];
  const seen = new Set();

  // 1. Program mentions in the assistant text — surface them as
  //    clickable "View Program" chips.
  const lowerText = assistantText.toLowerCase();
  for (const p of programs) {
    if (seen.size >= 2) break; // cap programs at 2 so the row stays clean
    const name = p.name.toLowerCase();
    if (!name) continue;
    if (lowerText.includes(name)) {
      seen.add(p.id);
      actions.push({
        type: 'program',
        label: p.name,
        // The configurator reads `?p=` on mount and pre-selects this program.
        href: `/programs?p=${encodeURIComponent(p.id)}`,
      });
    }
  }

  // 2. Signup intent from the user — keyword scan.
  //    Keywords stay compliance-safe (no "invest", "buy stock", etc.).
  const intentRe =
    /\b(sign[- ]?up|signup|register|start (?:a |the )?challenge|begin (?:a |the )?challenge|get(?:ting)? funded|apply|join|how (?:do|can) i start|how to start|let'?s? start|i want to start|ready to start|begin my|start my)\b/i;
  if (intentRe.test(userMessage) || intentRe.test(assistantText)) {
    if (beginChallengeUrl) {
      actions.push({
        type: 'signup',
        label: 'Start a Challenge',
        href: beginChallengeUrl,
        external: true,
      });
    }
  }

  // 3. If the assistant told them to check the Programs page but no
  //    specific program was matched, add a generic "Browse Programs".
  const mentionsProgramsPage = /\bprograms? page\b|\/programs\b|\bbrowse programs\b/i.test(
    assistantText,
  );
  if (mentionsProgramsPage && !actions.some((a) => a.type === 'program' || a.href === '/programs')) {
    actions.push({
      type: 'browse',
      label: 'Browse All Programs',
      href: '/programs',
    });
  }

  return actions.slice(0, 3);
}

// ---- Admin: list and view chats ----

export async function adminListSessions({ limit = 50, offset = 0 } = {}) {
  const rows = await all(
    `SELECT s.*,
       (SELECT COUNT(*) FROM chat_messages m WHERE m."sessionId" = s.id) AS "messageCount",
       (SELECT content FROM chat_messages m WHERE m."sessionId" = s.id AND m.role = 'user'
        ORDER BY m."createdAt" ASC LIMIT 1) AS "firstUserMessage"
     FROM chat_sessions s
     ORDER BY s."lastMessageAt" DESC
     LIMIT ? OFFSET ?`,
    [Number(limit) || 50, Number(offset) || 0],
  );
  return rows.map((r) => ({
    id: r.id,
    visitorId: r.visitorId,
    ipAddress: r.ipAddress,
    createdAt: r.createdAt,
    lastMessageAt: r.lastMessageAt,
    flagged: r.flagged === true || r.flagged === 't',
    exemplar: r.exemplar === true || r.exemplar === 't',
    messageCount: Number(r.messageCount) || 0,
    firstUserMessage: r.firstUserMessage || '',
  }));
}

export async function adminGetSession(id) {
  const session = await get('SELECT * FROM chat_sessions WHERE id = ?', [id]);
  if (!session) throw new ApiError(404, 'Chat not found');
  const messages = await all(
    `SELECT id, role, content, "tokensIn", "tokensOut", "createdAt"
     FROM chat_messages WHERE "sessionId" = ?
     ORDER BY "createdAt" ASC`,
    [id],
  );
  return {
    id: session.id,
    visitorId: session.visitorId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    lastMessageAt: session.lastMessageAt,
    flagged: session.flagged === true || session.flagged === 't',
    exemplar: session.exemplar === true || session.exemplar === 't',
    messages,
  };
}

export async function adminSetFlags(id, { flagged, exemplar }) {
  const session = await get('SELECT * FROM chat_sessions WHERE id = ?', [id]);
  if (!session) throw new ApiError(404, 'Chat not found');
  await run(
    `UPDATE chat_sessions SET
       flagged = COALESCE(?, flagged),
       exemplar = COALESCE(?, exemplar)
     WHERE id = ?`,
    [
      flagged === undefined ? null : !!flagged,
      exemplar === undefined ? null : !!exemplar,
      id,
    ],
  );
  return adminGetSession(id);
}

export async function adminDeleteSession(id) {
  const res = await run('DELETE FROM chat_sessions WHERE id = ?', [id]);
  if (!res) throw new ApiError(404, 'Chat not found');
  return { id };
}

export async function adminUsageThisMonth() {
  const ym = currentYearMonth();
  const row = await get(
    'SELECT * FROM chat_usage WHERE "yearMonth" = ?',
    [ym],
  );
  return {
    yearMonth: ym,
    tokensIn: row ? Number(row.tokensIn) : 0,
    tokensOut: row ? Number(row.tokensOut) : 0,
    messageCount: row ? Number(row.messageCount) : 0,
  };
}
