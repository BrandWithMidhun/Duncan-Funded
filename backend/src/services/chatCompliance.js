/**
 * Compliance filter for the Duncan chatbot.
 *
 * Architecture (UPDATED 2026-06):
 *
 *   1. Primary defence: the system prompt instructs Duncan to avoid
 *      advisory framings, guaranteed-returns claims, and specific
 *      buy/sell recommendations. The model is the first line of defence
 *      because it understands context.
 *
 *   2. Secondary defence: this surgical regex filter on Duncan's OUTPUT.
 *      Catches only phrases that have NO legitimate use in our domain
 *      (a prop trading firm). Generic financial vocabulary like "invest"
 *      or "portfolio" is NOT blocked — those words have many legitimate
 *      contexts (e.g. "invest your time in practice" or "your trading
 *      portfolio"). The previous version of this filter blocked them
 *      indiscriminately, which caused all kinds of false positives:
 *      legitimate questions about programs / rules / accounts got
 *      replaced with the safe fallback because Duncan's perfectly-fine
 *      answer happened to include the word "investment" somewhere.
 *
 *   3. Diagnostics: when the filter fires, we return WHICH pattern
 *      matched and a snippet of the matching text. The caller (chat
 *      service) stores this on the message row so admins can see
 *      "[Filtered by guaranteed-returns]" in the admin chat viewer
 *      and investigate false positives.
 *
 * Custom admin patterns (from the chat_restrictions table) are still
 * applied on top of the CORE_PATTERNS. Admins can disable individual
 * custom patterns from /admin/chat-restrictions.
 */

/**
 * Core patterns. Each entry: { id, label, source, regex }.
 *
 * Design principles for choosing what's in this list:
 *   - Phrase MUST have no plausible legitimate use in our domain
 *   - Block specific framings, not generic words
 *   - Prefer multi-word matches over single-word matches
 */
export const CORE_PATTERNS = [
  // --- Guaranteed-returns framings (never legitimate) ---
  {
    id: 'guaranteed-returns',
    label: 'Guaranteed returns/profits claim',
    source: 'guaranteed returns / profits / income / earnings / to make money',
    regex:
      /\bguaranteed\s+(?:returns?|profits?|income|earnings|money|to\s+(?:make|earn|profit))\b/gi,
  },
  // --- Risk-free / sure-fire (false promise) ---
  {
    id: 'risk-free',
    label: 'Risk-free / sure-fire framing',
    source: 'risk-free, risk free, sure-fire, surefire',
    regex: /\b(?:risk[- ]free|sure[- ]?fire)\b/gi,
  },
  // --- Risk-as-marketing (narrow — only marketing framings) ---
  // NOTE: deliberately does NOT match "high-risk" or "risky" —
  // those have legitimate descriptive uses.
  {
    id: 'risk-marketing',
    label: 'Risk minimization marketing claim',
    source: 'low risk, no risk, minimal risk, zero risk',
    regex: /\b(?:low|no|minimal|zero)[- ]risk\b/gi,
  },
  // --- Explicit "I recommend you buy/invest" framings ---
  {
    id: 'recommend-buy',
    label: 'Direct buy/invest recommendation',
    source: 'recommend (that you|to) buy/purchase/invest',
    regex:
      /\b(?:i\s+)?recommend(?:ed|s|ing)?\s+(?:that\s+you\s+|to\s+|you\s+)?(?:buy|purchase|invest\s+in)\b/gi,
  },
  // --- Financial advisor / wealth management framings ---
  // Duncan is not a financial advisor and must never imply otherwise.
  {
    id: 'financial-advice',
    label: 'Financial advice / advisor framing',
    source: 'financial advice, financial advisor, wealth management',
    regex: /\b(?:financial\s+(?:advice|advisor)|wealth\s+(?:management|advisor))\b/gi,
  },
  // --- Suitability framings ("right for you" / "best for you") ---
  // Suitability framings imply Duncan can assess what's appropriate
  // for the user's situation, which crosses into advice territory.
  {
    id: 'suitability',
    label: 'Personal suitability claim',
    source: 'right/best/suitable investment/program/account for you',
    regex:
      /\b(?:right|best|suitable|good|ideal|perfect)\s+(?:investment|program|account|challenge|plan|option|choice)\s+for\s+(?:you|me)\b/gi,
  },
  // --- "Is a good investment" (explicit endorsement framing) ---
  {
    id: 'good-investment',
    label: '"Is a good/great investment" framing',
    source: 'is a good investment, is a great investment',
    regex:
      /\b(?:is|are|would\s+be|will\s+be)\s+(?:a\s+|an\s+)?(?:good|great|smart|wise|excellent|safe|sound)\s+investment\b/gi,
  },
];

// The deflection a user sees when ANY violation is detected.
export const SAFE_FALLBACK =
  "I can share information about our challenges, evaluation rules, and payout policies, but I can't discuss that. Try asking about our programs, account sizes, or platforms — or contact support@duncanfunded.com for anything else.";

/**
 * Compile an admin-defined pattern. If isRegex is true, the pattern
 * string is treated as raw regex source (defensively wrapped to never
 * crash the filter on a malformed entry). Otherwise it's treated as
 * a plain phrase and we wrap with word boundaries.
 */
function compileCustomPattern({ pattern, isRegex }) {
  if (!pattern || typeof pattern !== 'string') return null;
  const trimmed = pattern.trim();
  if (!trimmed) return null;
  try {
    if (isRegex) {
      return new RegExp(trimmed, 'gi');
    }
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'gi');
  } catch {
    return null;
  }
}

/**
 * Run the full compliance check and return diagnostic info.
 *
 *   { blocked: false }                          -> response is clean
 *   { blocked: true, pattern: { id, label,      -> response hit a pattern;
 *     source }, match: "matched text snippet"}     the caller should
 *                                                 substitute SAFE_FALLBACK.
 *
 * The match snippet is up to 80 chars surrounding the hit, used purely
 * for admin diagnostics in the chat viewer.
 */
export function analyzeText(text, customPatterns = []) {
  if (!text || typeof text !== 'string') return { blocked: false };

  for (const p of CORE_PATTERNS) {
    p.regex.lastIndex = 0;
    const m = p.regex.exec(text);
    if (m) {
      return {
        blocked: true,
        pattern: { id: p.id, label: p.label, source: p.source, kind: 'core' },
        match: extractContext(text, m.index, m[0].length),
      };
    }
  }

  for (const custom of customPatterns) {
    if (!custom || !custom.enabled) continue;
    const re = compileCustomPattern(custom);
    if (!re) continue;
    re.lastIndex = 0;
    const m = re.exec(text);
    if (m) {
      return {
        blocked: true,
        pattern: {
          id: `custom:${custom.id || custom.pattern}`,
          label: custom.notes || custom.pattern,
          source: custom.pattern,
          kind: 'custom',
        },
        match: extractContext(text, m.index, m[0].length),
      };
    }
  }

  return { blocked: false };
}

/** Extract a short snippet around the matched index for admin diagnostics. */
function extractContext(text, index, length) {
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + length + 30);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return prefix + text.slice(start, end) + suffix;
}

// ---- Legacy API kept for backwards compatibility ----

/** True if any pattern matches. Use analyzeText() in new code for diagnostics. */
export function containsBannedTerms(text, customPatterns = []) {
  return analyzeText(text, customPatterns).blocked;
}

/** Replace the response with SAFE_FALLBACK if any pattern matches. */
export function enforceCompliance(text, customPatterns = []) {
  return analyzeText(text, customPatterns).blocked ? SAFE_FALLBACK : text;
}

/** Plain data view of core patterns for the admin UI. */
export function describeCorePatterns() {
  return CORE_PATTERNS.map((p) => ({
    id: p.id,
    label: p.label,
    source: p.source,
  }));
}
