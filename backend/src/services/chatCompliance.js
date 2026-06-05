/**
 * Compliance filter for the chatbot. Duncan Funded sells educational
 * evaluations and does not sell investments / securities. The bot must
 * never use language that could be construed as investment advice.
 *
 * This is a SECOND line of defence — the primary defence is the system
 * prompt. But LLMs occasionally slip; this layer guarantees the user
 * never sees banned terminology even if the model produces it.
 */

// Patterns that must never appear in bot output.
// Each entry is a regex (case-insensitive, word-boundary aware).
// Some specifically target investment/advice framings; others target
// guaranteed-returns / "suitable for you" framings the SEC frowns on.
const BANNED_PATTERNS = [
  // Investment vocabulary — bot offers evaluations, not investments
  /\binvest(?:ing|ments?|or)?\b/gi,
  /\bsecurit(?:y|ies)\b/gi,
  /\bportfolio\b/gi,
  /\bequity (?:market|investment)\b/gi,
  /\bbrokerage\b/gi,
  /\bfinancial advice\b/gi,
  /\bfinancial advisor\b/gi,
  /\bwealth (?:management|advisor)\b/gi,
  // Personalised-suitability framing
  /\bsuitable for you\b/gi,
  /\bright for you\b/gi,
  /\bbest investment\b/gi,
  /\bgood investment\b/gi,
  /\brecommend(?:ed)? (?:to|that you) (?:buy|purchase|invest)\b/gi,
  // Guaranteed-returns framing
  /\bguaranteed (?:returns?|profits?|income)\b/gi,
  /\bguaranteed (?:to (?:make|earn))\b/gi,
  /\brisk[- ]free\b/gi,
  /\bsure[- ]?fire\b/gi,
];

// The deflection a user sees when a violation is detected.
const SAFE_FALLBACK =
  "I can share information about our challenges, evaluation rules, and payout policies, but I can't discuss that. Try asking about our programs, account sizes, or platforms — or contact support@duncanfunded.com for anything else.";

/**
 * Returns true if the assistant output contains a banned phrase.
 * Reset .lastIndex on each pattern because the /g flag is stateful.
 */
export function containsBannedTerms(text) {
  if (!text) return false;
  for (const p of BANNED_PATTERNS) {
    p.lastIndex = 0;
    if (p.test(text)) return true;
  }
  return false;
}

/**
 * Replace the entire response with the safe fallback if any banned
 * phrase appears. We do whole-response replacement (not in-place
 * redaction) so the user never sees half a sentence with [REDACTED]
 * in it — which would look broken AND draw attention to the violation.
 */
export function enforceCompliance(text) {
  if (containsBannedTerms(text)) return SAFE_FALLBACK;
  return text;
}

export { SAFE_FALLBACK };
