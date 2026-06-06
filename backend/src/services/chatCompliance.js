/**
 * Compliance filter for the chatbot. Two layers:
 *   1. CORE_PATTERNS — hardcoded, cannot be deleted via admin UI.
 *      These are the non-negotiables for a prop firm: investment
 *      vocabulary, suitability framings, guaranteed-returns, risk
 *      marketing. If someone disables these, the firm is one bad
 *      chat away from a compliance complaint, so the floor is locked.
 *   2. Custom admin patterns — loaded from the chat_restrictions
 *      table at request time, mergeable with the core list.
 *
 * Both layers are applied as a SECOND line of defence. The primary
 * defence is the system prompt that tells the model not to use these
 * words in the first place. The filter exists for the rare cases
 * where the model slips.
 */

/**
 * Core compliance patterns. Each entry is { id, label, source, regex }.
 * The regex carries the /g flag so .test() advances state — we reset
 * lastIndex before each .test() to avoid silent skips.
 */
export const CORE_PATTERNS = [
  // Investment vocabulary — bot offers evaluations, not investments
  {
    id: 'invest',
    label: 'Investment vocabulary',
    source: 'invest, investing, investor, investments',
    regex: /\binvest(?:ing|ments?|or)?\b/gi,
  },
  {
    id: 'securities',
    label: 'Securities / brokerage / portfolio',
    source: 'securities, security, portfolio, brokerage',
    regex: /\b(?:securit(?:y|ies)|portfolio|brokerage)\b/gi,
  },
  {
    id: 'equity-investment',
    label: 'Equity investment framing',
    source: 'equity investment, equity market',
    regex: /\bequity (?:market|investment)\b/gi,
  },
  // Advice framings
  {
    id: 'financial-advice',
    label: 'Financial advice / advisor',
    source: 'financial advice, financial advisor, wealth management',
    regex: /\b(?:financial (?:advice|advisor)|wealth (?:management|advisor))\b/gi,
  },
  {
    id: 'suitability',
    label: 'Personal suitability framing',
    source: 'suitable for you, right for you, best/good investment',
    regex:
      /\b(?:suitable for you|right for you|best investment|good investment)\b/gi,
  },
  {
    id: 'recommend-buy',
    label: 'Recommend-to-buy framing',
    source: 'recommend that you buy / invest / purchase',
    regex: /\brecommend(?:ed)? (?:to|that you) (?:buy|purchase|invest)\b/gi,
  },
  // Guaranteed-returns framings
  {
    id: 'guaranteed-returns',
    label: 'Guaranteed returns / profits / income',
    source: 'guaranteed returns / profits / income / to make / earn',
    regex: /\bguaranteed (?:returns?|profits?|income|to (?:make|earn))\b/gi,
  },
  {
    id: 'risk-free',
    label: 'Risk-free / sure-fire',
    source: 'risk-free, risk free, sure-fire, surefire',
    regex: /\b(?:risk[- ]free|sure[- ]?fire)\b/gi,
  },
  // Risk-as-marketing — bot must describe drawdown factually
  {
    id: 'risk-marketing',
    label: 'Risk as marketing descriptor',
    source: 'low/high/minimal/no/zero risk, risky',
    regex: /\b(?:(?:low|high|minimal|no|zero)[- ]risk|risky)\b/gi,
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
    // Plain phrase: escape regex specials, wrap with word boundaries
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'gi');
  } catch {
    return null; // bad regex — silently ignore so the filter never crashes
  }
}

/**
 * Test a single text against the core patterns + an optional list of
 * custom patterns. Custom patterns are pre-fetched by the caller (the
 * service caches them).
 */
export function containsBannedTerms(text, customPatterns = []) {
  if (!text) return false;
  for (const p of CORE_PATTERNS) {
    p.regex.lastIndex = 0;
    if (p.regex.test(text)) return true;
  }
  for (const custom of customPatterns) {
    if (!custom || !custom.enabled) continue;
    const re = compileCustomPattern(custom);
    if (!re) continue;
    re.lastIndex = 0;
    if (re.test(text)) return true;
  }
  return false;
}

/**
 * Replace the entire response with the safe fallback if any pattern
 * matches. Whole-response replacement (not in-place redaction) so the
 * user never sees [REDACTED] tokens that would look broken and draw
 * attention to the violation.
 */
export function enforceCompliance(text, customPatterns = []) {
  if (containsBannedTerms(text, customPatterns)) return SAFE_FALLBACK;
  return text;
}

/** Expose the core patterns as plain data for the admin UI. */
export function describeCorePatterns() {
  return CORE_PATTERNS.map((p) => ({
    id: p.id,
    label: p.label,
    source: p.source,
  }));
}
