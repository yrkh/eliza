/*
    ELIZA (Doctor-style) — test-friendly version
    - Pattern matching w/ keyword priority
    - Pronoun reflection (you->I, my->your, etc.)
    - Templates keep matched word so tests pass ("help", "rude", "tired")
*/

/* ---------------------
   Reflection dictionary
---------------------- */
const gReflections = new Map([
  ["am", "are"],
  ["are", "am"],
  ["i", "you"],
  ["you", "I"],
  ["my", "your"],
  ["your", "my"],
  ["me", "you"],
  ["mine", "yours"],
  ["yours", "mine"],
  ["myself", "yourself"],
  ["yourself", "myself"],
  ["i'm", "you're"],
  ["you're", "I'm"]
]);

function i_reflect(text) {
  return text
    .split(/\b/)
    .map(tok => {
      const lower = tok.toLowerCase();
      if (!gReflections.has(lower)) return tok;
      const reflected = gReflections.get(lower);
      // Preserve capitalization if original looked capitalized
      if (/^[A-Z]/.test(tok)) {
        return reflected.charAt(0).toUpperCase() + reflected.slice(1);
      }
      return reflected;
    })
    .join("");
}

/* ---------------------
   Patterns w/ priority
---------------------- */
const gElizaPatterns = [
  // High-priority “because”
  {
    pattern: /because\s+(.*)/i,
    responses: [
      "Is that the real reason?",
      "What other reasons come to mind?",
      "Does that explanation satisfy you?"
    ]
  },
  // Greetings
  {
    pattern: /^(hi|hello|hey)\b/i,
    responses: [
      "Hello. How are you feeling today?",
      "Hi there. What would you like to discuss?",
      "Hello—what’s on your mind?"
    ]
  },
  // Apologies
  {
    pattern: /\bsorry\b/i,
    responses: [
      "No need to be sorry.",
      "Please don't apologize.",
      "What are you feeling sorry about?"
    ]
  },
  // “I need …”  (must keep matched word for tests)
  {
    pattern: /I\s+need\s+(.*)/i,
    responses: [
      "Why do you need pMatched?",
      "Would it help to get pMatched?",
      "Are you sure you need pMatched?"
    ],
    reflect: true
  },
  // “You are …”  (must keep matched word for tests)
  {
    pattern: /You\s+are\s+(.*)/i,
    responses: [
      "What makes you think I am pMatched?",
      "Why do you say I am pMatched?",
      "Does it bother you if I am pMatched?"
    ],
    reflect: true
  },
  // “I am …”  (must keep matched word for tests)
  {
    pattern: /I\s+am\s+(.*)/i,
    responses: [
      "How long have you been pMatched?",
      "Do you enjoy being pMatched?",
      "Why do you say you're pMatched?"
    ],
    reflect: true
  },
  // Questions
  {
    pattern: /\?$/i,
    responses: [
      "Why do you ask that?",
      "What do you think?",
      "How would an answer help you?"
    ]
  },
  // Catch some “my …”
  {
    pattern: /\bmy\s+(.*)/i,
    responses: [
      "Tell me more about your pMatched.",
      "Why is your pMatched important?",
      "How does your pMatched relate to how you feel?"
    ],
    reflect: true
  }
];

/* ---------------------
   Fallbacks
---------------------- */
const gFallbackResponses = [
  "Tell me more about that.",
  "What do you mean by that?",
  "How does that make you feel?",
  "Can you elaborate?",
  "That’s quite interesting..."
];

/* ---------------------
   Helpers
---------------------- */
function i_selectRandomResponse(arr) {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function i_fillTemplate(template, match, useReflection) {
  // match[1] is the captured text
  let captured = match[1] ? match[1].trim() : "";
  if (useReflection && captured) captured = i_reflect(captured);
  return template.replace(/pMatched/g, captured);
}

// Lightweight logger to BroadcastChannel (browser only)
function i_postLog(type, data) {
  try {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const ch = window.__elizaLogChannel || (window.__elizaLogChannel = new BroadcastChannel('eliza-logs'));
    ch.postMessage({ type, data, ts: Date.now(), from: 'jf_eliza_2.js' });
  } catch (_) { /* ignore logging errors */ }
}

function i_findPatternMatch(input) {
  let ruleIndex = 0;
  for (const rule of gElizaPatterns) {
    const m = input.match(rule.pattern);
    if (m) {
      const tmpl = i_selectRandomResponse(rule.responses);
      // Log matched rule details
      i_postLog('matched', {
        ruleIndex,
        pattern: String(rule.pattern),
        reflect: !!rule.reflect,
        captured: (m[1] || '').trim(),
        template: tmpl
      });
      return i_fillTemplate(tmpl, m, !!rule.reflect);
    }
    ruleIndex++;
  }
  return null;
}

/* ---------------------
   Public API
---------------------- */
function xGenerateReply(pUserInput) {
  const lSanitizedInput = (pUserInput || "").trim();
  i_postLog('request_received', { text: lSanitizedInput });

  if (!lSanitizedInput) {
    const resp = "Tell me more about that.";
    i_postLog('response_sent', { text: resp, path: 'empty_input' });
    return resp;
  }

  const lMatchResponse = i_findPatternMatch(lSanitizedInput);
  if (lMatchResponse) {
    i_postLog('response_sent', { text: lMatchResponse, path: 'pattern_match' });
    return lMatchResponse;
  }

  const fallback = i_selectRandomResponse(gFallbackResponses);
  i_postLog('fallback', { chosen: fallback });
  i_postLog('response_sent', { text: fallback, path: 'fallback' });
  return fallback;
}

// Export for Node/CommonJS if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { xGenerateReply };
}

// Also expose to browser global for direct <script> usage
if (typeof window !== 'undefined') {
  window.Eliza = Object.assign({}, window.Eliza, { xGenerateReply });
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  const readline = require("readline");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "You: "
  });

  console.log("ELIZA: Hello. How are you feeling today?");
  rl.prompt();

  rl.on("line", (line) => {
    const reply = xGenerateReply(line);
    console.log("ELIZA:", reply);
    rl.prompt();
  }).on("close", () => {
    console.log("ELIZA: Goodbye!");
    process.exit(0);
  });
}
