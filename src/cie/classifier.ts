// lib/cie/classifier.ts — Task classification via keyword pattern matching
//
// Zero tokens: pure regex matching on the message text.
// Agent bias nudges scores based on who is asking.

import type { TaskType, TaskProfile } from './types';

// ---------------------------------------------------------------------------
// Pattern definitions — each TaskType gets a regex built from its keywords.
// Matches are case-insensitive and whole-word (word-boundary anchored).
// ---------------------------------------------------------------------------

const TYPE_PATTERNS: Record<TaskType, RegExp> = {
  backend_bug: /\b(?:error|crash|type|build|route|500|undefined|import)\b/i,
  strategy:    /\b(?:decide|direction|price|OKR|priority|investor|revenue)\b/i,
  frontend_ui: /\b(?:component|layout|CSS|responsive|tailwind|padding)\b/i,
  data_query:  /\b(?:query|database|schema|migration|supabase|fetch)\b/i,
  marketing:   /\b(?:campaign|copyright|brand|social|ad|content|copy)\b/i,
  ops_risk:    /\b(?:deploy|cost|SLA|downtime|security|auth|token)\b/i,
  general:     /(?:)/i, // catch-all — always matches zero-width
};

// Keyword extraction patterns — same as above but global so we can collect all hits.
const EXTRACT_PATTERNS: Record<TaskType, RegExp> = {
  backend_bug: /\b(?:error|crash|type|build|route|500|undefined|import)\b/gi,
  strategy:    /\b(?:decide|direction|price|OKR|priority|investor|revenue)\b/gi,
  frontend_ui: /\b(?:component|layout|CSS|responsive|tailwind|padding)\b/gi,
  data_query:  /\b(?:query|database|schema|migration|supabase|fetch)\b/gi,
  marketing:   /\b(?:campaign|copyright|brand|social|ad|content|copy)\b/gi,
  ops_risk:    /\b(?:deploy|cost|SLA|downtime|security|auth|token)\b/gi,
  general:     /(?:)/gi,
};

// ---------------------------------------------------------------------------
// Agent bias — each agent has a preferred task type with a +2 score boost.
// ---------------------------------------------------------------------------

interface Bias {
  agentId: string;
  taskType: TaskType;
  boost: number;
}

const AGENT_BIASES: Record<string, Bias> = {
  'dev-lead':      { agentId: 'dev-lead',      taskType: 'backend_bug',  boost: 2 },
  'mia-frontend':  { agentId: 'mia-frontend',  taskType: 'frontend_ui',  boost: 2 },
  'marcus-ceo':    { agentId: 'marcus-ceo',    taskType: 'strategy',     boost: 2 },
  'raj-backend':   { agentId: 'raj-backend',   taskType: 'data_query',   boost: 2 },
};

// All task types in priority order for tie-breaking (non-general first).
const PRIORITY_ORDER: TaskType[] = [
  'backend_bug',
  'strategy',
  'frontend_ui',
  'data_query',
  'marketing',
  'ops_risk',
  'general',
];

// ---------------------------------------------------------------------------
// agentBias — returns the bias boost for a given agent + task type pair.
// ---------------------------------------------------------------------------

export function agentBias(agentId: string, taskType: TaskType): number {
  const bias = AGENT_BIASES[agentId];
  if (bias && bias.taskType === taskType) {
    return bias.boost;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// extractKeywords — pull all matched keywords out of the message.
// ---------------------------------------------------------------------------

function extractKeywords(message: string, taskType: TaskType): string[] {
  const pattern = EXTRACT_PATTERNS[taskType];
  const matches = message.match(pattern);
  if (!matches || matches.length === 0) return [];
  // Deduplicate and normalize to lowercase.
  return [...new Set(matches.map((m) => m.toLowerCase()))];
}

// ---------------------------------------------------------------------------
// classifyTask — main entry point.
//
// 1. Score every TaskType by counting regex matches.
// 2. Apply agent bias to the scores.
// 3. Pick the type with the highest score (general if all zero).
// 4. Compute confidence: winning score / sum of all scores (1.0 if only general).
// 5. Extract and return keywords from the winning type.
// ---------------------------------------------------------------------------

export function classifyTask(
  agentId: string,
  message: string,
  venture: string,
): TaskProfile {
  const scores: Record<TaskType, number> = {
    backend_bug: 0,
    strategy: 0,
    frontend_ui: 0,
    data_query: 0,
    marketing: 0,
    ops_risk: 0,
    general: 0,
  };

  // Step 1 — count keyword matches.
  for (const taskType of PRIORITY_ORDER) {
    if (taskType === 'general') continue; // general skips matching
    const matches = message.match(TYPE_PATTERNS[taskType]);
    scores[taskType] = matches ? matches.length : 0;
  }

  // Step 2 — apply agent bias.
  for (const taskType of PRIORITY_ORDER) {
    scores[taskType] += agentBias(agentId, taskType);
  }

  // Step 3 — determine winning type.
  let bestType: TaskType = 'general';
  let bestScore = -1;

  for (const taskType of PRIORITY_ORDER) {
    if (scores[taskType] > bestScore) {
      bestScore = scores[taskType];
      bestType = taskType;
    }
  }

  // If nothing matched, general is the winner.
  if (bestScore <= 0) {
    bestType = 'general';
    bestScore = 1; // treat general as having a base score of 1 for confidence calc
    scores.general = 1;
  }

  // Step 4 — compute confidence.
  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const confidence = totalScore > 0
    ? Math.round((bestScore / totalScore) * 100) / 100
    : 1;

  // Step 5 — extract keywords.
  const keywords = extractKeywords(message, bestType);

  return {
    type: bestType,
    agentId,
    venture,
    confidence,
    keywords,
  };
}
