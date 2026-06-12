// lib/cie/index.ts — Context Intelligence Engine orchestrator
//
// One function: buildCieContext(params) → CieContext
// Everything else is internal. Wire into any API route with one line.
//
// Flow: classify → retrieve → rank → build → inject
//
// ADAPTIVE INJECTION: Context scales with task complexity.
//  - Short tasks (<500 chars):   max 3 items, 300 char cap (avoid overhead)
//  - Medium tasks (500-2000):    standard 2500 char cap
//  - Large tasks (2000+):        full 4000 char cap (complex tasks need context)

import type { TaskProfile, CieContext, TaskType } from './types'
import { classifyTask } from './classifier'
import { retrieveContext } from './retriever'
import { rankContext, getSourcesUsed } from './ranker'
import { buildInjection } from './builder'

// ─── Public API ──────────────────────────────────────────────────────────────

export interface CieParams {
  agentId: string
  task: string
  venture?: string
  charBudget?: number
}

/**
 * Build CIE context for an agent call. Adaptive — scales with task complexity.
 */
export function buildCieContext(params: CieParams): CieContext {
  const t0 = Date.now()
  const taskLen = params.task.length
  
  // Adaptive budget based on task complexity
  let charBudget: number
  let maxItems: number
  
  if (taskLen < 500) {
    // Short tasks: minimal context (overhead would dominate)
    charBudget = 300
    maxItems = 3
  } else if (taskLen < 2000) {
    // Medium tasks: standard context
    charBudget = params.charBudget ?? 2500
    maxItems = 10
  } else {
    // Large tasks: full context (complex tasks benefit from knowledge)
    charBudget = params.charBudget ?? 4000
    maxItems = 20
  }
  
  // Step 1: Classify
  const profile = classifyTask(params.agentId, params.task, params.venture ?? 'yvon-dashboard')
  
  // Step 2: Retrieve
  const items = retrieveContext(profile)
  
  // Limit items before ranking for short tasks
  const cappedItems = items.slice(0, maxItems)
  
  // Step 3: Rank + dedup + cap
  const { selected, filtered } = rankContext(cappedItems, {
    charBudget,
    dedupSimilarity: 0.85,
  })
  
  // Step 4: Build injection blocks
  const timeMs = Date.now() - t0
  const context = buildInjection(selected, filtered, timeMs)
  
  return context
}

// ─── Exports for testing ─────────────────────────────────────────────────────

export type { TaskProfile, CieContext, TaskType }
export { classifyTask } from './classifier'
export { retrieveContext } from './retriever'
export { rankContext, getSourcesUsed } from './ranker'
export { buildInjection } from './builder'
