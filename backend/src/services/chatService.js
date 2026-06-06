import Anthropic from '@anthropic-ai/sdk';
import { all, get, run } from '../lib/db.js';
import { ApiError, genId, now } from '../lib/helpers.js';
import { getSettings } from './settingsService.js';
import { listPrograms } from './programService.js';
import { getAllContent } from './contentService.js';
import { enforceCompliance, SAFE_FALLBACK } from './chatCompliance.js';

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

/**
 * Compose the system prompt. Includes:
 *   - hard compliance rules (repeated at start and end — LLMs follow
 *     instructions better when they bookend the prompt)
 *   - live programs from the DB (so admin edits show up immediately)
 *   - selected FAQ items
 *   - selected content blocks
 *   - any admin-appended "systemExtras"
 */
async function buildSystemPrompt(settings) {
  const programs = await listPrograms();
  const content = await getAllContent();

  // FAQ — pull the top 25 items, ordered by category then position
  const faqs = await all(
    `SELECT i.question, i.answer, c.label AS "categoryLabel"
     FROM faq_items i JOIN faq_categories c ON c.id = i."categoryId"
     ORDER BY c."order" ASC, i."order" ASC
     LIMIT 25`,
  );

  // Format programs for the prompt — compact but complete
  const programsBlock = programs
    .map((p) => {
      const sizes = (p.sizes || []).map((s) => `$${s.toLocaleString()}`).join(', ');
      const prices = Object.entries(p.prices || {})
        .map(([s, v]) => `$${Number(s).toLocaleString()}: $${v}`)
        .join(', ');
      return [
        `### ${p.name}${p.popular ? ' [Popular]' : ''}`,
        `Category: ${p.category}`,
        `Account sizes: ${sizes || 'n/a'}`,
        `Pricing: ${prices || 'n/a'}`,
        `Platforms: ${(p.platforms || []).join(', ') || 'n/a'}`,
        `Rules:`,
        ...(p.rules || []).map((r) => `  - ${r}`),
      ].join('\n');
    })
    .join('\n\n');

  const faqBlock = faqs
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join('\n\n');

  // Pull a few key content blocks for "about the firm" context
  const aboutBlock = [
    content['about.paragraph1'],
    content['about.paragraph2'],
    content['about.paragraph3'],
  ]
    .filter(Boolean)
    .join('\n\n');

  const COMPLIANCE_RULES = `
CRITICAL COMPLIANCE RULES — NEVER VIOLATE:

1. Your name is Duncan. You are the official guide for Duncan Funded.
   If asked who you are, say: "I'm Duncan, the guide for Duncan Funded."
   Do not call yourself an "AI assistant", a "chatbot", or "Claude".

2. Duncan Funded sells EDUCATIONAL CHALLENGES and EVALUATION SERVICES.
   It does NOT sell investments, securities, or financial products.
   Refer to its offerings as "challenges", "evaluations", "programs",
   or "accounts" — NEVER as investments.

3. NEVER use these terms or any variants:
   - invest, investment, investor, investing
   - securities, brokerage, portfolio
   - financial advice, financial advisor, wealth management
   - "suitable for you", "best investment", "right for you"
   - guaranteed returns, guaranteed profits, risk-free, sure-fire

4. NEVER use "risk" as a marketing descriptor. Do not say "low risk",
   "no risk", "high risk", "risky", or "low-risk option". When the
   user asks about risk, redirect them to the specific concrete rules
   that limit losses — drawdown limits, daily loss limits, max loss
   limits, evaluation parameters. Discuss those rules factually
   without labelling them as "low" or "high" anything.

5. NEVER recommend a specific challenge as best for the user. You may
   describe what each challenge offers and let the user decide. If
   asked "which one should I pick?", describe the trade-offs neutrally
   and suggest they review the full details on the Programs page.

6. NEVER predict, project, or imply returns. Talk only about rules,
   profit splits as defined in the program, drawdown limits, and
   evaluation structure.

7. NEVER answer questions about specific markets, trading strategies,
   when to buy/sell anything, or how to make money trading. Politely
   decline and redirect to evaluation-specific topics.

8. For ANY question about taxes, legal status, regulatory licensing,
   refunds, account suspension, or personal data: defer to
   support@duncanfunded.com. Do not invent answers.

9. Use only the information in the KNOWLEDGE BASE below to answer
   product questions. If asked something not in the knowledge base,
   say you don't know and suggest contacting support.
`.trim();

  return [
    COMPLIANCE_RULES,
    '',
    '## ABOUT DUNCAN FUNDED',
    aboutBlock || 'Duncan Funded is a prop firm providing capital allocation challenges.',
    '',
    '## PROGRAMS / CHALLENGES',
    programsBlock || '(no programs configured)',
    '',
    '## FREQUENTLY ASKED QUESTIONS',
    faqBlock || '(no FAQs configured)',
    '',
    settings.chatbot.systemExtras
      ? `## ADDITIONAL ADMIN GUIDANCE\n${settings.chatbot.systemExtras}`
      : '',
    '',
    '## REMINDER OF CRITICAL RULES',
    COMPLIANCE_RULES,
    '',
    '## RESPONSE STYLE — STRICT',
    '- MAXIMUM 2-3 short sentences per reply. Never more unless the user explicitly asks for detail.',
    '- NO markdown formatting at all. Do NOT use **asterisks**, _underscores_, # headings, or - bullet lines. Just plain prose.',
    '- Quote program names exactly as they appear in the knowledge base (e.g. "Forex One Step Assessment") so they can be turned into clickable buttons.',
    '- Be direct and confident, not chatty. No filler like "Great question!" or "I would be happy to help."',
    '',
    '## INTENT GUIDANCE',
    '- If the user names an asset class (forex, crypto, futures, equities), mention the specific programs we offer in that category by name and tell them the details are on the Programs page.',
    '- If the user expresses interest in starting (words like "sign up", "begin", "get funded", "apply", "start"), confirm and tell them to use the buttons below your message.',
    '- If the user is exploring with no clear intent, ask ONE qualifying question: which asset class they trade.',
    '- Never tell them which program is "best" or "right for them". Surface the relevant options factually and let them decide.',
  ]
    .filter(Boolean)
    .join('\n');
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
  if (!client) {
    throw new ApiError(
      503,
      'Chat is temporarily unavailable. Please contact support@duncanfunded.com.',
    );
  }
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

  // Build context for the model — system prompt + previous turns + new turn
  const systemPrompt = await buildSystemPrompt(settings);
  const priorMessages = await loadSessionMessages(session.id, 30);

  let assistantText = '';
  let usageIn = 0;
  let usageOut = 0;
  try {
    const response = await client.messages.create({
      model: settings.chatbot.model,
      max_tokens: 280,
      system: systemPrompt,
      messages: priorMessages, // already includes the user turn we just persisted
    });
    // Concatenate text blocks
    assistantText = (response.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    usageIn = response.usage?.input_tokens || 0;
    usageOut = response.usage?.output_tokens || 0;
  } catch (e) {
    console.error('Anthropic API error:', e.message || e);
    throw new ApiError(
      502,
      'Our chat assistant is having trouble right now. Please try again in a moment or contact support@duncanfunded.com.',
    );
  }

  if (!assistantText) assistantText = SAFE_FALLBACK;

  // Compliance pass — replace whole response if banned terms detected
  const safeText = enforceCompliance(assistantText);

  await appendMessage(session.id, 'assistant', safeText, usageIn, usageOut);
  await recordUsage(usageIn, usageOut);

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
        href: '/programs',
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
